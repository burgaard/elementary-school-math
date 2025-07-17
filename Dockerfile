# Use the official Node.js runtime as the base image
FROM node:24-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY app/ ./app/
COPY prisma/ ./prisma/
COPY public/ ./public/
COPY package*.json ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:24-alpine AS production

# Install sqlite3 for runtime
RUN apk add --no-cache sqlite

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S remix -u 1001

# Set working directory
WORKDIR /app

COPY ./run.sh .

# Copy built application from builder stage
COPY --from=base --chown=remix:nodejs /app/build ./build
COPY --from=base --chown=remix:nodejs /app/public ./public
COPY --from=base --chown=remix:nodejs /app/package*.json ./
COPY --from=base --chown=remix:nodejs /app/prisma ./prisma

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Create database directory and set permissions
RUN mkdir -p /app/data && chown -R remix:nodejs /app/data

# Switch to non-root user
USER remix

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:/app/data/production.db"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["./run.sh"]
