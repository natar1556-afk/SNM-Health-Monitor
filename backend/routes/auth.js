import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

const createToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// ✅ REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
      emailVerified: true // ✅ direct login allow
    });

    return res.status(201).json({ message: "Registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed" });
  }
});

// ✅ LOGIN (FIXED)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ NO email verification block

    const token = createToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
});

// ✅ FORGOT PASSWORD (OTP)
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If email exists, OTP sent" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendMail({
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}`
    });

    return res.json({ message: "OTP sent" });
  } catch (error) {
    return res.status(500).json({ message: "Error sending OTP" });
  }
});

// ✅ RESET PASSWORD
router.post("/reset", async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email,
      resetOtp: otpHash,
      resetOtpExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;

    await user.save();

    return res.json({ message: "Password updated" });
  } catch (error) {
    return res.status(500).json({ message: "Reset failed" });
  }
});

export default router;