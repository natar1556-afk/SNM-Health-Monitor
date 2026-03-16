import express from "express";
import Workout from "../models/Workout.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const workouts = await Workout.find({ user: req.user.id }).sort({ date: -1 });
  return res.json(workouts);
});

router.post("/", authMiddleware, async (req, res) => {
  const { type, category, duration, caloriesBurned, date } = req.body;
  if (!type || !duration || !caloriesBurned || !date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const workout = await Workout.create({
    user: req.user.id,
    type,
    category,
    duration,
    caloriesBurned,
    date
  });

  return res.status(201).json(workout);
});

router.put("/:id", authMiddleware, async (req, res) => {
  const workout = await Workout.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true }
  );

  if (!workout) return res.status(404).json({ message: "Workout not found" });
  return res.json(workout);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const result = await Workout.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!result) return res.status(404).json({ message: "Workout not found" });
  return res.json({ message: "Workout deleted" });
});

export default router;
