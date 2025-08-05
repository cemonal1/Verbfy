# 🚀 Verbfy Production Deployment Guide

This guide will help you deploy the Verbfy English learning platform to production with all necessary configurations for domain deployment.

## 📋 Prerequisites

### Domain Setup
- **Main Domain**: `verbfy.com`
- **API Subdomain**: `api.verbfy.com`
- **LiveKit Subdomain**: `livekit.verbfy.com`
- **SSL Certificates**: Let's Encrypt (automatic via Certbot)

### Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 50GB+ SSD
- **CPU**: 2+ cores
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

## 🔧 Step-by-Step Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/verbfy
sudo chown $USER:$USER /opt/verbfy
cd /opt/verbfy
```

### 2. Clone and Setup Project

```bash
# Clone the repository
git clone https://github.com/cemonal1/Verbfy.git .
git checkout main

# Remove old/duplicate directories
rm -rf client server livefy

# Set proper permissions
chmod +x deploy-production.sh
```

### 3. Environment Configuration

#### Frontend Environment
```bash
# Copy and configure frontend environment
cp verbfy-app/env.production.example verbfy-app/.env.production
nano verbfy-app/.env.production
```

**Required variables:**
```env
NEXT_PUBLIC_API_URL=https://api.verbfy.com
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.verbfy.com
NEXT_PUBLIC_LIVEKIT_CLOUD_URL=wss://livekit.verbfy.com
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://verbfy.com
```

#### Backend Environment
```bash
# Copy and configure backend environment
cp backend/env.production.example backend/.env.production
nano backend/.env.production
```

**Required variables:**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/verbfy?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://verbfy.com
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-jwt-refresh-secret-key-here
LIVEKIT_CLOUD_API_KEY=your-livekit-cloud-api-key
LIVEKIT_CLOUD_API_SECRET=your-livekit-cloud-api-secret
LIVEKIT_CLOUD_URL=wss://livekit.verbfy.com
LIVEKIT_SELF_API_KEY=your-livekit-self-hosted-api-key
LIVEKIT_SELF_API_SECRET=your-livekit-self-hosted-api-secret
LIVEKIT_SELF_URL=wss://livekit.verbfy.com
CORS_ORIGIN=https://verbfy.com
```

### 4. DNS Configuration

Configure your domain DNS records:

```
Type    Name    Value
A       @       YOUR_SERVER_IP
A       api     YOUR_SERVER_IP
A       livekit YOUR_SERVER_IP
CNAME   www     verbfy.com
```

### 5. SSL Certificate Setup

```bash
# Create SSL directories
sudo mkdir -p nginx/ssl nginx/webroot nginx/logs

# Set proper permissions
sudo chown -R $USER:$USER nginx/

# Create initial Nginx configuration for SSL
sudo nano nginx/nginx-ssl-init.conf
```

**Initial Nginx config for SSL:**
```nginx
server {
    listen 80;
    server_name verbfy.com www.verbfy.com api.verbfy.com livekit.verbfy.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

### 6. Initial Deployment

```bash
# Start services without SSL first
docker-compose -f docker-compose.production.yml up -d mongodb redis livekit-server

# Wait for services to be ready
sleep 30

# Start backend and frontend
docker-compose -f docker-compose.production.yml up -d verbfy-backend verbfy-frontend

# Check logs
docker-compose -f docker-compose.production.yml logs -f
```

### 7. SSL Certificate Generation

```bash
# Set environment variables for Certbot
export CERTBOT_EMAIL=your-email@verbfy.com
export DOMAIN_NAME=verbfy.com

# Generate SSL certificates
docker-compose -f docker-compose.production.yml run --rm certbot

# Start Nginx with SSL
docker-compose -f docker-compose.production.yml up -d nginx
```

### 8. Final Verification

```bash
# Check all services are running
docker-compose -f docker-compose.production.yml ps

# Test endpoints
curl -I https://verbfy.com
curl -I https://api.verbfy.com/health
curl -I https://livekit.verbfy.com

# Check SSL certificates
docker-compose -f docker-compose.production.yml exec nginx nginx -t
```

## 🔒 Security Checklist

### ✅ Completed Security Measures
- [x] HTTPS enforcement with HSTS
- [x] Security headers (X-Frame-Options, CSP, etc.)
- [x] Rate limiting on API endpoints
- [x] CORS configuration
- [x] JWT token security
- [x] Input validation and sanitization
- [x] SQL injection prevention (Mongoose)
- [x] XSS protection
- [x] CSRF protection

### 🔧 Additional Security Recommendations
- [ ] Set up firewall (UFW)
- [ ] Configure fail2ban
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Implement backup strategy
- [ ] Set up log aggregation
- [ ] Configure intrusion detection

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Automated health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
curl -f https://verbfy.com/health || echo "Frontend down"
curl -f https://api.verbfy.com/health || echo "Backend down"
curl -f https://livekit.verbfy.com || echo "LiveKit down"
EOF

chmod +x health-check.sh
```

### Backup Strategy
```bash
# Database backup
docker-compose -f docker-compose.production.yml exec mongodb mongodump --out /backup/$(date +%Y%m%d)

# Application backup
tar -czf verbfy-backup-$(date +%Y%m%d).tar.gz verbfy-app/ backend/ nginx/ docker-compose.production.yml
```

### Log Management
```bash
# View logs
docker-compose -f docker-compose.production.yml logs -f [service-name]

# Log rotation
sudo logrotate /etc/logrotate.d/verbfy
```

## 🚨 Troubleshooting

### Common Issues

#### 1. SSL Certificate Issues
```bash
# Renew certificates
docker-compose -f docker-compose.production.yml run --rm certbot renew

# Check certificate status
docker-compose -f docker-compose.production.yml exec nginx openssl x509 -in /etc/nginx/ssl/live/verbfy.com/fullchain.pem -text -noout
```

#### 2. Database Connection Issues
```bash
# Check MongoDB status
docker-compose -f docker-compose.production.yml exec mongodb mongo --eval "db.adminCommand('ping')"

# Check connection string
docker-compose -f docker-compose.production.yml exec verbfy-backend env | grep MONGO_URI
```

#### 3. LiveKit Issues
```bash
# Check LiveKit status
docker-compose -f docker-compose.production.yml exec livekit-server livekit-server --version

# Check WebSocket connection
curl -I -H "Connection: Upgrade" -H "Upgrade: websocket" https://livekit.verbfy.com
```

### Performance Optimization

#### 1. Database Optimization
```javascript
// Add indexes to MongoDB
db.reservations.createIndex({ "teacher": 1, "date": 1 })
db.reservations.createIndex({ "student": 1, "date": 1 })
db.users.createIndex({ "email": 1 })
```

#### 2. Caching Strategy
```bash
# Redis monitoring
docker-compose -f docker-compose.production.yml exec redis redis-cli info memory
docker-compose -f docker-compose.production.yml exec redis redis-cli info stats
```

## 📞 Support

For deployment issues:
1. Check logs: `docker-compose -f docker-compose.production.yml logs -f`
2. Verify environment variables
3. Test individual services
4. Check DNS propagation
5. Verify SSL certificate validity

## 🎉 Success!

Your Verbfy application is now deployed and ready for production use!

**Access URLs:**
- **Frontend**: https://verbfy.com
- **API**: https://api.verbfy.com
- **LiveKit**: https://livekit.verbfy.com

**Next Steps:**
1. Set up monitoring and alerting
2. Configure automated backups
3. Set up CI/CD pipeline
4. Implement user analytics
5. Set up payment processing (Stripe) 