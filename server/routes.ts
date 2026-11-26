import { Router } from "express";
import bcrypt from "bcryptjs";
import { requireAuth, signToken } from "./auth.ts";
import { computeRankAndLevel, getStreakReward, store, toSafeUser } from "./store.ts";
import type { CampaignStatus, MissionType } from "./types.ts";

const router = Router();

// ─── Health ───────────────────────────────────────────────────────────────────
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", mode: process.env.DATABASE_URL ? "postgres" : "memory" });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ message: "Identifiant et mot de passe requis" });
    return;
  }

  const identifier = username.trim().toLowerCase();
  const user = store.users.find(
    (u) => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier,
  );
  if (!user) {
    res.status(401).json({ message: "Identifiants incorrects" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Identifiants incorrects" });
    return;
  }

  const token = signToken({ userId: user.id, username: user.username });
  res.json({ token, user: toSafeUser(user) });
});

router.post("/auth/register", async (req, res) => {
  const { username, email, password, referralCode } = req.body as {
    username?: string;
    email?: string;
    password?: string;
    referralCode?: string;
  };

  if (!username?.trim() || !email?.trim() || !password?.trim()) {
    res.status(400).json({ message: "Tous les champs sont requis" });
    return;
  }
  if (username.trim().length < 3) {
    res.status(400).json({ message: "Le nom d'utilisateur doit faire au moins 3 caractères" });
    return;
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
    res.status(400).json({
      message: "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et points",
    });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ message: "Le mot de passe doit faire au moins 6 caractères" });
    return;
  }

  const usernameClean = username.trim();
  const emailClean = email.trim().toLowerCase();

  if (store.users.some((u) => u.username.toLowerCase() === usernameClean.toLowerCase())) {
    res.status(409).json({ message: "Ce nom d'utilisateur est déjà pris" });
    return;
  }
  if (store.users.some((u) => u.email.toLowerCase() === emailClean)) {
    res.status(409).json({ message: "Cet email est déjà associé à un compte" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();

  let referredById: number | null = null;
  if (referralCode?.trim()) {
    const referrer = store.users.find(
      (u) => u.referralCode === referralCode.trim().toUpperCase(),
    );
    if (referrer) referredById = referrer.id;
  }

  const now = new Date().toISOString();
  const newUser = {
    id: store.nextUserId(),
    username: usernameClean,
    email: emailClean,
    passwordHash,
    rank: "Bronze" as const,
    level: 1,
    xp: 0,
    coins: 100,
    dailyStreak: 0,
    lastCheckinAt: null,
    isPremium: false,
    referralCode: code,
    referredBy: referredById,
    avatarUrl: null,
    bio: null,
    createdAt: now,
    updatedAt: now,
  };
  store.users.push(newUser);

  store.coinTransactions.push({
    id: store.nextCoinTxId(),
    userId: newUser.id,
    amount: 100,
    type: "bonus",
    description: "Bonus de bienvenue",
    referenceId: null,
    referenceType: "welcome",
    createdAt: now,
  });

  if (referredById) {
    const referrer = store.users.find((u) => u.id === referredById);
    if (referrer) {
      const REFERRAL_BONUS = 50;
      referrer.coins += REFERRAL_BONUS;
      store.coinTransactions.push({
        id: store.nextCoinTxId(),
        userId: referredById,
        amount: REFERRAL_BONUS,
        type: "bonus",
        description: `Parrainage : ${usernameClean} a rejoint !`,
        referenceId: newUser.id,
        referenceType: "referral",
        createdAt: now,
      });
      store.activityFeed.push({
        id: store.nextActivityId(),
        userId: referredById,
        type: "referral_reward",
        description: `+${REFERRAL_BONUS} coins : ${usernameClean} a rejoint grâce à ton code !`,
        metadata: null,
        createdAt: now,
      });
      store.syncAchievements(referredById);
    }
  }

  const token = signToken({ userId: newUser.id, username: newUser.username });
  res.status(201).json({ token, user: toSafeUser(newUser) });
});

router.post("/auth/forgot-password", (_req, res) => {
  res.json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
});

router.post("/auth/logout", requireAuth, (_req, res) => {
  res.json({ message: "Déconnecté" });
});

// ─── Check-in ─────────────────────────────────────────────────────────────────
router.get("/auth/checkin/status", requireAuth, (req, res) => {
  const user = store.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    res.status(404).json({ message: "Utilisateur introuvable" });
    return;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastCheckin = user.lastCheckinAt ? new Date(user.lastCheckinAt) : null;
  const alreadyCheckedIn = Boolean(lastCheckin && lastCheckin >= todayStart);
  const nextCheckinAt = new Date(todayStart.getTime() + 86_400_000);
  const nextReward = getStreakReward(alreadyCheckedIn ? user.dailyStreak : user.dailyStreak + 1);

  res.json({
    streak: user.dailyStreak,
    alreadyCheckedIn,
    lastCheckinAt: user.lastCheckinAt,
    nextCheckinAt: nextCheckinAt.toISOString(),
    nextReward,
  });
});

router.post("/auth/checkin", requireAuth, (req, res) => {
  const user = store.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    res.status(404).json({ message: "Utilisateur introuvable" });
    return;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const lastCheckin = user.lastCheckinAt ? new Date(user.lastCheckinAt) : null;

  if (lastCheckin && lastCheckin >= todayStart) {
    const nextCheckin = new Date(todayStart.getTime() + 86_400_000);
    res.status(409).json({
      message: "Déjà checké aujourd'hui",
      streak: user.dailyStreak,
      nextCheckinAt: nextCheckin.toISOString(),
    });
    return;
  }

  const isConsecutive = Boolean(lastCheckin && lastCheckin >= yesterdayStart);
  const newStreak = isConsecutive ? user.dailyStreak + 1 : 1;
  const { coins, xp, label } = getStreakReward(newStreak);

  user.dailyStreak = newStreak;
  user.lastCheckinAt = now.toISOString();
  user.coins += coins;
  user.xp += xp;
  const { rank, level } = computeRankAndLevel(user.xp);
  user.rank = rank;
  user.level = level;
  user.updatedAt = now.toISOString();

  store.coinTransactions.push({
    id: store.nextCoinTxId(),
    userId: user.id,
    amount: coins,
    type: "earn",
    description: `Check-in quotidien — ${label}`,
    referenceId: null,
    referenceType: "checkin",
    createdAt: now.toISOString(),
  });

  store.activityFeed.push({
    id: store.nextActivityId(),
    userId: user.id,
    type: "daily_checkin",
    description: `Check-in du jour — Streak ${newStreak} — +${coins} coins, +${xp} XP`,
    metadata: JSON.stringify({ streak: newStreak, coins, xp }),
    createdAt: now.toISOString(),
  });

  store.syncAchievements(user.id);

  const nextCheckinAt = new Date(todayStart.getTime() + 86_400_000);
  res.json({
    streak: newStreak,
    coinsEarned: coins,
    xpEarned: xp,
    label,
    newRank: rank,
    nextCheckinAt: nextCheckinAt.toISOString(),
    alreadyCheckedIn: false,
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────
router.get("/users/me", requireAuth, (req, res) => {
  const user = store.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(toSafeUser(user));
});

router.patch("/users/me", requireAuth, (req, res) => {
  const user = store.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const { bio } = req.body as { bio?: string };
  if (bio === undefined) {
    res.status(400).json({ message: "Nothing to update" });
    return;
  }
  user.bio = bio.slice(0, 300);
  user.updatedAt = new Date().toISOString();
  res.json(toSafeUser(user));
});

// ─── Upload Avatar ────────────────────────────────────────────────────────────
router.post("/upload/avatar", requireAuth, (req, res) => {
  const user = store.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const { image } = req.body as { image?: string };
  if (!image) {
    res.status(400).json({ message: "Image data required (base64)" });
    return;
  }
  if (image.length * 0.75 > 5 * 1024 * 1024) {
    res.status(400).json({ message: "Image too large (max 5MB)" });
    return;
  }
  user.avatarUrl = image;
  user.updatedAt = new Date().toISOString();
  res.json({ avatarUrl: image, message: "Avatar mis à jour !" });
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get("/dashboard/stats", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const missionsCompleted = store.userMissions.filter((um) => um.userId === userId).length;
  const activeCampaigns = store.campaigns.filter(
    (c) => c.ownerId === userId && c.status === "active",
  ).length;
  const totalCoinsEarned = store.coinTransactions
    .filter((t) => t.userId === userId && (t.type === "earn" || t.type === "bonus"))
    .reduce((sum, t) => sum + t.amount, 0);
  const followersGained = store.campaigns
    .filter((c) => c.ownerId === userId)
    .reduce((sum, c) => sum + c.completedCount, 0);

  res.json({
    missionsCompleted,
    activeCampaigns,
    totalCoinsEarned,
    followersGained,
  });
});

router.get("/dashboard/activity-feed", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const limit = Number(req.query.limit ?? 20);
  const feed = store.activityFeed
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  res.json(feed);
});

// ─── Missions ─────────────────────────────────────────────────────────────────
router.get("/missions", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const type = req.query.type as string | undefined;
  const completedIds = new Set(
    store.userMissions.filter((um) => um.userId === userId).map((um) => um.missionId),
  );
  const filtered = store.missions.filter(
    (m) => m.status === "active" && (!type || m.type === type),
  );
  res.json(
    filtered.map((m) => ({
      ...m,
      userStatus: completedIds.has(m.id) ? "completed" : "active",
    })),
  );
});

router.get("/missions/daily", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const completedIds = new Set(
    store.userMissions.filter((um) => um.userId === userId).map((um) => um.missionId),
  );
  const filtered = store.missions.filter((m) => m.isDaily && m.status === "active");
  res.json(
    filtered.map((m) => ({
      ...m,
      userStatus: completedIds.has(m.id) ? "completed" : "active",
    })),
  );
});

router.post("/missions/:missionId/complete", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const missionId = Number(req.params.missionId);
  const { proofUrl } = req.body as { proofUrl?: string };

  const mission = store.missions.find((m) => m.id === missionId);
  if (!mission) {
    res.status(404).json({ message: "Mission not found" });
    return;
  }

  const already = store.userMissions.some(
    (um) => um.userId === userId && um.missionId === missionId,
  );
  if (already) {
    res.status(400).json({ message: "Mission already completed" });
    return;
  }

  if (mission.targetUrl && !proofUrl) {
    res.status(400).json({
      message: "Une URL de preuve est requise pour cette mission",
      requiresProof: true,
    });
    return;
  }

  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const now = new Date().toISOString();
  store.userMissions.push({
    id: store.nextUserMissionId(),
    userId,
    missionId,
    status: "completed",
    completedAt: now,
  });

  user.coins += mission.coinsReward;
  user.xp += mission.xpReward;
  const { rank, level } = computeRankAndLevel(user.xp);
  user.rank = rank;
  user.level = level;
  user.updatedAt = now;

  store.coinTransactions.push({
    id: store.nextCoinTxId(),
    userId,
    amount: mission.coinsReward,
    type: "earn",
    description: `Mission: ${mission.title}`,
    referenceId: missionId,
    referenceType: "mission",
    createdAt: now,
  });

  store.activityFeed.push({
    id: store.nextActivityId(),
    userId,
    type: "mission_completed",
    description: `Mission accomplie : ${mission.title}`,
    metadata: null,
    createdAt: now,
  });

  store.syncAchievements(userId);

  res.json({
    coinsEarned: mission.coinsReward,
    xpEarned: mission.xpReward,
    message: "Mission complétée !",
    targetUrl: mission.targetUrl,
  });
});

// ─── Campaigns ────────────────────────────────────────────────────────────────
router.get("/campaigns", requireAuth, (req, res) => {
  const status = (req.query.status as CampaignStatus | undefined) ?? "active";
  const campaigns = store.campaigns.filter((c) => c.status === status);
  res.json(campaigns);
});

router.get("/campaigns/mine", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const campaigns = store.campaigns
    .filter((c) => c.ownerId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(campaigns);
});

router.post("/campaigns", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const { title, description, targetType, targetUrl, targetCount } = req.body as {
    title?: string;
    description?: string;
    targetType?: MissionType;
    targetUrl?: string;
    targetCount?: number;
  };

  if (!title?.trim() || !targetType) {
    res.status(400).json({ message: "Title and targetType are required" });
    return;
  }

  const count = Math.max(10, Math.min(targetCount ?? 100, 10000));
  const coinsRequired = Math.floor(count * 0.5);

  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (user.coins < coinsRequired) {
    res.status(400).json({
      message: `Coins insuffisants. Cette campagne coûte ${coinsRequired} coins (tu as ${user.coins})`,
      coinsRequired,
      currentCoins: user.coins,
    });
    return;
  }

  const now = new Date().toISOString();
  user.coins -= coinsRequired;
  user.updatedAt = now;

  store.coinTransactions.push({
    id: store.nextCoinTxId(),
    userId,
    amount: -coinsRequired,
    type: "spend",
    description: `Campagne créée : ${title.trim()}`,
    referenceId: null,
    referenceType: "campaign",
    createdAt: now,
  });

  const campaign = {
    id: store.nextCampaignId(),
    ownerId: userId,
    title: title.trim(),
    description: description?.trim() || null,
    targetType,
    targetUrl: targetUrl?.trim() || null,
    targetCount: count,
    completedCount: 0,
    coinsRequired,
    status: "active" as const,
    createdAt: now,
    updatedAt: now,
  };
  store.campaigns.unshift(campaign);

  store.activityFeed.push({
    id: store.nextActivityId(),
    userId,
    type: "campaign_created",
    description: `Campagne lancée : ${campaign.title}`,
    metadata: null,
    createdAt: now,
  });

  store.syncAchievements(userId);
  res.status(201).json(campaign);
});

router.patch("/campaigns/:id/status", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const campaignId = Number(req.params.id);
  const { status } = req.body as { status?: "active" | "paused" };

  const campaign = store.campaigns.find(
    (c) => c.id === campaignId && c.ownerId === userId,
  );
  if (!campaign) {
    res.status(404).json({ message: "Campaign not found or not yours" });
    return;
  }
  if (status !== "active" && status !== "paused") {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  campaign.status = status;
  campaign.updatedAt = new Date().toISOString();
  res.json({ message: `Campaign ${status}`, campaign });
});

// ─── Coins ────────────────────────────────────────────────────────────────────
router.get("/coins/balance", requireAuth, (req, res) => {
  const user = store.users.find((u) => u.id === req.user!.userId);
  res.json({ balance: user?.coins ?? 0, pendingEarnings: 0 });
});

router.get("/coins/transactions", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);
  const txs = store.coinTransactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(offset, offset + limit);
  res.json(txs);
});

// ─── Leaderboard ──────────────────────────────────────────────────────────────
router.get("/leaderboard", requireAuth, (req, res) => {
  const limit = Number(req.query.limit ?? 50);
  const sorted = [...store.users]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit)
    .map((u) => ({
      userId: u.id,
      username: u.username,
      rank: u.rank,
      level: u.level,
      xp: u.xp,
    }));
  res.json(sorted);
});

router.get("/leaderboard/my-rank", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const sorted = [...store.users].sort((a, b) => b.xp - a.xp);
  const position = sorted.findIndex((u) => u.id === userId) + 1;
  const me = sorted.find((u) => u.id === userId);
  res.json({ rank: position, xp: me?.xp ?? 0, level: me?.level ?? 1 });
});

// ─── Achievements ─────────────────────────────────────────────────────────────
router.get("/achievements", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  store.syncAchievements(userId);
  const userMap = new Map(
    store.userAchievements
      .filter((ua) => ua.userId === userId)
      .map((ua) => [ua.achievementId, ua]),
  );
  const result = store.achievements.map((a) => {
    const ua = userMap.get(a.id);
    return {
      ...a,
      progress: ua?.progress ?? 0,
      unlocked: Boolean(ua?.unlockedAt),
    };
  });
  res.json(result);
});

// ─── Tickets ──────────────────────────────────────────────────────────────────
router.get("/tickets", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const status = req.query.status as string | undefined;
  const tickets = store.tickets
    .filter((t) => t.userId === userId && (!status || t.status === status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(tickets);
});

router.post("/tickets", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const { subject, message } = req.body as { subject?: string; message?: string };
  if (!subject?.trim() || !message?.trim()) {
    res.status(400).json({ message: "Subject and message required" });
    return;
  }
  const now = new Date().toISOString();
  const ticket = {
    id: store.nextTicketId(),
    userId,
    subject: subject.trim(),
    message: message.trim(),
    status: "open" as const,
    createdAt: now,
    updatedAt: now,
  };
  store.tickets.unshift(ticket);
  res.status(201).json(ticket);
});

// ─── Referrals ────────────────────────────────────────────────────────────────
router.get("/referrals/stats", requireAuth, (req, res) => {
  const userId = req.user!.userId;
  const user = store.users.find((u) => u.id === userId);
  const totalReferrals = store.users.filter((u) => u.referredBy === userId).length;
  const coinsEarned = store.coinTransactions
    .filter((t) => t.userId === userId && t.referenceType === "referral")
    .reduce((sum, t) => sum + t.amount, 0);

  res.json({
    referralCode: user?.referralCode ?? "",
    totalReferrals,
    coinsEarned,
  });
});

export default router;
