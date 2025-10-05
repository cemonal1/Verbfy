# Admin Notification System - Deployment Guide

## Overview

This document provides comprehensive instructions for deploying the Verbfy Admin Notification System, which includes real-time notifications, admin dashboard features, and Socket.IO integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Configuration](#database-configuration)
6. [Socket.IO Configuration](#socketio-configuration)
7. [Security Configuration](#security-configuration)
8. [Monitoring and Health Checks](#monitoring-and-health-checks)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)
11. [Post-Deployment Verification](#post-deployment-verification)

## Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **MongoDB**: v5.0 or higher
- **Redis**: v6.0 or higher (for Socket.IO scaling)
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Minimum 10GB available space

### Required Services

- MongoDB Atlas or self-hosted MongoDB instance
- Redis instance (for Socket.IO adapter in production)
- SSL certificates for HTTPS (recommended)
- Load balancer (for multi-instance deployments)

## Environment Setup

### 1. Environment Variables

Create the following environment files:

#### Backend Environment (`.env`)

```bash
# Database Configuration
MONGO_URI=mongodb://localhost:27017/verbfy
MONGO_URI_TEST=mongodb://localhost:27017/verbfy_test

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com

# Socket.IO Configuration
SOCKET_IO_CORS_ORIGIN=https://your-frontend-domain.com
REDIS_URL=redis://localhost:6379

# Admin Configuration
ADMIN_EMAIL=admin@verbfy.com
ADMIN_PASSWORD=secure-admin-password

# Notification Configuration
NOTIFICATION_BATCH_SIZE=100
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY=5000

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring Configuration
HEALTH_CHECK_INTERVAL=30000
SYSTEM_METRICS_INTERVAL=60000

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Frontend Environment (`.env.local`)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.com

# Environment
NEXT_PUBLIC_ENV=production

# Admin Configuration
NEXT_PUBLIC_ADMIN_NAMESPACE=/admin

# Feature Flags
NEXT_PUBLIC_ENABLE_ADMIN_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_REAL_TIME_UPDATES=true

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### 2. SSL Certificates

For production deployment, ensure you have valid SSL certificates:

```bash
# Example using Let's Encrypt
sudo certbot certonly --standalone -d your-backend-domain.com
sudo certbot certonly --standalone -d your-frontend-domain.com
```

## Backend Deployment

### 1. Build Process

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Run database migrations (if any)
npm run migrate

# Seed admin user
npm run seed:admin
```

### 2. Process Management with PM2

Install and configure PM2 for process management:

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'verbfy-backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

Start the application:

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### 3. Nginx Configuration

Create Nginx configuration for the backend:

```nginx
# /etc/nginx/sites-available/verbfy-backend
server {
    listen 80;
    server_name your-backend-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-backend-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-backend-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-backend-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API routes
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Socket.IO routes
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        access_log off;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/verbfy-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Frontend Deployment

### 1. Build Process

```bash
# Navigate to frontend directory
cd verbfy-app

# Install dependencies
npm ci

# Build the application
npm run build

# Test the build locally (optional)
npm start
```

### 2. Static Deployment (Recommended)

For Next.js static export:

```bash
# Add to next.config.js
module.exports = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

# Build and export
npm run build
```

### 3. Server Deployment with PM2

If using server-side rendering:

Create `ecosystem.frontend.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'verbfy-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/verbfy-app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '512M'
  }]
};
```

### 4. Nginx Configuration for Frontend

```nginx
# /etc/nginx/sites-available/verbfy-frontend
server {
    listen 80;
    server_name your-frontend-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-frontend-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-frontend-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-frontend-domain.com/privkey.pem;

    root /path/to/verbfy-app/out; # For static export
    index index.html;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Next.js static files
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if needed)
    location /api {
        proxy_pass https://your-backend-domain.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Database Configuration

### 1. MongoDB Setup

#### Production MongoDB Configuration

```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

#### Database Indexes

Create necessary indexes for optimal performance:

```javascript
// scripts/createIndexes.js
const mongoose = require('mongoose');
const User = require('../models/User');

async function createIndexes() {
  try {
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ isEmailVerified: 1 });

    // Add other model indexes as needed
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

module.exports = createIndexes;
```

### 2. Database Migration

```bash
# Run index creation
node scripts/createIndexes.js

# Create admin user
node scripts/createAdminUser.js
```

## Socket.IO Configuration

### 1. Redis Adapter Setup

For production scaling with multiple server instances:

```javascript
// config/socket.js
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

function setupSocketIO(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_IO_CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Redis adapter for scaling
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.IO Redis adapter connected');
    });
  }

  return io;
}

module.exports = setupSocketIO;
```

### 2. Load Balancer Configuration

For sticky sessions with multiple instances:

```nginx
# Add to nginx.conf
upstream backend {
    ip_hash; # Sticky sessions
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}

server {
    # ... other configuration

    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Security Configuration

### 1. Firewall Setup

```bash
# UFW configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. SSL/TLS Configuration

```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
```

### 3. Rate Limiting

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

module.exports = {
  authLimiter: createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts'),
  apiLimiter: createRateLimiter(15 * 60 * 1000, 100, 'Too many API requests'),
  adminLimiter: createRateLimiter(15 * 60 * 1000, 50, 'Too many admin requests')
};
```

## Monitoring and Health Checks

### 1. Health Check Endpoint

```javascript
// routes/health.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      version: process.env.npm_package_version || '1.0.0'
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
```

### 2. Monitoring with PM2

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# Monitor processes
pm2 monit
```

### 3. System Monitoring Script

```bash
#!/bin/bash
# monitoring/check-services.sh

# Check if services are running
check_service() {
    if pm2 describe $1 > /dev/null 2>&1; then
        echo "✓ $1 is running"
    else
        echo "✗ $1 is not running"
        pm2 restart $1
    fi
}

# Check backend
check_service "verbfy-backend"

# Check frontend (if using PM2)
check_service "verbfy-frontend"

# Check database connection
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✓ MongoDB is accessible"
else
    echo "✗ MongoDB is not accessible"
fi

# Check Redis connection
if redis-cli ping > /dev/null 2>&1; then
    echo "✓ Redis is accessible"
else
    echo "✗ Redis is not accessible"
fi
```

## Performance Optimization

### 1. Node.js Optimization

```javascript
// server.js optimizations
process.env.UV_THREADPOOL_SIZE = 128;

// Cluster mode for CPU-intensive tasks
if (process.env.NODE_ENV === 'production') {
  const cluster = require('cluster');
  const numCPUs = require('os').cpus().length;

  if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died`);
      cluster.fork();
    });
  } else {
    require('./app');
  }
}
```

### 2. Database Optimization

```javascript
// Connection pooling
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});

// Query optimization
const getUsersWithPagination = async (page, limit) => {
  return await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean(); // Use lean() for read-only operations
};
```

### 3. Caching Strategy

```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      res.sendResponse = res.json;
      res.json = (body) => {
        client.setex(key, duration, JSON.stringify(body));
        res.sendResponse(body);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Socket.IO Connection Issues

```bash
# Check if Socket.IO is accessible
curl -I http://localhost:5000/socket.io/

# Check WebSocket upgrade
curl -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" http://localhost:5000/socket.io/
```

#### 2. Database Connection Issues

```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/verbfy" --eval "db.runCommand({ping: 1})"

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### 3. Memory Issues

```bash
# Monitor memory usage
pm2 monit

# Check for memory leaks
node --inspect server.js
```

#### 4. Performance Issues

```bash
# Profile the application
npm install -g clinic
clinic doctor -- node server.js

# Check slow queries
db.setProfilingLevel(2, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(5)
```

### Log Analysis

```bash
# View application logs
pm2 logs verbfy-backend --lines 100

# View error logs only
pm2 logs verbfy-backend --err --lines 50

# Real-time log monitoring
tail -f logs/combined.log | grep ERROR
```

## Post-Deployment Verification

### 1. Automated Testing

```bash
# Run health checks
curl -f http://localhost:5000/api/health || exit 1

# Test admin authentication
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@verbfy.com","password":"your-password"}'

# Test Socket.IO connection
node scripts/test-socket-connection.js
```

### 2. Manual Verification Checklist

- [ ] Backend API endpoints respond correctly
- [ ] Admin login works
- [ ] Socket.IO connections establish successfully
- [ ] Real-time notifications are received
- [ ] Database queries execute within acceptable time
- [ ] SSL certificates are valid and properly configured
- [ ] Security headers are present in responses
- [ ] Rate limiting is working
- [ ] Error handling returns appropriate responses
- [ ] Logs are being written correctly
- [ ] Monitoring endpoints are accessible

### 3. Performance Verification

```bash
# Load testing with Artillery
npm install -g artillery
artillery quick --count 10 --num 100 http://localhost:5000/api/health

# WebSocket load testing
artillery run socket-load-test.yml
```

### 4. Security Verification

```bash
# SSL/TLS testing
nmap --script ssl-enum-ciphers -p 443 your-domain.com

# Security headers testing
curl -I https://your-domain.com

# Vulnerability scanning
npm audit
```

## Maintenance

### Regular Tasks

1. **Daily**
   - Check application logs for errors
   - Monitor system resources
   - Verify backup completion

2. **Weekly**
   - Update dependencies (after testing)
   - Review security logs
   - Performance analysis

3. **Monthly**
   - SSL certificate renewal check
   - Database optimization
   - Security audit

### Backup Strategy

```bash
# Database backup
mongodump --uri="mongodb://localhost:27017/verbfy" --out=/backups/$(date +%Y%m%d)

# Application backup
tar -czf /backups/verbfy-app-$(date +%Y%m%d).tar.gz /path/to/verbfy

# Automated backup script
0 2 * * * /scripts/backup.sh
```

## Support and Documentation

For additional support:

- **Technical Issues**: Create an issue in the project repository
- **Security Concerns**: Contact security@verbfy.com
- **Performance Issues**: Review the monitoring dashboard
- **Documentation Updates**: Submit a pull request

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
**Maintainer**: Verbfy Development Team