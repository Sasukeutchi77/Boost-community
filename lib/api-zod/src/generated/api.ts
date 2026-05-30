import { z } from "zod/v4";

export const HealthCheckResponse = z.object({ status: z.string() });
export const MessageResponse = z.object({ message: z.string() });
export const LoginInput = z.object({ username: z.string(), password: z.string() });
export const RegisterInput = z.object({ username: z.string(), email: z.string(), password: z.string(), referralCode: z.string().optional() });
export const ForgotPasswordBody = z.object({ email: z.string() });

export const User = z.object({
  id: z.number(), username: z.string(), email: z.string(),
  rank: z.enum(["Bronze", "Silver", "Gold", "Elite", "Demon", "Legend"]),
  level: z.number(), xp: z.number(), coins: z.number(), dailyStreak: z.number(),
  lastCheckinAt: z.string().nullable().optional(),
  isPremium: z.boolean(),
  referralCode: z.string().nullable().optional(), referredBy: z.number().nullable().optional(),
  avatarUrl: z.string().nullable().optional(), fcmToken: z.string().nullable().optional(),
  bio: z.string().nullable().optional(), createdAt: z.string(), updatedAt: z.string(),
});

export const AuthResponse = z.object({ token: z.string(), user: User });

export const DashboardData = z.object({
  user: User, missionsCompleted: z.number(), activeCampaigns: z.number(), coinsEarned: z.number(),
  activityFeed: z.array(z.object({ id: z.number(), type: z.string(), description: z.string().nullable().optional(), createdAt: z.string() })),
});

export const Mission = z.object({
  id: z.number(), title: z.string(), description: z.string().nullable().optional(),
  type: z.enum(["watch", "like", "comment", "follow", "share"]),
  status: z.enum(["active", "paused", "completed"]),
  coinsReward: z.number(), xpReward: z.number(), targetUrl: z.string().nullable().optional(),
  isDaily: z.boolean(), createdAt: z.string(),
});

export const Campaign = z.object({
  id: z.number(), ownerId: z.number(), title: z.string(), description: z.string().nullable().optional(),
  targetType: z.enum(["watch", "like", "comment", "follow", "share"]),
  targetUrl: z.string().nullable().optional(), targetCount: z.number(), completedCount: z.number(),
  coinsRequired: z.number(), status: z.enum(["pending", "active", "paused", "completed"]),
  createdAt: z.string(), updatedAt: z.string(),
});

export const CoinBalance = z.object({ balance: z.number() });
export const CoinTransaction = z.object({
  id: z.number(), amount: z.number(),
  type: z.enum(["earn", "spend", "purchase", "bonus", "refund", "adjustment"]),
  description: z.string().nullable().optional(), createdAt: z.string(),
});

export const LeaderboardEntry = z.object({
  userId: z.number(), username: z.string(),
  rank: z.enum(["Bronze", "Silver", "Gold", "Elite", "Demon", "Legend"]),
  level: z.number(), xp: z.number(),
});

export const MyRank = z.object({ rank: z.number(), xp: z.number(), level: z.number() });

export const AchievementWithProgress = z.object({
  id: z.number(), title: z.string(), description: z.string().nullable().optional(),
  category: z.string(), requirement: z.number(), rewardCoins: z.number(),
  progress: z.number(), unlocked: z.boolean(),
});

export const Ticket = z.object({
  id: z.number(), subject: z.string(), message: z.string(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]), createdAt: z.string(),
});
export const TicketInput = z.object({ subject: z.string(), message: z.string() });

export const ReferralStats = z.object({
  referralCode: z.string(), totalReferrals: z.number(), coinsEarned: z.number(),
});

export const CheckinResult = z.object({
  streak: z.number(), coinsEarned: z.number(), xpEarned: z.number(), label: z.string(),
  newRank: z.enum(["Bronze", "Silver", "Gold", "Elite", "Demon", "Legend"]),
  nextCheckinAt: z.string(), alreadyCheckedIn: z.boolean(),
});

export const CheckinStatus = z.object({
  streak: z.number(), alreadyCheckedIn: z.boolean(),
  lastCheckinAt: z.string().nullable().optional(), nextCheckinAt: z.string(),
  nextReward: z.object({ coins: z.number(), xp: z.number(), label: z.string() }),
});

export const AdminStats = z.object({
  totalUsers: z.number(), totalMissions: z.number(), totalCampaigns: z.number(),
  openTickets: z.number(), totalCoinsEarned: z.number(), activeUsersToday: z.number(),
});

export const BroadcastInput = z.object({
  title: z.string(), body: z.string(), data: z.record(z.string(), z.string()).optional(),
});
