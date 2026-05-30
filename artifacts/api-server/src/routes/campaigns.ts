import { Router } from "express";
import { db, campaignsTable, usersTable, coinTransactionsTable, activityFeedTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/campaigns", requireAuth, async (req, res) => {
  const status = req.query.status as string | undefined;
  let campaigns;
  if (status) {
    campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.status, status as "pending" | "active" | "paused" | "completed"));
  } else {
    campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.status, "active"));
  }
  res.json(campaigns);
});

router.get("/campaigns/mine", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.ownerId, userId));
  res.json(campaigns);
});

// ✅ Création de campagne par l'utilisateur
router.post("/campaigns", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { title, description, targetType, targetUrl, targetCount } = req.body as {
    title: string;
    description?: string;
    targetType: "watch" | "like" | "comment" | "follow" | "share";
    targetUrl?: string;
    targetCount?: number;
  };

  if (!title || !targetType) {
    res.status(400).json({ message: "Title and targetType are required" });
    return;
  }

  const count = Math.max(10, Math.min(targetCount ?? 100, 10000));
  const coinsRequired = Math.floor(count * 0.5);

  // Vérifie que l'utilisateur a assez de coins
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];
  if (!user) { res.status(404).json({ message: "User not found" }); return; }

  if (user.coins < coinsRequired) {
    res.status(400).json({ message: `Coins insuffisants. Cette campagne coûte ${coinsRequired} coins (tu as ${user.coins})`, coinsRequired, currentCoins: user.coins });
    return;
  }

  // Débite les coins
  await db.update(usersTable).set({ coins: sql`coins - ${coinsRequired}` }).where(eq(usersTable.id, userId));
  await db.insert(coinTransactionsTable).values({ userId, amount: -coinsRequired, type: "spend", description: `Campagne créée : ${title}` });

  const [campaign] = await db.insert(campaignsTable).values({
    ownerId: userId,
    title,
    description,
    targetType,
    targetUrl,
    targetCount: count,
    coinsRequired,
    status: "active",
  }).returning();

  await db.insert(activityFeedTable).values({ userId, type: "campaign_created", description: `Campagne lancée : ${title}` });

  res.status(201).json(campaign);
});

// ✅ Pause / relance d'une campagne
router.patch("/campaigns/:id/status", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const campaignId = Number(req.params.id);
  const { status } = req.body as { status: "active" | "paused" };

  const campaigns = await db.select().from(campaignsTable).where(and(eq(campaignsTable.id, campaignId), eq(campaignsTable.ownerId, userId))).limit(1);
  if (!campaigns[0]) { res.status(404).json({ message: "Campaign not found or not yours" }); return; }

  await db.update(campaignsTable).set({ status }).where(eq(campaignsTable.id, campaignId));
  res.json({ message: `Campaign ${status}` });
});

export default router;
