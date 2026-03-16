import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import workoutRoutes from "./routes/workouts.js";
import foodRoutes from "./routes/foods.js";
import waterRoutes from "./routes/water.js";
import heartRateRoutes from "./routes/heartRate.js";
import adminRoutes from "./routes/admin.js";
import summaryRoutes from "./routes/summary.js";
import { startReminderScheduler } from "./utils/reminderScheduler.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ status: "Fitness API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/water", waterRoutes);
app.use("/api/heart-rate", heartRateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/summary", summaryRoutes);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const ensureAdmin = async () => {
      const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
      if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        return;
      }

      const existing = await User.findOne({ email: ADMIN_EMAIL });
      if (existing) {
        if (existing.role !== "admin") {
          existing.role = "admin";
          await existing.save();
        }
        return;
      }

      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await User.create({
        name: ADMIN_NAME || "Admin User",
        email: ADMIN_EMAIL,
        password: hash,
        role: "admin"
      });
      console.log("Default admin user created:", ADMIN_EMAIL);
    };

    ensureAdmin().catch((err) => console.error("Admin bootstrap failed:", err));
    startReminderScheduler();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
