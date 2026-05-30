import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, coinTransactionsTable, activityFeedTable } from "@workspace/db";
import { eq, or, sql } from "drizzle-orm";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middlewares/auth.js";
import { sendPushNotification } from "../lib/firebase.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) {
    res.status(400).json({ message: "Identifiant et mot de passe requis" });
    return;
  }

  const identifier = username.trim().toLowerCase();

  // ✅ Accepte email OU username
  const users = await db
    .select()
    .from(usersTable)
    .where(
      or(
        eq(sql`LOWER(${usersTable.username})`, identifier),
        eq(sql`LOWER(${usersTable.email})`, identifier)
      )
    )
    .limit(1);

  const user = users[0];
  if (!user) {
    res.status(401).json({ message: "Identifiants incorrects" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Identifiants incorrects" });
    return;
  }

  const token = signToken({ userId: user.id, username: user.username });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.post("/auth/register", async (req, res) => {
  const { username, email, password, referralCode } = req.body as {
    username: string; email: string; password: string; referralCode?: string;
  };

  if (!username?.trim() || !email?.trim() || !password?.trim()) {
    res.status(400).json({ message: "Tous les champs sont requis" });
    return;
  }
  if (username.trim().length < 3) {
    res.status(400).json({ message: "Le nom d'utilisateur doit faire au moins 3 caractères" });
    return;
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
    res.status(400).json({ message: "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et points" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ message: "Le mot de passe doit faire au moins 6 caractères" });
    return;
  }

  const usernameClean = username.trim();
  const emailClean = email.trim().toLowerCase();

  // Check existing username
  const existingByUsername = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(sql`LOWER(${usersTable.username})`, usernameClean.toLowerCase()))
    .limit(1);
  if (existingByUsername.length > 0) {
    res.status(409).json({ message: "Ce nom d'utilisateur est déjà pris" });
    return;
  }

  // Check existing email
  const existingByEmail = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(sql`LOWER(${usersTable.email})`, emailClean))
    .limit(1);
  if (existingByEmail.length > 0) {
    res.status(409).json({ message: "Cet email est déjà associé à un compte" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();

  let referredById: number | undefined;
  if (referralCode?.trim()) {
    const referrer = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.referralCode, referralCode.trim().toUpperCase()))
      .limit(1);
    if (referrer[0]) referredById = referrer[0].id;
  }

  const [newUser] = await db
    .insert(usersTable)
    .values({ username: usernameClean, email: emailClean, passwordHash, referralCode: code, referredBy: referredById, coins: 100 })
    .returning();

  // ✅ Récompense automatique du parrain
  if (referredById) {
    const REFERRAL_BONUS = 50;
    await db.update(usersTable).set({ coins: sql`coins + ${REFERRAL_BONUS}` }).where(eq(usersTable.id, referredById));
    await db.insert(coinTransactionsTable).values({
      userId: referredById, amount: REFERRAL_BONUS, type: "bonus",
      description: `Parrainage : ${usernameClean} a rejoint !`, referenceId: newUser.id, referenceType: "referral",
    });
    await db.insert(activityFeedTable).values({
      userId: referredById, type: "referral_reward",
      description: `+${REFERRAL_BONUS} coins : ${usernameClean} a rejoint grâce à ton code !`,
    });
    const referrers = await db.select().from(usersTable).where(eq(usersTable.id, referredById)).limit(1);
    const fcmToken = (referrers[0] as any)?.fcmToken;
    if (fcmToken) {
      await sendPushNotification(fcmToken, "Nouveau filleul ! 🎉", `${usernameClean} a rejoint. +${REFERRAL_BONUS} coins !`, { type: "referral_reward" });
    }
  }

  const token = signToken({ userId: newUser.id, username: newUser.username });
  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ token, user: safeUser });
});

router.post("/auth/forgot-password", async (_req, res) => {
  res.json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
});

router.post("/auth/logout", requireAuth, (_req, res) => {
  res.json({ message: "Déconnecté" });
});

export default router;
