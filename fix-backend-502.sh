#!/bin/bash
# Quick fix script for 502 Bad Gateway issue

set -e

echo "🔧 Starting comprehensive backend fix..."

# Check if we're in the right directory
if [ ! -f "docker-compose.hetzner.yml" ]; then
    echo "❌ Error: docker-compose.hetzner.yml not found. Are you in /opt/verbfy?"
    exit 1
fi

echo "📊 Checking current container status..."
docker ps -a

echo "🛑 Stopping all services..."
docker compose -f docker-compose.hetzner.yml down

echo "🧹 Cleaning up containers and networks..."
docker container prune -f
docker network prune -f

echo "📝 Checking backend .env file..."
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env missing! Creating from template..."
    cat > backend/.env << 'EOF'
MONGO_URI=mongodb+srv://Verbfy:Verbfy@verbfy.kxzpcit.mongodb.net/verbfy?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
JWT_SECRET=ddb2070e412a4e227a233c3ed275d1cc6603ce9f9a0bfda81ecbbbbab81fd491
JWT_REFRESH_SECRET=ddb2070e412a4e227a233c3ed275d1cc6603ce9f9a0bfda81ecbbbbab81fd491_refresh
FRONTEND_URL=https://verbfy.com
BACKEND_URL=https://api.verbfy.com
COOKIE_DOMAIN=.verbfy.com
CORS_EXTRA_ORIGINS=https://www.verbfy.com,https://verbfy.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SMTP_HOST=privatemail.com
SMTP_PORT=587
SMTP_USER=noreply@verbfy.com
SMTP_PASS=Verbfy1940
SMTP_FROM=noreply@verbfy.com
EOF
    echo "✅ Created backend/.env template. Please add your Google OAuth credentials!"
else
    echo "✅ backend/.env exists"
fi

echo "🚀 Building and starting services..."
docker compose -f docker-compose.hetzner.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 30

echo "📊 Checking container status..."
docker ps

echo "🔍 Checking backend logs..."
docker logs verbfy-backend --tail 20

echo "🔍 Checking nginx logs..."
docker logs verbfy-nginx --tail 10

echo "🧪 Testing backend health..."
if docker exec verbfy-backend curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Backend container is responding internally"
else
    echo "❌ Backend container is not responding internally"
    echo "Backend logs:"
    docker logs verbfy-backend --tail 50
fi

echo "🧪 Testing external API..."
if curl -s https://api.verbfy.com/api/health > /dev/null; then
    echo "✅ External API is working!"
    echo "🎉 Fix completed successfully!"
else
    echo "❌ External API still not working"
    echo "Nginx logs:"
    docker logs verbfy-nginx --tail 20
fi

echo "📋 Summary:"
echo "- Backend container: $(docker inspect -f '{{.State.Status}}' verbfy-backend 2>/dev/null || echo 'NOT FOUND')"
echo "- Nginx container: $(docker inspect -f '{{.State.Status}}' verbfy-nginx 2>/dev/null || echo 'NOT FOUND')"
echo "- API Health: $(curl -s https://api.verbfy.com/api/health 2>/dev/null | head -c 50 || echo 'FAILED')"

echo "✅ Script completed. Check the results above."
