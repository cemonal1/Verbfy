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

# Build the project
echo "🔨 Building Verbfy backend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Stop existing PM2 process
echo "🛑 Stopping existing PM2 process..."
pm2 stop verbfy-backend 2>/dev/null || true
pm2 delete verbfy-backend 2>/dev/null || true

# Start with ecosystem config
echo "🚀 Starting Verbfy backend with ecosystem config..."
pm2 start ecosystem.config.js

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Check backend status
echo "📊 Backend status:"
pm2 status

# Show logs
echo "📋 Recent logs:"
pm2 logs verbfy-backend --lines 10

echo "🎉 Deployment completed!"
echo "🌐 Test WebSocket: https://api.verbfy.com/socket.io/"
echo "🔍 Test API: https://api.verbfy.com/api/health"
echo ""
echo "📝 Useful PM2 commands:"
echo "  pm2 logs verbfy-backend --lines 50    # Show last 50 log lines"
echo "  pm2 restart verbfy-backend             # Restart backend"
echo "  pm2 reload verbfy-backend              # Zero-downtime reload"
echo "  pm2 monit                              # Monitor all processes"
