import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetCoinBalance, useGetCoinTransactions, type CoinTransaction } from "@workspace/api-client-react";
import Colors from "@/constants/colors";

const TX_META: Record<string, { icon: string; color: string }> = {
  earn: { icon: "plus-circle", color: Colors.success },
  spend: { icon: "minus-circle", color: Colors.destructive },
  purchase: { icon: "shopping-cart", color: Colors.accent },
  bonus: { icon: "gift", color: Colors.secondary },
  refund: { icon: "rotate-ccw", color: Colors.warning },
  adjustment: { icon: "sliders", color: Colors.mutedForeground },
};

function TransactionRow({ tx }: { tx: CoinTransaction }) {
  const meta = TX_META[(tx as any).type as string] ?? { icon: "circle", color: Colors.mutedForeground };
  const amount = (tx as any).amount ?? 0;
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: `${meta.color}15` }]}>
        <Feather name={meta.icon as never} size={18} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txDesc} numberOfLines={1}>{(tx as any).description ?? (tx as any).type}</Text>
        <Text style={styles.txDate}>{(tx as any).createdAt ? new Date((tx as any).createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : ""}</Text>
      </View>
      <Text style={[styles.txAmount, { color: amount > 0 ? Colors.success : Colors.destructive }]}>
        {amount > 0 ? "+" : ""}{amount.toLocaleString()}
      </Text>
    </View>
  );
}

export default function Coins() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: balance, isLoading: balLoading, refetch: refetchBal } = useGetCoinBalance();
  const { data: txData, isLoading: txLoading, refetch: refetchTx } = useGetCoinTransactions({ limit: 50 });
  const transactions = (Array.isArray(txData) ? txData : (txData as any)?.data ?? []) as CoinTransaction[];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Coins</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(tx, i) => String((tx as any).id ?? i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetchBal(); refetchTx(); }} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              <Feather name="dollar-sign" size={32} color={Colors.yellow} />
              {balLoading ? (
                <ActivityIndicator color={Colors.yellow} style={{ marginVertical: 8 }} />
              ) : (
                <Text style={styles.balanceValue}>{((balance as any)?.balance ?? 0).toLocaleString()}</Text>
              )}
              <Text style={styles.balanceLabel}>coins disponibles</Text>
              {(balance as any)?.pendingEarnings > 0 && (
                <View style={styles.pendingRow}>
                  <Feather name="clock" size={13} color={Colors.warning} />
                  <Text style={styles.pendingText}>+{(balance as any).pendingEarnings.toLocaleString()} en attente</Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionTitle}>Historique des transactions</Text>
          </View>
        }
        ListEmptyComponent={
          !txLoading ? (
            <View style={styles.empty}><Feather name="dollar-sign" size={36} color={Colors.mutedForeground} /><Text style={styles.emptyText}>Aucune transaction pour l'instant</Text></View>
          ) : <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        }
        renderItem={({ item }) => <TransactionRow tx={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border, marginHorizontal: 16 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.foreground, fontFamily: "Inter_700Bold" },
  balanceSection: { paddingHorizontal: 16, paddingTop: 20 },
  balanceCard: { backgroundColor: Colors.surface, borderRadius: Colors.radiusLg, borderWidth: 1, borderColor: `${Colors.yellow}25`, padding: 28, alignItems: "center", marginBottom: 28, gap: 4 },
  balanceValue: { fontSize: 44, fontWeight: "900", color: Colors.yellow, fontFamily: "Inter_900Black", letterSpacing: -1 },
  balanceLabel: { fontSize: 14, color: Colors.mutedForeground, fontFamily: "Inter_400Regular" },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: `${Colors.warning}15`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pendingText: { fontSize: 13, color: Colors.warning, fontFamily: "Inter_500Medium" },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: Colors.mutedForeground, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  txIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 14, color: Colors.foreground, fontFamily: "Inter_500Medium" },
  txDate: { fontSize: 12, color: Colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { color: Colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
});
