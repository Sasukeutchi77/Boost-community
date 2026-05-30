import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let initialized = false;

function initFirebase() {
  if (initialized || getApps().length > 0) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("[Firebase] Missing env vars — push notifications disabled");
    return;
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  initialized = true;
}

initFirebase();

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<boolean> {
  if (getApps().length === 0) return false;
  try {
    await getMessaging().send({ token, notification: { title, body }, data, android: { priority: "high" }, apns: { payload: { aps: { sound: "default" } } } });
    return true;
  } catch (err) {
    console.error("[Firebase] sendPushNotification error:", err);
    return false;
  }
}

export async function sendPushToMany(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  if (getApps().length === 0 || tokens.length === 0) return;
  try {
    await getMessaging().sendEachForMulticast({ tokens, notification: { title, body }, data, android: { priority: "high" }, apns: { payload: { aps: { sound: "default" } } } });
  } catch (err) {
    console.error("[Firebase] sendPushToMany error:", err);
  }
}
