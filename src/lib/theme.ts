import type { MissionType, Rank } from "../types";

export const RANK_COLORS: Record<Rank | string, string> = {
  Bronze: "#b45309",
  Silver: "#94a3b8",
  Gold: "#eab308",
  Elite: "#22d3ee",
  Demon: "#f87171",
  Legend: "#c084fc",
};

export const MISSION_COLORS: Record<MissionType, string> = {
  watch: "#22d3ee",
  like: "#ec4899",
  comment: "#4ade80",
  follow: "#8b5cf6",
  share: "#facc15",
};

export const MISSION_LABELS: Record<MissionType | "all", string> = {
  all: "Tous",
  watch: "Watch",
  like: "Like",
  comment: "Comment",
  follow: "Follow",
  share: "Share",
};

export const CAMPAIGN_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "#f59e0b" },
  active: { label: "Active", color: "#22c55e" },
  paused: { label: "Pausée", color: "#8080a0" },
  completed: { label: "Terminée", color: "#22d3ee" },
};

export const TICKET_STATUS_META: Record<string, { label: string; color: string }> = {
  open: { label: "Ouvert", color: "#8b5cf6" },
  in_progress: { label: "En cours", color: "#f59e0b" },
  resolved: { label: "Résolu", color: "#22c55e" },
  closed: { label: "Fermé", color: "#8080a0" },
};
