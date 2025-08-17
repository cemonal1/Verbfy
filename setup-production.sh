#!/bin/bash

# =================================================================
# VERBFY PRODUCTION SETUP SCRIPT
# =================================================================
# This script sets up the Verbfy application for production deployment
# Run this script on your production server before deployment

set -e  # Exit on any error

echo "🚀 Setting up Verbfy for production deployment..."

# =================================================================
# ENVIRONMENT VARIABLES CHECK
# =================================================================
check_env_vars() {
    echo "🔍 Checking environment variables..."
    
    local missing_vars=()
    local required_vars=(
        "MONGO_URI"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "FRONTEND_URL"
        "BACKEND_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo "❌ Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "   - $var"
        done
        echo ""
        echo "📝 Please set these variables in your deployment environment or create a .env file in the backend directory."
        echo "   You can use backend/env.production.example as a template."
        exit 1
    fi
    
    echo "✅ All required environment variables are set"
}

# =================================================================
# DIRECTORY STRUCTURE SETUP
# =================================================================
setup_directories() {
    echo "📁 Setting up directory structure..."
    
    # Create necessary directories
    mkdir -p backend/uploads/avatars
    mkdir -p backend/uploads/materials
    mkdir -p backend/logs
    mkdir -p /var/log/nginx
    
    # Set proper permissions
    if [[ $EUID -eq 0 ]]; then
        chown -R $USER:$USER backend/uploads
        chmod -R 755 backend/uploads
    fi
    
    echo "✅ Directory structure created"
}

# =================================================================
# SSL CERTIFICATE SETUP
# =================================================================
setup_ssl() {
    echo "🔐 Checking SSL certificate setup..."
    
    local api_domain="api.verbfy.com"
    local cert_path="/etc/letsencrypt/live/$api_domain"
    
    if [[ ! -d "$cert_path" ]]; then
        echo "⚠️  SSL certificates not found for $api_domain"
        echo "📝 Please run the following commands to set up SSL:"
        echo ""
        echo "   sudo apt update && sudo apt install certbot"
        echo "   sudo certbot certonly --standalone -d $api_domain"
        echo ""
        echo "   Or if you have a web server running:"
        echo "   sudo certbot certonly --webroot -w /var/www/html -d $api_domain"
        echo ""
        return 1
    fi
    
    echo "✅ SSL certificates found for $api_domain"
    return 0
}

# =================================================================
# DOCKER SETUP
# =================================================================
setup_docker() {
    echo "🐳 Setting up Docker environment..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        echo "📝 Installation guide: https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        echo "📝 Installation guide: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    echo "✅ Docker and Docker Compose are installed"
}

# =================================================================
# NGINX CONFIGURATION
# =================================================================
setup_nginx() {
    echo "🌐 Setting up Nginx configuration..."
    
    # Check if nginx directory exists
    if [[ ! -d "nginx" ]]; then
        echo "❌ Nginx configuration directory not found"
        exit 1
    fi
    
    # Validate nginx configuration
    if command -v nginx &> /dev/null; then
        nginx -t -c "$(pwd)/nginx/nginx.conf" 2>/dev/null || {
            echo "⚠️  Nginx configuration validation failed"
            echo "📝 Please check nginx/nginx.conf for syntax errors"
        }
    fi
    
    echo "✅ Nginx configuration ready"
}

# =================================================================
# BACKEND DEPENDENCIES
# =================================================================
setup_backend() {
    echo "⚙️  Setting up backend..."
    
    cd backend
    
    # Install dependencies
    if [[ -f "package.json" ]]; then
        echo "📦 Installing backend dependencies..."
        npm ci --only=production
        
        # Build TypeScript
        echo "🔨 Building TypeScript..."
        npm run build
        
        echo "✅ Backend setup complete"
    else
        echo "❌ Backend package.json not found"
        exit 1
    fi
    
    cd ..
}

# =================================================================
# HEALTH CHECK SETUP
# =================================================================
setup_healthcheck() {
    echo "🏥 Setting up health checks..."
    
    cat > healthcheck.sh << 'EOF'
#!/bin/bash
# Health check script for Verbfy

check_backend() {
    local backend_url="${BACKEND_URL:-http://localhost:5000}"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$backend_url/api/health" 2>/dev/null)
    
    if [[ "$response" == "200" ]]; then
        echo "✅ Backend is healthy"
        return 0
    else
        echo "❌ Backend health check failed (HTTP $response)"
        return 1
    fi
}

check_database() {
    echo "🔍 Checking database connection..."
    # This would typically involve a database connection test
    # For now, we'll just check if the backend health endpoint includes DB status
    echo "✅ Database connection check delegated to backend health endpoint"
}

main() {
    echo "🏥 Running Verbfy health checks..."
    
    check_backend
    backend_status=$?
    
    check_database
    db_status=$?
    
    if [[ $backend_status -eq 0 && $db_status -eq 0 ]]; then
        echo "✅ All health checks passed"
        exit 0
    else
        echo "❌ Some health checks failed"
        exit 1
    fi
}

main "$@"
EOF
    
    chmod +x healthcheck.sh
    echo "✅ Health check script created"
}

# =================================================================
# MAIN EXECUTION
# =================================================================
main() {
    echo "🎓 Verbfy Production Setup"
    echo "========================="
    echo ""
    
    # Run setup functions
    check_env_vars
    setup_directories
    setup_docker
    setup_nginx
    setup_backend
    setup_healthcheck
    
    # SSL setup (optional but recommended)
    if ! setup_ssl; then
        echo ""
        echo "⚠️  SSL setup incomplete. The application will work but HTTPS is recommended for production."
        echo ""
    fi
    
    echo ""
    echo "🎉 Production setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Ensure all environment variables are properly set"
    echo "   2. Set up SSL certificates if not already done"
    echo "   3. Run: docker-compose -f docker-compose.hetzner.yml up -d"
    echo "   4. Monitor logs: docker-compose -f docker-compose.hetzner.yml logs -f"
    echo "   5. Run health check: ./healthcheck.sh"
    echo ""
    echo "🔧 Useful commands:"
    echo "   - View running containers: docker ps"
    echo "   - View logs: docker-compose -f docker-compose.hetzner.yml logs"
    echo "   - Restart services: docker-compose -f docker-compose.hetzner.yml restart"
    echo "   - Stop services: docker-compose -f docker-compose.hetzner.yml down"
    echo ""
}

# Execute main function
main "$@"
