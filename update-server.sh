#!/bin/bash
# Verbfy Server Update Script
# Run this script on your production server to update the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔄 Updating Verbfy Production Services..."

# Check if we're in the right directory
if [ ! -f "docker-compose.hetzner.yml" ]; then
    print_error "docker-compose.hetzner.yml not found. Are you in /opt/verbfy?"
    exit 1
fi

# Create backup of current state
print_status "Creating backup of current state..."
BACKUP_DIR="/opt/verbfy-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/" 2>/dev/null || print_warning "Some files couldn't be backed up"
print_success "Backup created at $BACKUP_DIR"

# Go to app directory
cd /opt/verbfy

print_status "Pulling latest changes from repository..."
git fetch --all
git reset --hard origin/main

print_status "Stopping services gracefully..."
docker compose -f docker-compose.hetzner.yml down --timeout 30

print_status "Cleaning up unused Docker resources..."
docker system prune -f

print_status "Rebuilding and starting services..."
docker compose -f docker-compose.hetzner.yml up -d --build

print_status "Waiting for services to initialize..."
sleep 45

# Health checks
print_status "Running health checks..."

# Test API health
print_status "Testing API health endpoint..."
if curl -s -f https://api.verbfy.com/api/health > /dev/null; then
    print_success "API health check passed"
else
    print_error "API health check failed"
fi

# Test frontend
print_status "Testing frontend accessibility..."
if curl -s -f https://verbfy.com > /dev/null; then
    print_success "Frontend accessibility check passed"
else
    print_error "Frontend accessibility check failed"
fi

# Test CORS
print_status "Testing CORS configuration..."
CORS_RESPONSE=$(curl -s -I -H "Origin: https://verbfy.com" https://api.verbfy.com/api/health | grep -i "access-control-allow-origin" || echo "")
if [[ "$CORS_RESPONSE" == *"https://verbfy.com"* ]]; then
    print_success "CORS configuration is working"
else
    print_warning "CORS configuration may need attention"
fi

# Show container status
print_status "Container status:"
docker compose -f docker-compose.hetzner.yml ps

print_success "Update completed successfully!"
print_status "Backup location: $BACKUP_DIR"
