# 🚀 Verbfy Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. **Environment Configuration**
- [ ] Copy `backend/env.production.example` to `backend/.env`
- [ ] Set all required environment variables:
  - [ ] `MONGO_URI` - MongoDB connection string
  - [ ] `JWT_SECRET` - Secure 64-character hex string
  - [ ] `JWT_REFRESH_SECRET` - Different secure 64-character hex string
  - [ ] `FRONTEND_URL` - https://verbfy.com
  - [ ] `BACKEND_URL` - https://api.verbfy.com
  - [ ] LiveKit configuration (Cloud or Self-hosted)
  - [ ] SMTP email configuration
  - [ ] Stripe payment configuration (if needed)
  - [ ] AWS S3 configuration (for file uploads)

### 2. **SSL Certificates**
- [ ] SSL certificate for `api.verbfy.com` exists in `/etc/letsencrypt/live/api.verbfy.com/`
- [ ] Certificate is valid and not expired
- [ ] Auto-renewal is configured

### 3. **Server Requirements**
- [ ] Node.js 18+ installed
- [ ] Docker and Docker Compose installed
- [ ] Nginx installed (for SSL termination)
- [ ] MongoDB accessible (Atlas or self-hosted)
- [ ] Sufficient disk space (minimum 10GB free)
- [ ] Sufficient RAM (minimum 2GB)

### 4. **Security**
- [ ] Firewall configured (ports 80, 443 open)
- [ ] All secrets are cryptographically secure
- [ ] No default/example values in production environment
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Regular security updates enabled

## 🛠️ Deployment Steps

### Step 1: Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nodejs npm docker.io docker-compose nginx certbot

# Add user to docker group
sudo usermod -aG docker $USER
```

### Step 2: SSL Certificate Setup
```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get SSL certificate
sudo certbot certonly --standalone -d api.verbfy.com

# Start nginx
sudo systemctl start nginx
```

### Step 3: Clone and Setup Project
```bash
# Clone repository
git clone <your-repo-url> /opt/verbfy
cd /opt/verbfy

# Set proper permissions
sudo chown -R $USER:$USER /opt/verbfy
```

### Step 4: Environment Configuration
```bash
# Create production environment file
cp backend/env.production.example backend/.env

# Edit environment variables
nano backend/.env

# Generate secure JWT secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Build and Deploy
```bash
# Run setup script
./setup-production.sh

# Deploy with Docker
docker-compose -f docker-compose.hetzner.yml up -d --build

# Check status
docker ps
docker-compose -f docker-compose.hetzner.yml logs
```

## 🔍 Post-Deployment Verification

### Health Checks
- [ ] Backend health check: `curl https://api.verbfy.com/api/health`
- [ ] Database connection working
- [ ] SSL certificate valid
- [ ] All containers running: `docker ps`
- [ ] No error logs: `docker-compose -f docker-compose.hetzner.yml logs`

### Functional Tests
- [ ] User registration works
- [ ] User login works
- [ ] Email sending works (password reset)
- [ ] File upload works
- [ ] LiveKit video calls work (if configured)
- [ ] Payment processing works (if configured)

### Performance Tests
- [ ] Response time < 2 seconds
- [ ] Memory usage stable
- [ ] CPU usage reasonable
- [ ] Disk space sufficient

## 🔧 Troubleshooting

### Common Issues

#### 1. **502 Bad Gateway**
```bash
# Check backend container
docker logs verbfy-backend

# Check nginx configuration
sudo nginx -t

# Restart services
docker-compose -f docker-compose.hetzner.yml restart
```

#### 2. **Database Connection Failed**
```bash
# Check environment variables
grep MONGO_URI backend/.env

# Test connection from container
docker exec verbfy-backend node -e "require('mongoose').connect(process.env.MONGO_URI).then(() => console.log('Connected')).catch(console.error)"
```

#### 3. **SSL Certificate Issues**
```bash
# Check certificate validity
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Restart nginx
sudo systemctl restart nginx
```

#### 4. **LiveKit Connection Issues**
- [ ] Check LiveKit configuration in environment variables
- [ ] Verify LiveKit service is accessible
- [ ] Check firewall rules for WebSocket connections

### Log Locations
- Backend logs: `docker logs verbfy-backend`
- Nginx logs: `/var/log/nginx/error.log`
- System logs: `journalctl -u docker`

## 🔄 Maintenance

### Regular Tasks
- [ ] **Weekly**: Check logs for errors
- [ ] **Weekly**: Monitor resource usage
- [ ] **Monthly**: Update Docker images
- [ ] **Monthly**: Review security logs
- [ ] **Quarterly**: Rotate JWT secrets
- [ ] **Quarterly**: Update SSL certificates

### Backup Strategy
- [ ] Database backups configured
- [ ] File uploads backed up
- [ ] Environment variables backed up (securely)
- [ ] SSL certificates backed up

### Monitoring Setup
- [ ] Set up monitoring dashboard
- [ ] Configure alerts for downtime
- [ ] Monitor resource usage
- [ ] Set up log aggregation

## 📞 Support

### Emergency Contacts
- Server Administrator: [Your Contact]
- Database Administrator: [Your Contact]
- Security Team: [Your Contact]

### Useful Commands
```bash
# View all containers
docker ps -a

# View logs in real-time
docker-compose -f docker-compose.hetzner.yml logs -f

# Restart specific service
docker-compose -f docker-compose.hetzner.yml restart verbfy-backend

# Update and redeploy
git pull origin main
docker-compose -f docker-compose.hetzner.yml up -d --build

# Backup database
docker exec verbfy-backend mongodump --uri="$MONGO_URI" --out=/backup

# Check disk usage
df -h
docker system df
```

## 🎯 Success Criteria

The deployment is considered successful when:
- [ ] All health checks pass
- [ ] SSL certificate is valid and auto-renewing
- [ ] All core features work as expected
- [ ] Performance meets requirements
- [ ] Monitoring and alerts are configured
- [ ] Backup strategy is implemented
- [ ] Documentation is up to date

---

**Last Updated**: $(date)
**Deployed By**: [Your Name]
**Environment**: Production