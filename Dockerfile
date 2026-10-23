# ============================================================
# DollShop Production Multi-Stage Dockerfile (Step 7.2)
# Next.js 16 Standalone Runner on Node.js 22 Alpine (Non-Root)
# ============================================================

# ------------------------------------------------------------
# Stage 1: Base image
# ------------------------------------------------------------
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ------------------------------------------------------------
# Stage 2: Dependencies
# ------------------------------------------------------------
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------
# Stage 3: Builder
# ------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Отключаем телеметрию Next.js при сборке
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Сборка Next.js в standalone-режиме
RUN npm run build

# ------------------------------------------------------------
# Stage 4: Production Runner (Non-Root UID 1001)
# ------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache curl ca-certificates tzdata

# Установка часового пояса Минска (UTC+3)
ENV TZ=Europe/Minsk
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Безопасность: создание непривилегированного системного пользователя
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем статические ассеты и скомпилированный standalone-сервер
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Директория для локальных загрузок медиа (если не используется S3)
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
