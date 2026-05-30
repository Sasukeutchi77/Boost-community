import { Router } from "express";
import { db, userMissionsTable, campaignsTable, coinTransactionsTable, activityFeedTable } from "@workspace/db";
import { eq, count, sum, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const [missionsRes] = await db.select({ count: count() }).from(userMissionsTable).where(eq(userMissionsTable.userId, userId));
  const [activeCampaignsRes] = await db.select({ count: count() }).from(campaignsTable).where(and(eq(campaignsTable.ownerId, userId), eq(campaignsTable.status, "active")));
  const [coinsRes] = await db.select({ total: sum(coinTransactionsTable.amount) }).from(coinTransactionsTable).where(and(eq(coinTransactionsTable.userId, userId), eq(coinTransactionsTable.type, "earn")));

  res.json({
    missionsCompleted: missionsRes.count,
    activeCampaigns: activeCampaignsRes.count,
    totalCoinsEarned: Number(coinsRes.total ?? 0),
    followersGained: 0,
  });
});

router.get("/dashboard/activity-feed", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const limit = Number(req.query.limit ?? 20);
  const feed = await db.select().from(activityFeedTable).where(eq(activityFeedTable.userId, userId)).orderBy(desc(activityFeedTable.createdAt)).limit(limit);
  res.json(feed);
});

export default router;
