import { Router } from "express";
import { db, usersTable, missionsTable, campaignsTable, ticketsTable, coinTransactionsTable } from "@workspace/db";
import { eq, desc, count, sum } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES ?? "admin").split(",").map(s => s.trim());

function requireAdmin(req: any, res: any, next: any) {
  if (!ADMIN_USERNAMES.includes(req.user?.username ?? "")) {
    res.status(403).json({ message: "Admin only" });
    return;
  }
  next();
}

const router = Router();

// Stats globales
router.get("/admin/stats", requireAuth, requireAdmin, async (_req, res) => {
  const [usersCount] = await db.select({ count: count() }).from(usersTable);
  const [missionsCount] = await db.select({ count: count() }).from(missionsTable);
  const [campaignsCount] = await db.select({ count: count() }).from(campaignsTable);
  const [openTickets] = await db.select({ count: count() }).from(ticketsTable).where(eq(ticketsTable.status, "open"));
  const [totalCoins] = await db.select({ total: sum(coinTransactionsTable.amount) }).from(coinTransactionsTable).where(eq(coinTransactionsTable.type, "earn"));
  res.json({ totalUsers: usersCount.count, totalMissions: missionsCount.count, totalCampaigns: campaignsCount.count, openTickets: openTickets.count, totalCoinsEarned: Number(totalCoins.total ?? 0) });
});

// Liste des utilisateurs
router.get("/admin/users", requireAuth, requireAdmin, async (_req, res) => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(100);
  const safe = users.map(({ passwordHash: _, ...u }) => u);
  res.json(safe);
});

// Créer une mission
router.post("/admin/missions", requireAuth, requireAdmin, async (req, res) => {
  const { title, description, type, coinsReward, xpReward, targetUrl, isDaily } = req.body as {
    title: string; description?: string; type: "watch" | "like" | "comment" | "follow" | "share";
    coinsReward?: number; xpReward?: number; targetUrl?: string; isDaily?: boolean;
  };
  if (!title || !type) { res.status(400).json({ message: "title and type required" }); return; }
  const [mission] = await db.insert(missionsTable).values({ title, description, type, coinsReward: coinsReward ?? 10, xpReward: xpReward ?? 5, targetUrl, isDaily: isDaily ?? false }).returning();
  res.status(201).json(mission);
});

// Modifier le statut d'une mission
router.patch("/admin/missions/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status: "active" | "paused" | "completed" };
  await db.update(missionsTable).set({ status }).where(eq(missionsTable.id, id));
  res.json({ message: "Mission updated" });
});

// Supprimer une mission
router.delete("/admin/missions/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(missionsTable).where(eq(missionsTable.id, id));
  res.json({ message: "Mission deleted" });
});

// Gérer les tickets support
router.get("/admin/tickets", requireAuth, requireAdmin, async (_req, res) => {
  const tickets = await db.select().from(ticketsTable).orderBy(desc(ticketsTable.createdAt)).limit(100);
  res.json(tickets);
});

router.patch("/admin/tickets/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status: "open" | "in_progress" | "resolved" | "closed" };
  await db.update(ticketsTable).set({ status, updatedAt: new Date() }).where(eq(ticketsTable.id, id));
  res.json({ message: "Ticket updated" });
});

// Gérer les campagnes
router.patch("/admin/campaigns/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status: "pending" | "active" | "paused" | "completed" };
  await db.update(campaignsTable).set({ status }).where(eq(campaignsTable.id, id));
  res.json({ message: "Campaign updated" });
});

// Ajuster les coins d'un utilisateur
router.post("/admin/users/:id/adjust-coins", requireAuth, requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  const { amount, reason } = req.body as { amount: number; reason: string };
  if (!amount || !reason) { res.status(400).json({ message: "amount and reason required" }); return; }
  const { sql } = await import("drizzle-orm");
  await db.update(usersTable).set({ coins: sql`coins + ${amount}` }).where(eq(usersTable.id, userId));
  await db.insert(coinTransactionsTable).values({ userId, amount, type: "adjustment", description: `Admin: ${reason}` });
  res.json({ message: `${amount > 0 ? "+" : ""}${amount} coins ajustés` });
});

export default router;
