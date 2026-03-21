import express from "express";
import OpenAI from "openai";
import { authMiddleware } from "../middleware/auth.js";
import User from "../models/User.js";
import Workout from "../models/Workout.js";
import Food from "../models/Food.js";

const router = express.Router();

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const formatEntries = (entries, formatter) =>
  entries
    .map(formatter)
    .filter(Boolean)
    .join("\n");

router.post("/chat", authMiddleware, async (req, res) => {
  if (!openaiClient) {
    return res
      .status(500)
      .json({ message: "Assistant unavailable. Missing OpenAI configuration." });
  }

  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const [user, workouts, foods] = await Promise.all([
      User.findById(req.user.id)
        .select("name goals gender age height weight reminder")
        .lean(),
      Workout.find({ user: req.user.id })
        .sort({ date: -1 })
        .limit(5)
        .lean(),
      Food.find({ user: req.user.id })
        .sort({ date: -1 })
        .limit(5)
        .lean()
    ]);

    const profileSummary = user
      ? `Name: ${user.name || "Unknown"}
Goals: ${JSON.stringify(user.goals || {}, null, 2)}
Stats: gender ${user.gender || "n/a"}, age ${user.age || "n/a"}, height ${
          user.height || "n/a"
        }cm, weight ${user.weight || "n/a"}kg`
      : "No profile data";

    const workoutSummary = workouts.length
      ? formatEntries(workouts, (item) => {
          const date = new Date(item.date).toLocaleDateString();
          return `${date}: ${item.type || "Workout"} for ${item.duration || 0} mins, ${item.caloriesBurned ||
            0} kcal`;
        })
      : "No recent workouts";

    const foodSummary = foods.length
      ? formatEntries(foods, (item) => {
          const date = new Date(item.date).toLocaleDateString();
          return `${date}: ${item.name || "Meal"} - ${item.calories || 0} kcal`;
        })
      : "No recent meals";

    const systemPrompt = `
You are SNM Health Monitor's AI fitness assistant. Provide concise, motivational, and safe fitness or nutrition guidance.
You have access to the user's profile, goals, and recent activity. If data is missing, make light assumptions and encourage consistent tracking.
Always respond in under 150 words unless the user explicitly asks for more detail.
`;

    const userPrompt = `
User message: """${message}"""

Context:
Profile:
${profileSummary}

Recent Workouts:
${workoutSummary}

Recent Meals:
${foodSummary}
`;

    const response = await openaiClient.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const reply = response.output_text?.trim() || "I'm not sure how to respond right now.";

    return res.json({ reply });
  } catch (error) {
    console.error("Assistant error:", error);
    return res.status(500).json({ message: "Failed to generate response" });
  }
});

export default router;
