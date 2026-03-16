import mongoose from "mongoose";

const waterIntakeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amountMl: { type: Number, required: true },
    date: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("WaterIntake", waterIntakeSchema);
