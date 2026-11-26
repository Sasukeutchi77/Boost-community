import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Coins,
  ExternalLink,
  Eye,
  Heart,
  LayoutGrid,
  MessageCircle,
  Play,
  Share2,
  UserPlus,
  ZapOff,
} from "lucide-react";
import { apiFetch, ApiError } from "../lib/api";
import { MISSION_COLORS, MISSION_LABELS } from "../lib/theme";
import { useAuth } from "../context/AuthContext";
import type { Mission, MissionType } from "../types";

const MISSION_TYPES: Array<"all" | MissionType> = [
  "all",
  "watch",
  "like",
  "comment",
  "follow",
  "share",
];

function MissionIcon({ type, color }: { type: "all" | MissionType; color: string }) {
  const props = { className: "w-4 h-4", style: { color } };
  switch (type) {
    case "watch":
      return <Eye {...props} />;
    case "like":
      return <Heart {...props} />;
    case "comment":
      return <MessageCircle {...props} />;
    case "follow":
      return <UserPlus {...props} />;
    case "share":
      return <Share2 {...props} />;
    default:
      return <LayoutGrid {...props} />;
  }
}

export function MissionsTab() {
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState<"all" | MissionType>("all");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["missions", activeType],
    queryFn: () =>
      apiFetch<Mission[]>(
        activeType === "all" ? "/missions" : `/missions?type=${activeType}`,
      ),
  });

  const completeMutation = useMutation({
    mutationFn: (mission: Mission) =>
      apiFetch<{ coinsEarned: number; xpEarned: number; message: string }>(
        `/missions/${mission.id}/complete`,
        {
          method: "POST",
          body: JSON.stringify({ proofUrl: mission.targetUrl ?? undefined }),
        },
      ),
    onSuccess: async (res) => {
      setFeedback({
        type: "ok",
        text: `+${res.coinsEarned} coins et +${res.xpEarned} XP gagnés !`,
      });
      await Promise.all([
        refreshUser(),
        queryClient.invalidateQueries({ queryKey: ["missions"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["activity-feed"] }),
        queryClient.invalidateQueries({ queryKey: ["coins-balance"] }),
        queryClient.invalidateQueries({ queryKey: ["coins-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["achievements"] }),
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
        queryClient.invalidateQueries({ queryKey: ["my-rank"] }),
      ]);
    },
    onError: (err) => {
      setFeedback({
        type: "err",
        text: err instanceof ApiError ? err.message : "Erreur lors de la validation",
      });
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-[#f8f8fc]">Missions</h2>
        <p className="text-xs sm:text-sm text-[#8080a0] mt-0.5">
          Accomplis des missions, gagne des coins et de l'XP
        </p>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {MISSION_TYPES.map((type) => {
          const active = activeType === type;
          const color = type === "all" ? "#8b5cf6" : MISSION_COLORS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border transition-colors cursor-pointer"
              style={{
                backgroundColor: active ? `${color}22` : "#0f0f1a",
                borderColor: active ? `${color}60` : "#1e1e33",
                color: active ? color : "#8080a0",
              }}
            >
              <MissionIcon type={type} color={active ? color : "#8080a0"} />
              {MISSION_LABELS[type]}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`rounded-xl px-4 py-2.5 text-xs font-medium border ${
            feedback.type === "ok"
              ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#4ade80]"
              : "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-[#8080a0]">Chargement des missions...</div>
      ) : missions.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-[#8080a0]">
          <ZapOff className="w-10 h-10" />
          <p className="text-sm">Aucune mission disponible</p>
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((mission) => {
            const color = MISSION_COLORS[mission.type] ?? "#8b5cf6";
            const completed = mission.userStatus === "completed";
            const isPending =
              completeMutation.isPending && completeMutation.variables?.id === mission.id;

            return (
              <div
                key={mission.id}
                className={`bg-[#0f0f1a] border border-[#1e1e33] rounded-2xl p-4 flex items-center gap-3.5 transition-opacity ${
                  completed ? "opacity-60" : ""
                }`}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <MissionIcon type={mission.type} color={color} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#f8f8fc] truncate">
                      {mission.title}
                    </h3>
                    {mission.isDaily && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8b5cf6]/15 text-[#8b5cf6]">
                        Quotidienne
                      </span>
                    )}
                  </div>
                  {mission.description && (
                    <p className="text-xs text-[#8080a0] mt-0.5 line-clamp-2">
                      {mission.description}
                    </p>
                  )}
                  {mission.targetUrl && (
                    <p className="inline-flex items-center gap-1 text-[11px] text-[#22d3ee] mt-1">
                      <ExternalLink className="w-3 h-3" />
                      {mission.targetUrl.replace(/^https?:\/\//, "")}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                    <Coins className="w-3.5 h-3.5 text-[#facc15]" />
                    <span className="text-[#facc15] font-semibold">+{mission.coinsReward} coins</span>
                    <span className="text-[#8080a0]">· +{mission.xpReward} XP</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={completed || isPending}
                  onClick={() => completeMutation.mutate(mission)}
                  title={completed ? "Complétée" : "Compléter la mission"}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer disabled:cursor-default"
                  style={{
                    backgroundColor: completed ? "#1a1a2e" : color,
                    color: completed ? "#22c55e" : "#ffffff",
                  }}
                >
                  {completed ? (
                    <Check className="w-4 h-4" />
                  ) : isPending ? (
                    <span className="text-xs font-bold">...</span>
                  ) : mission.targetUrl ? (
                    <ExternalLink className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
