import React, { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Award,
  Camera,
  Check,
  ChevronRight,
  Coins,
  Copy,
  Flame,
  LogOut,
  MessageCircle,
  Pencil,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { RANK_COLORS } from "../lib/theme";
import { useAuth } from "../context/AuthContext";
import type { ReferralStats } from "../types";
import type { ModalKey } from "./DashboardTab";

export function ProfileTab({ onOpenModal }: { onOpenModal: (modal: ModalKey) => void }) {
  const { user, logout, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(user?.bio ?? "");

  const { data: referralStats } = useQuery({
    queryKey: ["referral-stats"],
    queryFn: () => apiFetch<ReferralStats>("/referrals/stats"),
  });

  const bioMutation = useMutation({
    mutationFn: (bio: string) =>
      apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ bio }),
      }),
    onSuccess: async () => {
      setEditingBio(false);
      await refreshUser();
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      if (!base64) return;
      setUploadingAvatar(true);
      try {
        await apiFetch("/upload/avatar", {
          method: "POST",
          body: JSON.stringify({ image: base64 }),
        });
        await refreshUser();
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyReferral = () => {
    if (!user?.referralCode) return;
    void navigator.clipboard?.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const rankColor = RANK_COLORS[user?.rank ?? "Bronze"] ?? "#8b5cf6";
  const xpCurrent = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const xpForLevel = level * 200;
  const xpPct = Math.min(100, ((xpCurrent % xpForLevel) / xpForLevel) * 100);

  return (
    <div className="space-y-5">
      {/* Profile Card */}
      <div
        className="bg-[#0f0f1a] border rounded-3xl p-6 flex flex-col items-center text-center"
        style={{ borderColor: `${rankColor}35` }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingAvatar}
          className="relative mb-3 group cursor-pointer"
          title="Changer d'avatar"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-20 h-20 rounded-3xl object-cover border-2"
              style={{ borderColor: `${rankColor}60` }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl"
              style={{ backgroundColor: `${rankColor}22`, color: rankColor }}
            >
              {user?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#8b5cf6] border-2 border-[#0f0f1a] flex items-center justify-center text-white">
            <Camera className="w-3.5 h-3.5" />
          </span>
        </button>

        <h2 className="text-xl font-extrabold text-[#f8f8fc]">{user?.username ?? "..."}</h2>
        <p className="text-xs text-[#8080a0] mt-0.5">{user?.email ?? ""}</p>

        {/* Bio */}
        {editingBio ? (
          <div className="w-full max-w-sm mt-3 flex gap-2">
            <input
              type="text"
              value={bioDraft}
              maxLength={300}
              onChange={(e) => setBioDraft(e.target.value)}
              placeholder="Ta bio TikTok..."
              className="flex-1 bg-[#090914] border border-[#1e1e33] rounded-xl px-3 py-1.5 text-xs text-[#f8f8fc] focus:outline-none focus:border-[#8b5cf6]"
            />
            <button
              type="button"
              onClick={() => bioMutation.mutate(bioDraft)}
              disabled={bioMutation.isPending}
              className="px-3 py-1.5 rounded-xl bg-[#8b5cf6] text-white text-xs font-semibold cursor-pointer"
            >
              OK
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setBioDraft(user?.bio ?? "");
              setEditingBio(true);
            }}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#8080a0] hover:text-[#f8f8fc] cursor-pointer"
          >
            <span>{user?.bio || "Ajouter une bio"}</span>
            <Pencil className="w-3 h-3" />
          </button>
        )}

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
            style={{
              backgroundColor: `${rankColor}20`,
              borderColor: `${rankColor}45`,
              color: rankColor,
            }}
          >
            <Award className="w-3.5 h-3.5" />
            {user?.rank ?? "Bronze"}
          </span>
          <span className="bg-[#1a1a2e] text-[#f8f8fc] px-3 py-1 rounded-full text-xs font-medium">
            Niveau {level}
          </span>
          {user?.isPremium && (
            <span className="inline-flex items-center gap-1 bg-[#facc15]/15 text-[#facc15] px-2.5 py-1 rounded-full text-xs font-medium">
              <Star className="w-3 h-3" />
              Premium
            </span>
          )}
        </div>

        <div className="w-full max-w-md">
          <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8b5cf6] rounded-full transition-all"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <p className="text-[11px] text-[#8080a0] mt-2">
            {xpCurrent.toLocaleString("fr-FR")} XP · {Math.round(xpPct)}% vers Niv.{level + 1}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="bg-[#0f0f1a] border border-[#1e1e33] rounded-2xl p-4 grid grid-cols-3 divide-x divide-[#1e1e33] text-center">
        <div className="flex flex-col items-center gap-1">
          <Coins className="w-4 h-4 text-[#facc15]" />
          <p className="text-base font-bold text-[#f8f8fc]">
            {(user?.coins ?? 0).toLocaleString("fr-FR")}
          </p>
          <p className="text-[11px] text-[#8080a0]">Coins</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Flame className="w-4 h-4 text-[#f97316]" />
          <p className="text-base font-bold text-[#f8f8fc]">{user?.dailyStreak ?? 0}</p>
          <p className="text-[11px] text-[#8080a0]">Streak</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Users className="w-4 h-4 text-[#22d3ee]" />
          <p className="text-base font-bold text-[#f8f8fc]">
            {referralStats?.totalReferrals ?? 0}
          </p>
          <p className="text-[11px] text-[#8080a0]">Parrains</p>
        </div>
      </div>

      {/* Referral Card */}
      {user?.referralCode && (
        <div className="bg-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-2xl p-4 flex items-center gap-3">
          <UserPlus className="w-5 h-5 text-[#22d3ee] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#8080a0]">Ton code de parrainage</p>
            <p className="text-lg font-black tracking-widest text-[#22d3ee]">
              {user.referralCode}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-[#22c55e]">+50 coins / filleul</p>
            <button
              type="button"
              onClick={handleCopyReferral}
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#f8f8fc] bg-[#1a1a2e] hover:bg-[#252542] px-2.5 py-1 rounded-lg cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-[#22c55e]" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
        </div>
      )}

      {/* Account Menu */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8080a0] mb-2">
          Mon compte
        </h3>
        <div className="bg-[#0f0f1a] border border-[#1e1e33] rounded-2xl divide-y divide-[#1e1e33] overflow-hidden">
          <button
            type="button"
            onClick={() => onOpenModal("coins")}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#13132a] transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#facc15]/15 flex items-center justify-center text-[#facc15]">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-[#f8f8fc]">Coins & Transactions</span>
            <span className="ml-auto text-xs text-[#8080a0]">
              {(user?.coins ?? 0).toLocaleString("fr-FR")}
            </span>
            <ChevronRight className="w-4 h-4 text-[#8080a0]" />
          </button>

          <button
            type="button"
            onClick={() => onOpenModal("achievements")}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#13132a] transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#ec4899]/15 flex items-center justify-center text-[#ec4899]">
              <Star className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-[#f8f8fc] flex-1 text-left">
              Succès & Badges
            </span>
            <ChevronRight className="w-4 h-4 text-[#8080a0]" />
          </button>

          <button
            type="button"
            onClick={() => onOpenModal("support")}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#13132a] transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#22d3ee]/15 flex items-center justify-center text-[#22d3ee]">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-[#f8f8fc] flex-1 text-left">
              Support
            </span>
            <ChevronRight className="w-4 h-4 text-[#8080a0]" />
          </button>
        </div>
      </div>

      {/* Session */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8080a0] mb-2">
          Session
        </h3>
        <div className="bg-[#0f0f1a] border border-[#1e1e33] rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#ef4444]/10 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#ef4444]/15 flex items-center justify-center text-[#ef4444]">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-[#ef4444] flex-1 text-left">
              Se déconnecter
            </span>
            <ChevronRight className="w-4 h-4 text-[#8080a0]" />
          </button>
        </div>
      </div>
    </div>
  );
}
