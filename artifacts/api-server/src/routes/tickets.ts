import { Router } from "express";
import { db, ticketsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/tickets", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const status = req.query.status as string | undefined;
  let tickets;
  if (status) {
    tickets = await db.select().from(ticketsTable).where(and(eq(ticketsTable.userId, userId), eq(ticketsTable.status, status as "open" | "in_progress" | "resolved" | "closed"))).orderBy(desc(ticketsTable.createdAt));
  } else {
    tickets = await db.select().from(ticketsTable).where(eq(ticketsTable.userId, userId)).orderBy(desc(ticketsTable.createdAt));
  }
  res.json(tickets);
});

router.post("/tickets", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { subject, message } = req.body as { subject: string; message: string };
  if (!subject || !message) {
    res.status(400).json({ message: "Subject and message required" });
    return;
  }
  const [ticket] = await db.insert(ticketsTable).values({ userId, subject, message }).returning();
  res.status(201).json(ticket);
});

export default router;
