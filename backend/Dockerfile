###############################
# Builder stage
###############################
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install ALL deps (incl. dev) to build TypeScript
COPY package*.json ./
# Use npm install to avoid lockfile mismatch errors on first deploy
RUN npm install

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
# Use npm install to avoid lockfile mismatch errors
RUN npm install --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 5000

# Health check: verify the service is responding to health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/v1/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]