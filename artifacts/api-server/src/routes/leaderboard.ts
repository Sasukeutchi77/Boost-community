import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/leaderboard", requireAuth, async (req, res) => {
  const limit = Number(req.query.limit ?? 50);
  const users = await db.select({ id: usersTable.id, username: usersTable.username, rank: usersTable.rank, level: usersTable.level, xp: usersTable.xp }).from(usersTable).orderBy(desc(usersTable.xp)).limit(limit);
  const entries = users.map(u => ({ userId: u.id, username: u.username, rank: u.rank, level: u.level, xp: u.xp }));
  res.json(entries);
});

router.get("/leaderboard/my-rank", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const allUsers = await db.select({ id: usersTable.id, xp: usersTable.xp, level: usersTable.level }).from(usersTable).orderBy(desc(usersTable.xp));
  const position = allUsers.findIndex(u => u.id === userId) + 1;
  const me = allUsers.find(u => u.id === userId);
  res.json({ rank: position, xp: me?.xp ?? 0, level: me?.level ?? 1 });
});

export default router;
