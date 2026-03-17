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

const todayKey = () => new Date().toISOString().slice(0, 10);

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const isStrongPassword = (password) => {
  if (!password || typeof password !== "string") return false;
  if (password.length < 8 || password.length > 16) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

const passwordRuleMessage =
  "Password must be 8-16 characters and include at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.";

const sendVerifyEmail = async (user, token) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${baseUrl}/verify-email?token=${token}`;
  const subject = "Verify your SNM Health Monitor account";
  const text = `Hi ${user.name || "there"}, verify your email to activate your account: ${link}`;
  const html = `<p>Hi ${user.name || "there"},</p><p>Verify your email to activate your account:</p><p><a href="${link}">Verify Email</a></p>`;
  return sendMail({ to: user.email, subject, text, html });
};

const sendResetEmail = async (email, otp) => {
  const subject = "Your SNM Health Monitor password reset code";
  const text = `Your reset code is: ${otp}. It expires in 10 minutes.`;
  const html = `<p>Your reset code is:</p><h2>${otp}</h2><p>It expires in 10 minutes.</p>`;
  const result = await sendMail({ to: email, subject, text, html });
  if (!result?.sent) {
    console.warn("[Mailer] SMTP disabled, OTP logged for", email, "code:", otp);
  }
  return result;
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const cleanName = (name || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password required" });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: passwordRuleMessage });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hash,
      emailVerified: false,
      emailVerifyToken: crypto.createHash("sha256").update(verifyToken).digest("hex"),
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      emailVerifyLastSent: todayKey()
    });

    await sendVerifyEmail(user, verifyToken);

    return res.status(201).json({
      message: "Registration successful. Please verify your email before logging in."
    });
  } catch (error) {
    console.error("Register error", error);
    return res.status(500).json({ message: "Registration failed" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      const token = crypto.randomBytes(32).toString("hex");
      user.emailVerifyToken = crypto.createHash("sha256").update(token).digest("hex");
      user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.emailVerifyLastSent = todayKey();
      await user.save();
      await sendVerifyEmail(user, token);
      return res.status(403).json({
        message: "Please verify your email. We've sent a verification link to your inbox."
      });
    }

    const token = createToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error("Login error", error);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/verify", async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: "Verification token is required" });
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    emailVerifyToken: tokenHash,
    emailVerifyExpires: { $gt: new Date() }
  });
  if (!user) {
    return res.status(400).json({ message: "Verification link is invalid or expired" });
  }

  user.emailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();

  return res.json({ message: "Email verified successfully. You can log in now." });
});

router.post("/resend-verify", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.json({ message: "If the email exists, a verification email was sent." });
  }
  if (user.emailVerified) {
    return res.json({ message: "Email already verified." });
  }
  const today = todayKey();
  if (user.emailVerifyLastSent === today) {
    return res.json({ message: "Verification email already sent today." });
  }
  const verifyToken = crypto.randomBytes(32).toString("hex");
  user.emailVerifyToken = crypto.createHash("sha256").update(verifyToken).digest("hex");
  user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.emailVerifyLastSent = today;
  await user.save();
  await sendVerifyEmail(user, verifyToken);
  return res.json({ message: "Verification email sent." });
});

router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.json({ message: "If the email exists, a reset code was sent." });
    }

    const otp = generateOtp();
    user.resetOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log("[OTP] Generated", {
      email: user.email,
      otpLength: otp.length,
      otpLast2: otp.slice(-2),
      expiresAt: user.resetOtpExpires.toISOString()
    });

    await sendResetEmail(user.email, otp);

    return res.json({ message: "If the email exists, a reset code was sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Failed to start password reset" });
  }
});

router.post("/reset", async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ message: "Email, OTP, and new password required" });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: passwordRuleMessage });
    }

    const normalizedOtp = otp.toString().trim();
    const otpHash = crypto.createHash("sha256").update(normalizedOtp).digest("hex");
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      resetOtp: otpHash,
      resetOtpExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "OTP is invalid or expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

export default router;
