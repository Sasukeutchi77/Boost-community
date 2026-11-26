import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Award,
  Check,
  Clock,
  Coins,
  Gift,
  MessageCircle,
  MinusCircle,
  Plus,
  PlusCircle,
  Radio,
  RotateCcw,
  ShoppingCart,
  Sliders,
  TrendingUp,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { TICKET_STATUS_META } from "../lib/theme";
import type { Achievement, CoinBalance, CoinTransaction, Ticket } from "../types";
import type { ModalKey } from "./DashboardTab";

export function AppModals({
  activeModal,
  onClose,
}: {
  activeModal: ModalKey;
  onClose: () => void;
}) {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#090914] border border-[#1e1e33] rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {activeModal === "coins" && <CoinsContent onClose={onClose} />}
        {activeModal === "achievements" && <AchievementsContent onClose={onClose} />}
        {activeModal === "support" && <SupportContent onClose={onClose} />}
      </div>
    </div>
  );
}

type TxFilter = "all" | "gains" | "expenses";

const TX_TYPE_LABELS: Record<CoinTransaction["type"], string> = {
  earn: "Gain",
  spend: "Dépense",
  purchase: "Achat",
  bonus: "Bonus",
  refund: "Remboursement",
  adjustment: "Ajustement",
};

function CoinsContent({ onClose }: { onClose: () => void }) {
  const [filter, setFilter] = useState<TxFilter>("all");

  const { data: balance } = useQuery({
    queryKey: ["coins-balance"],
    queryFn: () => apiFetch<CoinBalance>("/coins/balance"),
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["coins-transactions"],
    queryFn: () => apiFetch<CoinTransaction[]>("/coins/transactions?limit=50"),
  });

  const totalGains = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "gains") return tx.amount > 0;
    if (filter === "expenses") return tx.amount < 0;
    return true;
  });

  const renderIcon = (type: CoinTransaction["type"]) => {
    switch (type) {
      case "earn":
        return <PlusCircle className="w-4 h-4 text-[#22c55e]" />;
      case "spend":
        return <MinusCircle className="w-4 h-4 text-[#ef4444]" />;
      case "purchase":
        return <ShoppingCart className="w-4 h-4 text-[#22d3ee]" />;
      case "bonus":
        return <Gift className="w-4 h-4 text-[#ec4899]" />;
      case "refund":
        return <RotateCcw className="w-4 h-4 text-[#f59e0b]" />;
      default:
        return <Sliders className="w-4 h-4 text-[#8080a0]" />;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e33]">
        <h3 className="text-base font-bold text-[#f8f8fc]">Mes Coins</h3>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-[#0f0f1a] flex items-center justify-center text-[#f8f8fc] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto space-y-5">
        <div className="bg-[#0f0f1a] border border-[#facc15]/25 rounded-3xl p-6 flex flex-col items-center text-center gap-1">
          <Coins className="w-8 h-8 text-[#facc15] mb-1" />
          <p className="text-4xl font-black text-[#facc15]">
            {(balance?.balance ?? 0).toLocaleString("fr-FR")}
          </p>
          <p className="text-xs text-[#8080a0]">coins disponibles</p>
          {(balance?.pendingEarnings ?? 0) > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-[#f59e0b]/15 text-[#f59e0b] text-xs px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              +{balance?.pendingEarnings.toLocaleString("fr-FR")} en attente
            </div>
          )}
        </div>

        {/* Summary Gains vs Expenses */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0f0f1a] border border-[#22c55e]/20 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#22c55e]/15 flex items-center justify-center shrink-0">
              <PlusCircle className="w-4 h-4 text-[#22c55e]" />
            </div>
            <div>
              <p className="text-[11px] text-[#8080a0]">Gains récents</p>
              <p className="text-sm font-bold text-[#22c55e]">
                +{totalGains.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>

          <div className="bg-[#0f0f1a] border border-[#ef4444]/20 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ef4444]/15 flex items-center justify-center shrink-0">
              <MinusCircle className="w-4 h-4 text-[#ef4444]" />
            </div>
            <div>
              <p className="text-[11px] text-[#8080a0]">Dépenses récentes</p>
              <p className="text-sm font-bold text-[#ef4444]">
                -{totalExpenses.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8080a0]">
              Historique des transactions
            </h4>

            <div className="flex items-center gap-1.5">
              {(
                [
                  { key: "all", label: "Tout" },
                  { key: "gains", label: "Gains" },
                  { key: "expenses", label: "Dépenses" },
                ] as const
              ).map(({ key, label }) => {
                const active = filter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                      active
                        ? "bg-[#8b5cf6]/20 border-[#8b5cf6]/50 text-[#8b5cf6]"
                        : "bg-[#0f0f1a] border-[#1e1e33] text-[#8080a0] hover:text-[#f8f8fc]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-[#8080a0] py-6 text-center">Chargement...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-sm text-[#8080a0] py-8 text-center">
              {filter === "gains"
                ? "Aucun gain enregistré pour l'instant"
                : filter === "expenses"
                  ? "Aucune dépense enregistrée pour l'instant"
                  : "Aucune transaction pour l'instant"}
            </p>
          ) : (
            <div className="bg-[#0f0f1a] border border-[#1e1e33] rounded-2xl divide-y divide-[#1e1e33]">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1a1a2e] flex items-center justify-center shrink-0">
                    {renderIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#f8f8fc] truncate">
                      {tx.description ?? tx.type}
                    </p>
                    <p className="text-[11px] text-[#8080a0]">
                      {TX_TYPE_LABELS[tx.type] ?? tx.type} ·{" "}
                      {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold shrink-0 ${
                      tx.amount > 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount.toLocaleString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function AchievementsContent({ onClose }: { onClose: () => void }) {
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => apiFetch<Achievement[]>("/achievements"),
  });

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);
  const ordered = [...unlocked, ...locked];
  const pctTotal =
    achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0;

  const getCategoryIcon = (cat: string, color: string) => {
    const props = { className: "w-5 h-5", style: { color } };
    switch (cat) {
      case "missions":
        return <Zap {...props} />;
      case "campaigns":
        return <Radio {...props} />;
      case "streak":
        return <Activity {...props} />;
      case "coins":
        return <Coins {...props} />;
      case "followers":
        return <Users {...props} />;
      case "level":
        return <TrendingUp {...props} />;
      case "referral":
        return <UserPlus {...props} />;
      default:
        return <Award {...props} />;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e33]">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-bold text-[#f8f8fc]">Succès & Badges</h3>
          <span className="bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#8b5cf6] text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {unlocked.length}/{achievements.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-[#0f0f1a] flex items-center justify-center text-[#f8f8fc] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto space-y-4">
        {achievements.length > 0 && (
          <div>
            <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8b5cf6] rounded-full transition-all"
                style={{ width: `${pctTotal}%` }}
              />
            </div>
            <p className="text-xs text-[#8080a0] text-right mt-1.5">
              {pctTotal}% débloqués
            </p>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-[#8080a0] py-8 text-center">Chargement...</p>
        ) : (
          <div className="space-y-2.5">
            {ordered.map((ach) => {
              const color = ach.unlocked ? "#8b5cf6" : "#8080a0";
              const pct = Math.min(100, (ach.progress / Math.max(1, ach.requirement)) * 100);

              return (
                <div
                  key={ach.id}
                  className={`bg-[#0f0f1a] rounded-2xl border p-4 flex items-start gap-3.5 ${
                    ach.unlocked ? "border-[#8b5cf6]/35" : "border-[#1e1e33]"
                  }`}
                >
                  <div
                    className="relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    {getCategoryIcon(ach.category, color)}
                    {ach.unlocked && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#22c55e] border-2 border-[#0f0f1a] flex items-center justify-center text-white">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-semibold ${
                        ach.unlocked ? "text-[#f8f8fc]" : "text-[#8080a0]"
                      }`}
                    >
                      {ach.title}
                    </h4>
                    <p className="text-xs text-[#8080a0] mt-0.5">{ach.description}</p>
                    {!ach.unlocked && ach.requirement > 1 && (
                      <div className="mt-2">
                        <div className="h-1 bg-[#1a1a2e] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#8b5cf6] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[#8080a0] mt-1">
                          {ach.progress} / {ach.requirement}
                        </p>
                      </div>
                    )}
                  </div>

                  {ach.rewardCoins > 0 && (
                    <span className="inline-flex items-center gap-1 bg-[#facc15]/15 text-[#facc15] text-xs font-semibold px-2 py-1 rounded-xl shrink-0">
                      <Coins className="w-3 h-3" />
                      {ach.rewardCoins}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function SupportContent({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => apiFetch<Ticket[]>("/tickets"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<Ticket>("/tickets", {
        method: "POST",
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      }),
    onSuccess: async () => {
      setSubject("");
      setMessage("");
      setCreating(false);
      await queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e33]">
        <h3 className="text-base font-bold text-[#f8f8fc]">
          {creating ? "Nouveau ticket" : "Support"}
        </h3>
        <div className="flex items-center gap-2">
          {!creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1 bg-[#8b5cf6]/15 border border-[#8b5cf6]/35 text-[#8b5cf6] text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouveau
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#0f0f1a] flex items-center justify-center text-[#f8f8fc] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 overflow-y-auto">
        {creating ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!subject.trim() || !message.trim()) return;
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-[#f8f8fc] mb-1.5">
                Sujet
              </label>
              <input
                type="text"
                value={subject}
                maxLength={100}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Décris ton problème..."
                className="w-full bg-[#0f0f1a] border border-[#1e1e33] rounded-xl px-3.5 py-2.5 text-sm text-[#f8f8fc] placeholder-[#8080a0]/70 focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#f8f8fc] mb-1.5">
                Message
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explique en détail..."
                className="w-full bg-[#0f0f1a] border border-[#1e1e33] rounded-xl px-3.5 py-2.5 text-sm text-[#f8f8fc] placeholder-[#8080a0]/70 focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-4 py-2 rounded-xl bg-[#1a1a2e] text-xs font-semibold text-[#f8f8fc] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!subject.trim() || !message.trim() || createMutation.isPending}
                className="px-5 py-2 rounded-xl bg-[#8b5cf6] disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
              >
                {createMutation.isPending ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </form>
        ) : isLoading ? (
          <p className="text-sm text-[#8080a0] py-8 text-center">Chargement...</p>
        ) : tickets.length === 0 ? (
          <div className="py-10 flex flex-col items-center text-center gap-3">
            <MessageCircle className="w-10 h-10 text-[#8080a0]" />
            <p className="text-sm font-bold text-[#f8f8fc]">Aucun ticket ouvert</p>
            <p className="text-xs text-[#8080a0] max-w-xs">
              Tu as un problème ? Ouvre un ticket et notre équipe t'aidera.
            </p>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="mt-1 inline-flex items-center gap-1.5 bg-[#8b5cf6] text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Créer un ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const meta = TICKET_STATUS_META[t.status] ?? {
                label: t.status,
                color: "#8080a0",
              };
              return (
                <div
                  key={t.id}
                  className="bg-[#0f0f1a] border border-[#1e1e33] rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-[#f8f8fc] truncate">
                      {t.subject}
                    </h4>
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg shrink-0"
                      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#8080a0] line-clamp-2">{t.message}</p>
                  <p className="text-[11px] text-[#8080a0]/70">
                    {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
