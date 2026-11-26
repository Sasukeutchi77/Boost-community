export type Rank = "Bronze" | "Silver" | "Gold" | "Elite" | "Demon" | "Legend";
export type MissionType = "watch" | "like" | "comment" | "follow" | "share";
export type MissionStatus = "active" | "paused" | "completed";
export type CampaignStatus = "pending" | "active" | "paused" | "completed";
export type CoinTxType = "earn" | "spend" | "purchase" | "bonus" | "refund" | "adjustment";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  rank: Rank;
  level: number;
  xp: number;
  coins: number;
  dailyStreak: number;
  lastCheckinAt: string | null;
  isPremium: boolean;
  referralCode: string;
  referredBy: number | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<UserRecord, "passwordHash">;

export interface MissionRecord {
  id: number;
  title: string;
  description: string | null;
  type: MissionType;
  status: MissionStatus;
  coinsReward: number;
  xpReward: number;
  targetUrl: string | null;
  isDaily: boolean;
  createdAt: string;
}

export interface UserMissionRecord {
  id: number;
  userId: number;
  missionId: number;
  status: MissionStatus;
  completedAt: string;
}

export interface CampaignRecord {
  id: number;
  ownerId: number;
  title: string;
  description: string | null;
  targetType: MissionType;
  targetUrl: string | null;
  targetCount: number;
  completedCount: number;
  coinsRequired: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CoinTransactionRecord {
  id: number;
  userId: number;
  amount: number;
  type: CoinTxType;
  description: string | null;
  referenceId: number | null;
  referenceType: string | null;
  createdAt: string;
}

export interface AchievementRecord {
  id: number;
  title: string;
  description: string | null;
  category: string;
  requirement: number;
  rewardCoins: number;
  createdAt: string;
}

export interface UserAchievementRecord {
  id: number;
  userId: number;
  achievementId: number;
  progress: number;
  unlockedAt: string | null;
}

export interface TicketRecord {
  id: number;
  userId: number;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFeedRecord {
  id: number;
  userId: number;
  type: string;
  description: string | null;
  metadata: string | null;
  createdAt: string;
}
