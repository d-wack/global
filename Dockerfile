# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-alpine

# --- Base image with pnpm enabled via corepack ---
FROM node:${NODE_VERSION} AS base
# libc6-compat helps native modules (e.g. sharp) run on Alpine/musl.
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

# --- Install dependencies (cached layer) ---
FROM base AS deps
# HUSKY=0 skips git-hook installation, which has no .git in the image.
ENV HUSKY=0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- Build the app (produces .next/standalone) ---
FROM base AS builder
ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# --- Minimal runtime image ---
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a dedicated non-root user.
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001 -G nodejs

# Standalone output plus the static assets it does not bundle.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
