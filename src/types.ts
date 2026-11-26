export type Rank = "Bronze" | "Silver" | "Gold" | "Elite" | "Demon" | "Legend";
export type MissionType = "watch" | "like" | "comment" | "follow" | "share";
export type CampaignStatus = "pending" | "active" | "paused" | "completed";

export interface User {
  id: number;
  username: string;
  email: string;
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

export interface DashboardStats {
  missionsCompleted: number;
  activeCampaigns: number;
  totalCoinsEarned: number;
  followersGained: number;
}

export interface ActivityFeedItem {
  id: number;
  userId: number;
  type: string;
  description: string | null;
  createdAt: string;
}

export interface CheckinStatus {
  streak: number;
  alreadyCheckedIn: boolean;
  lastCheckinAt: string | null;
  nextCheckinAt: string;
  nextReward: {
    coins: number;
    xp: number;
    label: string;
  };
}

export interface Mission {
  id: number;
  title: string;
  description: string | null;
  type: MissionType;
  status: string;
  userStatus: "active" | "completed";
  coinsReward: number;
  xpReward: number;
  targetUrl: string | null;
  isDaily: boolean;
}

export interface Campaign {
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
}

export interface CoinBalance {
  balance: number;
  pendingEarnings: number;
}

export interface CoinTransaction {
  id: number;
  amount: number;
  type: "earn" | "spend" | "purchase" | "bonus" | "refund" | "adjustment";
  description: string | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  rank: Rank;
  level: number;
  xp: number;
}

export interface MyRank {
  rank: number;
  xp: number;
  level: number;
}

export interface Achievement {
  id: number;
  title: string;
  description: string | null;
  category: string;
  requirement: number;
  rewardCoins: number;
  progress: number;
  unlocked: boolean;
}

export interface Ticket {
  id: number;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
}

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  coinsEarned: number;
}
