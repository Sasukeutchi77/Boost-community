import { Router } from "express";
import { db, usersTable, coinTransactionsTable } from "@workspace/db";
import { eq, and, count, sum } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/referrals/stats", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const users = await db.select({ referralCode: usersTable.referralCode }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const code = users[0]?.referralCode ?? "";
  const [referralsRes] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.referredBy, userId));
  const [coinsRes] = await db.select({ total: sum(coinTransactionsTable.amount) }).from(coinTransactionsTable).where(and(eq(coinTransactionsTable.userId, userId), eq(coinTransactionsTable.referenceType, "referral")));
  res.json({ referralCode: code, totalReferrals: referralsRes.count, coinsEarned: Number(coinsRes.total ?? 0) });
});

export default router;
