import express from "express";
import Food from "../models/Food.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const foods = await Food.find({ user: req.user.id }).sort({ date: -1 });
  return res.json(foods);
});

router.post("/", authMiddleware, async (req, res) => {
  const { name, calories, date } = req.body;
  if (!name || !calories || !date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const food = await Food.create({
    user: req.user.id,
    name,
    calories,
    date
  });

  return res.status(201).json(food);
});

router.put("/:id", authMiddleware, async (req, res) => {
  const food = await Food.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true }
  );

  if (!food) return res.status(404).json({ message: "Food entry not found" });
  return res.json(food);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const result = await Food.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!result) return res.status(404).json({ message: "Food entry not found" });
  return res.json({ message: "Food entry deleted" });
});

export default router;
