# Multi-stage build for Smart-Watch-Display
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY artifacts/cib-prime ./artifacts/cib-prime
COPY lib ./lib

RUN pnpm install --ignore-scripts

ENV PORT=3001
ENV BASE_PATH=/
RUN pnpm --filter @workspace/cib-prime run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY artifacts/api-server ./artifacts/api-server
COPY lib ./lib

RUN pnpm install --ignore-scripts

RUN pnpm --filter @workspace/api-server run build

# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy frontend build
COPY --from=frontend-builder /app/artifacts/cib-prime/dist ./public

# Copy backend
COPY --from=backend-builder /app/artifacts/api-server/dist ./dist
COPY --from=backend-builder /app/artifacts/api-server/package.json ./
COPY --from=backend-builder /app/node_modules ./node_modules

EXPOSE 3001

# Health check - Railway uses /up
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/up || exit 1

# Start the app
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
