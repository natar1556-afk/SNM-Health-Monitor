import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    targetWeight: { type: Number },
    weeklyWorkouts: { type: Number },
    dailyCalories: { type: Number },
    dailyWaterMl: { type: Number }
  },
  { _id: false }
);

const weightEntrySchema = new mongoose.Schema(
  {
    value: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const reminderSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    daysOfWeek: { type: [Number], default: [] }, // 0=Sun ... 6=Sat
    time: { type: String }, // HH:mm
    timeZone: { type: String },
    channels: {
      type: [String],
      enum: ["email", "sms"],
      default: ["email"]
    },
    smsNumber: { type: String },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String },
      end: { type: String }
    },
    startDate: { type: String },
    lastSent: { type: mongoose.Schema.Types.Mixed } // legacy string or per-channel object
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String },
    emailVerifyExpires: { type: Date },
    emailVerifyLastSent: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    age: { type: Number },
    height: { type: Number },
    weight: { type: Number },
    gender: { type: String, enum: ["male", "female", "other"] },
    goals: goalSchema,
    weights: [weightEntrySchema],
    reminder: reminderSchema,
    resetOtp: { type: String },
    resetOtpExpires: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
