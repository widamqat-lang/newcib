# Multi-stage build for Smart-Watch-Display
# Stage 1: Build frontend (rebuild at 2026-07-11-1200)
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Timestamp: 2026-07-11-1200 - forcing rebuild
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY artifacts/cib-prime ./artifacts/cib-prime
COPY lib ./lib

RUN pnpm install --ignore-scripts

ENV PORT=3000
ENV BASE_PATH=/
RUN pnpm --filter @workspace/cib-prime run build

# Stage 2: Build backend (rebuild at 2026-07-11-1200)
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Timestamp: 2026-07-11-1200 - forcing rebuild
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY artifacts/api-server ./artifacts/api-server
COPY lib ./lib

RUN pnpm install --ignore-scripts

RUN pnpm --filter @workspace/api-server run build

# Stage 3: Production - serve with Node
FROM node:20-alpine AS production

WORKDIR /app

# Copy frontend build
COPY --from=frontend-builder /app/artifacts/cib-prime/dist ./public

# Copy backend
COPY --from=backend-builder /app/artifacts/api-server/dist ./dist
COPY --from=backend-builder /app/artifacts/api-server/package.json ./
COPY --from=backend-builder /app/node_modules ./node_modules

# Install serve for static files
RUN npm install -g serve

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

EXPOSE 8080

# Start the app - API server will handle routes
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
