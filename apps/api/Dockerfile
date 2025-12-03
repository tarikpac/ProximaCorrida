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
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3333

# Start the application
CMD ["node", "dist/src/main"]
