
import webPush from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (!publicKey || !privateKey || !subject) {
  throw new Error(
    "Missing Web Push configuration. Check VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT."
  );
}

// Configure VAPID authentication
webPush.setVapidDetails(
  subject,
  publicKey,
  privateKey
);

export const webPushClient = webPush;

// Public key can safely be shared with the frontend
export const vapidPublicKey = publicKey;
