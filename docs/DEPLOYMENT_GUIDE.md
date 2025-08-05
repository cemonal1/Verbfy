# Verbfy Deployment Guide

## 🚀 **Production Deployment Guide**

This guide provides comprehensive instructions for deploying the Verbfy platform to production environments.

---

## 📋 **Prerequisites**

### **System Requirements**
- **Server**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 50GB SSD
- **CPU**: 2+ cores
- **Network**: Stable internet connection

### **Software Requirements**
- **Node.js**: 18.x or higher
- **MongoDB**: 5.0 or higher
- **Redis**: 6.0 or higher (optional, for caching)
- **Nginx**: Latest stable version
- **Docker**: 20.10+ (optional, for containerized deployment)
- **PM2**: For process management

### **Domain & SSL**
- **Domain Name**: Registered domain for your application
- **SSL Certificate**: Valid SSL certificate (Let's Encrypt recommended)
- **DNS Configuration**: Proper DNS records

---

## 🏗️ **Architecture Overview**

### **Production Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Server    │    │  Database       │
│   (Nginx)       │───▶│   (Next.js)     │───▶│  (MongoDB)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Server    │    │   File Storage  │    │   Redis Cache   │
│   (Express.js)  │    │   (AWS S3)      │    │   (Optional)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Environment Separation**
- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live application environment

---

## 🔧 **Environment Setup**

### **1. Server Preparation**

#### **Update System**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### **Install Node.js**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### **Install MongoDB**
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### **Install Nginx**
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### **Install PM2**
```bash
sudo npm install -g pm2
```

### **2. Application Setup**

#### **Clone Repository**
```bash
# Create application directory
sudo mkdir -p /var/www/verbfy
sudo chown $USER:$USER /var/www/verbfy

# Clone repository
git clone https://github.com/your-org/verbfy.git /var/www/verbfy
cd /var/www/verbfy
```

#### **Install Dependencies**
```bash
# Install frontend dependencies
cd verbfy-app
npm install
npm run build

# Install backend dependencies
cd ../backend
npm install
```

---

## ⚙️ **Configuration**

### **1. Environment Variables**

#### **Frontend Configuration** (`verbfy-app/.env.production`)
```env
# Application
NEXT_PUBLIC_APP_URL=https://verbfy.com
NEXT_PUBLIC_API_URL=https://api.verbfy.com

# Database
MONGODB_URI=mongodb://localhost:27017/verbfy_production

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key

# LiveKit
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=verbfy-storage

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password

# Redis (Optional)
REDIS_URL=redis://localhost:6379
```

#### **Backend Configuration** (`backend/.env.production`)
```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/verbfy_production

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# LiveKit
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=verbfy-storage

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password

# Redis (Optional)
REDIS_URL=redis://localhost:6379
```

### **2. Nginx Configuration**

#### **Frontend Configuration** (`/etc/nginx/sites-available/verbfy-frontend`)
```nginx
server {
    listen 80;
    server_name verbfy.com www.verbfy.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name verbfy.com www.verbfy.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/verbfy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/verbfy.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Root directory
    root /var/www/verbfy/verbfy-app/.next;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static files
    location /_next/static/ {
        alias /var/www/verbfy/verbfy-app/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy
    location /api/ {
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
    
    # Main application
    location / {
        try_files $uri $uri/ /_next/server/pages/index.html;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

#### **Backend Configuration** (`/etc/nginx/sites-available/verbfy-api`)
```nginx
server {
    listen 80;
    server_name api.verbfy.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.verbfy.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.verbfy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.verbfy.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # CORS Headers
    add_header Access-Control-Allow-Origin "https://verbfy.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    
    # Proxy to backend
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### **3. Enable Nginx Sites**
```bash
# Enable sites
sudo ln -s /etc/nginx/sites-available/verbfy-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/verbfy-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 **SSL Certificate Setup**

### **Using Let's Encrypt**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificates
sudo certbot --nginx -d verbfy.com -d www.verbfy.com
sudo certbot --nginx -d api.verbfy.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🚀 **Application Deployment**

### **1. PM2 Configuration**

#### **Frontend PM2 Config** (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [
    {
      name: 'verbfy-frontend',
      cwd: '/var/www/verbfy/verbfy-app',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/verbfy/frontend-error.log',
      out_file: '/var/log/verbfy/frontend-out.log',
      log_file: '/var/log/verbfy/frontend-combined.log',
      time: true
    },
    {
      name: 'verbfy-backend',
      cwd: '/var/www/verbfy/backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/verbfy/backend-error.log',
      out_file: '/var/log/verbfy/backend-out.log',
      log_file: '/var/log/verbfy/backend-combined.log',
      time: true
    }
  ]
};
```

### **2. Start Applications**
```bash
# Create log directory
sudo mkdir -p /var/log/verbfy
sudo chown $USER:$USER /var/log/verbfy

# Start applications
cd /var/www/verbfy
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

---

## 📊 **Monitoring & Logging**

### **1. PM2 Monitoring**
```bash
# View application status
pm2 status

# Monitor resources
pm2 monit

# View logs
pm2 logs

# Restart applications
pm2 restart all
```

### **2. System Monitoring**
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor system resources
htop
```

### **3. Log Management**
```bash
# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View application logs
pm2 logs verbfy-frontend
pm2 logs verbfy-backend
```

---

## 🔄 **Deployment Automation**

### **1. Deployment Script** (`deploy.sh`)
```bash
#!/bin/bash

# Configuration
APP_DIR="/var/www/verbfy"
BACKUP_DIR="/var/backups/verbfy"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Verbfy deployment...${NC}"

# Create backup
echo -e "${YELLOW}Creating backup...${NC}"
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/verbfy_backup_$DATE.tar.gz -C $APP_DIR .

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes...${NC}"
cd $APP_DIR
git pull origin main

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
cd verbfy-app
npm install
npm run build

cd ../backend
npm install

# Restart applications
echo -e "${YELLOW}Restarting applications...${NC}"
pm2 restart all

# Check status
echo -e "${YELLOW}Checking application status...${NC}"
pm2 status

echo -e "${GREEN}Deployment completed successfully!${NC}"
```

### **2. Make Script Executable**
```bash
chmod +x deploy.sh
```

---

## 🔧 **Maintenance**

### **1. Regular Updates**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js (if needed)
sudo npm update -g npm

# Update PM2
sudo npm update -g pm2
```

### **2. Database Maintenance**
```bash
# MongoDB backup
mongodump --db verbfy_production --out /var/backups/mongodb/

# MongoDB restore
mongorestore --db verbfy_production /var/backups/mongodb/verbfy_production/
```

### **3. Log Rotation**
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/verbfy

# Add configuration
/var/log/verbfy/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Application Won't Start**
```bash
# Check logs
pm2 logs

# Check port availability
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :5000

# Restart services
pm2 restart all
```

#### **2. Nginx Issues**
```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

#### **3. Database Issues**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

#### **4. SSL Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Check SSL configuration
openssl s_client -connect verbfy.com:443 -servername verbfy.com
```

---

## 📞 **Support**

### **Emergency Contacts**
- **Technical Support**: tech@verbfy.com
- **Server Admin**: admin@verbfy.com
- **Emergency Hotline**: +1-800-VERBFY-1

### **Useful Commands**
```bash
# View all running processes
pm2 list

# Monitor system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check network connections
netstat -tlnp
```

---

*Last updated: January 2025*
*Version: 1.0.0* 