import express from "express";
import HeartRate from "../models/HeartRate.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const entries = await HeartRate.find({ user: req.user.id }).sort({ date: -1 });
  return res.json(entries);
});

router.post("/", authMiddleware, async (req, res) => {
  const { bpm, date } = req.body;
  if (!bpm || !date) {
    return res.status(400).json({ message: "BPM and date are required" });
  }
  const entry = await HeartRate.create({
    user: req.user.id,
    bpm,
    date
  });
  return res.status(201).json(entry);
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { bpm, date } = req.body;
  const entry = await HeartRate.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { bpm, date },
    { new: true }
  );
  if (!entry) return res.status(404).json({ message: "Heart rate entry not found" });
  return res.json(entry);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const result = await HeartRate.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!result) return res.status(404).json({ message: "Heart rate entry not found" });
  return res.json({ message: "Heart rate entry deleted" });
});

export default router;
