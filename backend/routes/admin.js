import express from "express";
import PDFDocument from "pdfkit";
import User from "../models/User.js";
import Workout from "../models/Workout.js";
import Food from "../models/Food.js";
import WaterIntake from "../models/WaterIntake.js";
import HeartRate from "../models/HeartRate.js";
import Settings from "../models/Settings.js";
import Log from "../models/Log.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { encryptValue, decryptValue } from "../utils/crypto.js";
import { recordAuditLog } from "../utils/auditLogger.js";

const router = express.Router();

const normalizeFrom = (value) => {
  const fallback = process.env.SMTP_FROM || "SNM Health Monitor <no-reply@pulsetrack.local>";
  if (!value) return fallback;
  const lower = value.toLowerCase();
  if (lower.includes("pulse tracking") || lower.includes("pulsetrack")) {
    return fallback;
  }
  if (!lower.includes("snm health monitor")) {
    return fallback;
  }
  return value;
};

const computeStats = async () => {
  const [userCount, workoutCount, foodCount, waterCount, heartRateCount] = await Promise.all([
    User.countDocuments(),
    Workout.countDocuments(),
    Food.countDocuments(),
    WaterIntake.countDocuments(),
    HeartRate.countDocuments()
  ]);

  const caloriesBurned = await Workout.aggregate([
    { $group: { _id: null, total: { $sum: "$caloriesBurned" } } }
  ]);

  return {
    users: userCount,
    workouts: workoutCount,
    foods: foodCount,
    waterEntries: waterCount,
    heartRateEntries: heartRateCount,
    caloriesBurned: caloriesBurned[0]?.total || 0
  };
};

const buildAnalyticsSnapshot = async (days = 30) => {
  const rangeDays = Number.isNaN(Number(days)) ? 30 : Math.max(1, Number(days));
  const generatedAt = new Date();
  const since = new Date();
  since.setDate(since.getDate() - rangeDays);

  const stats = await computeStats();
  const leaders = await Workout.aggregate([
    { $match: { date: { $gte: since } } },
    {
      $group: {
        _id: "$user",
        workouts: { $sum: 1 },
        caloriesBurned: { $sum: "$caloriesBurned" }
      }
    },
    { $sort: { workouts: -1, caloriesBurned: -1 } },
    { $limit: 10 }
  ]);

  const userIds = leaders.map((entry) => entry._id).filter(Boolean);
  const profiles = await User.find({ _id: { $in: userIds } })
    .select("name email")
    .lean();
  const profileMap = profiles.reduce((acc, profile) => {
    acc[profile._id.toString()] = profile;
    return acc;
  }, {});

  const topUsers = leaders.map((entry, index) => {
    const profile = profileMap[entry._id?.toString()] || {};
    return {
      rank: index + 1,
      userId: entry._id,
      name: profile.name || "Unknown",
      email: profile.email || "",
      workouts: entry.workouts,
      caloriesBurned: entry.caloriesBurned
    };
  });

  return {
    generatedAt,
    range: { days: rangeDays, since },
    stats,
    topUsers
  };
};

const sendAnalyticsCsv = (res, snapshot) => {
  const lines = [];
  lines.push("Metric,Value");
  lines.push(`Total Users,${snapshot.stats.users}`);
  lines.push(`Total Workouts,${snapshot.stats.workouts}`);
  lines.push(`Total Meals,${snapshot.stats.foods}`);
  lines.push(`Water Entries,${snapshot.stats.waterEntries}`);
  lines.push(`Heart Rate Entries,${snapshot.stats.heartRateEntries}`);
  lines.push(`Calories Burned,${snapshot.stats.caloriesBurned}`);
  lines.push("");
  lines.push(
    `Top Users (Last ${snapshot.range.days} days since ${snapshot.range.since
      .toISOString()
      .slice(0, 10)})`
  );
  lines.push("Rank,Name,Email,Workouts Logged,Calories Burned");
  snapshot.topUsers.forEach((user) => {
    lines.push(
      `${user.rank},"${user.name}","${user.email}",${user.workouts},${user.caloriesBurned}`
    );
  });

  const csv = lines.join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="snm-analytics-${snapshot.range.days}d.csv"`
  );
  return res.send(csv);
};

const sendAnalyticsPdf = (res, snapshot) => {
  const doc = new PDFDocument({ margin: 48 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="snm-analytics-${snapshot.range.days}d.pdf"`
  );
  doc.pipe(res);
  doc.fontSize(18).text("SNM Health Monitor – Analytics Report");
  doc.moveDown();
  doc
    .fontSize(12)
    .text(`Generated: ${snapshot.generatedAt.toLocaleString()}`)
    .text(
      `Range: last ${snapshot.range.days} days (since ${snapshot.range.since.toLocaleDateString()})`
    );
  doc.moveDown();
  doc.fontSize(14).text("Key Metrics");
  doc.fontSize(12);
  const metricLabels = [
    ["Users", snapshot.stats.users],
    ["Workouts", snapshot.stats.workouts],
    ["Meals Logged", snapshot.stats.foods],
    ["Water Entries", snapshot.stats.waterEntries],
    ["Heart Rate Entries", snapshot.stats.heartRateEntries],
    ["Calories Burned", snapshot.stats.caloriesBurned]
  ];
  metricLabels.forEach(([label, value]) => {
    doc.text(`${label}: ${value.toLocaleString()}`);
  });
  doc.moveDown();
  doc.fontSize(14).text("Top Active Users");
  doc.fontSize(12);
  if (!snapshot.topUsers.length) {
    doc.text("No workout activity recorded in this range.");
  } else {
    snapshot.topUsers.forEach((user) => {
      doc
        .text(
          `${user.rank}. ${user.name} (${user.email || "N/A"}) – ${user.workouts} workouts, ${user.caloriesBurned.toLocaleString()} kcal`
        )
        .moveDown(0.2);
    });
  }
  doc.end();
};

router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  const users = await User.find().select("name email role createdAt updatedAt");
  return res.json(users);
});

router.get("/logs", authMiddleware, adminMiddleware, async (req, res) => {
  const limitParam = Number(req.query.limit) || 50;
  const limit = Math.max(1, Math.min(limitParam, 200));
  const logs = await Log.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", "name email role")
    .lean();

  const formatted = logs.map((log) => ({
    id: log._id,
    action: log.action,
    description: log.description,
    metadata: log.metadata,
    ip: log.ip,
    createdAt: log.createdAt,
    user: log.user
      ? { id: log.user._id, name: log.user.name, email: log.user.email, role: log.user.role }
      : null
  }));

  return res.json(formatted);
});

router.delete("/logs/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const log = await Log.findByIdAndDelete(req.params.id);
  if (!log) {
    return res.status(404).json({ message: "Log not found" });
  }

  recordAuditLog({
    userId: req.user.id,
    action: "admin.logs.delete",
    description: "Audit log entry deleted",
    metadata: { deletedLogId: log._id },
    ip: req.ip
  });

  return res.json({ message: "Log deleted" });
});

router.delete("/logs", authMiddleware, adminMiddleware, async (req, res) => {
  const result = await Log.deleteMany({});

  recordAuditLog({
    userId: req.user.id,
    action: "admin.logs.delete_all",
    description: "All audit logs cleared",
    metadata: { deletedCount: result.deletedCount || 0 },
    ip: req.ip
  });

  return res.json({
    message: "All logs deleted",
    deleted: result.deletedCount || 0
  });
});

router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
  const stats = await computeStats();
  return res.json(stats);
});

router.get("/analytics/export", authMiddleware, adminMiddleware, async (req, res) => {
  const format = req.query.format === "pdf" ? "pdf" : "csv";
  const days = req.query.days ? Number(req.query.days) : 30;
  recordAuditLog({
    userId: req.user.id,
    action: "admin.analytics.export",
    description: `Analytics export (${format.toUpperCase()})`,
    metadata: { format, days },
    ip: req.ip
  });
  const snapshot = await buildAnalyticsSnapshot(days);
  if (format === "pdf") {
    return sendAnalyticsPdf(res, snapshot);
  }
  return sendAnalyticsCsv(res, snapshot);
});

router.get("/smtp", authMiddleware, adminMiddleware, async (req, res) => {
  const settings = await Settings.findOne({ key: "smtp" }).lean();
  if (!settings?.smtp) {
    return res.json({
      host: process.env.SMTP_HOST || "",
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      user: process.env.SMTP_USER || "",
      pass: "",
      from: process.env.SMTP_FROM || ""
    });
  }

  const decrypted = {
    host: settings.smtp.host ? decryptValue(settings.smtp.host) : "",
    port: settings.smtp.port || 587,
    user: settings.smtp.user ? decryptValue(settings.smtp.user) : "",
    pass: "",
    from: settings.smtp.from ? decryptValue(settings.smtp.from) : ""
  };

  return res.json(decrypted);
});

router.post("/smtp", authMiddleware, adminMiddleware, async (req, res) => {
  const { host, port, user, pass, from } = req.body;
  if (!host || !user || !pass) {
    return res.status(400).json({ message: "Host, user, and pass are required" });
  }

  const payload = {
    host: encryptValue(host),
    port: Number(port) || 587,
    user: encryptValue(user),
    pass: encryptValue(pass),
    from: from ? encryptValue(from) : ""
  };

  const settings = await Settings.findOneAndUpdate(
    { key: "smtp" },
    { key: "smtp", smtp: payload },
    { upsert: true, new: true }
  );

  recordAuditLog({
    userId: req.user.id,
    action: "admin.smtp.update",
    description: "SMTP settings updated",
    metadata: { host },
    ip: req.ip
  });

  return res.json({ message: "SMTP settings updated", id: settings._id });
});

router.post("/smtp/test", authMiddleware, adminMiddleware, async (req, res) => {
  const { to } = req.body;
  const settings = await Settings.findOne({ key: "smtp" }).lean();
  if (!settings?.smtp) {
    return res.status(400).json({ message: "SMTP settings not configured" });
  }

  const host = settings.smtp.host ? decryptValue(settings.smtp.host) : "";
  const port = settings.smtp.port || 587;
  const user = settings.smtp.user ? decryptValue(settings.smtp.user) : "";
  const pass = settings.smtp.pass ? decryptValue(settings.smtp.pass) : "";
  const from = normalizeFrom(settings.smtp.from ? decryptValue(settings.smtp.from) : "");

  if (!host || !user || !pass) {
    return res.status(400).json({ message: "SMTP settings incomplete" });
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host,
    port: Number(port || 587),
    secure: Number(port) === 465,
    auth: { user, pass }
  });

  await transporter.sendMail({
    from,
    to: to || user,
    subject: "SNM Health Monitor SMTP Test",
    text: "SMTP is configured correctly. This is a test email from SNM Health Monitor.",
    html: "<p>SMTP is configured correctly. This is a test email from SNM Health Monitor.</p>"
  });

  recordAuditLog({
    userId: req.user.id,
    action: "admin.smtp.test",
    description: "SMTP test email sent",
    metadata: { to: to || user },
    ip: req.ip
  });

  return res.json({ message: "Test email sent" });
});

router.delete("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  recordAuditLog({
    userId: req.user.id,
    action: "admin.users.delete",
    description: "User deleted",
    metadata: { deletedUser: user.email },
    ip: req.ip
  });
  return res.json({ message: "User deleted" });
});

export default router;
