import Log from "../models/Log.js";

export const recordAuditLog = async ({ userId, action, description, metadata, ip }) => {
  try {
    await Log.create({
      user: userId,
      action,
      description,
      metadata,
      ip
    });
  } catch (error) {
    console.error("[Audit] Failed to record log", error.message);
  }
};
