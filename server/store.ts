import bcrypt from "bcryptjs";
import type {
  AchievementRecord,
  ActivityFeedRecord,
  CampaignRecord,
  CoinTransactionRecord,
  MissionRecord,
  Rank,
  SafeUser,
  TicketRecord,
  UserAchievementRecord,
  UserMissionRecord,
  UserRecord,
} from "./types.ts";

const RANK_THRESHOLDS: Array<{ xp: number; rank: Rank }> = [
  { xp: 0, rank: "Bronze" },
  { xp: 500, rank: "Silver" },
  { xp: 1500, rank: "Gold" },
  { xp: 3500, rank: "Elite" },
  { xp: 7000, rank: "Demon" },
  { xp: 15000, rank: "Legend" },
];

export function computeRankAndLevel(xp: number): { rank: Rank; level: number } {
  const level = Math.floor(xp / 200) + 1;
  let rank: Rank = "Bronze";
  for (const t of RANK_THRESHOLDS) {
    if (xp >= t.xp) rank = t.rank;
  }
  return { rank, level };
}

export function toSafeUser(user: UserRecord): SafeUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export function getStreakReward(streak: number): { coins: number; xp: number; label: string } {
  if (streak >= 30) return { coins: 300, xp: 150, label: "Streak 30 jours !" };
  if (streak >= 14) return { coins: 150, xp: 75, label: "Streak 2 semaines !" };
  if (streak % 7 === 0) return { coins: 75, xp: 35, label: `Streak ${streak} jours !` };
  const base = [0, 10, 15, 20, 25, 30, 40][Math.min(streak, 6)];
  const xpBase = [0, 5, 8, 10, 12, 15, 20][Math.min(streak, 6)];
  return { coins: base, xp: xpBase, label: `Jour ${streak}` };
}

class MemoryStore {
  users: UserRecord[] = [];
  missions: MissionRecord[] = [];
  userMissions: UserMissionRecord[] = [];
  campaigns: CampaignRecord[] = [];
  coinTransactions: CoinTransactionRecord[] = [];
  achievements: AchievementRecord[] = [];
  userAchievements: UserAchievementRecord[] = [];
  tickets: TicketRecord[] = [];
  activityFeed: ActivityFeedRecord[] = [];

  private nextIds = {
    user: 1,
    mission: 1,
    userMission: 1,
    campaign: 1,
    coinTx: 1,
    achievement: 1,
    userAchievement: 1,
    ticket: 1,
    activity: 1,
  };

  constructor() {
    this.seed();
  }

  private seed() {
    const now = new Date();
    const iso = (offsetMs = 0) => new Date(now.getTime() + offsetMs).toISOString();
    const demoPassHash = bcrypt.hashSync("demo1234", 10);

    // Seed community creators + demo user
    const seedUsers: Array<Omit<UserRecord, "id" | "createdAt" | "updatedAt">> = [
      {
        username: "creator_demo",
        email: "demo@boost.community",
        passwordHash: demoPassHash,
        rank: "Gold",
        level: 9,
        xp: 1680,
        coins: 420,
        dailyStreak: 4,
        lastCheckinAt: iso(-86_400_000), // checked in yesterday -> consecutive today!
        isPremium: true,
        referralCode: "BOOST777",
        referredBy: null,
        avatarUrl: null,
        bio: "Créateur TikTok lifestyle & gaming — objectif 100K !",
      },
      {
        username: "sasukecreator",
        email: "sasuke@boost.community",
        passwordHash: demoPassHash,
        rank: "Legend",
        level: 80,
        xp: 15840,
        coins: 4920,
        dailyStreak: 34,
        lastCheckinAt: iso(-3_600_000),
        isPremium: true,
        referralCode: "SASUKE01",
        referredBy: null,
        avatarUrl: null,
        bio: "Fondateur Boost Community",
      },
      {
        username: "nina_vibes",
        email: "nina@boost.community",
        passwordHash: demoPassHash,
        rank: "Demon",
        level: 44,
        xp: 8720,
        coins: 2150,
        dailyStreak: 19,
        lastCheckinAt: iso(-7_200_000),
        isPremium: true,
        referralCode: "NINA2026",
        referredBy: 2,
        avatarUrl: null,
        bio: "Danse & tendances TikTok",
      },
      {
        username: "tikpulse_fr",
        email: "pulse@boost.community",
        passwordHash: demoPassHash,
        rank: "Elite",
        level: 23,
        xp: 4480,
        coins: 1290,
        dailyStreak: 11,
        lastCheckinAt: iso(-12_000_000),
        isPremium: false,
        referralCode: "PULSE888",
        referredBy: 2,
        avatarUrl: null,
        bio: "Astuces montage CapCut",
      },
      {
        username: "camille_cook",
        email: "camille@boost.community",
        passwordHash: demoPassHash,
        rank: "Silver",
        level: 5,
        xp: 920,
        coins: 310,
        dailyStreak: 3,
        lastCheckinAt: iso(-50_000_000),
        isPremium: false,
        referralCode: "CAMILLE5",
        referredBy: 1,
        avatarUrl: null,
        bio: "Recettes rapides en 30s",
      },
    ];

    for (const u of seedUsers) {
      this.users.push({
        ...u,
        id: this.nextIds.user++,
        createdAt: iso(-86_400_000 * 14),
        updatedAt: iso(-3_600_000),
      });
    }

    // Seed Missions (from scripts/src/seed.ts)
    const seedMissions: Array<Omit<MissionRecord, "id" | "createdAt">> = [
      { title: "Regarde 3 vidéos", description: "Regarde 3 vidéos TikTok de nos partenaires jusqu'à la fin", type: "watch", status: "active", coinsReward: 15, xpReward: 8, targetUrl: null, isDaily: true },
      { title: "Like 5 vidéos", description: "Like 5 vidéos de membres de la communauté", type: "like", status: "active", coinsReward: 10, xpReward: 5, targetUrl: null, isDaily: true },
      { title: "Commente une vidéo", description: "Laisse un commentaire positif et constructif", type: "comment", status: "active", coinsReward: 20, xpReward: 10, targetUrl: null, isDaily: false },
      { title: "Follow 3 créateurs", description: "Suis 3 nouveaux créateurs TikTok aujourd'hui", type: "follow", status: "active", coinsReward: 25, xpReward: 12, targetUrl: null, isDaily: true },
      { title: "Partage une vidéo", description: "Partage une vidéo depuis TikTok vers tes réseaux", type: "share", status: "active", coinsReward: 30, xpReward: 15, targetUrl: null, isDaily: false },
      { title: "10 Likes en 1 jour", description: "Like 10 vidéos différentes dans la journée", type: "like", status: "active", coinsReward: 50, xpReward: 25, targetUrl: null, isDaily: true },
      { title: "Regarde 10 vidéos", description: "Regarde 10 vidéos complètes sans zapper", type: "watch", status: "active", coinsReward: 40, xpReward: 20, targetUrl: null, isDaily: false },
      { title: "Commente 5 vidéos", description: "Écris 5 commentaires détaillés et engageants", type: "comment", status: "active", coinsReward: 75, xpReward: 35, targetUrl: null, isDaily: false },
      { title: "Follow 10 créateurs", description: "Suis 10 créateurs de la communauté", type: "follow", status: "active", coinsReward: 80, xpReward: 40, targetUrl: null, isDaily: false },
      { title: "Partage 3 vidéos", description: "Partage 3 vidéos sur tes stories ou DM", type: "share", status: "active", coinsReward: 90, xpReward: 45, targetUrl: null, isDaily: false },
    ];

    for (const m of seedMissions) {
      this.missions.push({ ...m, id: this.nextIds.mission++, createdAt: iso(-86_400_000 * 10) });
    }

    // Seed Achievements (from scripts/src/seed.ts)
    const seedAchievements: Array<Omit<AchievementRecord, "id" | "createdAt">> = [
      { title: "Premier pas", description: "Complète ta première mission", category: "missions", requirement: 1, rewardCoins: 50 },
      { title: "Missionnaire", description: "Complète 10 missions", category: "missions", requirement: 10, rewardCoins: 200 },
      { title: "Expert des missions", description: "Complète 50 missions", category: "missions", requirement: 50, rewardCoins: 500 },
      { title: "Créateur actif", description: "Maintiens un streak de 7 jours", category: "streak", requirement: 7, rewardCoins: 150 },
      { title: "Régulier", description: "Maintiens un streak de 30 jours", category: "streak", requirement: 30, rewardCoins: 500 },
      { title: "Riche en coins", description: "Gagne 500 coins", category: "coins", requirement: 500, rewardCoins: 100 },
      { title: "Millionnaire", description: "Gagne 5000 coins", category: "coins", requirement: 5000, rewardCoins: 500 },
      { title: "Lanceur de campagne", description: "Lance ta première campagne", category: "campaigns", requirement: 1, rewardCoins: 100 },
      { title: "Ambassadeur", description: "Parraine 1 ami", category: "referral", requirement: 1, rewardCoins: 200 },
    ];

    for (const a of seedAchievements) {
      this.achievements.push({ ...a, id: this.nextIds.achievement++, createdAt: iso(-86_400_000 * 10) });
    }

    // Seed Campaigns
    const seedCampaigns: Array<Omit<CampaignRecord, "id" | "createdAt" | "updatedAt">> = [
      { ownerId: 2, title: "Boost mes likes TikTok", description: "J'ai besoin de likes sur mes dernières vidéos", targetType: "like", targetUrl: "https://tiktok.com/@sasukecreator", targetCount: 500, completedCount: 340, coinsRequired: 250, status: "active" },
      { ownerId: 3, title: "Gagne des followers", description: "Rejoins ma communauté TikTok gaming & danse", targetType: "follow", targetUrl: "https://tiktok.com/@nina_vibes", targetCount: 200, completedCount: 128, coinsRequired: 100, status: "active" },
      { ownerId: 5, title: "Vues vidéo cuisine", description: "Regarde mes recettes et donne ton avis", targetType: "watch", targetUrl: "https://tiktok.com/@camille_cook", targetCount: 1000, completedCount: 615, coinsRequired: 500, status: "active" },
      { ownerId: 1, title: "Édition Montage CapCut", description: "Boost de commentaires sur mon dernier tuto transition", targetType: "comment", targetUrl: "https://tiktok.com/@creator_demo", targetCount: 150, completedCount: 92, coinsRequired: 75, status: "active" },
    ];

    for (const c of seedCampaigns) {
      this.campaigns.push({
        ...c,
        id: this.nextIds.campaign++,
        createdAt: iso(-86_400_000 * 3),
        updatedAt: iso(-7_200_000),
      });
    }

    // Seed demo user activity, completed missions, transactions, achievements & ticket
    this.userMissions.push(
      { id: this.nextIds.userMission++, userId: 1, missionId: 1, status: "completed", completedAt: iso(-86_400_000 * 2) },
      { id: this.nextIds.userMission++, userId: 1, missionId: 2, status: "completed", completedAt: iso(-86_400_000) },
    );

    this.coinTransactions.push(
      { id: this.nextIds.coinTx++, userId: 1, amount: 100, type: "bonus", description: "Bonus de bienvenue", referenceId: null, referenceType: "welcome", createdAt: iso(-86_400_000 * 10) },
      { id: this.nextIds.coinTx++, userId: 1, amount: 15, type: "earn", description: "Mission: Regarde 3 vidéos", referenceId: 1, referenceType: "mission", createdAt: iso(-86_400_000 * 2) },
      { id: this.nextIds.coinTx++, userId: 1, amount: 50, type: "bonus", description: "Parrainage : camille_cook a rejoint !", referenceId: 5, referenceType: "referral", createdAt: iso(-86_400_000 * 2) },
      { id: this.nextIds.coinTx++, userId: 1, amount: 10, type: "earn", description: "Mission: Like 5 vidéos", referenceId: 2, referenceType: "mission", createdAt: iso(-86_400_000) },
      { id: this.nextIds.coinTx++, userId: 1, amount: -75, type: "spend", description: "Campagne créée : Édition Montage CapCut", referenceId: 4, referenceType: "campaign", createdAt: iso(-86_400_000) },
    );

    this.activityFeed.push(
      { id: this.nextIds.activity++, userId: 1, type: "campaign_created", description: "Campagne lancée : Édition Montage CapCut", metadata: null, createdAt: iso(-86_400_000) },
      { id: this.nextIds.activity++, userId: 1, type: "mission_completed", description: "Mission accomplie : Like 5 vidéos", metadata: null, createdAt: iso(-86_400_000) },
      { id: this.nextIds.activity++, userId: 1, type: "referral_reward", description: "+50 coins : camille_cook a rejoint grâce à ton code !", metadata: null, createdAt: iso(-86_400_000 * 2) },
      { id: this.nextIds.activity++, userId: 1, type: "mission_completed", description: "Mission accomplie : Regarde 3 vidéos", metadata: null, createdAt: iso(-86_400_000 * 2) },
    );

    this.userAchievements.push(
      { id: this.nextIds.userAchievement++, userId: 1, achievementId: 1, progress: 2, unlockedAt: iso(-86_400_000 * 2) },
      { id: this.nextIds.userAchievement++, userId: 1, achievementId: 2, progress: 2, unlockedAt: null },
      { id: this.nextIds.userAchievement++, userId: 1, achievementId: 4, progress: 4, unlockedAt: null },
      { id: this.nextIds.userAchievement++, userId: 1, achievementId: 8, progress: 1, unlockedAt: iso(-86_400_000) },
      { id: this.nextIds.userAchievement++, userId: 1, achievementId: 9, progress: 1, unlockedAt: iso(-86_400_000 * 2) },
    );

    this.tickets.push({
      id: this.nextIds.ticket++,
      userId: 1,
      subject: "Question sur les campagnes TikTok",
      message: "Bonjour, combien de temps dure en moyenne une campagne de 150 participants ?",
      status: "resolved",
      createdAt: iso(-86_400_000 * 3),
      updatedAt: iso(-86_400_000 * 2),
    });
  }

  nextUserId() { return this.nextIds.user++; }
  nextUserMissionId() { return this.nextIds.userMission++; }
  nextCampaignId() { return this.nextIds.campaign++; }
  nextCoinTxId() { return this.nextIds.coinTx++; }
  nextUserAchievementId() { return this.nextIds.userAchievement++; }
  nextTicketId() { return this.nextIds.ticket++; }
  nextActivityId() { return this.nextIds.activity++; }

  syncAchievements(userId: number) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return;
    const completedMissionsCount = this.userMissions.filter((um) => um.userId === userId).length;
    const userCampaignsCount = this.campaigns.filter((c) => c.ownerId === userId).length;
    const referralsCount = this.users.filter((u) => u.referredBy === userId).length;
    const totalCoinsEarned = this.coinTransactions
      .filter((t) => t.userId === userId && t.amount > 0)
      .reduce((acc, t) => acc + t.amount, 0);

    for (const ach of this.achievements) {
      let currentProgress = 0;
      if (ach.category === "missions") currentProgress = completedMissionsCount;
      else if (ach.category === "streak") currentProgress = user.dailyStreak;
      else if (ach.category === "coins") currentProgress = totalCoinsEarned;
      else if (ach.category === "campaigns") currentProgress = userCampaignsCount;
      else if (ach.category === "referral") currentProgress = referralsCount;

      let ua = this.userAchievements.find(
        (item) => item.userId === userId && item.achievementId === ach.id,
      );
      if (!ua) {
        ua = {
          id: this.nextUserAchievementId(),
          userId,
          achievementId: ach.id,
          progress: currentProgress,
          unlockedAt: null,
        };
        this.userAchievements.push(ua);
      } else {
        ua.progress = Math.max(ua.progress, currentProgress);
      }

      if (!ua.unlockedAt && currentProgress >= ach.requirement) {
        ua.unlockedAt = new Date().toISOString();
        if (ach.rewardCoins > 0) {
          user.coins += ach.rewardCoins;
          this.coinTransactions.push({
            id: this.nextCoinTxId(),
            userId,
            amount: ach.rewardCoins,
            type: "bonus",
            description: `Succès débloqué : ${ach.title}`,
            referenceId: ach.id,
            referenceType: "achievement",
            createdAt: new Date().toISOString(),
          });
          this.activityFeed.push({
            id: this.nextActivityId(),
            userId,
            type: "achievement_unlocked",
            description: `Succès débloqué : ${ach.title} (+${ach.rewardCoins} coins)`,
            metadata: null,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }
}

export const store = new MemoryStore();
