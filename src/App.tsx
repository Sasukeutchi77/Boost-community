import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Award, Coins, Home, Radio, Star, User as UserIcon, Zap } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthScreen } from "./components/AuthScreen";
import { DashboardTab, type ModalKey, type TabKey } from "./components/DashboardTab";
import { MissionsTab } from "./components/MissionsTab";
import { CampaignsTab } from "./components/CampaignsTab";
import { LeaderboardTab } from "./components/LeaderboardTab";
import { ProfileTab } from "./components/ProfileTab";
import { AppModals } from "./components/Modals";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const NAV_ITEMS: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "missions", label: "Missions", icon: Zap },
  { key: "campaigns", label: "Campagnes", icon: Radio },
  { key: "leaderboard", label: "Classement", icon: Award },
  { key: "profile", label: "Profil", icon: UserIcon },
];

function MainShell() {
  const { token, user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [activeModal, setActiveModal] = useState<ModalKey>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090914] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#8b5cf6] animate-pulse" />
          </div>
          <p className="text-xs text-[#8080a0]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#090914] text-[#f8f8fc] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#0f0f1a] border-r border-[#1e1e33] p-4">
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/35 flex items-center justify-center text-[#8b5cf6]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-[#f8f8fc]">
              Boost Community
            </h1>
            <p className="text-[11px] text-[#8080a0]">Croissance TikTok</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-[#8b5cf6]/15 text-[#8b5cf6] border border-[#8b5cf6]/30 font-semibold"
                    : "text-[#8080a0] hover:text-[#f8f8fc] hover:bg-[#1a1a2e]/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-[#1e1e33] space-y-2">
          <button
            type="button"
            onClick={() => setActiveModal("coins")}
            className="w-full flex items-center justify-between bg-[#facc15]/10 border border-[#facc15]/20 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#facc15] hover:bg-[#facc15]/20 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Mes Coins
            </span>
            <span>{(user?.coins ?? 0).toLocaleString("fr-FR")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("achievements")}
            className="w-full flex items-center gap-2 bg-[#1a1a2e]/60 hover:bg-[#1a1a2e] rounded-xl px-3.5 py-2 text-xs font-medium text-[#f8f8fc] cursor-pointer"
          >
            <Star className="w-3.5 h-3.5 text-[#ec4899]" />
            Succès & Badges
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {activeTab === "dashboard" && (
            <DashboardTab
              onNavigateTab={setActiveTab}
              onOpenModal={setActiveModal}
            />
          )}
          {activeTab === "missions" && <MissionsTab />}
          {activeTab === "campaigns" && <CampaignsTab />}
          {activeTab === "leaderboard" && <LeaderboardTab />}
          {activeTab === "profile" && <ProfileTab onOpenModal={setActiveModal} />}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0f0f1a]/95 backdrop-blur border-t border-[#1e1e33] px-2 py-2 grid grid-cols-5">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium cursor-pointer ${
                active ? "text-[#8b5cf6]" : "text-[#8080a0]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <AppModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainShell />
      </AuthProvider>
    </QueryClientProvider>
  );
}
