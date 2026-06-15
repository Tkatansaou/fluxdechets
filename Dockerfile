# ─── WasteFlow — Dockerfile (multi-stage) ─────────────────────────────────────
# Build optimisé pour production

# ─── Stage 1 : Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --only=production

# ─── Stage 2 : Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# ─── Stage 3 : Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Copy node_modules for Prisma
COPY --from=deps /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
