import express from "express";
import Workout from "../models/Workout.js";
import Food from "../models/Food.js";
import User from "../models/User.js";
import WaterIntake from "../models/WaterIntake.js";
import HeartRate from "../models/HeartRate.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const dayKey = (date) => startOfDay(date).toISOString().slice(0, 10);

const startOfWeek = (date) => {
  const base = startOfDay(date);
  const day = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - day);
  return base;
};

const groupByWeek = (items, getValue) => {
  const now = new Date();
  const weeks = Array.from({ length: 4 }, (_, i) => ({
    label: `W${4 - i}`,
    value: 0
  }));

  items.forEach((item) => {
    const diffDays = Math.floor((startOfDay(now) - startOfDay(item.date)) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7);
    if (weekIndex >= 0 && weekIndex < 4) {
      weeks[3 - weekIndex].value += getValue(item);
    }
  });

  return weeks;
};

const groupByWeekAvg = (items, getValue) => {
  const now = new Date();
  const weeks = Array.from({ length: 4 }, (_, i) => ({
    label: `W${4 - i}`,
    value: 0,
    count: 0
  }));

  items.forEach((item) => {
    const diffDays = Math.floor((startOfDay(now) - startOfDay(item.date)) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7);
    if (weekIndex >= 0 && weekIndex < 4) {
      const slot = weeks[3 - weekIndex];
      slot.value += getValue(item);
      slot.count += 1;
    }
  });

  return weeks.map((w) => ({
    label: w.label,
    value: w.count ? Math.round(w.value / w.count) : 0
  }));
};

const buildStreaks = (workouts) => {
  const uniqueDays = new Set(workouts.map((w) => dayKey(w.date)));
  const today = startOfDay(new Date());

  let current = 0;
  for (let i = 0; ; i += 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    if (uniqueDays.has(dayKey(day))) {
      current += 1;
    } else {
      break;
    }
  }

  const sortedDays = Array.from(uniqueDays)
    .map((key) => new Date(key))
    .sort((a, b) => a - b);

  let longest = 0;
  let run = 0;
  let prev = null;
  sortedDays.forEach((date) => {
    if (!prev) {
      run = 1;
    } else {
      const diffDays = Math.round((startOfDay(date) - startOfDay(prev)) / (1000 * 60 * 60 * 24));
      run = diffDays === 1 ? run + 1 : 1;
    }
    if (run > longest) longest = run;
    prev = date;
  });

  return { current, longest };
};

router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const streakSince = new Date();
  streakSince.setDate(streakSince.getDate() - 365);

  const [workouts, foods, waterEntries, heartRates, streakWorkouts, user] = await Promise.all([
    Workout.find({ user: userId, date: { $gte: since } }).sort({ date: 1 }).lean(),
    Food.find({ user: userId, date: { $gte: since } }).sort({ date: 1 }).lean(),
    WaterIntake.find({ user: userId, date: { $gte: since } }).sort({ date: 1 }).lean(),
    HeartRate.find({ user: userId, date: { $gte: since } }).sort({ date: 1 }).lean(),
    Workout.find({ user: userId, date: { $gte: streakSince } }).sort({ date: 1 }).lean(),
    User.findById(userId).lean()
  ]);

  const weeklyBurned = groupByWeek(workouts, (item) => item.caloriesBurned);
  const weeklyConsumed = groupByWeek(foods, (item) => item.calories);
  const weeklyWater = groupByWeek(waterEntries, (item) => item.amountMl);
  const weeklyHeartRate = groupByWeekAvg(heartRates, (item) => item.bpm);

  const weights = (user?.weights || []).slice(-8);
  const { current: currentStreak, longest: longestStreak } = buildStreaks(streakWorkouts);

  const weekStart = startOfWeek(new Date());
  const isInWeek = (date) => startOfDay(date) >= weekStart;
  const weeklyWorkouts = workouts.filter((w) => isInWeek(w.date));
  const weeklyFoods = foods.filter((f) => isInWeek(f.date));
  const weeklyWaterEntries = waterEntries.filter((w) => isInWeek(w.date));
  const weeklyHeartRates = heartRates.filter((h) => isInWeek(h.date));

  const weeklyReport = {
    weekStart,
    workouts: weeklyWorkouts.length,
    caloriesBurned: weeklyWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0),
    caloriesConsumed: weeklyFoods.reduce((sum, f) => sum + f.calories, 0),
    waterMl: weeklyWaterEntries.reduce((sum, w) => sum + w.amountMl, 0),
    avgHeartRate: weeklyHeartRates.length
      ? Math.round(weeklyHeartRates.reduce((sum, h) => sum + h.bpm, 0) / weeklyHeartRates.length)
      : 0,
    goals: {
      weeklyWorkouts: user?.goals?.weeklyWorkouts || null,
      dailyCalories: user?.goals?.dailyCalories || null,
      dailyWaterMl: user?.goals?.dailyWaterMl || null
    }
  };

  return res.json({
    weeklyBurned,
    weeklyConsumed,
    weeklyWater,
    weeklyHeartRate,
    weightTrend: weights.map((w) => ({ date: w.date, value: w.value })),
    streak: { current: currentStreak, longest: longestStreak },
    weeklyReport
  });
});

export default router;
