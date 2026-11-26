import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, TrendingUp } from "lucide-react";
import { apiFetch } from "../lib/api";
import { RANK_COLORS } from "../lib/theme";
import { useAuth } from "../context/AuthContext";
import type { LeaderboardEntry, MyRank } from "../types";

const POSITION_COLORS: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

export function LeaderboardTab() {
  const { user } = useAuth();

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => apiFetch<LeaderboardEntry[]>("/leaderboard?limit=50"),
  });

  const { data: myRank } = useQuery({
    queryKey: ["my-rank"],
    queryFn: () => apiFetch<MyRank>("/leaderboard/my-rank"),
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-[#f8f8fc]">Classement</h2>
        <p className="text-xs sm:text-sm text-[#8080a0] mt-0.5">
          Les meilleurs créateurs de la communauté
        </p>
      </div>

      {myRank && (
        <div className="flex items-center gap-3 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-2xl px-4 py-3">
          <TrendingUp className="w-4 h-4 text-[#8b5cf6]" />
          <p className="text-sm text-[#f8f8fc] flex-1">
            Ton rang :{" "}
            <span className="font-bold text-[#8b5cf6]">#{myRank.rank}</span>
          </p>
          <span className="text-xs text-[#8080a0]">
            {myRank.xp.toLocaleString("fr-FR")} XP
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-[#8080a0]">Chargement...</div>
      ) : leaderboard.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-[#8080a0]">
          <Award className="w-10 h-10" />
          <p className="text-sm">Aucun classement disponible</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => {
            const position = idx + 1;
            const isMe = entry.username === user?.username;
            const rankColor = RANK_COLORS[entry.rank] ?? "#8b5cf6";
            const posColor = POSITION_COLORS[position];

            return (
              <div
                key={entry.userId}
                className={`rounded-2xl border p-3.5 flex items-center gap-3 ${
                  isMe
                    ? "bg-[#8b5cf6]/10 border-[#8b5cf6]/40"
                    : "bg-[#0f0f1a] border-[#1e1e33]"
                }`}
              >
                <div className="w-8 flex justify-center">
                  {position <= 3 ? (
                    <Award className="w-5 h-5" style={{ color: posColor }} />
                  ) : (
                    <span
                      className={`text-sm font-bold ${
                        position <= 10 ? "text-[#f8f8fc]" : "text-[#8080a0]"
                      }`}
                    >
                      #{position}
                    </span>
                  )}
                </div>

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0"
                  style={{ backgroundColor: `${rankColor}22`, color: rankColor }}
                >
                  {entry.username[0]?.toUpperCase() ?? "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#f8f8fc] truncate">
                    {entry.username}
                    {isMe && (
                      <span className="text-xs font-normal text-[#8b5cf6]"> (toi)</span>
                    )}
                  </p>
                  <p className="text-xs mt-0.5">
                    <span className="font-semibold" style={{ color: rankColor }}>
                      {entry.rank}
                    </span>
                    <span className="text-[#8080a0]"> · Niv. {entry.level}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-[#f8f8fc]">
                    {entry.xp.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-[11px] text-[#8080a0]">XP</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
