#!/bin/bash
# Server update script - run this on your Hetzner server

set -e

echo "🔄 Updating Verbfy services with CORS fixes..."

# Go to app directory
cd /opt/verbfy

echo "📥 Pulling latest changes..."
git fetch --all
git reset --hard origin/main

echo "🛑 Stopping services..."
docker compose -f docker-compose.hetzner.yml down

echo "🔨 Rebuilding and starting services..."
docker compose -f docker-compose.hetzner.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 30

echo "🧪 Testing API health..."
curl -s https://api.verbfy.com/api/health || echo "API not responding yet"

echo "🧪 Testing CORS preflight..."
curl -s -X OPTIONS \
  -H "Origin: https://verbfy.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Idempotency-Key" \
  https://api.verbfy.com/api/auth/register

echo "✅ Update completed. Please test the frontend now."
