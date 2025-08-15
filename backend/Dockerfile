###############################
# Builder stage
###############################
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install ALL deps (incl. dev) to build TypeScript
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

###############################
# Runtime stage
###############################
FROM node:18-alpine AS runtime

WORKDIR /app

# Copy only package files and install production deps for smaller image
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.production ./ .env.production 2>/dev/null || true

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "dist/index.js"]