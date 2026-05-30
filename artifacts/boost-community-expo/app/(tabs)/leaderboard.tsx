import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetLeaderboard, useGetMyRank, type LeaderboardEntry } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

const POSITION_COLORS: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

function LeaderboardRow({ entry, position, isMe }: { entry: LeaderboardEntry; position: number; isMe: boolean }) {
  const rankColor = Colors.rank[(entry as any).rank ?? "Bronze"] ?? Colors.primary;
  const posColor = POSITION_COLORS[position] ?? Colors.mutedForeground;

  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <View style={styles.positionBox}>
        {position <= 3 ? (
          <Feather name="award" size={18} color={posColor} />
        ) : (
          <Text style={[styles.position, { color: position <= 10 ? Colors.foreground : Colors.mutedForeground }]}>#{position}</Text>
        )}
      </View>
      <View style={[styles.avatar, { backgroundColor: `${rankColor}20` }]}>
        <Text style={[styles.avatarText, { color: rankColor }]}>{(entry as any).username?.[0]?.toUpperCase() ?? "?"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.username} numberOfLines={1}>
          {(entry as any).username ?? "Créateur"}{isMe ? <Text style={styles.meTag}> (toi)</Text> : null}
        </Text>
        <View style={styles.rankRow}>
          <Text style={[styles.rankText, { color: rankColor }]}>{(entry as any).rank ?? "Bronze"}</Text>
          <Text style={styles.levelText}> · Niv. {(entry as any).level ?? 1}</Text>
        </View>
      </View>
      <View style={styles.xpBox}>
        <Text style={styles.xpValue}>{((entry as any).xp ?? 0).toLocaleString()}</Text>
        <Text style={styles.xpLabel}>XP</Text>
      </View>
    </View>
  );
}

export default function Leaderboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: leaderboard, isLoading, refetch } = useGetLeaderboard({ limit: 50 });
  const { data: myRank } = useGetMyRank();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>Classement</Text>
        <Text style={styles.headerSub}>Les meilleurs créateurs de la communauté</Text>
        {myRank && (
          <View style={styles.myRankCard}>
            <Feather name="trending-up" size={16} color={Colors.primary} />
            <Text style={styles.myRankText}>Ton rang : <Text style={{ color: Colors.primary, fontFamily: "Inter_700Bold" }}>#{(myRank as any).rank ?? "?"}</Text></Text>
            <Text style={styles.myRankXp}>{((myRank as any).xp ?? 0).toLocaleString()} XP</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={(leaderboard as LeaderboardEntry[] | undefined) ?? []}
          keyExtractor={(e, i) => String((e as any).userId ?? i)}
          contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="award" size={40} color={Colors.mutedForeground} />
              <Text style={styles.emptyText}>Aucun classement disponible</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <LeaderboardRow entry={item} position={index + 1} isMe={(item as any).username === (user as any)?.username} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: Colors.foreground, fontFamily: "Inter_800ExtraBold", marginBottom: 2 },
  headerSub: { fontSize: 13, color: Colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 12 },
  myRankCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.primaryDim, borderRadius: Colors.radiusSm, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: `${Colors.primary}30` },
  myRankText: { flex: 1, color: Colors.foreground, fontSize: 13, fontFamily: "Inter_500Medium" },
  myRankXp: { color: Colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular" },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surface, borderRadius: Colors.radius, borderWidth: 1, borderColor: Colors.border, padding: 12 },
  rowMe: { borderColor: `${Colors.primary}40`, backgroundColor: Colors.primaryDim },
  positionBox: { width: 32, alignItems: "center" },
  position: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  avatar: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 17, fontWeight: "900", fontFamily: "Inter_900Black" },
  username: { fontSize: 14, fontWeight: "600", color: Colors.foreground, fontFamily: "Inter_600SemiBold" },
  meTag: { fontSize: 12, color: Colors.primary, fontFamily: "Inter_400Regular" },
  rankRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  rankText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  levelText: { fontSize: 12, color: Colors.mutedForeground, fontFamily: "Inter_400Regular" },
  xpBox: { alignItems: "flex-end" },
  xpValue: { fontSize: 14, fontWeight: "700", color: Colors.foreground, fontFamily: "Inter_700Bold" },
  xpLabel: { fontSize: 11, color: Colors.mutedForeground, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: Colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
});
