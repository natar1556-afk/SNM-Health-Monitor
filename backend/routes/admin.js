import express from "express";
import User from "../models/User.js";
import Workout from "../models/Workout.js";
import Food from "../models/Food.js";
import WaterIntake from "../models/WaterIntake.js";
import HeartRate from "../models/HeartRate.js";
import Settings from "../models/Settings.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { encryptValue, decryptValue } from "../utils/crypto.js";

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

router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  const users = await User.find().select("name email role createdAt updatedAt");
  return res.json(users);
});

router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
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

  return res.json({
    users: userCount,
    workouts: workoutCount,
    foods: foodCount,
    waterEntries: waterCount,
    heartRateEntries: heartRateCount,
    caloriesBurned: caloriesBurned[0]?.total || 0
  });
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

  return res.json({ message: "Test email sent" });
});

router.delete("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ message: "User deleted" });
});

export default router;
