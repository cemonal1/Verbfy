# 🚀 Production Deployment Guide

## Overview

This guide explains how to deploy Verbfy to production using Docker Compose with proper environment configuration.

## 🔧 Environment Setup

### 1. Backend Environment Variables

Copy `backend/env.production.example` to `backend/.env.production` and update with your production values:

```bash
cp backend/env.production.example backend/.env.production
```

**Critical Variables to Update:**

- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `JWT_REFRESH_SECRET` - Generate a different 64-char hex string
- `MONGO_URI` - Your production MongoDB connection string
- `LIVEKIT_CLOUD_API_KEY` - Your LiveKit Cloud API key
- `LIVEKIT_CLOUD_API_SECRET` - Your LiveKit Cloud API secret
- `STRIPE_SECRET_KEY` - Your production Stripe secret key
- `SMTP_*` - Your email service configuration

### 2. Frontend Environment Variables

Copy `verbfy-app/.env.production.example` to `verbfy-app/.env.production` and update:

```bash
cp verbfy-app/.env.production.example verbfy-app/.env.production
```

**Key Variables:**
- `NEXT_PUBLIC_API_URL` - Your backend API URL
- `NEXT_PUBLIC_LIVEKIT_URL` - Your LiveKit server URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

### 3. Docker Compose Environment

Create a `.env` file in the root directory for Docker Compose variables:

```bash
# Docker Compose Environment Variables
MONGO_ROOT_USERNAME=your_mongo_admin_user
MONGO_ROOT_PASSWORD=your_secure_mongo_password
REDIS_PASSWORD=your_secure_redis_password
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.your-domain.com
CERTBOT_EMAIL=admin@your-domain.com
DOMAIN_NAME=your-domain.com
```

## 🐳 Deployment Steps

### 1. Build and Start Services

```bash
# Build and start all services
docker compose -f docker-compose.production.yml up -d --build

# Check service status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f
```

### 2. SSL Certificate Setup

```bash
# Generate SSL certificates (first time only)
docker compose -f docker-compose.production.yml run --rm certbot

# Reload nginx after certificate generation
docker compose -f docker-compose.production.yml restart nginx
```

### 3. Database Initialization

```bash
# Access MongoDB to create initial admin user (if needed)
docker compose -f docker-compose.production.yml exec mongodb mongosh

# Or run any database migrations
docker compose -f docker-compose.production.yml exec verbfy-backend npm run migrate
```

## 🔒 Security Checklist

- [ ] All secrets are generated securely (64+ character random strings)
- [ ] Database passwords are strong and unique
- [ ] SSL certificates are properly configured
- [ ] Firewall rules are configured (only ports 80, 443 open)
- [ ] Regular backups are configured
- [ ] Monitoring and logging are set up
- [ ] Environment files are not committed to version control

## 📊 Monitoring

### Health Checks

```bash
# Check all services
curl https://api.your-domain.com/health
curl https://your-domain.com

# Check LiveKit
curl https://livekit.your-domain.com
```

### Logs

```bash
# View all logs
docker compose -f docker-compose.production.yml logs

# View specific service logs
docker compose -f docker-compose.production.yml logs verbfy-backend
docker compose -f docker-compose.production.yml logs verbfy-frontend
```

## 🔄 Updates and Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart services
docker compose -f docker-compose.production.yml up -d --build

# Clean up old images
docker system prune -f
```

### Backup Database

```bash
# Backup MongoDB
docker compose -f docker-compose.production.yml exec mongodb mongodump --out /data/backup

# Copy backup to host
docker cp verbfy-mongodb:/data/backup ./mongodb-backup-$(date +%Y%m%d)
```

## 🚨 Troubleshooting

### Common Issues

1. **Service won't start**: Check logs with `docker compose logs [service-name]`
2. **SSL issues**: Verify domain DNS and certificate generation
3. **Database connection**: Check MongoDB credentials and network connectivity
4. **LiveKit connection**: Verify API keys and WebSocket connectivity

### Useful Commands

```bash
# Restart specific service
docker compose -f docker-compose.production.yml restart [service-name]

# View resource usage
docker stats

# Access service shell
docker compose -f docker-compose.production.yml exec [service-name] sh
```

## 📞 Support

For deployment issues:
1. Check the logs first
2. Verify all environment variables are set correctly
3. Ensure all required ports are open
4. Check domain DNS configuration

---

**⚠️ Important**: Never commit `.env.production` files with real secrets to version control. Use environment variable injection in your deployment pipeline instead.