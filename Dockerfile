# Multi-stage build for Smart-Watch-Display
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY artifacts/cib-prime ./artifacts/cib-prime
COPY lib ./lib

RUN pnpm install --ignore-scripts

ENV PORT=3000
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

# Stage 3: Production with nginx and node
FROM node:20-alpine AS production

# Install nginx and dumb-init
RUN apk add --no-cache nginx dumb-init

# Create directories
RUN mkdir -p /var/www/html /var/log/nginx /tmp && \
    chown -R nginx:nginx /var/www/html /var/log/nginx

# Copy frontend build
COPY --from=frontend-builder /app/artifacts/cib-prime/dist/public /var/www/html

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy backend
COPY --from=backend-builder /app/artifacts/api-server/dist ./app/dist
COPY --from=backend-builder /app/artifacts/api-server/package.json ./app/
COPY --from=backend-builder /app/node_modules ./app/node_modules

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

RUN chown -R appuser:appgroup /app

USER appuser

# Health check for nginx
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

EXPOSE 3000

# Start services
CMD ["sh", "-c", "nginx & node --enable-source-maps ./dist/index.mjs & wait -n"]
