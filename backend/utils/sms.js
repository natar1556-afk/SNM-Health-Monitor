import twilio from "twilio";

let twilioClient;

const getTwilioClient = () => {
  if (twilioClient) return twilioClient;
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return null;
  }
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilioClient;
};

export const isSmsConfigured = () => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER);
};

export const sendSms = async ({ to, body }) => {
  if (!isSmsConfigured()) {
    console.warn("[SMS] Provider not configured. Skipping send.");
    return { sent: false, message: "sms_not_configured" };
  }

  const client = getTwilioClient();
  try {
    await client.messages.create({
      from: process.env.TWILIO_FROM_NUMBER,
      to,
      body
    });
    return { sent: true };
  } catch (error) {
    console.error("[SMS] Failed to send", error);
    return { sent: false, message: error.message };
  }
};
