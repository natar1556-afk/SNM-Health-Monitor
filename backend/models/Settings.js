import mongoose from "mongoose";

const smtpSchema = new mongoose.Schema(
  {
    host: String,
    port: Number,
    user: String,
    pass: String,
    from: String
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    smtp: smtpSchema
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
