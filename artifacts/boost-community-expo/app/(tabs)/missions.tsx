import { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Linking, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useListMissions, useCompleteMission, type Mission } from "@workspace/api-client-react";
import Colors from "@/constants/colors";

const MISSION_TYPES = ["all", "watch", "like", "comment", "follow", "share"] as const;
type MissionType = typeof MISSION_TYPES[number];
const TYPE_LABELS: Record<MissionType, string> = { all: "Tous", watch: "Watch", like: "Like", comment: "Comment", follow: "Follow", share: "Share" };
const TYPE_ICONS: Record<MissionType, string> = { all: "grid", watch: "eye", like: "heart", comment: "message-circle", follow: "user-plus", share: "share-2" };

function MissionCard({ mission, onComplete, completing }: { mission: Mission; onComplete: () => void; completing: boolean }) {
  const type = (mission as any).type as MissionType;
  const color = Colors.missionType[type] ?? Colors.primary;
  const completed = (mission as any).userStatus === "completed";
  const targetUrl = (mission as any).targetUrl as string | undefined;

  const handleAction = async () => {
    if (completed) return;
    if (targetUrl) {
      try {
        const canOpen = await Linking.canOpenURL(targetUrl);
        if (canOpen) { await Linking.openURL(targetUrl); setTimeout(() => onComplete(), 1500); }
        else onComplete();
      } catch { onComplete(); }
    } else { onComplete(); }
  };

  return (
    <View style={[styles.card, completed && styles.cardCompleted]}>
      <View style={[styles.cardIcon, { backgroundColor: color + "18" }]}>
        <Feather name={(TYPE_ICONS[type] ?? "zap") as never} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle} numberOfLines={1}>{(mission as any).title ?? "Mission " + type}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{(mission as any).description ?? ""}</Text>
        {targetUrl ? (
          <View style={styles.urlRow}>
            <Feather name="external-link" size={11} color={Colors.accent} />
            <Text style={styles.urlText} numberOfLines={1}>{targetUrl.replace(/^https?:\/\//, "")}</Text>
          </View>
        ) : null}
        <View style={styles.rewardRow}>
          <Feather name="dollar-sign" size={13} color={Colors.yellow} />
          <Text style={styles.rewardText}>+{(mission as any).coinsReward ?? 0} coins</Text>
          <Text style={styles.xpText}> · +{(mission as any).xpReward ?? 0} XP</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.completeBtn, { backgroundColor: completed ? Colors.muted : color }, (completing || completed) && { opacity: completed ? 1 : 0.6 }]}
        onPress={handleAction} disabled={completing || completed} activeOpacity={0.8}
      >
        {completing ? <ActivityIndicator size="small" color="#fff" /> :
          completed ? <Feather name="check" size={16} color={Colors.success} /> :
          targetUrl ? <Feather name="external-link" size={16} color="#fff" /> :
          <Feather name="play" size={16} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}

export default function Missions() {
  const insets = useSafeAreaInsets();
  const [activeType, setActiveType] = useState<MissionType>("all");
  const [completingId, setCompletingId] = useState<number | null>(null);

  const { data: missions, isLoading, refetch } = useListMissions(activeType !== "all" ? { type: activeType } : {});

  const completeMutation = useCompleteMission({
    mutation: {
      onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setCompletingId(null); refetch(); },
      onError: (err: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setCompletingId(null);
        const msg = err?.response?.data?.message ?? "Erreur";
        if (msg !== "Mission already completed") Alert.alert("Erreur", msg);
      },
    },
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>Missions</Text>
        <Text style={styles.headerSub}>Accomplis des missions, gagne des coins</Text>
        <FlatList
          horizontal data={MISSION_TYPES} keyExtractor={t => t}
          showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}
          renderItem={({ item: type }) => {
            const active = activeType === type;
            const color = type !== "all" ? (Colors.missionType[type] ?? Colors.primary) : Colors.primary;
            return (
              <TouchableOpacity style={[styles.tab, active && { backgroundColor: color + "20", borderColor: color + "40" }]} onPress={() => setActiveType(type)} activeOpacity={0.75}>
                <Feather name={TYPE_ICONS[type] as never} size={14} color={active ? color : Colors.mutedForeground} />
                <Text style={[styles.tabText, active && { color }]}>{TYPE_LABELS[type]}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
      {isLoading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={(missions as Mission[] | undefined) ?? []} keyExtractor={m => String((m as any).id)}
          contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
          ListEmptyComponent={<View style={styles.empty}><Feather name="zap-off" size={40} color={Colors.mutedForeground} /><Text style={styles.emptyText}>Aucune mission disponible</Text></View>}
          renderItem={({ item }) => (
            <MissionCard
              mission={item} completing={completingId === (item as any).id}
              onComplete={() => {
                const id = (item as any).id;
                setCompletingId(id);
                completeMutation.mutate({ missionId: id, missionCompleteInput: { proofUrl: (item as any).targetUrl ?? undefined } });
              }}
            />
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
  tabs: { gap: 8, paddingRight: 4 },
  tab: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  tabText: { fontSize: 12, color: Colors.mutedForeground, fontFamily: "Inter_500Medium" },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surface, borderRadius: Colors.radius, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  cardCompleted: { opacity: 0.6 },
  cardIcon: { width: 50, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 13, fontWeight: "600", color: Colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  cardDesc: { fontSize: 12, color: Colors.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 17, marginBottom: 4 },
  urlRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  urlText: { flex: 1, fontSize: 11, color: Colors.accent, fontFamily: "Inter_400Regular" },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  rewardText: { color: Colors.yellow, fontWeight: "600", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  xpText: { color: Colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular" },
  completeBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: Colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
});
