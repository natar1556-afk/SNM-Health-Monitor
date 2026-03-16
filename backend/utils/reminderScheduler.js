import User from "../models/User.js";
import { sendMail } from "./mailer.js";

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

const shouldSend = (reminder, now) => {
  if (!reminder?.enabled) return false;
  if (!reminder.timeZone || !reminder.time || !Array.isArray(reminder.daysOfWeek)) return false;
  let local;
  try {
    local = getLocalParts(now, reminder.timeZone);
  } catch (error) {
    return false;
  }
  if (!reminder.daysOfWeek.includes(local.weekday)) return false;
  if (local.time !== reminder.time) return false;
  if (reminder.lastSent === local.ymd) return false;
  return true;
};

const sendReminder = async (user) => {
  const subject = "SNM Health Monitor workout reminder";
  const text = `Hi ${user.name || "there"}, it's time for your workout. Keep your streak alive!`;
  const html = `<p>Hi ${user.name || "there"},</p><p>It's time for your workout. Keep your streak alive!</p>`;
  const result = await sendMail({ to: user.email, subject, text, html });
  return result.sent;
};

export const startReminderScheduler = () => {
  const run = async () => {
    const now = new Date();
    const users = await User.find({ "reminder.enabled": true }).select(
      "name email reminder"
    );

    await Promise.all(
      users.map(async (user) => {
        if (!shouldSend(user.reminder, now)) return;
        const sent = await sendReminder(user);
        if (sent) {
          const local = getLocalParts(now, user.reminder.timeZone);
          await User.updateOne(
            { _id: user._id },
            { "reminder.lastSent": local.ymd }
          );
        }
      })
    );
  };

  run().catch((err) => console.error("Reminder run failed:", err));
  setInterval(() => {
    run().catch((err) => console.error("Reminder run failed:", err));
  }, 60 * 1000);
};
