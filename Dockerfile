# syntax=docker/dockerfile:1
# Production image. Local development runs Next.js natively (`npm run dev`)
# with only PostgreSQL in Docker Compose — this file is NOT used for dev.

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
    HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
