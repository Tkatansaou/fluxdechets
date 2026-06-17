#!/bin/bash
# ─── WasteFlow — Vercel Build Script ──────────────────────────────────────────
# Exécute Prisma Generate puis Next Build
# requis pour Vercel car Prisma Client doit être régénéré dans l'environnement
# de build serverless

set -e

echo "→ Generating Prisma Client..."
npx prisma generate

echo "→ Running Next.js build..."
npm run build

echo "✓ Build complete"
