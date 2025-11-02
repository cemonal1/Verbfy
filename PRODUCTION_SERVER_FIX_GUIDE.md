# 🚀 Verbfy Production Server Fix Guide

## 🚨 Current Issues Identified

1. **CORS Error**: Frontend (www.verbfy.com) cannot access API (api.verbfy.com)
2. **502 Bad Gateway**: Backend service may not be running properly
3. **Domain Mismatch**: Configuration expects verbfy.com but frontend uses www.verbfy.com

## 🔧 Step-by-Step Fix Process

### Step 1: Connect to Production Server

```bash
ssh root@46.62.161.121
```

### Step 2: Check Current Status

```bash
# Check if backend is running
ps aux | grep node
netstat -tlnp | grep :5000

# Check Nginx status
systemctl status nginx

# Check logs
tail -f /var/log/nginx/error.log
tail -f /var/log/verbfy-backend.log
```

### Step 3: Navigate to Project Directory

```bash
cd /root/Verbfy
git pull origin main
```

### Step 4: Run the CORS Fix Script

```bash
# Make scripts executable
chmod +x fix-cors-production.sh
chmod +x test-cors.sh

# Run the fix
./fix-cors-production.sh
```

### Step 5: Manual Fix if Script Fails

If the automated script fails, follow these manual steps:

#### A. Update Backend Environment

```bash
cd /root/Verbfy/backend

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Create new .env with proper CORS settings
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb://admin:VerbfyDB2024!@localhost:27017/verbfy?authSource=admin

# JWT Secrets
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
```

#### B. Rebuild and Restart Backend

```bash
# Install dependencies and build
npm install
npm run build

# Kill existing process
pkill -f "node.*index.js" || true

# Start backend
nohup npm start > /var/log/verbfy-backend.log 2>&1 &

# Check if started
sleep 5
ps aux | grep node
```

#### C. Update Nginx Configuration

```bash
# Check current Nginx config
cat /etc/nginx/sites-available/verbfy

# If CORS headers are missing, add them
nano /etc/nginx/sites-available/verbfy
```

Add these CORS headers to the API location block:

```nginx
location /api/ {
    # CORS Headers
    add_header 'Access-Control-Allow-Origin' 'https://www.verbfy.com' always;
    add_header 'Access-Control-Allow-Origin' 'https://verbfy.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://www.verbfy.com' always;
        add_header 'Access-Control-Allow-Origin' 'https://verbfy.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Content-Length' 0;
        return 204;
    }
    
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### D. Restart Nginx

```bash
# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl status nginx
```

### Step 6: Test the Fix

```bash
# Run the test script
./test-cors.sh

# Manual tests
curl -I https://api.verbfy.com/api/health

# Test CORS preflight
curl -I \
  -H "Origin: https://www.verbfy.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -X OPTIONS \
  https://api.verbfy.com/api/auth/login
```

### Step 7: Monitor Logs

```bash
# Watch backend logs
tail -f /var/log/verbfy-backend.log

# Watch Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🔍 Troubleshooting

### If Backend Won't Start

```bash
# Check for port conflicts
netstat -tlnp | grep :5000

# Check MongoDB connection
mongo --host localhost --port 27017 -u admin -p

# Check environment variables
cd /root/Verbfy/backend
node -e "require('dotenv').config(); console.log(process.env.MONGO_URI);"
```

### If CORS Still Fails

```bash
# Check Nginx is serving CORS headers
curl -I -H "Origin: https://www.verbfy.com" https://api.verbfy.com/api/health

# Check backend CORS configuration
cd /root/Verbfy/backend
grep -r "cors" src/
```

### If SSL Issues

```bash
# Check SSL certificates
certbot certificates

# Renew if needed
certbot renew --dry-run
```

## 📋 Verification Checklist

- [ ] Backend service running on port 5000
- [ ] MongoDB connection working
- [ ] Nginx serving both domains (verbfy.com and www.verbfy.com)
- [ ] CORS headers present in API responses
- [ ] SSL certificates valid
- [ ] Frontend can access API endpoints
- [ ] Login functionality working

## 🚨 Emergency Rollback

If something goes wrong:

```bash
# Restore previous .env
cd /root/Verbfy/backend
cp .env.backup.* .env

# Restart services
pkill -f "node.*index.js"
npm start &
systemctl restart nginx
```

## 📞 Support Commands

```bash
# Check all services
systemctl status nginx mongodb
ps aux | grep node

# Check network connectivity
netstat -tlnp | grep -E ":(80|443|5000|27017)"

# Check disk space
df -h

# Check memory usage
free -h
```

---

**After completing these steps, the CORS issue should be resolved and the frontend should be able to communicate with the backend API successfully.**