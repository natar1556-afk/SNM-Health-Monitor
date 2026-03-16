import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

const calcBmi = (heightCm, weightKg) => {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  if (heightM <= 0) return null;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

const isStrongPassword = (password) => {
  if (!password || typeof password !== "string") return false;
  if (password.length < 8 || password.length > 16) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

const passwordRuleMessage =
  "Password must be 8-16 characters and include at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.";

router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ message: "User not found" });

  const bmi = calcBmi(user.height, user.weight);
  return res.json({
    profile: {
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      age: user.age,
      height: user.height,
      weight: user.weight,
      gender: user.gender,
      goals: user.goals,
      bmi,
      reminder: user.reminder || {}
    },
    weights: user.weights || []
  });
});

router.put("/me", authMiddleware, async (req, res) => {
  const { name, age, height, weight, gender, goals } = req.body;
  const updates = { name, age, height, weight, gender, goals };

  Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (weight !== undefined) {
    user.weights.push({ value: weight, date: new Date() });
    await user.save();
  }

  const bmi = calcBmi(user.height, user.weight);
  return res.json({
    message: "Profile updated",
    profile: {
      name: user.name,
      email: user.email,
      age: user.age,
      height: user.height,
      weight: user.weight,
      gender: user.gender,
      goals: user.goals,
      bmi,
      reminder: user.reminder || {}
    },
    weights: user.weights || []
  });
});

const isValidTime = (value) => {
  if (!value || typeof value !== "string") return false;
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return Boolean(match);
};

router.put("/me/reminder", authMiddleware, async (req, res) => {
  const { enabled, daysOfWeek, time, timeZone } = req.body;
  if (enabled && (!isValidTime(time) || !Array.isArray(daysOfWeek) || !timeZone)) {
    return res.status(400).json({ message: "Valid time, days, and time zone required" });
  }
  if (enabled && daysOfWeek.some((day) => day < 0 || day > 6)) {
    return res.status(400).json({ message: "Days must be between 0 and 6" });
  }

  const updates = {
    reminder: {
      enabled: Boolean(enabled),
      daysOfWeek: enabled ? daysOfWeek : [],
      time: enabled ? time : undefined,
      timeZone: enabled ? timeZone : undefined
    }
  };

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({
    message: "Reminder updated",
    reminder: user.reminder || {}
  });
});

router.put("/me/password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new password required" });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ message: passwordRuleMessage });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.json({ message: "Password updated successfully" });
});

export default router;
