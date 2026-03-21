import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import foodsRoutes from "./routes/foods.js";
import workoutsRoutes from "./routes/workouts.js";
import waterRoutes from "./routes/water.js";
import heartRateRoutes from "./routes/heartRate.js";
import summaryRoutes from "./routes/summary.js";
import adminRoutes from "./routes/admin.js";
import assistantRoutes from "./routes/assistant.js";

dotenv.config();
connectDB();

const app = express();

app.use(express.json());

// Allow localhost for development and production domain
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? "https://snm-health-monitor.vercel.app"
    : ["http://localhost:5173", "http://localhost:3000"]
}));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/foods", foodsRoutes);
app.use("/api/workouts", workoutsRoutes);
app.use("/api/water", waterRoutes);
app.use("/api/heart-rate", heartRateRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assistant", assistantRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    status: "SNM Health Monitor API running",
    docs: "All endpoints are served under /api"
  });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
