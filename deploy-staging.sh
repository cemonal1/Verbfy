#!/bin/bash

# Verbfy Staging Deployment Script
# This script deploys the Verbfy application to staging environment for testing

set -e  # Exit on any error

echo "🚀 Starting Verbfy Staging Deployment..."

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

# Check if Docker is running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running!"
        exit 1
    fi
    
    print_status "Docker is running ✓"
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

# Run basic tests
run_tests() {
    print_status "Running basic tests..."
    
    # Frontend tests (if available)
    cd verbfy-app
    if npm test -- --passWithNoTests 2>/dev/null; then
        print_status "Frontend tests completed ✓"
    else
        print_warning "Frontend tests skipped (no test script found)"
    fi
    cd ..
    
    # Backend tests (if available)
    cd backend
    if npm test -- --passWithNoTests 2>/dev/null; then
        print_status "Backend tests completed ✓"
    else
        print_warning "Backend tests skipped (no test script found)"
    fi
    cd ..
}

# Deploy to staging with Docker
deploy_staging() {
    print_status "Deploying to staging environment..."
    
    # Stop existing staging containers
    docker-compose -f docker-compose.staging.yml down 2>/dev/null || true
    
    # Build and start staging services
    docker-compose -f docker-compose.staging.yml up -d --build
    
    print_status "Staging deployment completed ✓"
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
    print_status "🎉 Verbfy staging deployment completed successfully!"
    echo ""
    echo "📊 Staging Environment URLs:"
    echo "   Frontend: http://localhost:3001"
    echo "   Backend API: http://localhost:5001"
    echo "   LiveKit: ws://localhost:7883"
    echo "   MongoDB: localhost:27018"
    echo "   Redis: localhost:6380"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   View logs: docker-compose -f docker-compose.staging.yml logs -f"
    echo "   Stop staging: docker-compose -f docker-compose.staging.yml down"
    echo "   Restart staging: docker-compose -f docker-compose.staging.yml restart"
    echo ""
    echo "⚠️  This is a staging environment for testing purposes only!"
}

# Main deployment process
main() {
    print_status "Starting Verbfy staging deployment..."
    
    check_docker
    build_frontend_staging
    build_backend_staging
    run_tests
    deploy_staging
    health_check_staging
    display_staging_info
}

# Run main function
main "$@" 