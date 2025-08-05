#!/bin/bash

# 🚀 Verbfy Deployment Script
# This script automates the deployment of the Verbfy application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/verbfy"
REPO_URL=""
DOMAIN_NAME="verbfy.com"
EMAIL=""

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root"
        exit 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! command_exists git; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Create application directory
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    cd $APP_DIR
    
    # Clone repository if not exists
    if [ ! -d ".git" ]; then
        if [ -z "$REPO_URL" ]; then
            print_error "Repository URL not set. Please set REPO_URL variable."
            exit 1
        fi
        git clone $REPO_URL .
    else
        git pull origin main
    fi
    
    print_success "Environment setup completed"
}

# Function to generate secrets
generate_secrets() {
    print_status "Generating JWT secrets..."
    
    cd backend
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Generate secrets
    npm run generate-secrets
    
    print_success "JWT secrets generated"
}

# Function to configure environment files
configure_environment() {
    print_status "Configuring environment files..."
    
    # Copy example files
    cp backend/env.example backend/.env
    cp verbfy-app/env.local.example verbfy-app/.env.local
    
    # Prompt for configuration
    print_warning "Please configure the following environment files:"
    print_warning "1. backend/.env - Set MongoDB URI, JWT secrets, and other backend variables"
    print_warning "2. verbfy-app/.env.local - Set frontend API URLs"
    
    read -p "Press Enter when you have configured the environment files..."
    
    print_success "Environment files configured"
}

# Function to build and deploy
build_and_deploy() {
    print_status "Building and deploying services..."
    
    # Build and start services
    docker-compose -f docker-compose.production.yml up -d --build
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check service status
    docker-compose -f docker-compose.production.yml ps
    
    print_success "Services deployed successfully"
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    # Create SSL directory
    sudo mkdir -p $APP_DIR/nginx/ssl
    sudo chown -R $USER:$USER $APP_DIR/nginx
    
    # Generate SSL certificates
    docker-compose -f docker-compose.production.yml run --rm certbot certonly \
        --webroot --webroot-path=/var/www/html \
        --email $EMAIL \
        --agree-tos --no-eff-email \
        -d $DOMAIN_NAME -d www.$DOMAIN_NAME \
        -d api.$DOMAIN_NAME -d livekit.$DOMAIN_NAME
    
    print_success "SSL certificates generated"
}

# Function to configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Copy Nginx configuration
    cp nginx/nginx.conf $APP_DIR/nginx/
    
    # Restart Nginx
    docker-compose -f docker-compose.production.yml restart nginx
    
    # Check Nginx configuration
    docker-compose -f docker-compose.production.yml exec nginx nginx -t
    
    print_success "Nginx configured successfully"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check if services are running
    if ! docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
        print_error "Some services are not running"
        docker-compose -f docker-compose.production.yml ps
        exit 1
    fi
    
    # Test health endpoints
    if curl -f -s https://api.$DOMAIN_NAME/api/health > /dev/null; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed"
    fi
    
    if curl -f -s https://$DOMAIN_NAME > /dev/null; then
        print_success "Frontend health check passed"
    else
        print_warning "Frontend health check failed"
    fi
    
    print_success "Health checks completed"
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create log rotation
    sudo tee /etc/logrotate.d/verbfy > /dev/null <<EOF
$APP_DIR/nginx/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
EOF
    
    # Create backup script
    mkdir -p $APP_DIR/scripts
    tee $APP_DIR/scripts/backup.sh > /dev/null <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/verbfy/backups"
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose -f /opt/verbfy/docker-compose.production.yml exec -T mongodb mongodump --out /data/backup_$DATE
docker cp verbfy-mongodb:/data/backup_$DATE $BACKUP_DIR/

# Backup application data
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /opt/verbfy .

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*" -mtime +7 -delete
EOF
    
    chmod +x $APP_DIR/scripts/backup.sh
    
    print_success "Monitoring setup completed"
}

# Function to display final instructions
display_final_instructions() {
    print_success "Deployment completed successfully!"
    echo
    echo "🎉 Verbfy is now deployed and running!"
    echo
    echo "📋 Next steps:"
    echo "1. Visit https://$DOMAIN_NAME to access the application"
    echo "2. Test the authentication flow"
    echo "3. Verify all features are working"
    echo "4. Set up monitoring and backups"
    echo
    echo "🔧 Useful commands:"
    echo "  - View logs: docker-compose -f docker-compose.production.yml logs -f"
    echo "  - Restart services: docker-compose -f docker-compose.production.yml restart"
    echo "  - Update application: git pull && docker-compose -f docker-compose.production.yml up -d --build"
    echo "  - Backup: $APP_DIR/scripts/backup.sh"
    echo
    echo "📞 Support:"
    echo "  - Check logs in $APP_DIR/nginx/logs/"
    echo "  - Database issues: MongoDB Atlas dashboard"
    echo "  - SSL issues: Certbot logs in $APP_DIR/nginx/ssl/"
}

# Main deployment function
main() {
    echo "🚀 Starting Verbfy deployment..."
    echo
    
    # Check if running as root
    check_root
    
    # Check prerequisites
    check_prerequisites
    
    # Setup environment
    setup_environment
    
    # Generate secrets
    generate_secrets
    
    # Configure environment
    configure_environment
    
    # Build and deploy
    build_and_deploy
    
    # Setup SSL certificates
    setup_ssl
    
    # Configure Nginx
    configure_nginx
    
    # Run health checks
    run_health_checks
    
    # Setup monitoring
    setup_monitoring
    
    # Display final instructions
    display_final_instructions
}

# Check if script is being sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 