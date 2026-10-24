# Production Dockerfile for AuraAudio Dedicated Backend Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for tsc)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL="file:./aura.db"
ENV JWT_SECRET="auraaudio_jwt_secret_key_2026_super_secure_cihuy"

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev && npx prisma generate

# Copy built code from builder
COPY --from=builder /app/dist ./dist

# Create database volume directory
RUN mkdir -p /app/prisma

# Expose port
EXPOSE 4000

# Start server with db push if db not created
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
