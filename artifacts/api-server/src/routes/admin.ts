import { Router } from "express";
import {
  db, usersTable, missionsTable, campaignsTable,
  ticketsTable, coinTransactionsTable, activityFeedTable,
} from "@workspace/db";
import { eq, desc, count, sum, sql, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { sendPushToMany } from "../lib/firebase.js";

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES ?? "admin").split(",").map(s => s.trim());

function requireAdmin(req: any, res: any, next: any) {
  if (!ADMIN_USERNAMES.includes(req.user?.username ?? "")) {
    res.status(403).json({ message: "Admin only" });
    return;
  }
  next();
}

const router = Router();

// ── Stats globales ─────────────────────────────────────────────────────────
router.get("/admin/stats", requireAuth, requireAdmin, async (_req, res) => {
  const [usersCount]     = await db.select({ count: count() }).from(usersTable);
  const [missionsCount]  = await db.select({ count: count() }).from(missionsTable);
  const [campaignsCount] = await db.select({ count: count() }).from(campaignsTable);
  const [openTickets]    = await db.select({ count: count() }).from(ticketsTable).where(eq(ticketsTable.status, "open"));
  const [totalCoins]     = await db.select({ total: sum(coinTransactionsTable.amount) }).from(coinTransactionsTable).where(eq(coinTransactionsTable.type, "earn"));

  const oneDayAgo = new Date(Date.now() - 86_400_000);
  const [activeToday] = await db.select({ count: count() }).from(usersTable).where(gte(usersTable.updatedAt, oneDayAgo));

  res.json({
    totalUsers: Number(usersCount.count),
    totalMissions: Number(missionsCount.count),
    totalCampaigns: Number(campaignsCount.count),
    openTickets: Number(openTickets.count),
    totalCoinsEarned: Number(totalCoins.total ?? 0),
    activeUsersToday: Number(activeToday.count),
  });
});

// ── Statistiques économie coins ────────────────────────────────────────────
router.get("/admin/stats/coins", requireAuth, requireAdmin, async (_req, res) => {
  const byType = await db
    .select({ type: coinTransactionsTable.type, total: sum(coinTransactionsTable.amount), txCount: count() })
    .from(coinTransactionsTable)
    .groupBy(coinTransactionsTable.type);

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
  const recentEarned = await db
    .select({ total: sum(coinTransactionsTable.amount) })
    .from(coinTransactionsTable)
    .where(gte(coinTransactionsTable.createdAt, sevenDaysAgo));

  res.json({
    byType,
    last7DaysEarned: Number(recentEarned[0]?.total ?? 0),
  });
});

// ── Liste des utilisateurs ─────────────────────────────────────────────────
router.get("/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const offset = Number(req.query.offset ?? 0);
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
  const safe = users.map(({ passwordHash: _, ...u }) => u);
  res.json(safe);
});

// ── Modifier un utilisateur (ban, premium, rang) ───────────────────────────
router.patch("/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { isPremium, rank, bio } = req.body as {
    isPremium?: boolean;
    rank?: "Bronze" | "Silver" | "Gold" | "Elite" | "Demon" | "Legend";
    bio?: string;
  };
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (isPremium !== undefined) updates.isPremium = isPremium;
  if (rank) updates.rank = rank;
  if (bio !== undefined) updates.bio = bio;

  await db.update(usersTable).set(updates as never).where(eq(usersTable.id, id));
  res.json({ message: "Utilisateur mis à jour" });
});

// ── Réinitialiser le streak d'un utilisateur ──────────────────────────────
router.post("/admin/users/:id/reset-streak", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.update(usersTable).set({ dailyStreak: 0, lastCheckinAt: null as any, updatedAt: new Date() }).where(eq(usersTable.id, id));
  res.json({ message: "Streak réinitialisé" });
});

// ── Ajuster les coins d'un utilisateur ────────────────────────────────────
router.post("/admin/users/:id/adjust-coins", requireAuth, requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  const { amount, reason } = req.body as { amount: number; reason: string };
  if (!amount || !reason) { res.status(400).json({ message: "amount and reason required" }); return; }

  await db.update(usersTable).set({ coins: sql`coins + ${amount}`, updatedAt: new Date() }).where(eq(usersTable.id, userId));
  await db.insert(coinTransactionsTable).values({
    userId, amount, type: "adjustment", description: `Admin: ${reason}`,
  });
  await db.insert(activityFeedTable).values({
    userId, type: "admin_adjustment",
    description: `${amount > 0 ? "+" : ""}${amount} coins (admin) — ${reason}`,
  });
  res.json({ message: `${amount > 0 ? "+" : ""}${amount} coins ajustés` });
});

// ── Liste toutes les missions (admin) ─────────────────────────────────────
router.get("/admin/missions", requireAuth, requireAdmin, async (_req, res) => {
  const missions = await db.select().from(missionsTable).orderBy(desc(missionsTable.createdAt));
  res.json(missions);
});

// ── Créer une mission ──────────────────────────────────────────────────────
router.post("/admin/missions", requireAuth, requireAdmin, async (req, res) => {
  const { title, description, type, coinsReward, xpReward, targetUrl, isDaily } = req.body as {
    title: string; description?: string;
    type: "watch" | "like" | "comment" | "follow" | "share";
    coinsReward?: number; xpReward?: number; targetUrl?: string; isDaily?: boolean;
  };
  if (!title || !type) { res.status(400).json({ message: "title and type required" }); return; }
  const [mission] = await db.insert(missionsTable).values({
    title, description, type,
    coinsReward: coinsReward ?? 10,
    xpReward: xpReward ?? 5,
    targetUrl, isDaily: isDaily ?? false,
  }).returning();
  res.status(201).json(mission);
});

// ── Modifier une mission ───────────────────────────────────────────────────
router.patch("/admin/missions/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status, title, description, coinsReward, xpReward, targetUrl, isDaily } = req.body as {
    status?: "active" | "paused" | "completed";
    title?: string; description?: string;
    coinsReward?: number; xpReward?: number; targetUrl?: string; isDaily?: boolean;
  };
  const updates: Record<string, unknown> = {};
  if (status)              updates.status = status;
  if (title)               updates.title = title;
  if (description !== undefined) updates.description = description;
  if (coinsReward !== undefined) updates.coinsReward = coinsReward;
  if (xpReward !== undefined)    updates.xpReward = xpReward;
  if (targetUrl !== undefined)   updates.targetUrl = targetUrl;
  if (isDaily !== undefined)     updates.isDaily = isDaily;

  await db.update(missionsTable).set(updates as never).where(eq(missionsTable.id, id));
  res.json({ message: "Mission mise à jour" });
});

// ── Supprimer une mission ──────────────────────────────────────────────────
router.delete("/admin/missions/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(missionsTable).where(eq(missionsTable.id, id));
  res.json({ message: "Mission supprimée" });
});

// ── Gestion des tickets ────────────────────────────────────────────────────
router.get("/admin/tickets", requireAuth, requireAdmin, async (req, res) => {
  const status = req.query.status as string | undefined;
  let query = db.select().from(ticketsTable).orderBy(desc(ticketsTable.createdAt)).limit(100);
  const tickets = status
    ? await db.select().from(ticketsTable).where(eq(ticketsTable.status, status as any)).orderBy(desc(ticketsTable.createdAt)).limit(100)
    : await query;
  res.json(tickets);
});

router.patch("/admin/tickets/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status: "open" | "in_progress" | "resolved" | "closed" };
  await db.update(ticketsTable).set({ status, updatedAt: new Date() }).where(eq(ticketsTable.id, id));
  res.json({ message: "Ticket mis à jour" });
});

// ── Gestion des campagnes ──────────────────────────────────────────────────
router.get("/admin/campaigns", requireAuth, requireAdmin, async (_req, res) => {
  const campaigns = await db.select().from(campaignsTable).orderBy(desc(campaignsTable.createdAt));
  res.json(campaigns);
});

router.patch("/admin/campaigns/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status: "pending" | "active" | "paused" | "completed" };
  await db.update(campaignsTable).set({ status, updatedAt: new Date() }).where(eq(campaignsTable.id, id));
  res.json({ message: "Campagne mise à jour" });
});

// ── Activity feed global (admin) ───────────────────────────────────────────
router.get("/admin/activity", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const activity = await db.select().from(activityFeedTable).orderBy(desc(activityFeedTable.createdAt)).limit(limit);
  res.json(activity);
});

// ── Broadcast push notification ────────────────────────────────────────────
router.post("/admin/broadcast", requireAuth, requireAdmin, async (req, res) => {
  const { title, body, data } = req.body as { title: string; body: string; data?: Record<string, string> };
  if (!title || !body) { res.status(400).json({ message: "title and body required" }); return; }

  const usersWithToken = await db
    .select({ fcmToken: usersTable.fcmToken })
    .from(usersTable)
    .where(sql`${usersTable.fcmToken} IS NOT NULL`);

  const tokens = usersWithToken.map(u => u.fcmToken!).filter(Boolean);
  if (tokens.length === 0) {
    res.json({ message: "Aucun token FCM disponible", sent: 0 });
    return;
  }

  await sendPushToMany(tokens, title, body, data);

  await db.insert(activityFeedTable).values({
    userId: req.user!.userId,
    type: "admin_broadcast",
    description: `Broadcast: ${title} — ${tokens.length} destinataires`,
  });

  res.json({ message: `Notification envoyée à ${tokens.length} utilisateurs`, sent: tokens.length });
});

export default router;
