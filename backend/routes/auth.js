import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendMail } from "../utils/mailer.js";
import { recordAuditLog } from "../utils/auditLogger.js";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();

const createToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

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

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

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

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hash,
      emailVerified: true,
      emailVerifyToken: undefined,
      emailVerifyExpires: undefined,
      emailVerifyLastSent: undefined
    });

    recordAuditLog({
      userId: user._id,
      action: "auth.register",
      description: "User registered",
      metadata: { email: user.email },
      ip: req.ip
    });

    return res.status(201).json({
      message: "Registration successful."
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

    const token = createToken(user);
    recordAuditLog({
      userId: user._id,
      action: "auth.login",
      description: "User logged in",
      metadata: { email: user.email },
      ip: req.ip
    });
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
    recordAuditLog({
      userId: user._id,
      action: "auth.forgot",
      description: "Password reset code sent",
      metadata: { email: user.email },
      ip: req.ip
    });

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
    recordAuditLog({
      userId: user._id,
      action: "auth.reset",
      description: "Password reset successful",
      metadata: { email: user.email },
      ip: req.ip
    });

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

router.post("/google", async (req, res) => {
  if (!googleClient) {
    return res.status(500).json({ message: "Google login not configured" });
  }
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: "Google credential is required" });
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId
    });
    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Unable to verify Google account" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hash = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        name: payload?.name || email.split("@")[0],
        email,
        password: hash,
        emailVerified: true,
        role: "user"
      });
    }

    const token = createToken(user);
    recordAuditLog({
      userId: user._id,
      action: "auth.google",
      description: "Google SSO login",
      metadata: { email },
      ip: req.ip
    });

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
    console.error("Google login failed", error);
    return res.status(400).json({ message: "Google authentication failed" });
  }
});

export default router;
