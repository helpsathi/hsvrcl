# Base image with Node.js 20 Alpine
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

# Dependencies stage: install dev & prod dependencies for building
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/realtime/package.json apps/realtime/
COPY packages/shared/package.json packages/shared/
RUN npm ci

# Build stage: generate database client and compile codebases
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=packages/shared/prisma/schema.prisma
RUN npm run build --workspaces

# Production stage: copy built output and run with minimal overhead
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Don't run production containers as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 helpsathi

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder --chown=helpsathi:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=helpsathi:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=helpsathi:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=helpsathi:nodejs /app/apps/realtime ./apps/realtime

USER helpsathi

EXPOSE 3000
EXPOSE 4000

ENV PORT=3000
CMD ["npm", "start"]
