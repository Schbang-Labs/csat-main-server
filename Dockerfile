# syntax=docker/dockerfile:1.7

# ============================================================
# Stage 1: install production dependencies
# ============================================================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts

# ============================================================
# Stage 2: runtime image
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

# tini           -> proper PID-1 signal forwarding for graceful shutdown
# mongodb-tools  -> mongodump for the monthly backup cron (Alpine community repo)
RUN apk add --no-cache mongodb-tools tini \
 && mkdir -p /app/logs \
 && chown -R node:node /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

USER node

ENV NODE_ENV=production \
    CONTAINER=true \
    PORT=8080 \
    NODE_OPTIONS="--import /app/src/tracing.js"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
