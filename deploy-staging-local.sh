#!/bin/bash

# Verbfy Local Staging Deployment Script
# This script deploys the Verbfy application locally for staging testing

set -e  # Exit on any error

echo "🚀 Starting Verbfy Local Staging Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed!"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed!"
        exit 1
    fi
    
    # Check MongoDB (optional)
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB is not installed locally. Using MongoDB Atlas or external database."
    fi
    
    print_status "Prerequisites check completed ✓"
}

# Setup environment variables for staging
setup_staging_env() {
    print_status "Setting up staging environment variables..."
    
    # Create staging environment file for backend
    cat > backend/.env.staging << EOF
NODE_ENV=staging
MONGO_URI=mongodb+srv://Verbfy:VerbfyDataBack@verbfy.kxzpcit.mongodb.net/verbfy_staging?retryWrites=true&w=majority&appName=Verbfy
PORT=5001
JWT_SECRET=staging-jwt-secret-key-for-testing-only
JWT_REFRESH_SECRET=staging-jwt-refresh-secret-key-for-testing-only
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001
LIVEKIT_SELF_URL=wss://localhost:7883
LIVEKIT_SELF_API_KEY=test-key
LIVEKIT_SELF_API_SECRET=test-secret
EOF
    
    # Create staging environment file for frontend
    cat > verbfy-app/.env.staging << EOF
NODE_ENV=staging
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_LIVEKIT_URL=wss://localhost:7883
NEXT_PUBLIC_LIVEKIT_CLOUD_URL=wss://localhost:7883
EOF
    
    print_status "Staging environment variables configured ✓"
}

# Build frontend for staging
build_frontend_staging() {
    print_status "Building frontend for staging..."
    cd verbfy-app
    
    # Install dependencies
    npm ci
    
    # Build the application
    npm run build
    
    print_status "Frontend staging build completed ✓"
    cd ..
}

# Build backend for staging
build_backend_staging() {
    print_status "Building backend for staging..."
    cd backend
    
    # Install dependencies
    npm ci
    
    # Build TypeScript
    npm run build
    
    print_status "Backend staging build completed ✓"
    cd ..
}

# Start backend in staging mode
start_backend_staging() {
    print_status "Starting backend in staging mode..."
    cd backend
    
    # Start backend with staging environment
    NODE_ENV=staging npm run dev &
    BACKEND_PID=$!
    
    print_status "Backend started with PID: $BACKEND_PID"
    cd ..
}

# Start frontend in staging mode
start_frontend_staging() {
    print_status "Starting frontend in staging mode..."
    cd verbfy-app
    
    # Start frontend with staging environment
    NODE_ENV=staging npm run dev &
    FRONTEND_PID=$!
    
    print_status "Frontend started with PID: $FRONTEND_PID"
    cd ..
}

# Health check for staging
health_check_staging() {
    print_status "Performing staging health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check frontend
    if curl -f http://localhost:3001 > /dev/null 2>&1; then
        print_status "Frontend staging health check passed ✓"
    else
        print_error "Frontend staging health check failed!"
        return 1
    fi
    
    # Check backend
    if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
        print_status "Backend staging health check passed ✓"
    else
        print_warning "Backend staging health check failed (health endpoint may not exist)"
    fi
    
    print_status "Staging health checks completed ✓"
}

# Display staging information
display_staging_info() {
    print_status "🎉 Verbfy local staging deployment completed successfully!"
    echo ""
    echo "📊 Staging Environment URLs:"
    echo "   Frontend: http://localhost:3001"
    echo "   Backend API: http://localhost:5001"
    echo "   LiveKit: ws://localhost:7883 (if running)"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   View backend logs: tail -f backend/logs/app.log"
    echo "   Stop staging: pkill -f 'node.*staging'"
    echo "   Restart staging: ./deploy-staging-local.sh"
    echo ""
    echo "⚠️  This is a local staging environment for testing purposes only!"
    echo "   Backend PID: $BACKEND_PID"
    echo "   Frontend PID: $FRONTEND_PID"
}

# Main deployment process
main() {
    print_status "Starting Verbfy local staging deployment..."
    
    check_prerequisites
    setup_staging_env
    build_frontend_staging
    build_backend_staging
    start_backend_staging
    start_frontend_staging
    health_check_staging
    display_staging_info
}

# Run main function
main "$@" 