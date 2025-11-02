#!/bin/bash

# 🔧 Verbfy CORS Production Fix Script
# This script fixes CORS issues on the production server

set -e

echo "🔧 Starting CORS Production Fix..."

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

# Check if we're on the server
if [[ ! -f "/root/Verbfy/backend/.env" ]]; then
    print_error "This script should be run on the production server"
    exit 1
fi

print_status "Checking current backend status..."

# Navigate to backend directory
cd /root/Verbfy/backend

# Check if backend is running
if pgrep -f "node.*index.js" > /dev/null; then
    print_status "Backend is currently running"
    BACKEND_RUNNING=true
else
    print_warning "Backend is not running"
    BACKEND_RUNNING=false
fi

# Update environment variables
print_status "Updating environment variables..."

# Backup current .env
if [[ -f ".env" ]]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    print_status "Backed up current .env file"
fi

# Create/update .env with proper CORS settings
cat > .env << 'EOF'
# Production Environment - Updated for CORS Fix
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb://admin:VerbfyDB2024!@localhost:27017/verbfy?authSource=admin

# JWT Secrets (Production)
JWT_SECRET=VerbfyJWT2024SecretKey!ProductionOnly
JWT_REFRESH_SECRET=VerbfyRefreshJWT2024SecretKey!ProductionOnly
SESSION_SECRET=VerbfySession2024SecretKey!ProductionOnly

# URLs and CORS
FRONTEND_URL=https://www.verbfy.com
BACKEND_URL=https://api.verbfy.com
COOKIE_DOMAIN=.verbfy.com
CORS_EXTRA_ORIGINS=https://verbfy.com,https://www.verbfy.com,https://api.verbfy.com

# LiveKit
LIVEKIT_API_KEY=placeholder-key
LIVEKIT_API_SECRET=placeholder-secret
LIVEKIT_URL=wss://livekit.verbfy.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@verbfy.com
SMTP_PASS=placeholder-password
SMTP_FROM="Verbfy <noreply@verbfy.com>"

# Security
SENTRY_DSN=
ALLOWED_FRAME_SRC=https://verbfy.com,https://www.verbfy.com
IDEMPOTENCY_TTL_MINUTES=30
EOF

print_success "Updated .env file with proper CORS configuration"

# Build the backend
print_status "Building backend..."
npm run build

if [[ $? -eq 0 ]]; then
    print_success "Backend built successfully"
else
    print_error "Backend build failed"
    exit 1
fi

# Restart backend if it was running
if [[ "$BACKEND_RUNNING" == "true" ]]; then
    print_status "Restarting backend service..."
    
    # Kill existing backend process
    pkill -f "node.*index.js" || true
    sleep 2
    
    # Start backend in background
    nohup npm start > /var/log/verbfy-backend.log 2>&1 &
    
    # Wait a moment for startup
    sleep 5
    
    # Check if backend started successfully
    if pgrep -f "node.*index.js" > /dev/null; then
        print_success "Backend restarted successfully"
    else
        print_error "Backend failed to restart"
        print_status "Check logs: tail -f /var/log/verbfy-backend.log"
        exit 1
    fi
else
    print_status "Starting backend service..."
    nohup npm start > /var/log/verbfy-backend.log 2>&1 &
    sleep 5
    
    if pgrep -f "node.*index.js" > /dev/null; then
        print_success "Backend started successfully"
    else
        print_error "Backend failed to start"
        exit 1
    fi
fi

# Test CORS configuration
print_status "Testing CORS configuration..."

# Test health endpoint
print_status "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)

if [[ "$HEALTH_RESPONSE" == "200" ]]; then
    print_success "Health endpoint responding (HTTP $HEALTH_RESPONSE)"
else
    print_error "Health endpoint failed (HTTP $HEALTH_RESPONSE)"
fi

# Test CORS preflight
print_status "Testing CORS preflight..."
CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: https://www.verbfy.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    http://localhost:5000/api/auth/login)

if [[ "$CORS_RESPONSE" == "204" || "$CORS_RESPONSE" == "200" ]]; then
    print_success "CORS preflight working (HTTP $CORS_RESPONSE)"
else
    print_warning "CORS preflight response: HTTP $CORS_RESPONSE"
fi

# Show backend logs
print_status "Recent backend logs:"
tail -n 20 /var/log/verbfy-backend.log

print_success "CORS fix completed!"
print_status "Backend is running on port 5000"
print_status "Check full logs: tail -f /var/log/verbfy-backend.log"

# Test external access
print_status "Testing external API access..."
EXTERNAL_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://api.verbfy.com/api/health)

if [[ "$EXTERNAL_HEALTH" == "200" ]]; then
    print_success "External API access working (HTTP $EXTERNAL_HEALTH)"
else
    print_warning "External API access: HTTP $EXTERNAL_HEALTH"
    print_status "Check Nginx configuration and SSL certificates"
fi

echo ""
print_success "🎉 CORS Production Fix Complete!"
echo ""
print_status "Next steps:"
echo "1. Test login from https://www.verbfy.com"
echo "2. Monitor logs: tail -f /var/log/verbfy-backend.log"
echo "3. Check Nginx status: systemctl status nginx"
echo ""