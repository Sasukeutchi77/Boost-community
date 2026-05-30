#!/bin/bash
set -e

echo ""
echo "=========================================="
echo "  🚀 Setup Boost Community — Codespaces"
echo "=========================================="

# ── 1. Installer pnpm ──────────────────────────────────────────────────────
echo ""
echo "1. Installation de pnpm..."
npm install -g pnpm@latest
pnpm --version

# ── 2. Installer EAS CLI (pour les builds Expo) ────────────────────────────
echo ""
echo "2. Installation de EAS CLI..."
npm install -g eas-cli expo-cli

# ── 3. Installer les dépendances du monorepo ───────────────────────────────
echo ""
echo "3. Installation des dépendances (pnpm install)..."
pnpm install

# ── 4. Régénérer les hooks API ─────────────────────────────────────────────
echo ""
echo "4. Codegen OpenAPI → React Query hooks..."
pnpm --filter @workspace/api-spec run codegen || echo "  ⚠ Codegen ignoré (spec non modifiée)"

# ── 5. Typecheck ───────────────────────────────────────────────────────────
echo ""
echo "5. Vérification TypeScript..."
pnpm run typecheck || echo "  ⚠ Erreurs TS détectées — vérifiez avec : pnpm run typecheck"

echo ""
echo "=========================================="
echo "  ✅ Setup terminé !"
echo ""
echo "  Commandes disponibles :"
echo "  • API server  → pnpm --filter @workspace/api-server run dev"
echo "  • DB push     → pnpm --filter @workspace/db run push"
echo "  • DB seed     → pnpm --filter @workspace/scripts run seed"
echo "  • Expo        → cd artifacts/boost-community-expo && pnpm run dev"
echo "  • Codegen     → pnpm --filter @workspace/api-spec run codegen"
echo "  • Typecheck   → pnpm run typecheck"
echo "=========================================="
echo ""
