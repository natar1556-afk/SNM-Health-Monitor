import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import { decryptValue } from "../utils/crypto.js";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

const createToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const normalizeFrom = (value) => {
  const fallback = process.env.SMTP_FROM || "SNM Health Monitor <no-reply@pulsetrack.local>";
  if (!value) return fallback;
  const lower = value.toLowerCase();
  if (lower.includes("pulse tracking") || lower.includes("pulsetrack")) {
    return fallback;
  }
  if (!lower.includes("snm health monitor")) {
    return fallback;
  }
  return value;
};

const getSmtpConfig = async () => {
  const settings = await Settings.findOne({ key: "smtp" }).lean();
  if (!settings?.smtp) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: normalizeFrom(process.env.SMTP_FROM)
    };
  }

  return {
    host: settings.smtp.host ? decryptValue(settings.smtp.host) : "",
    port: settings.smtp.port || 587,
    user: settings.smtp.user ? decryptValue(settings.smtp.user) : "",
    pass: settings.smtp.pass ? decryptValue(settings.smtp.pass) : "",
    from: normalizeFrom(settings.smtp.from ? decryptValue(settings.smtp.from) : "")
  };
};

const buildTransporter = async () => {
  const { host, port, user, pass } = await getSmtpConfig();
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(port || 587),
    secure: Number(port) === 465,
    auth: { user, pass }
  });
};

const sendResetEmail = async (toEmail, otp) => {
  try {
    const subject = "Your SNM Health Monitor password reset code";
    const text = `Your reset code is: ${otp}. It expires in 10 minutes.`;
    const html = `<p>Your reset code is:</p><h2>${otp}</h2><p>It expires in 10 minutes.</p>`;
    const result = await sendMail({ to: toEmail, subject, text, html });
    return result;
  } catch (error) {
    console.error("Failed to send reset email:", error);
    return { sent: false, reason: error.message };
  }
};

const sendVerifyEmail = async (user, token) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${baseUrl}/verify-email?token=${token}`;
  const subject = "Verify your SNM Health Monitor account";
  const text = `Hi ${user.name || "there"}, verify your email to activate your account: ${link}`;
  const html = `<p>Hi ${user.name || "there"},</p><p>Verify your email to activate your account:</p><p><a href="${link}">Verify Email</a></p>`;
  return sendMail({ to: user.email, subject, text, html });
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

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
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hash,
      emailVerified: false
    });
    const verifyToken = crypto.randomBytes(32).toString("hex");
    user.emailVerifyToken = crypto.createHash("sha256").update(verifyToken).digest("hex");
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const result = await sendVerifyEmail(user, verifyToken);
    if (result?.sent) {
      user.emailVerifyLastSent = todayKey();
      await user.save();
    }

    return res.status(201).json({
      message: "Registration successful. Please verify your email before logging in."
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
// Email verification temporarily disabled
// if (!user.emailVerified) {
//   const today = todayKey();
//   const expired = !user.emailVerifyExpires || user.emailVerifyExpires < new Date();
//   if (user.emailVerifyLastSent !== today) {
//     const verifyToken = crypto.randomBytes(32).toString("hex");
//     user.emailVerifyToken = crypto.createHash("sha256").update(verifyToken).digest("hex");
//     user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
//     await user.save();
//     const result = await sendVerifyEmail(user, verifyToken);
//     if (result?.sent) {
//       user.emailVerifyLastSent = today;
//       await user.save();
//     }
//   } else if (expired) {
//     const verifyToken = crypto.randomBytes(32).toString("hex");
//     user.emailVerifyToken = crypto.createHash("sha256").update(verifyToken).digest("hex");
//     user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
//     await user.save();
//   }
// }
    if (!user.emailVerified) {
      const today = todayKey();
      const expired = !user.emailVerifyExpires || user.emailVerifyExpires < new Date();
      if (user.emailVerifyLastSent !== today) {
        const verifyToken = crypto.randomBytes(32).toString("hex");
        user.emailVerifyToken = crypto.createHash("sha256").update(verifyToken).digest("hex");
        user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();
        const result = await sendVerifyEmail(user, verifyToken);
        if (result?.sent) {
          user.emailVerifyLastSent = today;
          await user.save();
        }
      } else if (expired) {
        const verifyToken = crypto.randomBytes(32).toString("hex");
        user.emailVerifyToken = crypto.createHash("sha256").update(verifyToken).digest("hex");
        user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();
      }
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
  const user = await User.findOne({ email });
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
  await user.save();
  const result = await sendVerifyEmail(user, verifyToken);
  if (result?.sent) {
    user.emailVerifyLastSent = today;
    await user.save();
    return res.json({ message: "Verification email sent." });
  }
  return res.status(500).json({ message: "Failed to send verification email." });
});

router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If the email exists, a reset code was sent." });
    }

    const otp = generateOtp();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetOtp = otpHash;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log("[OTP] Generated", {
      email: user.email,
      otpLength: otp.length,
      otpLast2: otp.slice(-2),
      expiresAt: user.resetOtpExpires.toISOString()
    });

    const emailResult = await sendResetEmail(user.email, otp);
    
    if (!emailResult.sent) {
      console.warn("[Email] Failed to send reset email:", {
        email: user.email,
        reason: emailResult.reason || "SMTP not configured"
      });
    } else {
      console.log("[Email] Reset email sent successfully to:", user.email);
    }

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
      email,
      resetOtp: otpHash,
      resetOtpExpires: { $gt: new Date() }
    });

    if (!user) {
      const existing = await User.findOne({ email }).lean();
      console.warn("[OTP] Reset failed", {
        email,
        otpLength: normalizedOtp.length,
        hasResetOtp: Boolean(existing?.resetOtp),
        resetOtpExpires: existing?.resetOtpExpires?.toISOString() || null,
        now: new Date().toISOString(),
        otpHash: otpHash.slice(0, 8)
      });
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
