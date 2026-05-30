import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { sendPushNotification } from "../lib/firebase.js";

const router = Router();

router.post("/notifications/register-token", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { token } = req.body as { token: string };
  if (!token) {
    res.status(400).json({ message: "Token required" });
    return;
  }
  await db.update(usersTable).set({ fcmToken: token } as never).where(eq(usersTable.id, userId));
  res.json({ message: "Token registered" });
});

router.post("/notifications/test", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0] as any;
  if (!user?.fcmToken) {
    res.status(400).json({ message: "No FCM token registered for this user" });
    return;
  }
  const sent = await sendPushNotification(
    user.fcmToken,
    "Test Boost Community 🚀",
    "Tes notifications fonctionnent parfaitement !",
    { type: "test" }
  );
  res.json({ sent, message: sent ? "Notification envoyée !" : "FCM non configuré" });
});

export default router;
