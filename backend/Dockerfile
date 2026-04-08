# ============================================================
#  FounderHub Backend — Dockerfile
#  Multi-stage build: deps → build → production image
# ============================================================

# ── Stage 1: Install dependencies ────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install only production deps first (better layer caching)
COPY package*.json ./
RUN npm install --only=production && cp -r node_modules /tmp/prod_modules

# Install all deps (including dev) for any build steps
RUN npm install


# ── Stage 2: Production image ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001

# Copy production node_modules from deps stage
COPY --from=deps /tmp/prod_modules ./node_modules

# Copy application source
COPY --chown=nodeapp:nodejs . .

# Create uploads directory (used in dev; prod uses Cloudinary)
RUN mkdir -p uploads && chown nodeapp:nodejs uploads

USER nodeapp

EXPOSE 5000

ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "server.js"]