FROM node:20-alpine AS builder

WORKDIR /app

# Copy API package files directly to root of WORKDIR
COPY apps/api/package*.json ./
COPY apps/api/prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy API source code
COPY apps/api/ .

# Generate Prisma Client
RUN npx prisma generate

# Build the API
RUN npm run build

# Production image
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

WORKDIR /app

# Set ENV for Playwright to work in Docker
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
# Copy only production dependencies if possible, or copy all and prune. 
# For safety here we re-install production deps to ensure architecture match (since builder was alpine)
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Install Chromium specifically
RUN npx playwright install chromium

EXPOSE 3333

# Start the application
CMD ["node", "dist/src/main"]
