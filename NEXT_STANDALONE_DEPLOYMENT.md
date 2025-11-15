# Next.js Standalone Mode Deployment Guide

## Overview

This guide describes how to deploy the Verbfy frontend using Next.js standalone mode, which creates a minimal, production-optimized build with significantly reduced image size and faster startup times.

## What is Standalone Mode?

Next.js standalone mode creates a self-contained output in `.next/standalone` that includes:
- Minimal Node.js server
- Only necessary dependencies (not entire `node_modules`)
- Optimized for Docker and serverless deployment
- Typically 80-90% smaller than full deployment

## Build Modes

The Verbfy frontend supports two production build modes:

### 1. Standalone Mode (Recommended)
**Best for**: Docker, VMs, server deployments with SSR
**Benefits**: Full CSP nonce support, image optimization, minimal size
**Output**: `.next/standalone/server.js`

```bash
npm run build:standalone
npm run start:standalone
```

### 2. Static Export Mode
**Best for**: CDN, static hosting (Cloudflare Pages, Vercel, Netlify)
**Limitations**: No SSR, no nonces, no API routes
**Output**: `out/` directory with static HTML/CSS/JS

```bash
npm run build:static
```

## Deployment Options

### Option 1: Docker (Recommended)

#### Build Docker Image

```bash
# From verbfy-app directory
npm run docker:build

# Or directly with docker
docker build -f Dockerfile.standalone -t verbfy-app:latest .
```

#### Run Docker Container

```bash
# Run on port 3000
npm run docker:run

# Or with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=https://api.verbfy.com \
  verbfy-app:latest
```

#### Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./verbfy-app
      dockerfile: Dockerfile.standalone
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${API_URL}
      - NEXT_PUBLIC_SOCKET_URL=${SOCKET_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Option 2: Direct Node.js Deployment

#### Build and Start

```bash
# Build standalone bundle
npm run build:standalone

# Start server
npm run start:standalone

# Or with PM2
pm2 start .next/standalone/server.js --name verbfy-frontend
```

#### PM2 Ecosystem File

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'verbfy-frontend',
    script: '.next/standalone/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    }
  }]
};
```

### Option 3: Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: verbfy-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: verbfy-frontend
  template:
    metadata:
      labels:
        app: verbfy-frontend
    spec:
      containers:
      - name: frontend
        image: verbfy-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.verbfy.com"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: verbfy-frontend
spec:
  selector:
    app: verbfy-frontend
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## File Structure

After building in standalone mode:

```
.next/
├── standalone/
│   ├── server.js          # Minimal Next.js server
│   ├── package.json       # Minimal dependencies only
│   ├── node_modules/      # Only required packages
│   └── .next/            # Build artifacts
├── static/                # Static assets
└── .next/cache/           # Build cache
```

## Size Comparison

| Mode | Size | Notes |
|------|------|-------|
| Full node_modules | ~800 MB | All dependencies |
| Standalone | ~100 MB | Minimal dependencies only |
| Static export | ~50 MB | HTML/CSS/JS only, no server |

## Environment Variables

Required environment variables for production:

```env
# Production mode
NODE_ENV=production

# API endpoints
NEXT_PUBLIC_API_URL=https://api.verbfy.com
NEXT_PUBLIC_SOCKET_URL=wss://api.verbfy.com
NEXT_PUBLIC_LIVEKIT_URL=https://livekit.verbfy.com

# Optional
NEXT_PUBLIC_SENTRY_DSN=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

## Performance Optimizations

### 1. Image Optimization

Standalone mode enables Next.js Image Optimization:

```tsx
import Image from 'next/image';

<Image
  src="/avatar.jpg"
  alt="User avatar"
  width={100}
  height={100}
  // Automatic optimization, WebP conversion, lazy loading
/>
```

### 2. Bundle Splitting

Next.js automatically splits bundles:
- React/React-DOM: Separate chunk
- UI libraries: Separate chunks
- Route-based code splitting

### 3. Caching

Configure caching headers in `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

## Health Checks

The application exposes `/api/health` endpoint:

```bash
# Check application health
curl http://localhost:3000/api/health

# Response
{
  "status": "healthy",
  "timestamp": "2025-11-15T14:55:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

## Monitoring

### Docker Logs

```bash
# View logs
docker logs -f verbfy-frontend

# Follow specific container
docker logs -f <container-id>
```

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs verbfy-frontend

# Metrics
pm2 metrics
```

## Troubleshooting

### Issue: Build fails with "Module not found"

**Solution**: Ensure all dependencies are in `dependencies`, not `devDependencies`

```bash
# Move package from dev to production
npm install <package> --save
```

### Issue: Static files not loading

**Solution**: Copy static files after build

```bash
# Ensure public and .next/static are copied
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

### Issue: Environment variables not working

**Solution**: Prefix client-side variables with `NEXT_PUBLIC_`

```env
# ✅ Accessible in browser
NEXT_PUBLIC_API_URL=https://api.verbfy.com

# ❌ Only available server-side
API_SECRET_KEY=secret
```

## Rollback Strategy

### Docker Rollback

```bash
# Tag previous version
docker tag verbfy-app:latest verbfy-app:previous

# Build new version
docker build -t verbfy-app:latest .

# If issues, rollback
docker run verbfy-app:previous
```

### PM2 Rollback

```bash
# Keep previous build
mv .next/standalone .next/standalone.previous

# Build new version
npm run build:standalone

# If issues, rollback
rm -rf .next/standalone
mv .next/standalone.previous .next/standalone
pm2 restart verbfy-frontend
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          cd verbfy-app
          docker build -f Dockerfile.standalone -t verbfy-app:${{ github.sha }} .

      - name: Push to registry
        run: |
          docker tag verbfy-app:${{ github.sha }} registry.example.com/verbfy-app:latest
          docker push registry.example.com/verbfy-app:latest

      - name: Deploy to production
        run: |
          # Deploy to your infrastructure
          kubectl set image deployment/verbfy-frontend frontend=registry.example.com/verbfy-app:latest
```

## Security Considerations

1. **Run as non-root user** (Dockerfile includes this)
2. **Enable CSP nonces** (automatic in standalone mode)
3. **Set security headers** (configured in `next.config.js`)
4. **Use HTTPS** (configure via reverse proxy)
5. **Environment variables** (never commit secrets to git)

## References

- [Next.js Output File Tracing](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## Support

For issues or questions:
1. Check application logs
2. Verify environment variables
3. Test health check endpoint
4. Review build output
5. Contact DevOps team
