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

# ── 6. Hook git post-commit → push automatique ────────────────────────────
echo ""
echo "6. Configuration du push automatique après chaque commit..."

HOOK_FILE=".git/hooks/post-commit"
cat > "$HOOK_FILE" << 'HOOK'
#!/bin/bash
# Push automatique vers GitHub après chaque git commit
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")
echo "🚀 Push automatique vers origin/$BRANCH..."
git push origin "$BRANCH" 2>&1 && echo "✅ Poussé sur GitHub !" || echo "⚠️  Push échoué — faites : git push"
HOOK
chmod +x "$HOOK_FILE"
echo "  ✅ Hook post-commit installé"

# ── 7. Alias git save ──────────────────────────────────────────────────────
echo ""
echo "7. Configuration de l'alias 'git save'..."
git config --global alias.save '!f() { msg=${1:-"update: $(date +\"%Y-%m-%d %H:%M\")\"}; git add -A && git commit -m "$msg" && git push; }; f'
echo "  ✅ Alias 'git save' configuré"

# ── 8. Alias git sync (pull + push) ───────────────────────────────────────
git config --global alias.sync '!git pull --rebase && git push'
echo "  ✅ Alias 'git sync' configuré"

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
echo ""
echo "  Push GitHub :"
echo "  • git save              → ajoute tout + commit + push"
echo "  • git save 'mon message'→ avec message personnalisé"
echo "  • git sync              → pull + push"
echo "  • git commit            → commit seul (push auto via hook)"
echo "=========================================="
echo ""
