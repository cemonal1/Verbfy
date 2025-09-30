# 🔧 Environment Configuration Guide

## Overview

This document explains how environment variables are managed in the Verbfy application for different deployment scenarios.

## 📁 Environment Files Structure

```
├── backend/
│   ├── .env                     # Development environment
│   ├── .env.staging            # Staging environment  
│   ├── .env.production         # Production placeholders (CI/CD safe)
│   └── env.production.example  # Production template
├── verbfy-app/
│   ├── .env.local              # Local development overrides
│   ├── .env.production         # Production placeholders (CI/CD safe)
│   └── .env.production.example # Production template (if exists)
└── docker-compose.production.yml # Docker environment references
```

## 🚨 Important Security Notes

### **Safe to Commit** ✅
- `backend/.env.production` - Contains placeholder values only
- `verbfy-app/.env.production` - Contains placeholder values only
- `*.env.example` files - Template files with no real secrets

### **NEVER Commit** ❌
- `.env.production.real` - Real production secrets
- `.env` with real database credentials
- Any file with actual API keys, passwords, or tokens

## 🔄 Environment Management by Stage

### **Development** 
```bash
# Use local .env files
backend/.env
verbfy-app/.env.local
```

### **CI/CD Pipeline**
```bash
# Uses placeholder files for validation
backend/.env.production     # Placeholder values
verbfy-app/.env.production  # Placeholder values
```

### **Production Deployment**
```bash
# Real secrets injected via:
# - GitHub Actions secrets
# - Environment variable injection
# - Server-side configuration
```

## 🛠️ Setup Instructions

### **For Development**
1. Copy example files:
   ```bash
   cp backend/env.example backend/.env
   cp backend/env.production.example backend/.env.production.real
   ```

2. Update with your development values:
   ```bash
   # Edit backend/.env with local database URLs, etc.
   nano backend/.env
   ```

### **For CI/CD**
- ✅ Files already configured with placeholder values
- ✅ Safe for automated testing and validation
- ✅ No additional setup required

### **For Production**
1. **Option A: GitHub Actions Secrets**
   ```yaml
   # In .github/workflows/deploy-production.yml
   - name: Create production environment
     run: |
       echo "MONGO_URI=${{ secrets.MONGO_URI }}" > backend/.env.production
       echo "JWT_SECRET=${{ secrets.JWT_SECRET }}" >> backend/.env.production
   ```

2. **Option B: Server-side Management**
   ```bash
   # On production server
   cp backend/env.production.example backend/.env.production.real
   # Edit with real values
   nano backend/.env.production.real
   ```

3. **Option C: Environment Variable Injection**
   ```bash
   # Docker Compose with environment variables
   MONGO_URI=real-value docker compose up
   ```

## 📋 Required Variables by Component

### **Backend (`backend/.env.production`)**
```bash
# Database
MONGO_URI=mongodb://...

# Authentication
JWT_SECRET=64-char-hex-string
JWT_REFRESH_SECRET=different-64-char-hex-string

# External Services
LIVEKIT_CLOUD_API_KEY=your-key
LIVEKIT_CLOUD_API_SECRET=your-secret
STRIPE_SECRET_KEY=sk_live_...
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email
SMTP_PASS=your-password

# AWS (if using S3)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=your-bucket
```

### **Frontend (`verbfy-app/.env.production`)**
```bash
# API Endpoints
NEXT_PUBLIC_API_URL=https://api.verbfy.com
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.verbfy.com

# Public Keys (safe to expose)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...

# Environment
NODE_ENV=production
```

### **Docker Compose Environment**
```bash
# In root .env file or environment variables
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure-password
REDIS_PASSWORD=secure-password
LIVEKIT_API_KEY=your-key
LIVEKIT_API_SECRET=your-secret
DOMAIN_NAME=verbfy.com
CERTBOT_EMAIL=admin@verbfy.com
```

## 🔍 Validation and Testing

### **Check Environment Files**
```bash
# Verify files exist
ls -la backend/.env.production
ls -la verbfy-app/.env.production

# Validate Docker Compose configuration
docker compose -f docker-compose.production.yml config
```

### **Test CI/CD Pipeline**
```bash
# The CI workflow will automatically:
# 1. Verify environment files exist
# 2. Build backend with environment
# 3. Build frontend with environment
# 4. Validate Docker Compose configuration
```

## 🚀 Deployment Checklist

### **Before Production Deployment**
- [ ] All placeholder values replaced with real secrets
- [ ] Database credentials are secure and tested
- [ ] API keys are valid and have proper permissions
- [ ] SSL certificates are configured
- [ ] Domain DNS is properly configured
- [ ] Backup and monitoring systems are in place

### **Security Verification**
- [ ] No real secrets committed to version control
- [ ] Environment files have proper permissions (600)
- [ ] Secrets are rotated regularly
- [ ] Access logs are monitored
- [ ] 2FA enabled on all service accounts

## 🆘 Troubleshooting

### **CI/CD Issues**
```bash
# If environment files are missing:
git add backend/.env.production verbfy-app/.env.production
git commit -m "Add environment placeholder files"

# If Docker Compose validation fails:
docker compose -f docker-compose.production.yml config
```

### **Production Issues**
```bash
# Check environment variables are loaded:
docker compose exec verbfy-backend env | grep MONGO_URI
docker compose exec verbfy-frontend env | grep NEXT_PUBLIC_API_URL

# Verify service connectivity:
docker compose exec verbfy-backend curl http://localhost:5000/health
```

---

**Remember**: The `.env.production` files in this repository contain only placeholder values and are safe for CI/CD validation. Real production secrets should never be committed to version control.