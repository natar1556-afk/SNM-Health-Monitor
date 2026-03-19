import mongoose from "mongoose";

const reminderJobSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    channel: { type: String, enum: ["email", "sms"], required: true },
    status: {
      type: String,
      enum: ["pending", "sending", "sent", "failed", "skipped"],
      default: "pending"
    },
    scheduledFor: { type: Date, required: true },
    sentAt: { type: Date },
    error: { type: String },
    metadata: {
      localDay: { type: String }, // YYYY-MM-DD
      timeZone: { type: String },
      reminderTime: { type: String },
      quietHours: {
        enabled: { type: Boolean },
        start: { type: String },
        end: { type: String }
      }
    }
  },
  { timestamps: true }
);

reminderJobSchema.index({ status: 1, scheduledFor: 1 });
reminderJobSchema.index({ user: 1, channel: 1, "metadata.localDay": 1 });

export default mongoose.model("ReminderJob", reminderJobSchema);
