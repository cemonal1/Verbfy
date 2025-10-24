FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve globally to serve static files
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start the application by serving the static files
CMD ["serve", "-s", "out", "-l", "3000"]