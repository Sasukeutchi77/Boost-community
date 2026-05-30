import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const registerMutation = useRegister({
    mutation: {
      onSuccess: async (data) => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await login((data as any).token);
        router.replace("/(tabs)");
      },
      onError: (err: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const msg = err?.response?.data?.message;
        setError(msg ?? "Erreur lors de l'inscription. Vérifie ta connexion.");
      },
    },
  });

  const handleRegister = () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Tous les champs sont requis");
      return;
    }
    if (username.trim().length < 3) {
      setError("Le nom d'utilisateur doit faire au moins 3 caractères");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      setError("Le nom d'utilisateur ne peut contenir que des lettres, chiffres, _ et .");
      return;
    }
    if (!email.trim().includes("@")) {
      setError("Adresse email invalide");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères");
      return;
    }
    setError("");
    registerMutation.mutate({
      registerInput: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        referralCode: referralCode.trim().toUpperCase() || undefined,
      },
    });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top + 40;

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 24 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bottomOffset={16}
    >
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Feather name="zap" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Rejoindre la communauté</Text>
        <Text style={styles.subtitle}>Gratuit · Sans carte bancaire</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nom d'utilisateur</Text>
        <View style={styles.inputWrapper}>
          <Feather name="user" size={18} color={Colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="ton_username"
            placeholderTextColor={Colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Email</Text>
        <View style={styles.inputWrapper}>
          <Feather name="mail" size={18} color={Colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="toi@email.com"
            placeholderTextColor={Colors.mutedForeground}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Mot de passe</Text>
        <View style={styles.inputWrapper}>
          <Feather name="lock" size={18} color={Colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 6 caractères"
            placeholderTextColor={Colors.mutedForeground}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={Colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Code de parrainage optionnel */}
        <TouchableOpacity style={styles.referralToggle} onPress={() => setShowReferral(v => !v)} activeOpacity={0.7}>
          <Feather name="user-plus" size={14} color={Colors.accent} />
          <Text style={styles.referralToggleText}>{showReferral ? "Masquer" : "J'ai un code de parrainage"}</Text>
        </TouchableOpacity>

        {showReferral && (
          <View style={[styles.inputWrapper, { marginTop: 8 }]}>
            <Feather name="gift" size={18} color={Colors.accent} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={referralCode}
              onChangeText={setReferralCode}
              placeholder="CODE8 chiffres"
              placeholderTextColor={Colors.mutedForeground}
              autoCapitalize="characters"
              maxLength={12}
            />
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, registerMutation.isPending && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={registerMutation.isPending}
          activeOpacity={0.85}
        >
          {registerMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="user-plus" size={18} color="#fff" />
              <Text style={styles.btnText}>Créer mon compte</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Déjà un compte ? </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Se connecter</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 36 },
  logoBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.primaryDim, borderWidth: 1, borderColor: Colors.primary + "40",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "900", color: Colors.foreground, fontFamily: "Inter_900Black", textAlign: "center" },
  subtitle: { fontSize: 14, color: Colors.mutedForeground, marginTop: 4, fontFamily: "Inter_400Regular" },
  form: {},
  label: { fontSize: 13, fontWeight: "600", color: Colors.foreground, marginBottom: 8, fontFamily: "Inter_600SemiBold" },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface, borderRadius: Colors.radiusSm,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.foreground, fontSize: 15, fontFamily: "Inter_400Regular" },
  eyeBtn: { padding: 4 },
  referralToggle: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  referralToggleText: { fontSize: 13, color: Colors.accent, fontFamily: "Inter_500Medium" },
  errorText: { color: Colors.destructive, fontSize: 13, marginTop: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  btn: {
    marginTop: 24, backgroundColor: Colors.primary, borderRadius: Colors.radius,
    height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 32 },
  footerText: { color: Colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
  footerLink: { color: Colors.primary, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
