#!/bin/bash

echo "🚀 Verbfy Backend Deployment Script (Ecosystem)"
echo "=============================================="

# Configuration
REMOTE_HOST="46.62.161.121"
REMOTE_USER="root"
REMOTE_PATH="/root/verbfy"
BRANCH="main"

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "❌ Not in a git repository!"
        exit 1
    fi
}

# Function to check for uncommitted changes
check_uncommitted_changes() {
    if ! git diff-index --quiet HEAD --; then
        echo "⚠️  You have uncommitted changes!"
        echo "📝 Staging all changes..."
        git add .
        
        echo "💬 Enter commit message (or press Enter for default):"
        read -r commit_message
        if [ -z "$commit_message" ]; then
            commit_message="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
        fi
        
        echo "📝 Committing changes..."
        git commit -m "$commit_message"
        
        if [ $? -ne 0 ]; then
            echo "❌ Git commit failed!"
            exit 1
        fi
    fi
}

# Function to push to remote repository
push_to_remote() {
    echo "🔄 Pushing to remote repository..."
    git push origin $BRANCH
    
    if [ $? -ne 0 ]; then
        echo "❌ Git push failed!"
        exit 1
    fi
    echo "✅ Successfully pushed to remote repository"
}

# Function to deploy to remote server
deploy_to_remote() {
    echo "🌐 Connecting to remote server and deploying..."
    
    ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST << 'EOF'
        set -e
        
        echo "📂 Navigating to project directory..."
        cd /root/verbfy
        
        echo "🔄 Pulling latest changes..."
        git pull origin main
        
        echo "📂 Navigating to backend directory..."
        cd backend
        
        echo "📦 Installing dependencies..."
        npm install --production
        
        echo "🔨 Building project..."
        npm run build:prod
        
        echo "🛑 Stopping existing PM2 process..."
        pm2 stop verbfy-backend 2>/dev/null || true
        pm2 delete verbfy-backend 2>/dev/null || true
        
        echo "🚀 Starting backend with PM2..."
        pm2 start ecosystem.config.js
        
        echo "💾 Saving PM2 configuration..."
        pm2 save
        
        echo "📊 Checking PM2 status..."
        pm2 status
        
        echo "🏥 Performing health check..."
        sleep 5
        curl -f http://localhost:5000/api/health || echo "❌ Health check failed"
        
        echo "✅ Remote deployment completed!"
EOF
    
    if [ $? -ne 0 ]; then
        echo "❌ Remote deployment failed!"
        exit 1
    fi
}

# Pre-deployment checks
echo "🔍 Pre-deployment checks..."
check_git_repo
check_uncommitted_changes

# Git operations
echo "📤 Git operations..."
push_to_remote

# Remote deployment
echo "🌐 Remote deployment..."
deploy_to_remote

echo "🎉 Full deployment pipeline completed successfully!"
echo ""
echo "🔗 Service URLs:"
echo "  🌐 API: https://api.verbfy.com/api/health"
echo "  🔌 WebSocket: https://api.verbfy.com/socket.io/"
echo "  📱 App: https://www.verbfy.com"
echo ""
echo "📊 Monitoring commands:"
echo "  ssh $REMOTE_USER@$REMOTE_HOST 'pm2 logs verbfy-backend --lines 50'"
echo "  ssh $REMOTE_USER@$REMOTE_HOST 'pm2 monit'"
echo "  ssh $REMOTE_USER@$REMOTE_HOST 'pm2 restart verbfy-backend'"

# Local deployment section (if running on server)
if [ "$1" = "--local" ]; then
    echo ""
    echo "🏠 Running local deployment steps..."

# Update Nginx config
echo "📝 Updating Nginx configuration..."
cp nginx-verbfy.conf /etc/nginx/sites-available/verbfy

# Test Nginx config
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config test passed"
    
    # Reload Nginx
    echo "🔄 Reloading Nginx..."
    systemctl reload nginx
    
    # Check Nginx status
    echo "📊 Nginx status:"
    systemctl status nginx --no-pager -l
    
else
    echo "❌ Nginx config test failed"
    exit 1
fi

# Install terser if not present
echo "📦 Ensuring build dependencies..."
npm install --save-dev terser

# Build the project with optimization
echo "🔨 Building Verbfy backend with optimization..."
npm run build:prod

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Performance check
echo "🔍 Checking build size..."
du -sh dist/
echo "📊 Build files:"
ls -la dist/

# Stop existing PM2 process
echo "🛑 Stopping existing PM2 process..."
pm2 stop verbfy-backend 2>/dev/null || true
pm2 delete verbfy-backend 2>/dev/null || true

# Start with ecosystem config
echo "🚀 Starting Verbfy backend with ecosystem config..."
pm2 start ecosystem.config.js

# Verify environment variables are loaded
echo "🔍 Checking environment variables..."
if [ -z "$MONGO_URI" ]; then
    echo "❌ MONGO_URI not found in .env file!"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET not found in .env file!"
    exit 1
fi

echo "✅ Environment variables loaded successfully"

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Check backend status
echo "📊 Backend status:"
pm2 status

# Show logs
echo "📋 Recent logs:"
pm2 logs verbfy-backend --lines 10

# Health check
echo "🏥 Performing health check..."
sleep 5  # Wait for server to start
curl -f http://localhost:5000/api/health || echo "❌ Health check failed"

# Memory check
echo "💾 Memory usage:"
free -h

# Performance monitoring setup
echo "📊 Setting up performance monitoring..."
if [ ! -d "logs" ]; then
    mkdir -p logs
fi

    echo "🎉 Local deployment completed!"
    echo "🌐 Test WebSocket: https://api.verbfy.com/socket.io/"
    echo "🔍 Test API: https://api.verbfy.com/api/health"
    echo ""
    echo "📝 Useful PM2 commands:"
    echo "  pm2 logs verbfy-backend --lines 50    # Show last 50 log lines"
    echo "  pm2 restart verbfy-backend             # Restart backend"
    echo "  pm2 reload verbfy-backend              # Zero-downtime reload"
    echo "  pm2 monit                              # Monitor all processes"
    echo ""
    echo "🔧 Performance commands:"
    echo "  npm run monitor:memory                 # Monitor memory usage"
    echo "  npm run health-check                   # Check API health"
    echo "  npm run performance:test               # Run performance tests"
fi

# Post-deployment verification
echo ""
echo "🔍 Post-deployment verification..."

# Test API endpoints
echo "🧪 Testing API endpoints..."
echo "  ➤ Health check..."
curl -s -f https://api.verbfy.com/api/health > /dev/null && echo "    ✅ Health endpoint OK" || echo "    ❌ Health endpoint failed"

echo "  ➤ CORS preflight check..."
curl -s -X OPTIONS -H "Origin: https://www.verbfy.com" -H "Access-Control-Request-Method: POST" https://api.verbfy.com/api/auth/login > /dev/null && echo "    ✅ CORS preflight OK" || echo "    ❌ CORS preflight failed"

# Check SSL certificate
echo "  ➤ SSL certificate check..."
curl -s -I https://api.verbfy.com > /dev/null && echo "    ✅ SSL certificate OK" || echo "    ❌ SSL certificate issue"

# Check remote server status
echo "🖥️  Remote server status check..."
ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST << 'EOF'
    echo "  ➤ PM2 process status:"
    pm2 jlist | jq -r '.[] | select(.name=="verbfy-backend") | "    Process: \(.name) | Status: \(.pm2_env.status) | CPU: \(.monit.cpu)% | Memory: \(.monit.memory/1024/1024 | floor)MB"' 2>/dev/null || pm2 status | grep verbfy-backend
    
    echo "  ➤ System resources:"
    echo "    $(free -h | grep Mem | awk '{print "Memory: " $3 "/" $2 " (" $3/$2*100 "% used)"}')"
    echo "    $(df -h / | tail -1 | awk '{print "Disk: " $3 "/" $2 " (" $5 " used)"}')"
    
    echo "  ➤ Recent error logs (if any):"
    pm2 logs verbfy-backend --lines 5 --err 2>/dev/null | tail -5 || echo "    No recent errors"
EOF

echo ""
echo "🎯 Deployment Summary:"
echo "  📅 Deployment time: $(date)"
echo "  🌿 Branch: $BRANCH"
echo "  🖥️  Remote host: $REMOTE_HOST"
echo "  📊 Status: ✅ Completed successfully"
echo ""
echo "🔗 Quick access commands:"
echo "  📊 Monitor: ssh $REMOTE_USER@$REMOTE_HOST 'pm2 monit'"
echo "  📋 Logs: ssh $REMOTE_USER@$REMOTE_HOST 'pm2 logs verbfy-backend'"
echo "  🔄 Restart: ssh $REMOTE_USER@$REMOTE_HOST 'pm2 restart verbfy-backend'"
echo "  🏥 Health: curl https://api.verbfy.com/api/health"
