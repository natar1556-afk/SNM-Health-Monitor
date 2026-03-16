import express from "express";
import WaterIntake from "../models/WaterIntake.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const entries = await WaterIntake.find({ user: req.user.id }).sort({ date: -1 });
  return res.json(entries);
});

router.post("/", authMiddleware, async (req, res) => {
  const { amountMl, date } = req.body;
  if (!amountMl || !date) {
    return res.status(400).json({ message: "Amount and date are required" });
  }
  const entry = await WaterIntake.create({
    user: req.user.id,
    amountMl,
    date
  });
  return res.status(201).json(entry);
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { amountMl, date } = req.body;
  const entry = await WaterIntake.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { amountMl, date },
    { new: true }
  );
  if (!entry) return res.status(404).json({ message: "Water entry not found" });
  return res.json(entry);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const result = await WaterIntake.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!result) return res.status(404).json({ message: "Water entry not found" });
  return res.json({ message: "Water entry deleted" });
});

export default router;
