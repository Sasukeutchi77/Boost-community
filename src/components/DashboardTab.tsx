import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Award,
  CheckCircle2,
  Coins,
  Flame,
  Radio,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { RANK_COLORS } from "../lib/theme";
import { useAuth } from "../context/AuthContext";
import type { ActivityFeedItem, CheckinStatus, DashboardStats } from "../types";

export type TabKey = "dashboard" | "missions" | "campaigns" | "leaderboard" | "profile";
export type ModalKey = "coins" | "achievements" | "support" | null;

export function DashboardTab({
  onNavigateTab,
  onOpenModal,
}: {
  onNavigateTab: (tab: TabKey) => void;
  onOpenModal: (modal: ModalKey) => void;
}) {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiFetch<DashboardStats>("/dashboard/stats"),
  });

  const { data: feed = [] } = useQuery({
    queryKey: ["activity-feed"],
    queryFn: () => apiFetch<ActivityFeedItem[]>("/dashboard/activity-feed?limit=10"),
  });

  const { data: checkinStatus } = useQuery({
    queryKey: ["checkin-status"],
    queryFn: () => apiFetch<CheckinStatus>("/auth/checkin/status"),
  });

  const checkinMutation = useMutation({
    mutationFn: () => apiFetch<{ coinsEarned: number; xpEarned: number; streak: number }>("/auth/checkin", { method: "POST" }),
    onSuccess: async () => {
      await Promise.all([
        refreshUser(),
        queryClient.invalidateQueries({ queryKey: ["checkin-status"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["activity-feed"] }),
        queryClient.invalidateQueries({ queryKey: ["coins-balance"] }),
        queryClient.invalidateQueries({ queryKey: ["coins-transactions"] }),
      ]);
    },
  });

  const rankColor = RANK_COLORS[user?.rank ?? "Bronze"] ?? "#8b5cf6";
  const xpCurrent = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const xpForLevel = level * 200;
  const xpPct = Math.min(100, ((xpCurrent % xpForLevel) / xpForLevel) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[#8080a0]">Bienvenue</p>
          <h2 className="text-2xl font-extrabold text-[#f8f8fc]">
            {user?.username ?? "..."}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenModal("coins")}
            className="inline-flex items-center gap-1.5 bg-[#facc15]/15 border border-[#facc15]/25 text-[#facc15] font-bold text-sm px-3 py-1.5 rounded-full hover:bg-[#facc15]/25 transition-colors cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            {(user?.coins ?? 0).toLocaleString("fr-FR")}
          </button>

          {(user?.dailyStreak ?? 0) > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-[#f97316]/15 border border-[#f97316]/25 text-[#f97316] font-bold text-sm px-3 py-1.5 rounded-full">
              <Flame className="w-4 h-4" />
              {user?.dailyStreak}j
            </div>
          )}
        </div>
      </div>

      {/* Rank + XP Card */}
      {user && (
        <div
          className="bg-[#0f0f1a] rounded-2xl border p-5"
          style={{ borderColor: `${rankColor}35` }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-12 h-12 rounded-xl object-cover border"
                style={{ borderColor: `${rankColor}50` }}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl"
                style={{ backgroundColor: `${rankColor}22`, color: rankColor }}
              >
                {user.username[0]?.toUpperCase() ?? "?"}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base" style={{ color: rankColor }}>
                  {user.rank}
                </span>
                <span className="text-xs text-[#8080a0]">· Niveau {user.level}</span>
              </div>
              <p className="text-xs text-[#8080a0] mt-0.5">
                {xpCurrent.toLocaleString("fr-FR")} XP
              </p>
            </div>

            {user.isPremium && (
              <span className="inline-flex items-center gap-1 bg-[#facc15]/15 text-[#facc15] text-xs font-semibold px-2.5 py-1 rounded-full">
                <Star className="w-3.5 h-3.5" />
                Premium
              </span>
            )}
          </div>

          <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8b5cf6] rounded-full transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#8080a0] mt-2">
            <span>Progression Niveau {level + 1}</span>
            <span>{Math.round(xpPct)}%</span>
          </div>
        </div>
      )}

      {/* Daily Check-in */}
      {checkinStatus && (
        <div className="bg-[#0f0f1a] border border-[#1e1e33] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#f97316]/15 flex items-center justify-center text-[#f97316]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#f8f8fc]">
                Check-in quotidien · {checkinStatus.nextReward.label}
              </p>
              <p className="text-xs text-[#8080a0]">
                {checkinStatus.alreadyCheckedIn
                  ? `Streak actuel : ${checkinStatus.streak} jour(s) — Reviens demain !`
                  : `Récompense : +${checkinStatus.nextReward.coins} coins & +${checkinStatus.nextReward.xp} XP`}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={checkinStatus.alreadyCheckedIn || checkinMutation.isPending}
            onClick={() => checkinMutation.mutate()}
            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
              checkinStatus.alreadyCheckedIn
                ? "bg-[#1a1a2e] text-[#22c55e] cursor-default"
                : "bg-[#f97316] hover:bg-[#ea580c] text-white cursor-pointer shadow-lg shadow-[#f97316]/20"
            }`}
          >
            {checkinStatus.alreadyCheckedIn ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Validé
              </>
            ) : checkinMutation.isPending ? (
              "Validation..."
            ) : (
              <>
                <Activity className="w-4 h-4" />
                Réclamer
              </>
            )}
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Zap, label: "Missions", value: statsLoading ? "—" : stats?.missionsCompleted ?? 0, color: "#8b5cf6" },
          { icon: Radio, label: "Campagnes", value: statsLoading ? "—" : stats?.activeCampaigns ?? 0, color: "#22d3ee" },
          { icon: TrendingUp, label: "Coins gagnés", value: statsLoading ? "—" : (stats?.totalCoinsEarned ?? 0).toLocaleString("fr-FR"), color: "#facc15" },
          { icon: Users, label: "Followers", value: statsLoading ? "—" : (stats?.followersGained ?? 0).toLocaleString("fr-FR"), color: "#22c55e" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="bg-[#0f0f1a] rounded-2xl border p-4 flex flex-col items-center text-center gap-1.5"
            style={{ borderColor: `${color}28` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}18`, color }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-lg font-extrabold text-[#f8f8fc]">{value}</p>
            <p className="text-xs text-[#8080a0]">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-base font-bold text-[#f8f8fc] mb-3">Accès rapide</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Zap, label: "Missions", color: "#8b5cf6", action: () => onNavigateTab("missions") },
            { icon: Radio, label: "Campagnes", color: "#22d3ee", action: () => onNavigateTab("campaigns") },
            { icon: Award, label: "Classement", color: "#facc15", action: () => onNavigateTab("leaderboard") },
            { icon: Star, label: "Succès", color: "#ec4899", action: () => onOpenModal("achievements") },
          ].map(({ icon: Icon, label, color, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className="bg-[#0f0f1a] hover:bg-[#13132a] rounded-2xl border p-4 flex flex-col items-center gap-2 transition-colors cursor-pointer"
              style={{ borderColor: `${color}22` }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}18`, color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#f8f8fc]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {feed.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#f8f8fc] mb-3">Activité récente</h3>
          <div className="bg-[#0f0f1a] border border-[#1e1e33] rounded-2xl divide-y divide-[#1e1e33]">
            {feed.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-2 h-2 rounded-full bg-[#8b5cf6] shrink-0" />
                <p className="text-xs sm:text-sm text-[#f8f8fc] flex-1 truncate">
                  {item.description ?? item.type}
                </p>
                <span className="text-[11px] text-[#8080a0] shrink-0">
                  {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
