import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const rankEnum = pgEnum("rank", ["Bronze", "Silver", "Gold", "Elite", "Demon", "Legend"]);
export const missionTypeEnum = pgEnum("mission_type", ["watch", "like", "comment", "follow", "share"]);
export const missionStatusEnum = pgEnum("mission_status", ["active", "paused", "completed"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["pending", "active", "paused", "completed"]);
export const coinTxTypeEnum = pgEnum("coin_tx_type", ["earn", "spend", "purchase", "bonus", "refund", "adjustment"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  rank: rankEnum("rank").notNull().default("Bronze"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  coins: integer("coins").notNull().default(100),
  dailyStreak: integer("daily_streak").notNull().default(0),
  lastCheckinAt: timestamp("last_checkin_at"),
  isPremium: boolean("is_premium").notNull().default(false),
  referralCode: varchar("referral_code", { length: 12 }),
  referredBy: integer("referred_by"),
  // ✅ Nouveaux champs
  avatarUrl: text("avatar_url"),
  fcmToken: text("fcm_token"),
  bio: varchar("bio", { length: 300 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// ─── Missions ─────────────────────────────────────────────────────────────────
export const missionsTable = pgTable("missions", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  type: missionTypeEnum("type").notNull(),
  status: missionStatusEnum("status").notNull().default("active"),
  coinsReward: integer("coins_reward").notNull().default(10),
  xpReward: integer("xp_reward").notNull().default(5),
  targetUrl: text("target_url"),
  isDaily: boolean("is_daily").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMissionSchema = createInsertSchema(missionsTable).omit({ id: true, createdAt: true });
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missionsTable.$inferSelect;

// ─── UserMissions ─────────────────────────────────────────────────────────────
export const userMissionsTable = pgTable("user_missions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  missionId: integer("mission_id").notNull().references(() => missionsTable.id),
  status: missionStatusEnum("status").notNull().default("completed"),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type UserMission = typeof userMissionsTable.$inferSelect;

// ─── Campaigns ────────────────────────────────────────────────────────────────
export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  targetType: missionTypeEnum("target_type").notNull(),
  targetUrl: text("target_url"),
  targetCount: integer("target_count").notNull().default(100),
  completedCount: integer("completed_count").notNull().default(0),
  coinsRequired: integer("coins_required").notNull().default(50),
  status: campaignStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true, updatedAt: true, completedCount: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;

// ─── Coin Transactions ────────────────────────────────────────────────────────
export const coinTransactionsTable = pgTable("coin_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  amount: integer("amount").notNull(),
  type: coinTxTypeEnum("type").notNull(),
  description: text("description"),
  referenceId: integer("reference_id"),
  referenceType: varchar("reference_type", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type CoinTransaction = typeof coinTransactionsTable.$inferSelect;

// ─── Achievements ─────────────────────────────────────────────────────────────
export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull().default("missions"),
  requirement: integer("requirement").notNull().default(1),
  rewardCoins: integer("reward_coins").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type Achievement = typeof achievementsTable.$inferSelect;

// ─── UserAchievements ─────────────────────────────────────────────────────────
export const userAchievementsTable = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  achievementId: integer("achievement_id").notNull().references(() => achievementsTable.id),
  progress: integer("progress").notNull().default(0),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type UserAchievement = typeof userAchievementsTable.$inferSelect;

// ─── Support Tickets ──────────────────────────────────────────────────────────
export const ticketsTable = pgTable("tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type Ticket = typeof ticketsTable.$inferSelect;

// ─── Activity Feed ────────────────────────────────────────────────────────────
export const activityFeedTable = pgTable("activity_feed", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type ActivityFeedItem = typeof activityFeedTable.$inferSelect;

// ─── Push Notification Logs ───────────────────────────────────────────────────
export const pushLogsTable = pgTable("push_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  type: varchar("type", { length: 50 }),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});
export type PushLog = typeof pushLogsTable.$inferSelect;
