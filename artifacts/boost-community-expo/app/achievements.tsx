import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetAchievements, type Achievement } from "@workspace/api-client-react";
import Colors from "@/constants/colors";

const ACHIEVEMENT_ICONS: Record<string, string> = { missions: "zap", campaigns: "radio", streak: "activity", coins: "dollar-sign", followers: "users", level: "trending-up", referral: "user-plus" };

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const unlocked = (achievement as any).unlocked ?? false;
  const progress = (achievement as any).progress ?? 0;
  const total = (achievement as any).requirement ?? 1;
  const pct = Math.min(100, (progress / total) * 100);
  const icon = ACHIEVEMENT_ICONS[(achievement as any).category as string] ?? "award";
  const color = unlocked ? Colors.primary : Colors.mutedForeground;

  return (
    <View style={[styles.card, unlocked && styles.cardUnlocked]}>
      <View style={[styles.icon, { backgroundColor: `${color}18` }]}>
        <Feather name={icon as never} size={22} color={color} />
        {unlocked && (
          <View style={styles.checkmark}><Feather name="check" size={10} color="#fff" /></View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, !unlocked && { color: Colors.mutedForeground }]}>{(achievement as any).title ?? "Succès"}</Text>
        <Text style={styles.desc} numberOfLines={2}>{(achievement as any).description ?? ""}</Text>
        {!unlocked && total > 1 && (
          <View style={{ marginTop: 8 }}>
            <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View>
            <Text style={styles.progressText}>{progress} / {total}</Text>
          </View>
        )}
      </View>
      {unlocked && (
        <View style={styles.rewardBadge}>
          <Feather name="dollar-sign" size={12} color={Colors.yellow} />
          <Text style={styles.rewardText}>{(achievement as any).rewardCoins ?? 0}</Text>
        </View>
      )}
    </View>
  );
}

export default function Achievements() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: achievements, isLoading, refetch } = useGetAchievements();

  const all = (achievements as Achievement[] | undefined) ?? [];
  const unlocked = all.filter((a) => (a as any).unlocked);
  const locked = all.filter((a) => !(a as any).unlocked);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Succès & Badges</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{unlocked.length}/{all.length}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={[...unlocked, ...locked]}
          keyExtractor={(a, i) => String((a as any).id ?? i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            all.length > 0 ? (
              <View style={styles.progressSummary}>
                <View style={styles.progressSummaryBar}>
                  <View style={[styles.progressSummaryFill, { width: `${all.length > 0 ? (unlocked.length / all.length) * 100 : 0}%` }]} />
                </View>
                <Text style={styles.progressSummaryText}>{Math.round(all.length > 0 ? (unlocked.length / all.length) * 100 : 0)}% débloqués</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}><Feather name="award" size={40} color={Colors.mutedForeground} /><Text style={styles.emptyText}>Aucun succès disponible</Text></View>
          }
          renderItem={({ item }) => <AchievementCard achievement={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.foreground, fontFamily: "Inter_700Bold" },
  countBadge: { backgroundColor: Colors.primaryDim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.primary}30` },
  countText: { color: Colors.primary, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16, gap: 10 },
  progressSummary: { marginBottom: 16 },
  progressSummaryBar: { height: 6, backgroundColor: Colors.muted, borderRadius: 99, overflow: "hidden", marginBottom: 6 },
  progressSummaryFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 99 },
  progressSummaryText: { fontSize: 12, color: Colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  card: { flexDirection: "row", alignItems: "flex-start", gap: 14, backgroundColor: Colors.surface, borderRadius: Colors.radius, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  cardUnlocked: { borderColor: `${Colors.primary}30` },
  icon: { width: 50, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  checkmark: { position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.success, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.surface },
  title: { fontSize: 14, fontWeight: "600", color: Colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  desc: { fontSize: 12, color: Colors.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 17 },
  progressBg: { height: 4, backgroundColor: Colors.muted, borderRadius: 99, overflow: "hidden" },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 99 },
  progressText: { fontSize: 11, color: Colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 3 },
  rewardBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: `${Colors.yellow}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  rewardText: { fontSize: 11, color: Colors.yellow, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { color: Colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
});
