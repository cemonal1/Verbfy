# 🌩️ Cloudflare Pages Deployment Guide - Verbfy Frontend

## ✅ **Changes Successfully Pushed to GitHub!**

All bug fixes and Cloudflare Pages configuration have been pushed to your main branch. Now follow these steps:

---

## 🚀 **Step 1: Connect GitHub Repository to Cloudflare Pages**

### 1.1 Access Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. Navigate to **Pages** in the left sidebar
4. Click **"Create a project"**

### 1.2 Connect Repository
1. Click **"Connect to Git"**
2. Select **GitHub** as provider
3. Authorize Cloudflare to access your GitHub account
4. Select repository: **`cemonal1/Verbfy`**
5. Click **"Begin setup"**

---

## ⚙️ **Step 2: Configure Build Settings**

Use these exact settings in Cloudflare Pages:

### 🔧 **Build Configuration**
```
Project name: verbfy-frontend
Production branch: main
Root directory: verbfy-app
Build command: npm run build
Build output directory: out
```

### 📦 **Framework Preset**
- Framework preset: **Next.js (Static HTML Export)**
- Node.js version: **18** (or latest available)

---

## 🌍 **Step 3: Environment Variables**

In Cloudflare Pages, add these environment variables:

### Production Environment Variables:
```
NEXT_PUBLIC_API_URL=https://api.verbfy.com
NEXT_PUBLIC_API_BASE_URL=https://api.verbfy.com
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
NODE_ENV=production
```

### Development/Preview Environment Variables:
```
NEXT_PUBLIC_API_URL=https://api-staging.verbfy.com
NEXT_PUBLIC_API_BASE_URL=https://api-staging.verbfy.com
NEXT_PUBLIC_LIVEKIT_URL=wss://staging-livekit.verbfy.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_key
NODE_ENV=development
```

---

## 📋 **Step 4: Domain Configuration**

### 4.1 Custom Domain Setup
1. In Cloudflare Pages project settings
2. Go to **"Custom domains"**
3. Add domain: **`verbfy.com`**
4. Add subdomain: **`www.verbfy.com`** (redirect to main)

### 4.2 DNS Configuration
Make sure your domain DNS points to Cloudflare:
```
Type: CNAME
Name: verbfy.com
Target: [your-cloudflare-pages-url].pages.dev
```

---

## 🔒 **Step 5: Security & Performance**

### 5.1 Security Headers (Already Configured)
✅ Security headers are automatically applied via `_headers` file
✅ CSRF protection enabled
✅ XSS protection enabled
✅ Content security policy configured

### 5.2 Redirects (Already Configured)
✅ API redirects to backend server
✅ Client-side routing support
✅ SEO-friendly URLs

---

## 🚀 **Step 6: Deploy & Test**

### 6.1 Trigger Deployment
1. Click **"Save and Deploy"** in Cloudflare Pages
2. Wait for build to complete (2-5 minutes)
3. Check deployment logs for any errors

### 6.2 Test Deployment
1. Visit your Cloudflare Pages URL: `https://[project-name].pages.dev`
2. Test main pages:
   - Homepage (`/`)
   - Landing page (`/landing`)
   - Teachers page (`/teachers`)
   - Materials page (`/materials`)

---

## 🔄 **Automatic Deployments**

### Production Deployments
- **Trigger**: Every push to `main` branch
- **URL**: `https://verbfy.com` (your custom domain)
- **Environment**: Production

### Preview Deployments
- **Trigger**: Every push to other branches
- **URL**: `https://[commit-hash].[project-name].pages.dev`
- **Environment**: Development/Preview

---

## 🆘 **Troubleshooting**

### Common Issues & Solutions:

#### Build Fails
```bash
# Check build locally first:
cd verbfy-app
npm install
npm run build
```

#### Environment Variables Not Working
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Check spelling and case sensitivity
- Redeploy after adding new variables

#### API Calls Failing
- Verify `NEXT_PUBLIC_API_URL` points to your backend
- Check CORS settings in your backend
- Verify SSL certificates on API domain

#### Pages Not Loading
- Check `_redirects` file configuration
- Verify Next.js routing setup
- Check browser console for errors

---

## 📊 **Monitoring & Analytics**

### Cloudflare Analytics
- Automatic traffic analytics
- Performance metrics
- Security insights

### Integration Options
- Google Analytics (configure in `NEXT_PUBLIC_GA_ID`)
- Sentry error monitoring
- Custom monitoring dashboards

---

## ✅ **Success Checklist**

- [ ] Repository connected to Cloudflare Pages
- [ ] Build configuration set correctly
- [ ] Environment variables configured
- [ ] Custom domain added and verified
- [ ] SSL certificate active
- [ ] First deployment successful
- [ ] All main pages loading correctly
- [ ] API integration working
- [ ] Automatic deployments enabled

---

## 🎉 **You're Done!**

Your Verbfy frontend is now deployed on Cloudflare Pages with:
- ⚡ Global CDN delivery
- 🔒 Enterprise-grade security
- 🚀 Automatic deployments
- 📊 Built-in analytics
- 💰 Generous free tier

**Next Steps:**
1. Configure your backend API deployment
2. Set up your custom domain
3. Test the full user journey
4. Monitor performance and errors

---

**Need Help?** 
- Check Cloudflare Pages documentation
- Review deployment logs in dashboard
- Test locally first with `npm run build`
