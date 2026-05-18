# Stage 1: Build
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl openssl-dev \
  && corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY .npmrc pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/tsconfig.json apps/api/tsconfig.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/shared/tsconfig.json packages/shared/tsconfig.json

RUN pnpm install --no-frozen-lockfile

COPY apps/api/src apps/api/src
COPY apps/api/prisma apps/api/prisma
COPY packages/shared/src packages/shared/src

RUN cd apps/api && npx prisma generate
RUN pnpm turbo run build --filter=@saas/api

# Stage 2: Production
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl openssl-dev \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser \
  && npm install -g prisma@5 \
  && mkdir -p /home/appuser/.cache/prisma \
  && chown -R appuser:nodejs /usr/local/lib/node_modules/prisma /home/appuser/.cache

WORKDIR /app

COPY --from=builder --chown=appuser:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/apps/api/package.json ./
COPY --from=builder --chown=appuser:nodejs /app/apps/api/prisma ./prisma
COPY --from=builder --chown=appuser:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules

USER appuser
EXPOSE 4000

CMD ["sh", "-c", "prisma migrate deploy && node dist/index.js"]
