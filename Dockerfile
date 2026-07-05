# Multi-stage build for the replay-tracking Fastify API.
# Build:  docker build -t replay-tracking .
# Run:    docker run -p 3000:3000 --env-file .env replay-tracking

# ---------- Stage 1: build (compile contracts + node_modules) ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install build deps for any native modules (none today, but defensive).
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .
# Compile the Solidity contracts (artifact is needed by the runtime).
RUN npm run compile

# Prune dev dependencies for the runtime image.
RUN npm prune --omit=dev

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

# Drop privileges.
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /app /app

USER app
EXPOSE 3000
ENV NODE_ENV=production

# Health check uses the /health endpoint added in v2.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "index.js"]
