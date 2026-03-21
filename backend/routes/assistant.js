import express from "express";
import OpenAI from "openai";
import { authMiddleware } from "../middleware/auth.js";
import User from "../models/User.js";
import Workout from "../models/Workout.js";
import Food from "../models/Food.js";

const router = express.Router();

const exerciseVideos = [
  { keyword: "push-up", label: "Push-up form", url: "https://www.youtube.com/watch?v=_l3ySVKYVJ8" },
  { keyword: "squat", label: "Bodyweight squat", url: "https://www.youtube.com/watch?v=aclHkVaku9U" },
  { keyword: "lunge", label: "Lunges", url: "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
  { keyword: "plank", label: "Plank", url: "https://www.youtube.com/watch?v=pSHjTRCQxIw" },
  { keyword: "burpee", label: "Burpees", url: "https://www.youtube.com/watch?v=TU8QYVW0gDU" },
  { keyword: "jump rope", label: "Jump rope", url: "https://www.youtube.com/watch?v=1BZMwQjrNeg" },
  { keyword: "mountain climber", label: "Mountain climbers", url: "https://www.youtube.com/watch?v=nmwgirgXLYM" },
  { keyword: "shoulder press", label: "Shoulder press", url: "https://www.youtube.com/watch?v=B-aVuyhvLHU" },
  { keyword: "glute bridge", label: "Glute bridge", url: "https://www.youtube.com/watch?v=m2mZVOd0jWY" },
  { keyword: "dead bug", label: "Dead bug", url: "https://www.youtube.com/watch?v=5rJ4bAbhC0A" },
  { keyword: "side plank", label: "Side plank", url: "https://www.youtube.com/watch?v=K3Q4ap2vjbA" },
  { keyword: "hip flexor", label: "Hip flexor stretch", url: "https://www.youtube.com/watch?v=XlM4Zk9dZlI" },
  { keyword: "cat-cow", label: "Cat-Cow stretch", url: "https://www.youtube.com/watch?v=Kp2bYWRQylk" }
];

const formatEntries = (entries, formatter) =>
  entries
    .map(formatter)
    .filter(Boolean)
    .join("\n");

const getVideoResources = (text) => {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  return exerciseVideos
    .filter(({ keyword }) => lowerText.includes(keyword))
    .map(({ label, url }) => `${label}: ${url}`);
};

router.post("/chat", authMiddleware, async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      message: "Assistant unavailable. Missing OpenAI configuration."
    });
  }

  const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const { message, language } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: "Message is required" });
  }

  let userSnapshot = null;

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

    userSnapshot = user;

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

    const preferredLanguage = language === "ta" ? "Tamil" : "English";

    const systemPrompt = `
You are SNM Health Monitor's AI fitness assistant. Provide concise, motivational, and safe fitness or nutrition guidance.
You have access to the user's profile, goals, and recent activity. If data is missing, make light assumptions and encourage consistent tracking.
Always respond in under 150 words unless the user explicitly asks for more detail.
Always respond in ${preferredLanguage}.
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

    const replyText = response.output_text?.trim() || "I'm not sure how to respond right now.";
    const resources = getVideoResources(`${message} ${replyText}`);
    const finalReply =
      resources.length > 0
        ? `${replyText}\n\nResources:\n${resources.map((r) => `- ${r}`).join("\n")}`
        : replyText;

    return res.json({ reply: finalReply });
  } catch (error) {
    console.error("Assistant error:", error);
    const fallback = `
Here are quick tips while the AI coach is offline:
- Stay consistent with your logged workouts and meals.
- Aim for balanced plates: half veggies, quarter protein, quarter carbs.
- Hydrate: ${userSnapshot?.goals?.dailyWaterMl || 2500} ml per day.
- Need more help? Visit the Library page for exercise videos.
`;
    return res.status(200).json({ reply: fallback.trim() });
  }
});

export default router;
