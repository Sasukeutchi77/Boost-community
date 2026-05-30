import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetMe, useGetDashboardStats, useGetActivityFeed } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}25` }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Feather name={icon as never} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  const { data: user, isLoading: userLoading, refetch: refetchUser } = useGetMe();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetDashboardStats();
  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed } = useGetActivityFeed({ limit: 10 });

  const onRefresh = () => { refetchUser(); refetchStats(); refetchFeed(); };

  const rankColor = Colors.rank[(user as any)?.rank ?? "Bronze"] ?? Colors.primary;
  const xpCurrent = (user as any)?.xp ?? 0;
  const level = (user as any)?.level ?? 1;
  const xpForLevel = level * 200;
  const xpPct = Math.min(100, (xpCurrent % xpForLevel) / xpForLevel * 100);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.px}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Bienvenue 👋</Text>
            <Text style={styles.username}>{(user as any)?.username ?? "..."}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.coinsChip} onPress={() => router.push("/coins")}>
              <Feather name="dollar-sign" size={14} color={Colors.yellow} />
              <Text style={styles.coinsText}>{((user as any)?.coins ?? 0).toLocaleString()}</Text>
            </TouchableOpacity>
            {(user as any)?.dailyStreak > 0 && (
              <View style={styles.streakChip}>
                <Feather name="activity" size={14} color={Colors.orange} />
                <Text style={styles.streakText}>{(user as any).dailyStreak}j</Text>
              </View>
            )}
          </View>
        </View>

        {/* Rank + XP card */}
        {!userLoading && user && (
          <View style={[styles.rankCard, { borderColor: `${rankColor}30` }]}>
            <View style={styles.rankRow}>
              <View style={[styles.avatar, { backgroundColor: `${rankColor}22` }]}>
                <Text style={[styles.avatarText, { color: rankColor }]}>
                  {(user as any).username?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.rankBadgeRow}>
                  <Text style={[styles.rankBadge, { color: rankColor }]}>{(user as any).rank}</Text>
                  <Text style={styles.levelText}> · Niveau {(user as any).level}</Text>
                </View>
                <Text style={styles.xpText}>{xpCurrent.toLocaleString()} XP</Text>
              </View>
              {(user as any)?.isPremium && (
                <View style={styles.premiumBadge}>
                  <Feather name="star" size={12} color={Colors.yellow} />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </View>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${xpPct}%` }]} />
            </View>
            <View style={styles.xpBarLabels}>
              <Text style={styles.xpBarLabel}>Progression Niveau {level + 1}</Text>
              <Text style={styles.xpBarLabel}>{Math.round(xpPct)}%</Text>
            </View>
          </View>
        )}

        {/* Stats */}
        {statsLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard icon="zap" label="Missions" value={(stats as any)?.missionsCompleted ?? 0} color={Colors.primary} />
            <StatCard icon="radio" label="Campagnes" value={(stats as any)?.activeCampaigns ?? 0} color={Colors.accent} />
            <StatCard icon="trending-up" label="Coins gagnés" value={((stats as any)?.totalCoinsEarned ?? 0).toLocaleString()} color={Colors.yellow} />
            <StatCard icon="users" label="Followers" value={(stats as any)?.followersGained ?? 0} color={Colors.success} />
          </View>
        )}

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.quickActions}>
          {[
            { icon: "zap", label: "Missions", route: "/(tabs)/missions", color: Colors.primary },
            { icon: "radio", label: "Campagnes", route: "/(tabs)/campaigns", color: Colors.accent },
            { icon: "award", label: "Classement", route: "/(tabs)/leaderboard", color: Colors.yellow },
            { icon: "star", label: "Succès", route: "/achievements", color: Colors.secondary },
          ].map(({ icon, label, route, color }) => (
            <TouchableOpacity
              key={label}
              style={[styles.quickAction, { borderColor: `${color}20` }]}
              onPress={() => router.push(route as never)}
              activeOpacity={0.75}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${color}18` }]}>
                <Feather name={icon as never} size={20} color={color} />
              </View>
              <Text style={styles.quickActionLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent activity */}
        {!feedLoading && (feedData as any)?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Activité récente</Text>
            {((feedData as any) as any[]).slice(0, 5).map((item: any, i: number) => (
              <View key={i} style={styles.activityItem}>
                <View style={[styles.activityDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.activityText} numberOfLines={1}>{item.description ?? item.type}</Text>
                <Text style={styles.activityTime}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("fr-FR") : ""}</Text>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontSize: 13, color: Colors.mutedForeground, fontFamily: "Inter_400Regular" },
  username: { fontSize: 22, fontWeight: "800", color: Colors.foreground, fontFamily: "Inter_800ExtraBold" },
  headerRight: { flexDirection: "row", gap: 8 },
  coinsChip: { flexDirection: "row", gap: 4, alignItems: "center", backgroundColor: `${Colors.yellow}15`, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: `${Colors.yellow}20` },
  coinsText: { color: Colors.yellow, fontWeight: "700", fontSize: 13, fontFamily: "Inter_700Bold" },
  streakChip: { flexDirection: "row", gap: 4, alignItems: "center", backgroundColor: `${Colors.orange}15`, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: `${Colors.orange}20` },
  streakText: { color: Colors.orange, fontWeight: "700", fontSize: 13, fontFamily: "Inter_700Bold" },
  rankCard: { backgroundColor: Colors.surface, borderRadius: Colors.radius, borderWidth: 1, padding: 16, marginBottom: 20 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "900", fontFamily: "Inter_900Black" },
  rankBadgeRow: { flexDirection: "row", alignItems: "center" },
  rankBadge: { fontWeight: "700", fontSize: 15, fontFamily: "Inter_700Bold" },
  levelText: { color: Colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular" },
  xpText: { color: Colors.mutedForeground, fontSize: 12, marginTop: 2, fontFamily: "Inter_400Regular" },
  premiumBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${Colors.yellow}18`, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  premiumText: { color: Colors.yellow, fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  xpBarBg: { height: 6, backgroundColor: Colors.muted, borderRadius: 99, overflow: "hidden" },
  xpBarFill: { height: 6, borderRadius: 99, backgroundColor: Colors.primary },
  xpBarLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  xpBarLabel: { fontSize: 11, color: Colors.mutedForeground, fontFamily: "Inter_400Regular" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statCard: { flex: 1, minWidth: "45%", backgroundColor: Colors.surface, borderRadius: Colors.radius, borderWidth: 1, padding: 14, alignItems: "center", gap: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 18, fontWeight: "800", color: Colors.foreground, fontFamily: "Inter_800ExtraBold" },
  statLabel: { fontSize: 12, color: Colors.mutedForeground, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 12 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  quickAction: { flex: 1, minWidth: "45%", backgroundColor: Colors.surface, borderRadius: Colors.radius, borderWidth: 1, padding: 14, alignItems: "center", gap: 8 },
  quickActionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontSize: 13, fontWeight: "600", color: Colors.foreground, fontFamily: "Inter_600SemiBold" },
  activityItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityText: { flex: 1, fontSize: 13, color: Colors.foreground, fontFamily: "Inter_400Regular" },
  activityTime: { fontSize: 11, color: Colors.mutedForeground, fontFamily: "Inter_400Regular" },
});
