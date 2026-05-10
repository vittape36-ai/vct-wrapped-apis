FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy source
COPY src/ ./src/

# Non-root user
RUN addgroup -g 1001 -S vct && \
    adduser -S vct -u 1001 -G vct
USER vct

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "src/server.js"]
