#!/bin/bash

# Verbfy Production Deployment Script
# This script deploys the entire Verbfy application to production

set -e  # Exit on any error

echo "🚀 Starting Verbfy Production Deployment..."

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

# Check if required environment files exist
check_env_files() {
    print_status "Checking environment files..."
    
    if [ ! -f "verbfy-app/.env.production" ]; then
        print_error "Frontend production environment file not found!"
        print_warning "Please copy verbfy-app/env.production.example to verbfy-app/.env.production and configure it."
        exit 1
    fi
    
    if [ ! -f "backend/.env.production" ]; then
        print_error "Backend production environment file not found!"
        print_warning "Please copy backend/env.production.example to backend/.env.production and configure it."
        exit 1
    fi
    
    print_status "Environment files found ✓"
}

# Build frontend
build_frontend() {
    print_status "Building frontend application..."
    cd verbfy-app
    
    # Install dependencies
    npm ci --only=production
    
    # Build the application
    npm run build
    
    print_status "Frontend build completed ✓"
    cd ..
}

# Build backend
build_backend() {
    print_status "Building backend application..."
    cd backend
    
    # Install dependencies
    npm ci --only=production
    
    # Build TypeScript
    npm run build
    
    print_status "Backend build completed ✓"
    cd ..
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Frontend tests
    cd verbfy-app
    npm test -- --passWithNoTests
    cd ..
    
    # Backend tests
    cd backend
    npm test -- --passWithNoTests
    cd ..
    
    print_status "Tests completed ✓"
}

# Deploy with Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    # Build Docker images
    docker-compose -f docker-compose.production.yml build
    
    # Deploy
    docker-compose -f docker-compose.production.yml up -d
    
    print_status "Docker deployment completed ✓"
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check frontend
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "Frontend health check passed ✓"
    else
        print_error "Frontend health check failed!"
        exit 1
    fi
    
    # Check backend
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_status "Backend health check passed ✓"
    else
        print_error "Backend health check failed!"
        exit 1
    fi
    
    print_status "All health checks passed ✓"
}

# Main deployment process
main() {
    print_status "Starting Verbfy production deployment..."
    
    check_env_files
    build_frontend
    build_backend
    run_tests
    deploy_docker
    health_check
    
    print_status "🎉 Verbfy production deployment completed successfully!"
    print_status "Frontend: https://verbfy.com"
    print_status "Backend API: https://api.verbfy.com"
    print_status "LiveKit: https://livekit.verbfy.com"
}

# Run main function
main "$@" 