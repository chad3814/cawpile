# Dockerfile for Remotion video generation application
# Based on Remotion's official Docker recommendations
# https://www.remotion.dev/docs/lambda/runtime

FROM node:22-bookworm-slim

# Install Chrome Headless Shell dependencies and fonts
# These are required for Remotion to render videos using Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libgbm-dev \
    libasound2 \
    libxrandr2 \
    libxkbcommon-dev \
    libxfixes3 \
    libxcomposite1 \
    libxdamage1 \
    libatk-bridge2.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libcups2 \
    curl \
    unzip \
    fontconfig \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Noto Color Emoji font for star rating display
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/* \
    && fc-cache -fv

# Set working directory
WORKDIR /app

# Copy package files first for layer caching optimization
COPY package.json package-lock.json ./

# Install all dependencies (tsx is in devDependencies but required to run server)
RUN npm ci

# Copy application source files
COPY src/ ./src/
COPY server/ ./server/
COPY remotion.config.ts ./
COPY tsconfig.json ./

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create output directory with appropriate permissions
RUN mkdir -p /app/out && chmod 755 /app/out

# Install Chrome Headless Shell for Remotion rendering
RUN npx remotion browser ensure

# Set production environment
ENV NODE_ENV=production

# Expose the Express server port
EXPOSE 3001

# Health check using curl to /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use entrypoint script for AWS credential handling
ENTRYPOINT ["./docker-entrypoint.sh"]
