# syntax=docker/dockerfile:1
# Production image. Local development runs Next.js natively (`npm run dev`)
# with only PostgreSQL in Docker Compose — this file is NOT used for dev.
#
# On every container start, `prisma migrate deploy` is applied before the
# server boots (idempotent: only pending migrations run).

# ---- deps: install exact dependencies from the lockfile ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: generate Prisma client and build the standalone server ----
FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public URL for social-image links on statically generated pages.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
# Build-only placeholders (not secrets, never reach the runtime image):
# prisma.config.ts needs DATABASE_URL to be defined even though `generate` never
# connects, and Better Auth refuses its default secret while Next collects page
# data. The real values come from the Dokploy environment at runtime.
ENV BUILD_DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN DATABASE_URL="$BUILD_DATABASE_URL" npx prisma generate
RUN DATABASE_URL="$BUILD_DATABASE_URL" BETTER_AUTH_SECRET="build-only-placeholder-not-used-at-runtime" npm run build

# ---- runner: minimal runtime, non-root ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    HOME=/home/nextjs

# openssl: required by the Prisma schema engine on Alpine.
RUN apk add --no-cache openssl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001 -G nodejs \
    && mkdir -p /home/nextjs /migrate \
    && chown -R nextjs:nodejs /home/nextjs /migrate

# App (standalone server)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migration toolkit, kept in /migrate so it never mixes with the standalone
# node_modules. Uses the full dependency set so prisma.config.ts resolves
# any import it needs (prisma/config, dotenv, ...).
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules /migrate/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json /migrate/package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma /migrate/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts /migrate/prisma.config.ts

# Entrypoint: migrate, then start the server. If the migration fails the
# container exits, so the problem is visible in the Dokploy logs.
RUN cat > /app/docker-entrypoint.sh <<'EOF' && chmod +x /app/docker-entrypoint.sh
#!/bin/sh
set -e
echo "[entrypoint] Applying database migrations..."
cd /migrate
node node_modules/prisma/build/index.js migrate deploy
echo "[entrypoint] Migrations done. Starting server..."
cd /app
exec node server.js
EOF

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/api/health" || exit 1
CMD ["/app/docker-entrypoint.sh"]