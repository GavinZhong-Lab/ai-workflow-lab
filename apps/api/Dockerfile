# Stage 1: Prune monorepo
FROM node:20-alpine AS pruner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY . .
RUN pnpm turbo prune --scope=@saas/api --docker

# Stage 2: Build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml .
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@saas/api

# Generate Prisma client for production
WORKDIR /app/apps/api
RUN npx prisma generate

# Stage 3: Production
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser

WORKDIR /app

COPY --from=builder --chown=appuser:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/apps/api/package.json ./
COPY --from=builder --chown=appuser:nodejs /app/apps/api/prisma ./prisma
COPY --from=builder --chown=appuser:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/packages/shared/node_modules ./packages/shared/node_modules

USER appuser
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
