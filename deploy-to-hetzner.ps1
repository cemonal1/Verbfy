# 🚀 Verbfy Hetzner Production Deployment Script (PowerShell)
# This script connects to the Hetzner server and applies all necessary fixes

Write-Host "🚀 Starting Verbfy Production Deployment to Hetzner..." -ForegroundColor Blue

# Server details
$ServerIP = "46.62.161.121"
$ServerUser = "root"

Write-Host "🔧 Connecting to Hetzner server: $ServerIP" -ForegroundColor Blue

# Create the deployment script content
$DeploymentScript = @'
#!/bin/bash
echo "🔧 Starting Verbfy Production Fix on Hetzner Server..."

# Navigate to project directory
cd /root/Verbfy

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Make scripts executable
chmod +x fix-cors-production.sh
chmod +x test-cors.sh

# Check current backend status
echo "🔍 Checking current backend status..."
if pgrep -f "node.*index.js" > /dev/null; then
    echo "✅ Backend is currently running"
    BACKEND_RUNNING=true
else
    echo "⚠️ Backend is not running"
    BACKEND_RUNNING=false
fi

# Navigate to backend directory
cd backend

# Backup current .env if it exists
if [[ -f ".env" ]]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "📋 Backed up current .env file"
fi

# Create production .env with proper CORS settings
echo "⚙️ Creating production environment configuration..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb://admin:VerbfyDB2024!@localhost:27017/verbfy?authSource=admin

# JWT Secrets (Production)
JWT_SECRET=VerbfyJWT2024SecretKey!ProductionOnly
JWT_REFRESH_SECRET=VerbfyRefreshJWT2024SecretKey!ProductionOnly
SESSION_SECRET=VerbfySession2024SecretKey!ProductionOnly

# URLs and CORS - FIXED FOR WWW DOMAIN
FRONTEND_URL=https://www.verbfy.com
BACKEND_URL=https://api.verbfy.com
COOKIE_DOMAIN=.verbfy.com
CORS_EXTRA_ORIGINS=https://verbfy.com,https://www.verbfy.com,https://api.verbfy.com

# LiveKit
LIVEKIT_API_KEY=placeholder-key
LIVEKIT_API_SECRET=placeholder-secret
LIVEKIT_URL=wss://livekit.verbfy.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@verbfy.com
SMTP_PASS=placeholder-password
SMTP_FROM="Verbfy <noreply@verbfy.com>"

# Security
SENTRY_DSN=
ALLOWED_FRAME_SRC=https://verbfy.com,https://www.verbfy.com
IDEMPOTENCY_TTL_MINUTES=30
EOF

echo "✅ Production environment configuration created"

# Install dependencies and build
echo "📦 Installing dependencies..."
npm install

echo "🔨 Building backend..."
npm run build

if [[ $? -eq 0 ]]; then
    echo "✅ Backend built successfully"
else
    echo "❌ Backend build failed"
    exit 1
fi

# Stop existing backend process
echo "🛑 Stopping existing backend process..."
pkill -f "node.*index.js" || true
sleep 3

# Start backend
echo "🚀 Starting backend service..."
nohup npm start > /var/log/verbfy-backend.log 2>&1 &

# Wait for startup
sleep 10

# Check if backend started successfully
if pgrep -f "node.*index.js" > /dev/null; then
    echo "✅ Backend started successfully"
else
    echo "❌ Backend failed to start"
    echo "📋 Checking logs..."
    tail -n 20 /var/log/verbfy-backend.log
    exit 1
fi

# Test the backend
echo "🧪 Testing backend health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)

if [[ "$HEALTH_RESPONSE" == "200" ]]; then
    echo "✅ Backend health check passed (HTTP $HEALTH_RESPONSE)"
else
    echo "⚠️ Backend health check: HTTP $HEALTH_RESPONSE"
fi

# Test CORS configuration
echo "🧪 Testing CORS configuration..."
cd /root/Verbfy
./test-cors.sh

# Show recent logs
echo "📋 Recent backend logs:"
tail -n 10 /var/log/verbfy-backend.log

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "✅ Backend is running on port 5000"
echo "✅ CORS configuration updated for www.verbfy.com"
echo "✅ Environment variables configured"
echo ""
echo "🔗 Test the application:"
echo "   Frontend: https://www.verbfy.com"
echo "   API Health: https://api.verbfy.com/api/health"
'@

try {
    Write-Host "📡 Executing deployment commands on server..." -ForegroundColor Yellow
    
    # Execute the deployment script on the server
    $result = ssh -o StrictHostKeyChecking=no "$ServerUser@$ServerIP" $DeploymentScript
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 Next steps:" -ForegroundColor Blue
        Write-Host "1. Test login at https://www.verbfy.com/login"
        Write-Host "2. Check API health: https://api.verbfy.com/api/health"
        Write-Host "3. Monitor logs if needed"
        Write-Host ""
        Write-Host "🔧 If issues persist:" -ForegroundColor Yellow
        Write-Host "ssh root@46.62.161.121"
        Write-Host "cd /root/Verbfy"
        Write-Host "tail -f /var/log/verbfy-backend.log"
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔧 Manual troubleshooting:" -ForegroundColor Yellow
        Write-Host "ssh root@46.62.161.121"
        Write-Host "cd /root/Verbfy"
        Write-Host "./fix-cors-production.sh"
    }
} catch {
    Write-Host "❌ Error connecting to server: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Manual connection:" -ForegroundColor Yellow
    Write-Host "ssh root@46.62.161.121"
}

Write-Host ""
Write-Host "🚀 Verbfy deployment to Hetzner completed!" -ForegroundColor Green