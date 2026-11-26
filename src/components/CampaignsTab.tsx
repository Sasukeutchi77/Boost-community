import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  Eye,
  Heart,
  Link2,
  MessageCircle,
  Pause,
  Play,
  Plus,
  Radio,
  Share2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { apiFetch, ApiError } from "../lib/api";
import { CAMPAIGN_STATUS_META, MISSION_COLORS } from "../lib/theme";
import { useAuth } from "../context/AuthContext";
import type { Campaign, MissionType } from "../types";

const TYPES: MissionType[] = ["watch", "like", "comment", "follow", "share"];

function TypeIcon({ type, color }: { type: MissionType; color: string }) {
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
  }
}

export function CampaignsTab() {
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"available" | "mine">("available");
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetType, setTargetType] = useState<MissionType>("watch");
  const [targetUrl, setTargetUrl] = useState("");
  const [targetCount, setTargetCount] = useState("100");
  const [formError, setFormError] = useState("");

  const { data: available = [], isLoading: loadingAvail } = useQuery({
    queryKey: ["campaigns-available"],
    queryFn: () => apiFetch<Campaign[]>("/campaigns?status=active"),
  });

  const { data: mine = [], isLoading: loadingMine } = useQuery({
    queryKey: ["campaigns-mine"],
    queryFn: () => apiFetch<Campaign[]>("/campaigns/mine"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<Campaign>("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          targetType,
          targetUrl: targetUrl.trim() || undefined,
          targetCount: Number(targetCount) || 100,
        }),
      }),
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setTargetUrl("");
      setTargetCount("100");
      setTargetType("watch");
      setFormError("");
      setShowCreate(false);
      setTab("mine");
      await Promise.all([
        refreshUser(),
        queryClient.invalidateQueries({ queryKey: ["campaigns-available"] }),
        queryClient.invalidateQueries({ queryKey: ["campaigns-mine"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["activity-feed"] }),
        queryClient.invalidateQueries({ queryKey: ["coins-balance"] }),
        queryClient.invalidateQueries({ queryKey: ["coins-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["achievements"] }),
      ]);
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : "Erreur lors de la création");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "paused" }) =>
      apiFetch(`/campaigns/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["campaigns-available"] }),
        queryClient.invalidateQueries({ queryKey: ["campaigns-mine"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      ]);
    },
  });

  const list = tab === "available" ? available : mine;
  const isLoading = tab === "available" ? loadingAvail : loadingMine;
  const coinsRequired = Math.floor(Math.max(10, Math.min(Number(targetCount) || 100, 10000)) * 0.5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Titre requis");
      return;
    }
    setFormError("");
    createMutation.mutate();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#f8f8fc]">Campagnes</h2>
          <p className="text-xs sm:text-sm text-[#8080a0] mt-0.5">
            Lance et suis tes campagnes TikTok
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl shadow-lg shadow-[#8b5cf6]/25 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nouvelle campagne
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="grid grid-cols-2 gap-2">
        {(["available", "mine"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`py-2.5 rounded-full text-xs sm:text-sm font-medium border transition-colors cursor-pointer ${
                active
                  ? "bg-[#8b5cf6]/15 border-[#8b5cf6]/45 text-[#8b5cf6] font-semibold"
                  : "bg-[#0f0f1a] border-[#1e1e33] text-[#8080a0] hover:text-[#f8f8fc]"
              }`}
            >
              {t === "available" ? "Disponibles" : "Mes Campagnes"}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-[#8080a0]">Chargement...</div>
      ) : list.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <Radio className="w-10 h-10 text-[#8080a0]" />
          <p className="text-sm text-[#8080a0]">
            {tab === "available" ? "Aucune campagne active" : "Aucune campagne créée"}
          </p>
          {tab === "mine" && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-1 inline-flex items-center gap-1.5 bg-[#8b5cf6] text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Créer une campagne
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((campaign) => {
            const color = MISSION_COLORS[campaign.targetType] ?? "#8b5cf6";
            const statusMeta = CAMPAIGN_STATUS_META[campaign.status] ?? {
              label: campaign.status,
              color: "#8080a0",
            };
            const pct = Math.min(
              100,
              (campaign.completedCount / Math.max(1, campaign.targetCount)) * 100,
            );

            return (
              <div
                key={campaign.id}
                className="bg-[#0f0f1a] rounded-2xl border p-4 space-y-3"
                style={{ borderColor: `${color}28` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <TypeIcon type={campaign.targetType} color={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[#f8f8fc] truncate">
                      {campaign.title}
                    </h3>
                    <p className="text-xs text-[#8080a0] capitalize">{campaign.targetType}</p>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{
                      backgroundColor: `${statusMeta.color}20`,
                      color: statusMeta.color,
                    }}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                {campaign.description && (
                  <p className="text-xs text-[#8080a0]">{campaign.description}</p>
                )}

                {campaign.targetUrl && (
                  <p className="inline-flex items-center gap-1.5 text-[11px] text-[#22d3ee]">
                    <Link2 className="w-3.5 h-3.5" />
                    {campaign.targetUrl}
                  </p>
                )}

                <div className="flex items-center justify-between gap-4 text-xs text-[#8080a0]">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {campaign.completedCount}/{campaign.targetCount}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#facc15]">
                      <Coins className="w-3.5 h-3.5" />
                      {campaign.coinsRequired} coins
                    </span>
                  </div>

                  {tab === "mine" &&
                    (campaign.status === "active" || campaign.status === "paused") && (
                      <button
                        type="button"
                        onClick={() =>
                          statusMutation.mutate({
                            id: campaign.id,
                            status: campaign.status === "active" ? "paused" : "active",
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#f8f8fc] bg-[#1a1a2e] hover:bg-[#252542] px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        {campaign.status === "active" ? (
                          <>
                            <Pause className="w-3 h-3" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" /> Reprendre
                          </>
                        )}
                      </button>
                    )}
                </div>

                <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f1a] border border-[#1e1e33] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e33]">
              <h3 className="text-base font-bold text-[#f8f8fc]">Nouvelle campagne</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center text-[#f8f8fc] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#f8f8fc] mb-1.5">
                  Titre *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  placeholder="Ex: Like ma vidéo TikTok"
                  className="w-full bg-[#090914] border border-[#1e1e33] rounded-xl px-3.5 py-2.5 text-sm text-[#f8f8fc] placeholder-[#8080a0]/70 focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#f8f8fc] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails optionnels..."
                  className="w-full bg-[#090914] border border-[#1e1e33] rounded-xl px-3.5 py-2.5 text-sm text-[#f8f8fc] placeholder-[#8080a0]/70 focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#f8f8fc] mb-1.5">
                  Type d'action *
                </label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => {
                    const active = targetType === t;
                    const color = MISSION_COLORS[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTargetType(t)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer capitalize"
                        style={{
                          backgroundColor: active ? `${color}22` : "#090914",
                          borderColor: active ? `${color}60` : "#1e1e33",
                          color: active ? color : "#8080a0",
                        }}
                      >
                        <TypeIcon type={t} color={active ? color : "#8080a0"} />
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#f8f8fc] mb-1.5">
                    URL cible
                  </label>
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://tiktok.com/@..."
                    className="w-full bg-[#090914] border border-[#1e1e33] rounded-xl px-3.5 py-2.5 text-sm text-[#f8f8fc] placeholder-[#8080a0]/70 focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#f8f8fc] mb-1.5">
                    Participants (min 10)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={10000}
                    value={targetCount}
                    onChange={(e) => setTargetCount(e.target.value)}
                    className="w-full bg-[#090914] border border-[#1e1e33] rounded-xl px-3.5 py-2.5 text-sm text-[#f8f8fc] focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#facc15]/10 border border-[#facc15]/25 rounded-xl px-3.5 py-2.5 text-xs">
                <Coins className="w-4 h-4 text-[#facc15]" />
                <span>
                  Coût estimé :{" "}
                  <strong className="text-[#facc15]">{coinsRequired} coins</strong>
                </span>
              </div>

              {formError && (
                <p className="text-xs text-[#ef4444] text-center">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1a1a2e] text-[#f8f8fc] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !title.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white cursor-pointer"
                >
                  {createMutation.isPending ? "Lancement..." : "Lancer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
