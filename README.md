# 🚀 Boost Community

Application mobile de croissance TikTok — les créateurs accomplissent des missions (watch, like, comment, follow, share) pour gagner des coins, monter de niveau et grimper dans le classement.

---

## 📱 Stack technique

| Couche | Technologie |
|--------|-------------|
| Mobile | Expo SDK 54, React Native 0.81.5, expo-router v6 |
| Backend | Node.js 24, Express 5, TypeScript 5.9 |
| Base de données | PostgreSQL + Drizzle ORM |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod v4, drizzle-zod |
| API Codegen | Orval (OpenAPI → React Query hooks + Zod validators) |
| Push notifs | Firebase Admin SDK |
| Upload | Cloudinary |
| Monorepo | pnpm workspaces |

---

## 📂 Structure du projet

```
├── artifacts/
│   ├── api-server/              # Serveur Express (backend)
│   │   └── src/routes/          # auth, users, missions, campaigns, coins,
│   │                            # leaderboard, achievements, tickets, referrals…
│   └── boost-community-expo/    # App mobile Expo
│       ├── app/(auth)/          # Login, Register, Forgot password
│       ├── app/(tabs)/          # Dashboard, Missions, Campaigns, Leaderboard, Profile
│       └── app/                 # Achievements, Coins, Support
├── lib/
│   ├── api-spec/openapi.yaml    # Source de vérité du contrat API
│   ├── api-client-react/        # Hooks React Query générés (ne pas éditer)
│   ├── api-zod/                 # Validators Zod générés (ne pas éditer)
│   └── db/src/schema/           # Schéma Drizzle (users, missions, campaigns…)
└── scripts/
    └── src/seed.ts              # Seeder BDD (missions, achievements, campaigns)
```

---

## ✨ Fonctionnalités

- **Authentification** — Inscription / Connexion (email ou username) / Mot de passe oublié
- **Missions** — 5 types : watch, like, comment, follow, share. Missions quotidiennes + permanentes
- **Système de Coins** — Gagner des coins en complétant des missions, historique des transactions
- **Classement** — 6 rangs : Bronze → Silver → Gold → Elite → Demon → Legend
- **Achievements** — Badges débloqués automatiquement selon la progression
- **Campagnes** — Les créateurs publient des campagnes TikTok pour la communauté
- **Système de parrainage** — Code de parrainage unique par utilisateur
- **Tickets de support** — Système de tickets intégré
- **Notifications push** — Firebase (optionnel)
- **Upload d'avatar** — Cloudinary (optionnel)
- **Panel admin** — Gestion des utilisateurs et missions

---

## ⚙️ Variables d'environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | ✅ | Connexion PostgreSQL |
| `SESSION_SECRET` | ✅ | Clé JWT |
| `FIREBASE_PROJECT_ID` | ❌ | Push notifications |
| `FIREBASE_CLIENT_EMAIL` | ❌ | Push notifications |
| `FIREBASE_PRIVATE_KEY` | ❌ | Push notifications |
| `CLOUDINARY_CLOUD_NAME` | ❌ | Upload images |
| `CLOUDINARY_API_KEY` | ❌ | Upload images |
| `CLOUDINARY_API_SECRET` | ❌ | Upload images |
| `ADMIN_USERNAMES` | ❌ | Usernames admins (séparés par virgule) |

---

## 🛠️ Commandes

```bash
# Installer les dépendances
pnpm install

# Lancer le serveur API (port 8080)
pnpm --filter @workspace/api-server run dev

# Pousser le schéma BDD (dev uniquement)
pnpm --filter @workspace/db run push

# Seeder la base de données
pnpm --filter @workspace/scripts run seed

# Régénérer les hooks API depuis l'OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Typecheck complet
pnpm run typecheck
```

---

## 📲 Build Android (APK)

```bash
cd artifacts/boost-community-expo
EXPO_TOKEN=<ton_token> eas build --platform android --profile preview --non-interactive
```

> Le build se fait sur les serveurs Expo (~10-15 min). Tu reçois un lien APK par email.
> Consulte aussi : https://expo.dev

---

## 🏗️ Décisions d'architecture

- **Contract-first** : la spec OpenAPI est la source de vérité ; le codegen produit les hooks React Query et les validators Zod automatiquement.
- **JWT stateless** : pas de session serveur, le token est stocké dans AsyncStorage côté mobile.
- **Monorepo pnpm** : `lib/` pour les packages partagés, `artifacts/` pour les apps déployables.
- **Firebase optionnel** : les push notifications sont désactivées si les variables Firebase sont absentes — l'app fonctionne sans.
- **Cloudinary optionnel** : l'upload d'images est désactivé si les variables Cloudinary sont absentes.

---

## 👤 Auteur

**Sasukeutchi77** — [github.com/Sasukeutchi77](https://github.com/Sasukeutchi77)
