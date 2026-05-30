# 🚀 Boost Community — Guide GitHub Codespaces

## Démarrage rapide

1. Sur GitHub → bouton vert **`< > Code`** → onglet **Codespaces** → **Create codespace on main**
2. Attendre ~2-3 min (installation automatique)
3. Le projet est prêt !

## Variables d'environnement requises

> ⚠️ À configurer dans GitHub → **Settings** du repo → **Secrets and variables** → **Codespaces**

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | ✅ | Connexion PostgreSQL |
| `SESSION_SECRET` | ✅ | Clé JWT (min. 32 caractères) |
| `FIREBASE_PROJECT_ID` | ❌ | Push notifications |
| `FIREBASE_CLIENT_EMAIL` | ❌ | Push notifications |
| `FIREBASE_PRIVATE_KEY` | ❌ | Push notifications |
| `CLOUDINARY_CLOUD_NAME` | ❌ | Upload images |
| `CLOUDINARY_API_KEY` | ❌ | Upload images |
| `CLOUDINARY_API_SECRET` | ❌ | Upload images |

## Commandes principales

```bash
# Lancer le serveur API (port 8080)
pnpm --filter @workspace/api-server run dev

# Pousser le schéma BDD
pnpm --filter @workspace/db run push

# Seeder la base de données
pnpm --filter @workspace/scripts run seed

# Lancer l'app Expo (web)
cd artifacts/boost-community-expo
pnpm run dev

# Régénérer les hooks API
pnpm --filter @workspace/api-spec run codegen

# Vérification TypeScript
pnpm run typecheck
```

## Structure du projet

```
├── artifacts/
│   ├── api-server/              # Backend Express (port 8080)
│   └── boost-community-expo/   # App mobile Expo
├── lib/
│   ├── api-spec/openapi.yaml   # Contrat API (source de vérité)
│   ├── api-client-react/       # Hooks générés (ne pas éditer)
│   ├── api-zod/                # Validators générés (ne pas éditer)
│   └── db/                     # Schéma Drizzle
└── scripts/                    # Seed & utilitaires
```

## Workflow recommandé

```bash
# Créer une nouvelle branche pour votre feature
git checkout -b feature/ma-fonctionnalite

# Faire vos modifications...

# Committer et pousser
git add .
git commit -m "feat: description de la feature"
git push origin feature/ma-fonctionnalite

# Puis créer une Pull Request sur GitHub
```
