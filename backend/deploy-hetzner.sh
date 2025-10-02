#!/bin/bash

echo "🚀 Verbfy Backend Deployment Script (Ecosystem)"
echo "=============================================="

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

echo "🎉 Deployment completed!"
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
