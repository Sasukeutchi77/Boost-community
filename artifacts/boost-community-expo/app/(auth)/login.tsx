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
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await login((data as any).token);
        router.replace("/(tabs)");
      },
      onError: (err: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const msg = err?.response?.data?.message;
        setError(msg ?? "Identifiants incorrects");
      },
    },
  });

  const handleLogin = () => {
    if (!identifier.trim() || !password.trim()) {
      setError("Remplis tous les champs");
      return;
    }
    setError("");
    // Le backend accepte email OU username dans le champ "username"
    loginMutation.mutate({ loginInput: { username: identifier.trim(), password } });
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
        <Text style={styles.title}>Boost Community</Text>
        <Text style={styles.subtitle}>Grandis sur TikTok — vraiment.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email ou nom d'utilisateur</Text>
        <View style={styles.inputWrapper}>
          <Feather name="user" size={18} color={Colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="email@exemple.com ou ton_username"
            placeholderTextColor={Colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
          />
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Mot de passe</Text>
        <View style={styles.inputWrapper}>
          <Feather name="lock" size={18} color={Colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={Colors.mutedForeground}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={Colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <Link href="/(auth)/forgot-password" asChild>
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </Link>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.loginBtn, loginMutation.isPending && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loginMutation.isPending}
          activeOpacity={0.85}
        >
          {loginMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="zap" size={18} color="#fff" />
              <Text style={styles.loginBtnText}>Se connecter</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Pas encore de compte ? </Text>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Rejoindre gratuitement</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  logoBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.primaryDim, borderWidth: 1, borderColor: Colors.primary + "40",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "900", color: Colors.foreground, fontFamily: "Inter_900Black", letterSpacing: 1 },
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
  forgotBtn: { alignSelf: "flex-end", marginTop: 10, marginBottom: 4 },
  forgotText: { fontSize: 13, color: Colors.primary, fontFamily: "Inter_500Medium" },
  errorText: { color: Colors.destructive, fontSize: 13, marginTop: 8, fontFamily: "Inter_400Regular", textAlign: "center" },
  loginBtn: {
    marginTop: 24, backgroundColor: Colors.primary, borderRadius: Colors.radius,
    height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 32 },
  footerText: { color: Colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
  footerLink: { color: Colors.primary, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
