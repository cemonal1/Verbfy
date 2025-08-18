# Comprehensive Backend Fix Guide

## Current Issue Analysis
The backend API (api.verbfy.com) returns 502 Bad Gateway, meaning:
1. Nginx is running but cannot connect to the backend container
2. Backend container might be crashed, not running, or misconfigured
3. Docker network issues between nginx and backend containers

## Step-by-Step Fix

### 1. Check Container Status
```bash
# SSH to your Hetzner server
ssh root@46.62.161.121

# Check running containers
docker ps

# Check all containers (including stopped)
docker ps -a

# Check logs
docker logs verbfy-backend
docker logs verbfy-nginx
```

### 2. Check Backend Environment Variables
```bash
# Verify backend .env file exists and has required values
cat /opt/verbfy/backend/.env

# Should contain:
# MONGO_URI=mongodb+srv://Verbfy:Verbfy@verbfy.kxzpcit.mongodb.net/verbfy?retryWrites=true&w=majority
# JWT_SECRET=ddb2070e412a4e227a233c3ed275d1cc6603ce9f9a0bfda81ecbbbbab81fd491
# JWT_REFRESH_SECRET=ddb2070e412a4e227a233c3ed275d1cc6603ce9f9a0bfda81ecbbbbab81fd491_refresh
# FRONTEND_URL=https://verbfy.com
# BACKEND_URL=https://api.verbfy.com
# COOKIE_DOMAIN=.verbfy.com
# CORS_EXTRA_ORIGINS=https://www.verbfy.com,https://verbfy.com
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# SMTP_HOST=privatemail.com
# SMTP_PORT=587
# SMTP_USER=noreply@verbfy.com
# SMTP_PASS=Verbfy1940
# SMTP_FROM=noreply@verbfy.com
```

### 3. Restart Services
```bash
cd /opt/verbfy

# Stop all services
docker compose -f docker-compose.hetzner.yml down

# Remove any orphaned containers
docker container prune -f

# Rebuild and start
docker compose -f docker-compose.hetzner.yml up -d --build

# Check status
docker ps
docker logs verbfy-backend
docker logs verbfy-nginx
```

### 4. Test Backend Directly
```bash
# Test if backend container is responding internally
docker exec verbfy-backend curl -s http://localhost:5000/api/health

# Should return: {"status":"ok","timestamp":"...","uptime":...}
```

### 5. Check Nginx Configuration
```bash
# Verify nginx config syntax
docker exec verbfy-nginx nginx -t

# If syntax error, update nginx.conf
```

### 6. SSL Certificate Check
```bash
# Check if SSL certificate exists
ls -la /etc/letsencrypt/live/api.verbfy.com/

# If missing, obtain certificate
docker compose -f docker-compose.hetzner.yml stop nginx
docker run --rm -p 80:80 \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/html:/var/www/html \
  certbot/certbot certonly --standalone \
  -d api.verbfy.com \
  -m your-email@example.com \
  --agree-tos --no-eff-email -n

# Restart nginx
docker compose -f docker-compose.hetzner.yml start nginx
```

### 7. Network Connectivity Test
```bash
# Test container-to-container connectivity
docker exec verbfy-nginx ping verbfy-backend
docker exec verbfy-nginx curl -s http://verbfy-backend:5000/api/health
```

## Quick Fix Commands (Run These First)

```bash
# 1. SSH to server
ssh root@46.62.161.121

# 2. Go to app directory
cd /opt/verbfy

# 3. Check container status
docker ps -a

# 4. If backend is not running, check logs
docker logs verbfy-backend

# 5. Restart everything
docker compose -f docker-compose.hetzner.yml down
docker compose -f docker-compose.hetzner.yml up -d --build

# 6. Wait 30 seconds, then test
sleep 30
curl -s https://api.verbfy.com/api/health
```

## Expected Results After Fix
- `https://api.verbfy.com/api/health` returns JSON with status "ok"
- `https://verbfy.com` loads frontend properly
- Google OAuth login works (popup closes, user gets logged in)
- Registration form works
- No more 502 errors

## If Problems Persist
1. Check MongoDB connectivity from backend container
2. Verify all environment variables are correctly set
3. Check firewall settings (ports 80, 443, 5000)
4. Verify DNS settings for api.verbfy.com point to correct IP
5. Check Docker daemon status and restart if needed

## Environment Variables Template
Create this as `/opt/verbfy/backend/.env`:

```env
MONGO_URI=mongodb+srv://Verbfy:Verbfy@verbfy.kxzpcit.mongodb.net/verbfy?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
JWT_SECRET=ddb2070e412a4e227a233c3ed275d1cc6603ce9f9a0bfda81ecbbbbab81fd491
JWT_REFRESH_SECRET=ddb2070e412a4e227a233c3ed275d1cc6603ce9f9a0bfda81ecbbbbab81fd491_refresh
FRONTEND_URL=https://verbfy.com
BACKEND_URL=https://api.verbfy.com
COOKIE_DOMAIN=.verbfy.com
CORS_EXTRA_ORIGINS=https://www.verbfy.com,https://verbfy.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email
SMTP_HOST=privatemail.com
SMTP_PORT=587
SMTP_USER=noreply@verbfy.com
SMTP_PASS=Verbfy1940
SMTP_FROM=noreply@verbfy.com
```
