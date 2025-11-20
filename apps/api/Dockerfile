FROM mcr.microsoft.com/playwright:v1.56.1-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose API port
EXPOSE 3000

# Copy start script
COPY start.sh .
RUN chmod +x start.sh

# Start the application
CMD ["./start.sh"]
