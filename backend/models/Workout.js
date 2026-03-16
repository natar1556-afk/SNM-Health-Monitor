import mongoose from "mongoose";

const workoutSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    category: {
      type: String,
      enum: ["Cardio", "Strength", "Yoga", "HIIT", "Mobility", "Other"],
      default: "Other"
    },
    duration: { type: Number, required: true },
    caloriesBurned: { type: Number, required: true },
    date: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Workout", workoutSchema);
