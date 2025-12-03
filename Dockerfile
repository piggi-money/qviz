# ==========================================
# Stage 1: Build Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies first (cache layer)
COPY frontend/package*.json ./
RUN npm ci --silent

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Backend
# ==========================================
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Install dependencies
COPY backend/package*.json ./
RUN npm ci --silent

# Copy source and compile TypeScript
COPY backend/ ./
RUN npm run build

# Remove devDependencies
RUN npm prune --production

# ==========================================
# Stage 3: Runtime
# ==========================================
FROM node:20-alpine AS runtime

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy compiled backend + production node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/dist ./dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/package.json ./

# Copy frontend build
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./public

# Metadata
LABEL org.opencontainers.image.title="Q-Visualizer"
LABEL org.opencontainers.image.description="Redis Queue Monitoring Dashboard"
LABEL org.opencontainers.image.version="1.0.0"

# Switch to non-root user
USER nodejs

# Port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start command
CMD ["node", "dist/index.js"]

