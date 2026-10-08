# ============================================================
#  Free Fire Top-Up API — Dockerfile
#  Base: Playwright official image (Chromium + deps included)
# ============================================================

FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# Set working directory
WORKDIR /app

# Set Node environment
ENV NODE_ENV=production
ENV PORT=3000
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Copy package files first (better caching)
COPY package*.json ./

# Install production dependencies
# --omit=dev        → skip devDependencies
# --no-audit        → skip security audit (faster)
# --no-fund         → skip funding message
# --ignore-scripts  → skip postinstall (Playwright already in base image)
RUN npm install --omit=dev --no-audit --no-fund --ignore-scripts

# Copy application source
COPY server.js ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start server
CMD ["node", "server.js"]
