# 🚀 Lancer la compilation Android — Boost Community

## Prérequis
- Node.js 18+ installé
- pnpm installé (`npm install -g pnpm`)
- EAS CLI installé (`npm install -g eas-cli`)
- Un compte Expo (expo.dev)

## Étapes de compilation APK

```bash
# 1. Extraire le ZIP et aller dans le projet Expo
cd artifacts/boost-community-expo

# 2. Installer les dépendances depuis la racine du monorepo
cd ../..
pnpm install

# 3. Se connecter à Expo (token déjà configuré dans app.json)
cd artifacts/boost-community-expo

# 4. Lancer la compilation APK Android
EXPO_TOKEN=<ton_token> eas build --platform android --profile preview --non-interactive

# OU si tu es déjà connecté via eas login :
eas build --platform android --profile preview --non-interactive
```

## Résultat
- EAS Build compile sur les serveurs Expo (~10-15 min)
- Tu reçois un lien de téléchargement de l'APK par email
- Ou consulte https://expo.dev pour télécharger le build

## Project ID EAS
- **ID**: c8284559-a2b7-4883-b3ac-dd6efc0dcfdb
- **Slug**: boost-community-expo
- **Compte**: demon1 (nouveaumc45t@gmail.com)

## Variables d'environnement nécessaires pour le backend
Ajouter dans ton serveur :
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- SESSION_SECRET
- DATABASE_URL
- ADMIN_USERNAMES (comma-separated, ex: "demon1,admin")
