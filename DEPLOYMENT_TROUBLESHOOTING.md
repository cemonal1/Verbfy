# Deployment Troubleshooting Guide

## Overview
This guide addresses common deployment issues and provides solutions for the Verbfy application deployment pipeline.

## Fixed Issues ✅

### 1. TypeScript Compilation Errors
All TypeScript errors have been resolved:
- ✅ Fixed `serverConfig` property error in `src/config/db.ts`
- ✅ Fixed CSP directive type error in `src/config/security.ts`
- ✅ Fixed `getHealthStatus` method error in `src/routes/performanceRoutes.ts`
- ✅ Fixed unknown properties in `src/services/cacheService.ts`
- ✅ Fixed null vs undefined type error in `src/services/performanceService.ts`

### 2. Frontend Deployment Configuration
- ✅ Added frontend service to `docker-compose.hetzner.yml`
- ✅ Updated nginx configuration to route traffic to frontend
- ✅ Removed problematic local frontend build step from GitHub Actions
- ✅ Added frontend health checks to deployment workflow

## Remaining Issues & Solutions

### 1. Slack Notifications Configuration

**Issue**: Slack webhook notifications are failing during deployment.

**Root Cause**: The `SLACK_WEBHOOK_URL` secret is not properly configured in GitHub repository settings.

**Solution**:
1. **Create a Slack Webhook**:
   - Go to your Slack workspace
   - Navigate to Apps → Incoming Webhooks
   - Create a new webhook for your deployment channel
   - Copy the webhook URL

2. **Configure GitHub Secret**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Add a new repository secret:
     - Name: `SLACK_WEBHOOK_URL`
     - Value: Your Slack webhook URL (e.g., `https://hooks.slack.com/services/...`)

3. **Test the Configuration**:
   - Trigger a deployment to test the Slack notifications
   - Check your Slack channel for deployment status messages

### 2. Directory Structure Issues

**Issue**: The deployment workflow was failing because it couldn't find the `verbfy-app` directory.

**Solution Applied**:
- Removed the local frontend build step from the GitHub Actions workflow
- The frontend is now built inside the Docker container during deployment
- This eliminates directory structure dependencies in the CI/CD pipeline

### 3. SSL Certificate Configuration

**Potential Issue**: SSL certificates for both `verbfy.com` and `api.verbfy.com` domains.

**Verification Steps**:
1. Ensure both domains are properly configured in DNS
2. Check that Let's Encrypt certificates are obtained for both domains:
   ```bash
   sudo certbot certificates
   ```
3. Verify nginx configuration includes both certificate paths:
   - `/etc/letsencrypt/live/verbfy.com/fullchain.pem`
   - `/etc/letsencrypt/live/api.verbfy.com/fullchain.pem`

## Deployment Architecture

### Current Setup
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│  Frontend       │    │   Backend API   │
│   (Port 80/443) │    │  (Port 3000)    │    │   (Port 5000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌─────────────────────────────────────────────────────────┐
    │                Docker Network                           │
    └─────────────────────────────────────────────────────────┘
```

### Domain Routing
- `verbfy.com` → Frontend (Next.js application)
- `api.verbfy.com` → Backend (Node.js API)

## Health Check Endpoints

### Backend Health Check
```bash
curl -f http://localhost:5000/api/health
```

### Frontend Health Check
```bash
curl -f http://localhost:3000
```

### Production Health Checks
```bash
# Backend
curl -f https://api.verbfy.com/api/health

# Frontend
curl -f https://verbfy.com
```

## Monitoring & Debugging

### Docker Logs
```bash
# View all service logs
docker compose -f docker-compose.hetzner.yml logs

# View specific service logs
docker compose -f docker-compose.hetzner.yml logs verbfy-backend
docker compose -f docker-compose.hetzner.yml logs verbfy-frontend
docker compose -f docker-compose.hetzner.yml logs nginx
```

### Service Status
```bash
# Check running containers
docker compose -f docker-compose.hetzner.yml ps

# Check container health
docker compose -f docker-compose.hetzner.yml exec verbfy-backend curl -f http://localhost:5000/api/health
docker compose -f docker-compose.hetzner.yml exec verbfy-frontend curl -f http://localhost:3000
```

## Emergency Recovery

### Quick Restart
```bash
cd /opt/verbfy
docker compose -f docker-compose.hetzner.yml down
docker compose -f docker-compose.hetzner.yml up -d --build
```

### Rollback to Previous Version
```bash
cd /opt/verbfy
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>
docker compose -f docker-compose.hetzner.yml down
docker compose -f docker-compose.hetzner.yml up -d --build
```

## Next Steps

1. **Configure Slack Webhook**: Follow the Slack notification configuration steps above
2. **Test Full Deployment**: Trigger a deployment and verify all services start correctly
3. **Monitor Performance**: Check application performance and resource usage
4. **Set Up Monitoring**: Consider adding application monitoring (e.g., Sentry, DataDog)

## Contact & Support

If you encounter issues not covered in this guide:
1. Check the GitHub Actions workflow logs
2. Review Docker container logs on the production server
3. Verify all required secrets are configured in GitHub repository settings
4. Ensure DNS records are properly configured for both domains