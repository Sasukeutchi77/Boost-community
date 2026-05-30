import { Router } from "express";
import { db, missionsTable, userMissionsTable, usersTable, coinTransactionsTable, activityFeedTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { sendPushNotification } from "../lib/firebase.js";

const router = Router();

router.get("/missions", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const type = req.query.type as string | undefined;
  const query = db.select().from(missionsTable);
  let missions;
  if (type) {
    missions = await query.where(and(eq(missionsTable.status, "active"), eq(missionsTable.type, type as "watch" | "like" | "comment" | "follow" | "share")));
  } else {
    missions = await query.where(eq(missionsTable.status, "active"));
  }
  const completed = await db.select({ missionId: userMissionsTable.missionId }).from(userMissionsTable).where(eq(userMissionsTable.userId, userId));
  const completedIds = new Set(completed.map(c => c.missionId));
  const result = missions.map(m => ({ ...m, userStatus: completedIds.has(m.id) ? "completed" : "active" }));
  res.json(result);
});

router.get("/missions/daily", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const missions = await db.select().from(missionsTable).where(and(eq(missionsTable.isDaily, true), eq(missionsTable.status, "active")));
  const completed = await db.select({ missionId: userMissionsTable.missionId }).from(userMissionsTable).where(eq(userMissionsTable.userId, userId));
  const completedIds = new Set(completed.map(c => c.missionId));
  const result = missions.map(m => ({ ...m, userStatus: completedIds.has(m.id) ? "completed" : "active" }));
  res.json(result);
});

router.post("/missions/:missionId/complete", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const missionId = Number(req.params.missionId);
  const { proofUrl } = req.body as { proofUrl?: string };

  const missions = await db.select().from(missionsTable).where(eq(missionsTable.id, missionId)).limit(1);
  const mission = missions[0];
  if (!mission) { res.status(404).json({ message: "Mission not found" }); return; }

  const already = await db.select().from(userMissionsTable).where(and(eq(userMissionsTable.userId, userId), eq(userMissionsTable.missionId, missionId))).limit(1);
  if (already.length > 0) { res.status(400).json({ message: "Mission already completed" }); return; }

  // ✅ Vérification URL de preuve si la mission a un targetUrl
  if (mission.targetUrl && !proofUrl) {
    res.status(400).json({ message: "Une URL de preuve est requise pour cette mission", requiresProof: true });
    return;
  }

  await db.insert(userMissionsTable).values({ userId, missionId, status: "completed" });
  await db.update(usersTable).set({ coins: sql`coins + ${mission.coinsReward}`, xp: sql`xp + ${mission.xpReward}` }).where(eq(usersTable.id, userId));
  await db.insert(coinTransactionsTable).values({ userId, amount: mission.coinsReward, type: "earn", description: `Mission: ${mission.title}`, referenceId: missionId, referenceType: "mission" });
  await db.insert(activityFeedTable).values({ userId, type: "mission_completed", description: `Mission accomplie : ${mission.title}` });

  // Notification push de confirmation
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const fcmToken = (users[0] as any)?.fcmToken;
  if (fcmToken) {
    await sendPushNotification(fcmToken, "Mission accomplie ! ⚡", `+${mission.coinsReward} coins et +${mission.xpReward} XP pour "${mission.title}"`, { type: "mission_complete", missionId: String(missionId) });
  }

  res.json({ coinsEarned: mission.coinsReward, xpEarned: mission.xpReward, message: "Mission complétée !", targetUrl: mission.targetUrl });
});

router.post("/missions/checkin", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];
  if (!user) { res.status(404).json({ message: "User not found" }); return; }

  const now = new Date();
  const lastCheckin = user.lastCheckinAt;
  const sameDay = lastCheckin && new Date(lastCheckin).toDateString() === now.toDateString();
  if (sameDay) { res.status(400).json({ message: "Already checked in today" }); return; }

  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = lastCheckin && new Date(lastCheckin).toDateString() === yesterday.toDateString();
  const newStreak = wasYesterday ? user.dailyStreak + 1 : 1;
  const coinsEarned = 10 + Math.min(newStreak, 7) * 2;

  await db.update(usersTable).set({ dailyStreak: newStreak, lastCheckinAt: now, coins: sql`coins + ${coinsEarned}` }).where(eq(usersTable.id, userId));
  await db.insert(coinTransactionsTable).values({ userId, amount: coinsEarned, type: "bonus", description: `Check-in journalier (streak ${newStreak})` });
  await db.insert(activityFeedTable).values({ userId, type: "daily_checkin", description: `Check-in journalier — Streak ${newStreak} jours !` });

  res.json({ coinsEarned, streak: newStreak, message: `Check-in ✓ Streak : ${newStreak} jours !` });
});

export default router;
