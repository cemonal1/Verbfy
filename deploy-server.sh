#!/bin/bash

# Verbfy Server Deployment Script
# This script should be run on the remote server (46.62.161.121)

set -e

echo "🚀 Starting Verbfy deployment on server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system
print_info "Updating system packages..."
apt update && apt upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    print_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    print_info "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install Git if not installed
if ! command -v git &> /dev/null; then
    print_info "Installing Git..."
    apt install git -y
fi

# Create project directory
PROJECT_DIR="/opt/verbfy"
print_info "Setting up project directory: $PROJECT_DIR"

if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # Clone repository
    print_info "Cloning Verbfy repository..."
    git clone https://github.com/cemon/Verbfy.git .
else
    cd "$PROJECT_DIR"
    print_info "Updating existing repository..."
    git pull origin main
fi

# Create environment files
print_info "Setting up environment files..."

# Backend environment
cat > backend/.env.production << EOF
# Production Environment Variables for Verbfy Backend
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://Verbfy:VerbfyDataBack@verbfy.kxzpcit.mongodb.net/verbfy?retryWrites=true&w=majority&appName=Verbfy
JWT_SECRET=ddb2070e412a4e227a233c3ed275d1cc6603ce9f9a0bfda81ecbbbbab81fd491
JWT_REFRESH_SECRET=ddb2070e412a4e227a233c3ed275d1cc6603ce9f9a0bfda81ecbbbbab81fd491_refresh
FRONTEND_URL=http://46.62.161.121:3000
CORS_ORIGIN=http://46.62.161.121:3000

# LiveKit Configuration
LIVEKIT_CLOUD_API_KEY=uc4eRZW1iYWcX2UXeoQ/v1JJ/ackt/qelbFiatS/WwM=
LIVEKIT_CLOUD_API_SECRET=1M2k3w3MV/PMZIvB2tANCZ0ZXcw93hhkV4N7eyW+QNQ=
LIVEKIT_CLOUD_URL=ws://46.62.161.121:7880

# Self-Hosted LiveKit Configuration
LIVEKIT_SELF_API_KEY=dev-api-key
LIVEKIT_SELF_API_SECRET=dev-api-secret
LIVEKIT_SELF_URL=ws://46.62.161.121:7880

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security Configuration
SESSION_SECRET=verbfy-session-secret-2024

# Logging Configuration
LOG_LEVEL=info
EOF

# Frontend environment
cat > verbfy-app/.env.production << EOF
# Production Environment Variables for Verbfy Frontend
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://46.62.161.121:5000
NEXT_PUBLIC_LIVEKIT_URL=ws://46.62.161.121:7880
NEXT_PUBLIC_LIVEKIT_CLOUD_URL=ws://46.62.161.121:7880
NEXT_PUBLIC_APP_URL=http://46.62.161.121:3000
EOF

# Create root .env file
cat > .env << EOF
NODE_ENV=production
EOF

print_success "Environment files created successfully"

# Build and start services
print_info "Building and starting Docker services..."
docker-compose -f docker-compose.production.yml down --remove-orphans
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to start
print_info "Waiting for services to start..."
sleep 30

# Check service status
print_info "Checking service status..."
docker-compose -f docker-compose.production.yml ps

# Test backend health
print_info "Testing backend health..."
if curl -f http://localhost:5000/api/health; then
    print_success "Backend is healthy!"
else
    print_warning "Backend health check failed, checking logs..."
    docker-compose -f docker-compose.production.yml logs verbfy-backend
fi

# Test frontend
print_info "Testing frontend..."
if curl -f http://localhost:3000; then
    print_success "Frontend is accessible!"
else
    print_warning "Frontend check failed, checking logs..."
    docker-compose -f docker-compose.production.yml logs verbfy-frontend
fi

# Display access information
echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.production.yml ps
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://46.62.161.121:3000"
echo "   Backend API: http://46.62.161.121:5000"
echo "   Health Check: http://46.62.161.121:5000/api/health"
echo ""
echo "📝 Useful Commands:"
echo "   View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.production.yml down"
echo "   Restart services: docker-compose -f docker-compose.production.yml restart"
echo "   Update: git pull origin main && docker-compose -f docker-compose.production.yml up -d --build"
echo ""
print_success "Verbfy is now running on your server! 🚀" 