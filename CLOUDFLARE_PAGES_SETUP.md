# 🌩️ Cloudflare Pages Deployment Guide for Verbfy

## 🚀 Quick Fix for Current Issue

Your Cloudflare Pages deployment was failing due to **TypeScript build errors**. These have been fixed:

✅ **Fixed TypeScript Issues**:
- Fixed `AxiosProgressEvent` type in `UploadMaterialModal.tsx`
- Fixed `useLoginViewModel` destructuring in `LoginPage.tsx`
- Fixed generic type usage in `RegisterPage.tsx`

✅ **Added Cloudflare Pages Configuration**:
- Created `verbfy-app/public/_headers` for security headers
- Created `verbfy-app/public/_redirects` for proper routing
- Frontend build now completes successfully

---

## 📋 Cloudflare Pages Setup Instructions

### 1. **Repository Connection**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** → **Create a project**
3. Connect your Git repository
4. Select the **Verbfy** repository

### 2. **Build Configuration**
Set these build settings in Cloudflare Pages:

```
Framework preset: Next.js
Build command: cd verbfy-app && npm run build
Build output directory: verbfy-app/out
Root directory: /
```

**Note**: You need to configure Next.js for static export first (see below).

### 3. **Environment Variables**
Add these environment variables in Cloudflare Pages:

**Required Variables**:
```
NEXT_PUBLIC_API_URL=https://api.verbfy.com
NEXT_PUBLIC_API_BASE_URL=https://api.verbfy.com
```

**Optional Variables**:
```
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url
NEXT_PUBLIC_LIVEKIT_CLOUD_URL=wss://your-project.livekit.cloud
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

### 4. **Configure Next.js for Static Export**

Update `verbfy-app/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable static export for Cloudflare Pages
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  
  // Disable server-side features for static export
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Security headers (duplicated in _headers for CF Pages)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    domains: [
      'localhost',
      'verbfy.com',
      'api.verbfy.com',
      'cdn.verbfy.com',
    ],
    unoptimized: true, // Required for static export
  },
};

// Sentry configuration (optional)
let exported = nextConfig;
try {
  const { withSentryConfig } = require('@sentry/nextjs');
  exported = withSentryConfig(nextConfig, {
    silent: true,
    hideSourceMaps: true,
  });
} catch (_) {}

module.exports = exported;
```

### 5. **Update Package.json Scripts**

Add export script to `verbfy-app/package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "build:export": "next build && next export",
    "start": "next start -p 3000",
    "export": "next export",
    "lint": "next lint"
  }
}
```

---

## 🔧 Deployment Commands

### Option 1: Automatic Deployment
- Push your changes to GitHub
- Cloudflare Pages will automatically rebuild and deploy

### Option 2: Manual Build Test
```bash
cd verbfy-app
npm run build:export
```

---

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. **Build Fails with "Dynamic Server Usage"**
**Error**: `Error: Page "/some-page" is using dynamic server features...`

**Solution**: Remove server-side features from pages:
- Remove `getServerSideProps`
- Replace with `getStaticProps` or client-side data fetching
- Use static generation instead of server rendering

#### 2. **API Calls Fail**
**Error**: CORS or network errors

**Solution**: 
- Ensure backend allows requests from `your-site.pages.dev`
- Update CORS configuration in backend
- Check environment variables are set correctly

#### 3. **Images Not Loading**
**Error**: Next.js Image optimization errors

**Solution**: Already configured with `unoptimized: true`

#### 4. **Routing Issues (404 on refresh)**
**Error**: Page refreshes show 404

**Solution**: Already configured with `_redirects` file

---

## 🔒 Security Configuration

### Headers Configuration
Configured in `verbfy-app/public/_headers`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### Content Security Policy
Update if needed based on your external dependencies.

---

## 📈 Performance Optimization

### Automatic Optimizations
Cloudflare Pages provides:
- ✅ Global CDN
- ✅ Automatic minification
- ✅ Gzip compression
- ✅ HTTP/2 and HTTP/3
- ✅ Automatic HTTPS

### Custom Optimizations
- ✅ Image optimization disabled for static export
- ✅ CSS optimization enabled
- ✅ Bundle splitting configured

---

## 🔄 Custom Domain Setup

### 1. **Add Custom Domain**
1. In Cloudflare Pages, go to **Custom domains**
2. Add `verbfy.com` and `www.verbfy.com`

### 2. **DNS Configuration**
Set these DNS records in Cloudflare:
```
Type: CNAME
Name: verbfy.com
Value: your-project.pages.dev

Type: CNAME  
Name: www
Value: your-project.pages.dev
```

### 3. **SSL Configuration**
- SSL is automatic with Cloudflare Pages
- Edge certificates are provisioned automatically

---

## 📊 Monitoring and Analytics

### Available Metrics
- Page views and unique visitors
- Performance metrics
- Error rates
- Deployment history

### Integration Options
- Cloudflare Analytics (built-in)
- Google Analytics (configure with environment variable)
- Sentry error monitoring (configure with environment variable)

---

## 🚀 Next Steps

1. **Update your repository** with the fixed TypeScript issues (already done)
2. **Configure Next.js for static export** (update next.config.js)
3. **Set environment variables** in Cloudflare Pages dashboard
4. **Trigger a new deployment** by pushing to your repository
5. **Test the deployment** to ensure everything works

---

## 📞 Support

### If Issues Persist:
1. Check Cloudflare Pages build logs for specific errors
2. Verify all environment variables are set correctly
3. Test the build locally with `npm run build:export`
4. Ensure your backend CORS settings allow requests from your Pages domain

### Useful Commands:
```bash
# Test build locally
cd verbfy-app && npm run build

# Test static export
cd verbfy-app && npm run build:export

# Check for TypeScript errors
cd verbfy-app && npm run lint
```

---

**Your frontend should now deploy successfully to Cloudflare Pages!** 🎉

The main issue was the TypeScript build errors preventing the deployment. With those fixed and proper configuration, your site will work correctly.
