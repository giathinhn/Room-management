FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

CMD ["sh", "-c", "npx prisma generate && node src/server.js"]
