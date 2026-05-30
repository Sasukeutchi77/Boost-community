import { Router } from "express";
import { db, usersTable, coinTransactionsTable, activityFeedTable, achievementsTable, userAchievementsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { sendPushNotification } from "../lib/firebase.js";

const router = Router();

// ── Calcul de la récompense selon le streak ────────────────────────────────
function getStreakReward(streak: number): { coins: number; xp: number; label: string } {
  if (streak >= 30) return { coins: 300, xp: 150, label: "Streak 30 jours !" };
  if (streak >= 14) return { coins: 150, xp: 75,  label: "Streak 2 semaines !" };
  if (streak % 7 === 0) return { coins: 75,  xp: 35,  label: `Streak ${streak} jours !` };
  const base = [0, 10, 15, 20, 25, 30, 40][Math.min(streak, 6)];
  const xpBase = [0, 5,  8,  10, 12, 15, 20][Math.min(streak, 6)];
  return { coins: base, xp: xpBase, label: `Jour ${streak}` };
}

// ── Vérification et attribution des achievements streak ────────────────────
async function checkStreakAchievements(userId: number, streak: number) {
  const milestones = [3, 7, 14, 30];
  if (!milestones.includes(streak)) return;

  const achievements = await db
    .select()
    .from(achievementsTable)
    .where(eq(achievementsTable.category, "streak"));

  for (const ach of achievements) {
    if (ach.requirement !== streak) continue;
    const existing = await db
      .select()
      .from(userAchievementsTable)
      .where(eq(userAchievementsTable.userId, userId))
      .limit(1);
    const alreadyUnlocked = existing.some((ua) => ua.achievementId === ach.id && ua.unlockedAt);
    if (alreadyUnlocked) continue;

    await db.insert(userAchievementsTable).values({
      userId,
      achievementId: ach.id,
      progress: streak,
      unlockedAt: new Date(),
    }).onConflictDoNothing();

    if (ach.rewardCoins > 0) {
      await db.update(usersTable).set({ coins: sql`coins + ${ach.rewardCoins}` }).where(eq(usersTable.id, userId));
      await db.insert(coinTransactionsTable).values({
        userId,
        amount: ach.rewardCoins,
        type: "bonus",
        description: `Achievement débloqué : ${ach.title}`,
        referenceType: "achievement",
      });
    }
  }
}

// ── POST /auth/checkin ─────────────────────────────────────────────────────
router.post("/auth/checkin", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];
  if (!user) { res.status(404).json({ message: "Utilisateur introuvable" }); return; }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);

  const lastCheckin = user.lastCheckinAt ? new Date(user.lastCheckinAt) : null;

  // Déjà checké aujourd'hui
  if (lastCheckin && lastCheckin >= todayStart) {
    const nextCheckin = new Date(todayStart.getTime() + 86_400_000);
    res.status(409).json({
      message: "Déjà checké aujourd'hui",
      streak: user.dailyStreak,
      nextCheckinAt: nextCheckin.toISOString(),
    });
    return;
  }

  // Calculer le nouveau streak
  const isConsecutive = lastCheckin && lastCheckin >= yesterdayStart;
  const newStreak = isConsecutive ? user.dailyStreak + 1 : 1;
  const { coins, xp, label } = getStreakReward(newStreak);

  // Calculer le nouveau rang selon XP total
  const newXp = user.xp + xp;
  const newLevel = Math.floor(newXp / 200) + 1;

  const RANK_THRESHOLDS: Array<{ xp: number; rank: string }> = [
    { xp: 0,    rank: "Bronze"  },
    { xp: 500,  rank: "Silver"  },
    { xp: 1500, rank: "Gold"    },
    { xp: 3500, rank: "Elite"   },
    { xp: 7000, rank: "Demon"   },
    { xp: 15000, rank: "Legend" },
  ];
  const newRank = RANK_THRESHOLDS.filter(r => newXp >= r.xp).pop()?.rank ?? "Bronze";

  // Mise à jour de l'utilisateur
  await db.update(usersTable).set({
    dailyStreak: newStreak,
    lastCheckinAt: now,
    coins: sql`coins + ${coins}`,
    xp: newXp,
    level: newLevel,
    rank: newRank as "Bronze" | "Silver" | "Gold" | "Elite" | "Demon" | "Legend",
    updatedAt: now,
  }).where(eq(usersTable.id, userId));

  // Transaction coins
  await db.insert(coinTransactionsTable).values({
    userId,
    amount: coins,
    type: "earn",
    description: `Check-in quotidien — ${label}`,
    referenceType: "checkin",
  });

  // Activity feed
  await db.insert(activityFeedTable).values({
    userId,
    type: "daily_checkin",
    description: `Check-in du jour — Streak ${newStreak} — +${coins} coins, +${xp} XP`,
    metadata: JSON.stringify({ streak: newStreak, coins, xp }),
  });

  // Achievements streak
  await checkStreakAchievements(userId, newStreak);

  // Push notification si FCM token disponible
  if (user.fcmToken) {
    await sendPushNotification(
      user.fcmToken,
      `Streak ${newStreak} jour${newStreak > 1 ? "s" : ""} !`,
      `+${coins} coins et +${xp} XP gagnés. Continue comme ca !`,
      { type: "daily_checkin", streak: String(newStreak) }
    );
  }

  const nextCheckinAt = new Date(todayStart.getTime() + 86_400_000);

  res.json({
    streak: newStreak,
    coinsEarned: coins,
    xpEarned: xp,
    label,
    newRank,
    nextCheckinAt: nextCheckinAt.toISOString(),
    alreadyCheckedIn: false,
  });
});

// ── GET /auth/checkin/status ───────────────────────────────────────────────
router.get("/auth/checkin/status", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  const users = await db.select({
    dailyStreak: usersTable.dailyStreak,
    lastCheckinAt: usersTable.lastCheckinAt,
  }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  const user = users[0];
  if (!user) { res.status(404).json({ message: "Utilisateur introuvable" }); return; }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastCheckin = user.lastCheckinAt ? new Date(user.lastCheckinAt) : null;
  const alreadyCheckedIn = !!(lastCheckin && lastCheckin >= todayStart);

  const nextCheckinAt = new Date(todayStart.getTime() + 86_400_000);
  const { coins, xp, label } = getStreakReward(
    alreadyCheckedIn ? user.dailyStreak : user.dailyStreak + 1
  );

  res.json({
    streak: user.dailyStreak,
    alreadyCheckedIn,
    lastCheckinAt: user.lastCheckinAt?.toISOString() ?? null,
    nextCheckinAt: nextCheckinAt.toISOString(),
    nextReward: { coins, xp, label },
  });
});

export default router;
