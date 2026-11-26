import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Gift, Lock, Mail, User, UserPlus, Zap } from "lucide-react";
import { apiFetch, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { User as UserType } from "../types";

type AuthMode = "login" | "register" | "forgot";

export function AuthScreen() {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");

  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const resetMessages = () => {
    setError("");
    setForgotSent(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Remplis tous les champs");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: UserType }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: identifier.trim(), password }),
      });
      login(data.token, data.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: UserType }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: "creator_demo", password: "demo1234" }),
      });
      login(data.token, data.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion démo");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: UserType }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          referralCode: referralCode.trim().toUpperCase() || undefined,
        }),
      });
      login(data.token, data.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Renseigne ton adresse email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setForgotSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur, réessaie plus tard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090914] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => {
              resetMessages();
              setMode("login");
            }}
            className="mb-6 inline-flex items-center gap-2 text-sm text-[#8080a0] hover:text-[#f8f8fc] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        )}

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/40 flex items-center justify-center mb-4 shadow-lg shadow-[#8b5cf6]/20">
            {mode === "forgot" ? (
              <Mail className="w-7 h-7 text-[#8b5cf6]" />
            ) : (
              <Zap className="w-8 h-8 text-[#8b5cf6]" />
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#f8f8fc]">
            {mode === "login" && "Boost Community"}
            {mode === "register" && "Rejoindre la communauté"}
            {mode === "forgot" && "Mot de passe oublié ?"}
          </h1>
          <p className="text-sm text-[#8080a0] mt-1">
            {mode === "login" && "Grandis sur TikTok — vraiment."}
            {mode === "register" && "Gratuit · 100 coins offerts à l'inscription"}
            {mode === "forgot" && "Renseigne ton email pour recevoir un lien de réinitialisation."}
          </p>
        </div>

        <div className="bg-[#0f0f1a] border border-[#1e1e33] rounded-3xl p-6 shadow-2xl">
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#f8f8fc] mb-2">
                  Email ou nom d'utilisateur
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-[#8080a0] absolute left-3.5" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="email@exemple.com ou ton_username"
                    className="w-full bg-[#090914] border border-[#1e1e33] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f8f8fc] placeholder-[#8080a0]/70 focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#f8f8fc] mb-2">
                  Mot de passe
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#8080a0] absolute left-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#090914] border border-[#1e1e33] rounded-xl pl-10 pr-10 py-3 text-sm text-[#f8f8fc] placeholder-[#8080a0]/70 focus:outline-none focus:border-[#8b5cf6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 text-[#8080a0] hover:text-[#f8f8fc] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setMode("forgot");
                    }}
                    className="text-xs font-medium text-[#8b5cf6] hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-[#ef4444] text-center bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl py-2 px-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#8b5cf6]/30 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                {loading ? "Connexion..." : "Se connecter"}
              </button>

              <div className="relative py-2 flex items-center">
                <div className="flex-grow border-t border-[#1e1e33]" />
                <span className="px-3 text-[11px] uppercase tracking-wider text-[#8080a0]">ou</span>
                <div className="flex-grow border-t border-[#1e1e33]" />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleDemoLogin}
                className="w-full bg-[#1a1a2e] hover:bg-[#23233d] border border-[#2d2d4a] text-[#f8f8fc] font-semibold text-sm py-3 rounded-2xl transition-colors cursor-pointer"
              >
                Accès rapide compte démo (@creator_demo)
              </button>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#f8f8fc] mb-2">
                  Nom d'utilisateur
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-[#8080a0] absolute left-3.5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ton_username"
                    className="w-full bg-[#090914] border border-[#1e1e33] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f8f8fc] placeholder-[#8080a0]/70 focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#f8f8fc] mb-2">Email</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#8080a0] absolute left-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="toi@email.com"
                    className="w-full bg-[#090914] border border-[#1e1e33] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f8f8fc] placeholder-[#8080a0]/70 focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#f8f8fc] mb-2">
                  Mot de passe
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#8080a0] absolute left-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 caractères"
                    className="w-full bg-[#090914] border border-[#1e1e33] rounded-xl pl-10 pr-10 py-3 text-sm text-[#f8f8fc] placeholder-[#8080a0]/70 focus:outline-none focus:border-[#8b5cf6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 text-[#8080a0] hover:text-[#f8f8fc] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowReferral((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#22d3ee] hover:underline cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {showReferral ? "Masquer le code parrainage" : "J'ai un code de parrainage (ex: BOOST777)"}
                </button>
                {showReferral && (
                  <div className="relative flex items-center mt-2">
                    <Gift className="w-4 h-4 text-[#22d3ee] absolute left-3.5" />
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      maxLength={12}
                      placeholder="CODE PARRAIN"
                      className="w-full bg-[#090914] border border-[#1e1e33] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f8f8fc] uppercase tracking-wider placeholder-[#8080a0]/70 focus:outline-none focus:border-[#22d3ee]"
                    />
                  </div>
                )}
              </div>

              {error && (
                <p className="text-xs text-[#ef4444] text-center bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl py-2 px-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#8b5cf6]/30 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? "Création..." : "Créer mon compte"}
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <>
              {forgotSent ? (
                <div className="text-center py-4 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-[#22c55e] mx-auto" />
                  <p className="text-sm text-[#f8f8fc] font-medium">
                    Email envoyé ! Vérifie ta boîte mail.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setMode("login");
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#8b5cf6]/15 text-[#8b5cf6] text-sm font-semibold hover:bg-[#8b5cf6]/25 cursor-pointer"
                  >
                    Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#8080a0] absolute left-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="toi@email.com"
                      className="w-full bg-[#090914] border border-[#1e1e33] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f8f8fc] placeholder-[#8080a0]/70 focus:outline-none focus:border-[#8b5cf6]"
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-[#ef4444] text-center">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer"
                  >
                    {loading ? "Envoi..." : "Envoyer le lien"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {mode !== "forgot" && (
          <p className="text-center text-sm text-[#8080a0] mt-6">
            {mode === "login" ? (
              <>
                Pas encore de compte ?{" "}
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode("register");
                  }}
                  className="text-[#8b5cf6] font-semibold hover:underline cursor-pointer"
                >
                  Rejoindre gratuitement
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode("login");
                  }}
                  className="text-[#8b5cf6] font-semibold hover:underline cursor-pointer"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
