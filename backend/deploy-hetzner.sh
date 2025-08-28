#!/bin/bash

echo "🚀 Verbfy Backend Deployment Script"
echo "=================================="

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

# Restart backend
echo "🔄 Restarting Verbfy backend..."
pm2 restart verbfy-backend

# Check backend status
echo "📊 Backend status:"
pm2 status

echo "🎉 Deployment completed!"
echo "🌐 Test WebSocket: https://api.verbfy.com/socket.io/"
echo "🔍 Test API: https://api.verbfy.com/api/health"
