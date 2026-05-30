import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useGetMe, useGetReferralStats } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

function MenuItem({ icon, label, onPress, color, rightText, danger }: { icon: string; label: string; onPress: () => void; color?: string; rightText?: string; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.menuIcon, { backgroundColor: (danger ? Colors.destructive : (color ?? Colors.primary)) + "18" }]}>
        <Feather name={icon as never} size={19} color={danger ? Colors.destructive : (color ?? Colors.primary)} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: Colors.destructive }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {rightText && <Text style={styles.menuRight}>{rightText}</Text>}
      <Feather name="chevron-right" size={16} color={Colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { logout, token } = useAuth();
  const router = useRouter();
  const { data: user, refetch: refetchUser } = useGetMe();
  const { data: referralStats } = useGetReferralStats();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const rankColor = Colors.rank[(user as any)?.rank ?? "Bronze"] ?? Colors.primary;
  const xpCurrent = (user as any)?.xp ?? 0;
  const level = (user as any)?.level ?? 1;
  const xpForLevel = level * 200;
  const xpPct = Math.min(100, (xpCurrent % xpForLevel) / xpForLevel * 100);
  const avatarUrl = (user as any)?.avatarUrl as string | undefined;

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Tu veux vraiment te déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnexion", style: "destructive", onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); logout(); } },
    ]);
  };

  // ✅ Upload avatar via Cloudinary
  const handleAvatarPress = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission requise", "Autorise l'accès à tes photos."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
    if (result.canceled || !result.assets[0]?.base64) return;
    setUploadingAvatar(true);
    try {
      const base64 = "data:image/jpeg;base64," + result.assets[0].base64;
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const res = await fetch("https://" + domain + "/api/upload/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();
      if (res.ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); refetchUser(); }
      else Alert.alert("Erreur", data.message ?? "Upload échoué");
    } catch { Alert.alert("Erreur", "Erreur réseau"); }
    setUploadingAvatar(false);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 + 84 : (insets.bottom + 80);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ paddingTop: topPad, paddingBottom: botPad }} showsVerticalScrollIndicator={false}>
      <View style={styles.px}>
        <View style={[styles.profileCard, { borderColor: rankColor + "30" }]}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handleAvatarPress} disabled={uploadingAvatar} activeOpacity={0.85}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={[styles.avatarImg, { borderColor: rankColor + "50" }]} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: rankColor + "22" }]}>
                <Text style={[styles.avatarText, { color: rankColor }]}>{(user as any)?.username?.[0]?.toUpperCase() ?? "?"}</Text>
              </View>
            )}
            {uploadingAvatar ? (
              <View style={styles.avatarOverlay}><ActivityIndicator color="#fff" size="small" /></View>
            ) : (
              <View style={styles.avatarEditBadge}><Feather name="camera" size={12} color="#fff" /></View>
            )}
          </TouchableOpacity>
          <Text style={styles.username}>{(user as any)?.username ?? "..."}</Text>
          <Text style={styles.email}>{(user as any)?.email ?? ""}</Text>
          <View style={styles.rankRow}>
            <View style={[styles.rankBadge, { backgroundColor: rankColor + "20", borderColor: rankColor + "40" }]}>
              <Feather name="award" size={13} color={rankColor} />
              <Text style={[styles.rankText, { color: rankColor }]}>{(user as any)?.rank ?? "Bronze"}</Text>
            </View>
            <View style={styles.levelBadge}><Text style={styles.levelText}>Niveau {level}</Text></View>
            {(user as any)?.isPremium && (
              <View style={styles.premiumBadge}><Feather name="star" size={12} color={Colors.yellow} /><Text style={styles.premiumText}>Premium</Text></View>
            )}
          </View>
          <View style={styles.xpBarBg}><View style={[styles.xpBarFill, { width: xpPct + "%" }]} /></View>
          <Text style={styles.xpLabel}>{xpCurrent.toLocaleString()} XP · {Math.round(xpPct)}% vers Niv.{level + 1}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}><Feather name="dollar-sign" size={18} color={Colors.yellow} /><Text style={styles.statValue}>{((user as any)?.coins ?? 0).toLocaleString()}</Text><Text style={styles.statLabel}>Coins</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.stat}><Feather name="activity" size={18} color={Colors.orange} /><Text style={styles.statValue}>{(user as any)?.dailyStreak ?? 0}</Text><Text style={styles.statLabel}>Streak</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.stat}><Feather name="users" size={18} color={Colors.accent} /><Text style={styles.statValue}>{(referralStats as any)?.totalReferrals ?? 0}</Text><Text style={styles.statLabel}>Parrains</Text></View>
        </View>

        {(user as any)?.referralCode && (
          <View style={styles.referralCard}>
            <Feather name="user-plus" size={16} color={Colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.referralLabel}>Ton code de parrainage</Text>
              <Text style={styles.referralCode}>{(user as any).referralCode}</Text>
            </View>
            <Text style={styles.referralBonus}>+50 coins / filleul</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Mon compte</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="dollar-sign" label="Coins & Transactions" color={Colors.yellow} rightText={"" + ((user as any)?.coins ?? 0).toLocaleString()} onPress={() => router.push("/coins")} />
          <MenuItem icon="star" label="Succès & Badges" color={Colors.secondary} onPress={() => router.push("/achievements")} />
          <MenuItem icon="message-circle" label="Support" color={Colors.accent} onPress={() => router.push("/support")} />
        </View>

        <Text style={styles.sectionTitle}>Session</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="log-out" label="Se déconnecter" danger onPress={handleLogout} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 16 },
  profileCard: { backgroundColor: Colors.surface, borderRadius: Colors.radiusLg, borderWidth: 1, padding: 20, alignItems: "center", marginBottom: 16 },
  avatarWrapper: { position: "relative", marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarImg: { width: 80, height: 80, borderRadius: 24, borderWidth: 2 },
  avatarText: { fontSize: 30, fontWeight: "900", fontFamily: "Inter_900Black" },
  avatarOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  avatarEditBadge: { position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.surface },
  username: { fontSize: 20, fontWeight: "800", color: Colors.foreground, fontFamily: "Inter_800ExtraBold" },
  email: { fontSize: 13, color: Colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2, marginBottom: 12 },
  rankRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 14 },
  rankBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  rankText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  levelBadge: { backgroundColor: Colors.muted, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  levelText: { color: Colors.foreground, fontSize: 12, fontFamily: "Inter_500Medium" },
  premiumBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.yellow + "18", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20 },
  premiumText: { color: Colors.yellow, fontSize: 12, fontFamily: "Inter_500Medium" },
  xpBarBg: { width: "100%", height: 5, backgroundColor: Colors.muted, borderRadius: 99, overflow: "hidden", marginBottom: 6 },
  xpBarFill: { height: 5, borderRadius: 99, backgroundColor: Colors.primary },
  xpLabel: { fontSize: 12, color: Colors.mutedForeground, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", backgroundColor: Colors.surface, borderRadius: Colors.radius, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 14 },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statValue: { fontSize: 17, fontWeight: "700", color: Colors.foreground, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, color: Colors.mutedForeground, fontFamily: "Inter_400Regular" },
  referralCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.accentDim, borderRadius: Colors.radiusSm, borderWidth: 1, borderColor: Colors.accent + "30", padding: 14, marginBottom: 20 },
  referralLabel: { fontSize: 11, color: Colors.mutedForeground, fontFamily: "Inter_400Regular" },
  referralCode: { fontSize: 18, fontWeight: "900", color: Colors.accent, fontFamily: "Inter_900Black", letterSpacing: 2 },
  referralBonus: { fontSize: 12, color: Colors.success, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: Colors.mutedForeground, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  menuGroup: { backgroundColor: Colors.surface, borderRadius: Colors.radius, borderWidth: 1, borderColor: Colors.border, overflow: "hidden", marginBottom: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14, color: Colors.foreground, fontFamily: "Inter_500Medium" },
  menuRight: { fontSize: 13, color: Colors.mutedForeground, fontFamily: "Inter_400Regular", marginRight: 6 },
});
