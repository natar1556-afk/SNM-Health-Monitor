import Settings from "../models/Settings.js";
import { decryptValue } from "./crypto.js";

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

export const getSmtpConfig = async () => {
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

export const sendMail = async ({ to, subject, text, html }) => {
  const { host, port, user, pass, from } = await getSmtpConfig();
  if (!host || !user || !pass) {
    return { sent: false, reason: "SMTP not configured" };
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host,
    port: Number(port || 587),
    secure: Number(port) === 465,
    auth: { user, pass }
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });

  return { sent: true };
};
