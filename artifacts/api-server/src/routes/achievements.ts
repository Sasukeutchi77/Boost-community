import { Router } from "express";
import { db, achievementsTable, userAchievementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/achievements", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const achievements = await db.select().from(achievementsTable);
  const userAchievements = await db.select().from(userAchievementsTable).where(eq(userAchievementsTable.userId, userId));
  const userMap = new Map(userAchievements.map(ua => [ua.achievementId, ua]));

  const result = achievements.map(a => {
    const ua = userMap.get(a.id);
    return {
      ...a,
      progress: ua?.progress ?? 0,
      unlocked: !!ua?.unlockedAt,
    };
  });
  res.json(result);
});

export default router;
