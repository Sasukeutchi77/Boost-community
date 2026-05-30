import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/users/me", requireAuth, async (req, res) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  const user = users[0];
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

router.patch("/users/me", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { bio } = req.body as { bio?: string };
  const updates: Record<string, unknown> = {};
  if (bio !== undefined) updates.bio = bio.slice(0, 300);
  if (Object.keys(updates).length === 0) { res.status(400).json({ message: "Nothing to update" }); return; }
  await db.update(usersTable).set(updates as never).where(eq(usersTable.id, userId));
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const { passwordHash: _, ...safeUser } = users[0];
  res.json(safeUser);
});

export default router;
