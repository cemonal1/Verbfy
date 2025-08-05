# 🚀 Verbfy Production Deployment Guide

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 50GB+ SSD
- **CPU**: 2+ cores
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Domain Setup
- **Main Domain**: `verbfy.com`
- **API Subdomain**: `api.verbfy.com`
- **LiveKit Subdomain**: `livekit.verbfy.com`
- **SSL Certificates**: Let's Encrypt (automatic via Certbot)

## 🔧 Step-by-Step Deployment

### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/verbfy
sudo chown $USER:$USER /opt/verbfy
cd /opt/verbfy

# Logout and login again for Docker group to take effect
exit
# SSH back into the server
```

### Step 2: Clone and Setup Project

```bash
# Clone the repository
git clone https://github.com/cemonal1/Verbfy.git .
git checkout main

# Set proper permissions
chmod +x deploy-production.sh
chmod +x start-dev.sh
chmod +x start-livekit.sh
```

### Step 3: Environment Configuration

#### Frontend Environment
```bash
# Copy and configure frontend environment
cp verbfy-app/env.production.example verbfy-app/.env.production
nano verbfy-app/.env.production
```

**Required variables for `verbfy-app/.env.production`:**
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.verbfy.com
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.verbfy.com
NEXT_PUBLIC_LIVEKIT_CLOUD_URL=wss://livekit.verbfy.com
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://verbfy.com

# Optional: Analytics (if implemented)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Optional: Sentry (if implemented)
# NEXT_PUBLIC_SENTRY_DSN=https://...
```

#### Backend Environment
```bash
# Copy and configure backend environment
cp backend/env.production.example backend/.env.production
nano backend/.env.production
```

**Required variables for `backend/.env.production`:**
```env
# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/verbfy?retryWrites=true&w=majority

# JWT Configuration (REQUIRED - Generate secure secrets for production)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-at-least-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-make-it-long-and-random-at-least-32-characters

# Server Configuration
PORT=5000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://verbfy.com
CORS_ORIGIN=https://verbfy.com

# LiveKit Configuration
LIVEKIT_CLOUD_API_KEY=your-livekit-cloud-api-key
LIVEKIT_CLOUD_API_SECRET=your-livekit-cloud-api-secret
LIVEKIT_CLOUD_URL=wss://livekit.verbfy.com
LIVEKIT_SELF_API_KEY=your-livekit-self-hosted-api-key
LIVEKIT_SELF_API_SECRET=your-livekit-self-hosted-api-secret
LIVEKIT_SELF_URL=wss://livekit.verbfy.com

# Redis Configuration (optional)
REDIS_URL=redis://:password@redis:6379

# Optional: Payment Configuration (for future Stripe integration)
# STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
# STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Optional: Email Configuration (for future email notifications)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

### Step 4: Generate Secure Secrets

```bash
# Generate JWT secrets (run these commands and copy the output)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Redis password
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Step 5: DNS Configuration

Configure your domain's DNS settings:

```bash
# A Records
verbfy.com          -> YOUR_SERVER_IP
www.verbfy.com      -> YOUR_SERVER_IP
api.verbfy.com      -> YOUR_SERVER_IP
livekit.verbfy.com  -> YOUR_SERVER_IP

# CNAME Records (if using CDN)
www.verbfy.com      -> verbfy.com
```

### Step 6: SSL Certificate Setup

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Generate SSL certificates
sudo certbot certonly --standalone \
  -d verbfy.com \
  -d www.verbfy.com \
  -d api.verbfy.com \
  -d livekit.verbfy.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Set up auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 7: Nginx Configuration

```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/verbfy

# Add the following configuration:
server {
    listen 80;
    server_name verbfy.com www.verbfy.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name verbfy.com www.verbfy.com;

    ssl_certificate /etc/letsencrypt/live/verbfy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/verbfy.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    server_name api.verbfy.com;

    ssl_certificate /etc/letsencrypt/live/api.verbfy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.verbfy.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    server_name livekit.verbfy.com;

    ssl_certificate /etc/letsencrypt/live/livekit.verbfy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/livekit.verbfy.com/privkey.pem;

    location / {
        proxy_pass http://localhost:7880;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/verbfy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 8: Database Setup

#### Option A: MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Get the connection string
5. Update the `MONGO_URI` in `backend/.env.production`

#### Option B: Self-hosted MongoDB
```bash
# Add MongoDB repository
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongosh
use verbfy
db.createUser({
  user: "verbfy_user",
  pwd: "your_secure_password",
  roles: ["readWrite"]
})
exit
```

### Step 9: Deploy Application

```bash
# Build and deploy
./deploy-production.sh

# Or manually:
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

### Step 10: Health Checks

```bash
# Check if services are running
docker ps

# Check frontend
curl -f https://verbfy.com/api/health

# Check backend
curl -f https://api.verbfy.com/api/health

# Check logs
docker-compose -f docker-compose.production.yml logs -f
```

## 🔒 Security Hardening

### 1. Firewall Configuration

```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Security Headers

Add to nginx configuration:
```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 3. Rate Limiting

Add to nginx configuration:
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... rest of configuration
}
```

## 📊 Monitoring Setup

### 1. Application Monitoring

```bash
# Install monitoring tools
sudo apt install htop nginx-full

# Set up log rotation
sudo nano /etc/logrotate.d/verbfy
```

Add to `/etc/logrotate.d/verbfy`:
```
/opt/verbfy/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

### 2. Database Monitoring

```bash
# Install MongoDB monitoring tools
sudo apt install mongodb-mongosh

# Set up database monitoring
# (Configure based on your monitoring solution)
```

## 🔄 Backup Strategy

### 1. Database Backup

```bash
# Create backup script
nano /opt/verbfy/backup.sh
```

Add to `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/verbfy/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --uri="your_mongodb_connection_string" --out=$BACKUP_DIR/mongodb_$DATE

# Compress backup
tar -czf $BACKUP_DIR/mongodb_$DATE.tar.gz -C $BACKUP_DIR mongodb_$DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/mongodb_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +7 -delete
```

### 2. Application Backup

```bash
# Backup application files
tar -czf /opt/verbfy/backups/app_$DATE.tar.gz /opt/verbfy
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5000

# Kill the process
sudo kill -9 <PID>
```

2. **Docker Issues**
```bash
# Clean up Docker
docker system prune -a
docker volume prune

# Restart Docker
sudo systemctl restart docker
```

3. **SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew
```

4. **Database Connection Issues**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection
mongosh "your_connection_string"
```

### Log Locations

- **Application logs**: `/opt/verbfy/logs/`
- **Nginx logs**: `/var/log/nginx/`
- **Docker logs**: `docker-compose logs -f`
- **System logs**: `/var/log/syslog`

## 📈 Performance Optimization

### 1. Frontend Optimization

```bash
# Enable gzip compression in nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/atom+xml
    image/svg+xml;
```

### 2. Backend Optimization

```bash
# Add to backend environment
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=2048"
```

### 3. Database Optimization

```bash
# Add indexes to MongoDB
db.users.createIndex({ "email": 1 })
db.users.createIndex({ "role": 1 })
db.reservations.createIndex({ "userId": 1 })
db.reservations.createIndex({ "date": 1 })
```

## 🎯 Post-Deployment Checklist

- [ ] All services are running (`docker ps`)
- [ ] SSL certificates are valid (`sudo certbot certificates`)
- [ ] Frontend is accessible (`https://verbfy.com`)
- [ ] Backend API is accessible (`https://api.verbfy.com`)
- [ ] LiveKit is accessible (`https://livekit.verbfy.com`)
- [ ] Database connection is working
- [ ] Authentication is working
- [ ] File uploads are working
- [ ] Real-time features are working
- [ ] Monitoring is set up
- [ ] Backups are configured
- [ ] Security headers are in place
- [ ] Rate limiting is configured
- [ ] Logs are being collected
- [ ] Performance is acceptable

## 🔄 Maintenance

### Daily Tasks
- Check application logs
- Monitor system resources
- Verify backups are running

### Weekly Tasks
- Update system packages
- Review security logs
- Check SSL certificate expiration
- Monitor disk usage

### Monthly Tasks
- Review performance metrics
- Update application dependencies
- Review and rotate secrets
- Test disaster recovery procedures

---

**Deployment Guide Version**: 1.0  
**Last Updated**: December 2024  
**Compatible with**: Verbfy v1.0.0 