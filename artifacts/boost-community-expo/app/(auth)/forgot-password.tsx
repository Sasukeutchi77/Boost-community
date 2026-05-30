import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useForgotPassword } from "@workspace/api-client-react";
import Colors from "@/constants/colors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const mutation = useForgotPassword({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSent(true);
      },
      onError: (err: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(err?.response?.data?.message ?? "Erreur, réessaie plus tard");
      },
    },
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top + 20;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 24;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={22} color={Colors.foreground} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Feather name="mail" size={28} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Mot de passe oublié ?</Text>
        <Text style={styles.subtitle}>Renseigne ton email pour recevoir un lien de réinitialisation.</Text>

        {!sent ? (
          <>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={18} color={Colors.mutedForeground} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="toi@email.com"
                placeholderTextColor={Colors.mutedForeground}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={() => mutation.mutate({ forgotPasswordBody: { email: email.trim() } })}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.btn, mutation.isPending && { opacity: 0.6 }]}
              onPress={() => mutation.mutate({ forgotPasswordBody: { email: email.trim() } })}
              disabled={mutation.isPending}
              activeOpacity={0.85}
            >
              {mutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Envoyer le lien</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successBox}>
            <Feather name="check-circle" size={44} color={Colors.success} />
            <Text style={styles.successText}>Email envoyé ! Vérifie ta boîte mail.</Text>
            <TouchableOpacity style={styles.backToLoginBtn} onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.backToLoginText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 24 },
  backBtn: { width: 44, height: 44, justifyContent: "center" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 60 },
  iconBox: { width: 68, height: 68, borderRadius: 20, backgroundColor: Colors.primaryDim, borderWidth: 1, borderColor: `${Colors.primary}40`, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "800", color: Colors.foreground, fontFamily: "Inter_800ExtraBold", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 28 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Colors.radiusSm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, height: 52, width: "100%", marginBottom: 8 },
  input: { flex: 1, color: Colors.foreground, fontSize: 15, fontFamily: "Inter_400Regular" },
  errorText: { color: Colors.destructive, fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8 },
  btn: { marginTop: 16, backgroundColor: Colors.primary, borderRadius: Colors.radius, height: 54, width: "100%", alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  successBox: { alignItems: "center", gap: 14 },
  successText: { fontSize: 16, color: Colors.foreground, fontFamily: "Inter_500Medium", textAlign: "center" },
  backToLoginBtn: { marginTop: 4, backgroundColor: Colors.primaryDim, borderRadius: Colors.radius, paddingHorizontal: 24, paddingVertical: 12 },
  backToLoginText: { color: Colors.primary, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
