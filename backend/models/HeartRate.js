import mongoose from "mongoose";

const heartRateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bpm: { type: Number, required: true },
    date: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("HeartRate", heartRateSchema);
