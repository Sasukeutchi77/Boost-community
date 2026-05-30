import { Router } from "express";
import { db, usersTable, coinTransactionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/coins/balance", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const users = await db.select({ coins: usersTable.coins }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json({ balance: users[0]?.coins ?? 0, pendingEarnings: 0 });
});

router.get("/coins/transactions", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);
  const txs = await db.select().from(coinTransactionsTable).where(eq(coinTransactionsTable.userId, userId)).orderBy(desc(coinTransactionsTable.createdAt)).limit(limit).offset(offset);
  res.json(txs);
});

export default router;
