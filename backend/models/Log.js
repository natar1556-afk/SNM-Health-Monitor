import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    description: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String }
  },
  { timestamps: true }
);

logSchema.index({ createdAt: -1 });
logSchema.index({ action: 1 });

export default mongoose.model("Log", logSchema);
