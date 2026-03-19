import User from "../models/User.js";
import ReminderJob from "../models/ReminderJob.js";
import { sendMail } from "./mailer.js";
import { isSmsConfigured, sendSms } from "./sms.js";

const weekdayMap = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

const getLocalParts = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach((part) => {
    map[part.type] = part.value;
  });
  const weekday = weekdayMap[map.weekday];
  const ymd = `${map.year}-${map.month}-${map.day}`;
  const time = `${map.hour}:${map.minute}`;
  return { weekday, ymd, time };
};

const parseTimeToMinutes = (value) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const isWithinQuietHours = (reminder, local) => {
  if (!reminder?.quietHours?.enabled) return false;
  const start = parseTimeToMinutes(reminder.quietHours.start);
  const end = parseTimeToMinutes(reminder.quietHours.end);
  if (start === null || end === null) return false;
  if (start === end) return false;
  const current = parseTimeToMinutes(local.time);
  if (current === null) return false;
  if (start < end) {
    return current >= start && current < end;
  }
  // wraps past midnight
  return current >= start || current < end;
};

const lastSentMatches = (reminder, channel, localDay) => {
  if (!reminder?.lastSent) return false;
  if (typeof reminder.lastSent === "string") {
    return channel === "email" && reminder.lastSent === localDay;
  }
  return reminder.lastSent[channel] === localDay;
};

const getReminderChannels = (reminder) => {
  if (!reminder?.enabled) return [];
  if (Array.isArray(reminder.channels) && reminder.channels.length) {
    return reminder.channels;
  }
  return ["email"];
};

const canUseChannel = (channel, reminder) => {
  if (channel === "sms") {
    return Boolean(reminder.smsNumber && isSmsConfigured());
  }
  return true;
};

const updateLastSent = async (user, channel, localDay) => {
  let lastSent = user.reminder?.lastSent;
  if (!lastSent || typeof lastSent === "string") {
    lastSent =
      typeof lastSent === "string"
        ? { email: lastSent }
        : {};
  }
  lastSent[channel] = localDay;
  await User.updateOne({ _id: user._id }, { "reminder.lastSent": lastSent });
};

const enqueueJobsForUser = async (user, now) => {
  const reminder = user.reminder;
  if (!reminder?.enabled || !reminder.timeZone || !reminder.time) return;
  if (!Array.isArray(reminder.daysOfWeek) || !reminder.daysOfWeek.length) return;
  let local;
  try {
    local = getLocalParts(now, reminder.timeZone);
  } catch (error) {
    return;
  }
  if (!reminder.daysOfWeek.includes(local.weekday)) return;
  if (local.time !== reminder.time) return;
  if (isWithinQuietHours(reminder, local)) return;

  const channels = getReminderChannels(reminder).filter(
    (channel) => canUseChannel(channel, reminder) && !lastSentMatches(reminder, channel, local.ymd)
  );

  if (!channels.length) return;

  await Promise.all(
    channels.map(async (channel) => {
      const existing = await ReminderJob.findOne({
        user: user._id,
        channel,
        "metadata.localDay": local.ymd,
        status: { $in: ["pending", "sending"] }
      }).lean();

      if (existing) return;

      await ReminderJob.create({
        user: user._id,
        channel,
        scheduledFor: now,
        metadata: {
          localDay: local.ymd,
          timeZone: reminder.timeZone,
          reminderTime: reminder.time,
          quietHours: reminder.quietHours || { enabled: false }
        }
      });
    })
  );
};

const sendReminderEmail = async (user) => {
  const subject = "SNM Health Monitor workout reminder";
  const text = `Hi ${user.name || "there"}, it's time for your workout. Keep your streak alive!`;
  const html = `<p>Hi ${user.name || "there"},</p><p>It's time for your workout. Keep your streak alive!</p>`;
  const result = await sendMail({ to: user.email, subject, text, html });
  return result.sent ? { sent: true } : { sent: false, message: "email_failed" };
};

const sendReminderSms = async (user) => {
  const number = user.reminder?.smsNumber;
  if (!number) {
    return { sent: false, message: "sms_number_missing" };
  }
  return sendSms({
    to: number,
    body: `SNM Health Monitor: Hi ${user.name || "there"}, it's time for your workout!`
  });
};

const processPendingJobs = async () => {
  const now = new Date();
  const jobs = await ReminderJob.find({
    status: "pending",
    scheduledFor: { $lte: now }
  })
    .sort({ scheduledFor: 1 })
    .limit(20);

  for (const job of jobs) {
    await ReminderJob.updateOne({ _id: job._id, status: "pending" }, { status: "sending" });
    const user = await User.findById(job.user).select("name email reminder");
    if (!user || !user.reminder?.enabled) {
      await ReminderJob.updateOne(
        { _id: job._id },
        { status: "skipped", error: "user_or_reminder_disabled" }
      );
      continue;
    }

    const reminder = user.reminder;
    const localDay = job.metadata?.localDay;
    let currentLocal = null;
    if (reminder.timeZone) {
      try {
        currentLocal = getLocalParts(now, reminder.timeZone);
      } catch (error) {
        currentLocal = null;
      }
    }

    if (!getReminderChannels(reminder).includes(job.channel)) {
      await ReminderJob.updateOne(
        { _id: job._id },
        { status: "skipped", error: "channel_disabled" }
      );
      continue;
    }

    if (isWithinQuietHours(reminder, currentLocal || { time: reminder.time })) {
      const reschedule = new Date(now.getTime() + 30 * 60 * 1000);
      await ReminderJob.updateOne(
        { _id: job._id },
        { status: "pending", scheduledFor: reschedule }
      );
      continue;
    }

    if (!canUseChannel(job.channel, reminder)) {
      await ReminderJob.updateOne(
        { _id: job._id },
        { status: "failed", error: "channel_not_available" }
      );
      continue;
    }

    let result;
    try {
      result = job.channel === "sms" ? await sendReminderSms(user) : await sendReminderEmail(user);
    } catch (error) {
      result = { sent: false, message: error.message };
    }

    if (result.sent) {
      await ReminderJob.updateOne(
        { _id: job._id },
        { status: "sent", sentAt: new Date(), error: null }
      );
      if (localDay) {
        await updateLastSent(user, job.channel, localDay);
      }
    } else {
      await ReminderJob.updateOne(
        { _id: job._id },
        { status: "failed", error: result.message || "unknown_error" }
      );
    }
  }
};

const enqueueDueJobs = async () => {
  const now = new Date();
  const users = await User.find({ "reminder.enabled": true }).select("name email reminder");
  await Promise.all(users.map((user) => enqueueJobsForUser(user, now)));
};

export const startReminderScheduler = () => {
  const run = async () => {
    await enqueueDueJobs();
    await processPendingJobs();
  };

  run().catch((err) => console.error("Reminder run failed:", err));
  setInterval(() => {
    run().catch((err) => console.error("Reminder run failed:", err));
  }, 60 * 1000);
};
