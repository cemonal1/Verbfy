# 🌐 VERBFY ENVIRONMENT SETUP INSTRUCTIONS

## 🚨 CRITICAL: Environment Configuration Required

To fix the current issues (WebSocket connection, OAuth, dashboard features), you need to properly configure environment variables.

---

## 📁 BACKEND ENVIRONMENT SETUP

### **File: `backend/.env`** (CREATE THIS FILE)

```env
# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/verbfy?retryWrites=true&w=majority

# JWT Configuration (REQUIRED - Generate secure secrets)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-at-least-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-make-it-long-and-random-at-least-32-characters

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend/Backend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
COOKIE_DOMAIN=.localhost
CORS_EXTRA_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# OAuth Providers (REQUIRED for Google login to work)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
MS_CLIENT_ID=your-microsoft-oauth-client-id
MS_CLIENT_SECRET=your-microsoft-oauth-client-secret
APPLE_CLIENT_ID=your-apple-oauth-client-id
APPLE_CLIENT_SECRET=your-apple-oauth-client-secret

# LiveKit Configuration (REQUIRED for video lessons)
# Cloud Configuration (recommended)
LIVEKIT_CLOUD_API_KEY=your-livekit-cloud-api-key
LIVEKIT_CLOUD_API_SECRET=your-livekit-cloud-api-secret
LIVEKIT_CLOUD_URL=wss://your-project.livekit.cloud

# Self-hosted Configuration (alternative)
LIVEKIT_SELF_API_KEY=dev-api-key
LIVEKIT_SELF_API_SECRET=dev-api-secret
LIVEKIT_SELF_URL=wss://localhost:7880

# Email Configuration (REQUIRED for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Verbfy <no-reply@verbfy.com>"

# Payment Configuration (Stripe)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AWS S3 Configuration (for file uploads)
AWS_REGION=us-east-1
S3_BUCKET=verbfy-uploads
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Security & Monitoring
SENTRY_DSN=
ALLOWED_FRAME_SRC=
IDEMPOTENCY_TTL_MINUTES=30
```

---

## 📱 FRONTEND ENVIRONMENT SETUP

### **File: `verbfy-app/.env.local`** (CREATE THIS FILE)

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://localhost:7880
NEXT_PUBLIC_LIVEKIT_CLOUD_URL=wss://your-project.livekit.cloud

# Sentry Configuration (Optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

---

## 🔧 PRODUCTION ENVIRONMENT SETUP

### **File: `backend/.env.production`** (FOR PRODUCTION)

```env
# Database Configuration
MONGO_URI=mongodb+srv://production-user:production-password@production-cluster.mongodb.net/verbfy-prod?retryWrites=true&w=majority

# JWT Configuration (GENERATE SECURE SECRETS)
JWT_SECRET=REPLACE_WITH_SECURE_64_CHAR_HEX_STRING
JWT_REFRESH_SECRET=REPLACE_WITH_DIFFERENT_SECURE_64_CHAR_HEX_STRING

# Server Configuration
PORT=5000
NODE_ENV=production

# Frontend/Backend URLs
FRONTEND_URL=https://verbfy.com
BACKEND_URL=https://api.verbfy.com
COOKIE_DOMAIN=.verbfy.com
CORS_EXTRA_ORIGINS=https://verbfy.com,https://www.verbfy.com

# OAuth Providers (PRODUCTION CREDENTIALS)
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
MS_CLIENT_ID=your-production-microsoft-client-id
MS_CLIENT_SECRET=your-production-microsoft-client-secret

# LiveKit Configuration (PRODUCTION)
LIVEKIT_CLOUD_API_KEY=your-production-livekit-api-key
LIVEKIT_CLOUD_API_SECRET=your-production-livekit-api-secret
LIVEKIT_CLOUD_URL=wss://your-production-project.livekit.cloud

# Email Configuration (PRODUCTION)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@verbfy.com
SMTP_PASS=your-production-app-password
SMTP_FROM="Verbfy <noreply@verbfy.com>"

# Payment Configuration (PRODUCTION STRIPE)
STRIPE_SECRET_KEY=sk_live_your_production_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_production_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# AWS S3 Configuration (PRODUCTION)
AWS_REGION=us-east-1
S3_BUCKET=verbfy-production-uploads
AWS_ACCESS_KEY_ID=your-production-aws-access-key
AWS_SECRET_ACCESS_KEY=your-production-aws-secret-key

# Security & Monitoring (PRODUCTION)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
ALLOWED_FRAME_SRC=https://trusted-domain.com
```

### **File: `verbfy-app/.env.production`** (FOR PRODUCTION)

```env
# API Configuration (PRODUCTION)
NEXT_PUBLIC_API_BASE_URL=https://api.verbfy.com

# LiveKit Configuration (PRODUCTION)
NEXT_PUBLIC_LIVEKIT_CLOUD_URL=wss://your-production-project.livekit.cloud

# Sentry Configuration (PRODUCTION)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

---

## 🔑 HOW TO GET OAUTH CREDENTIALS

### **Google OAuth Setup:**

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Create new project or select existing

2. **Enable Google+ API:**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Authorized redirect URIs: 
     - `http://localhost:5000/api/auth/oauth/google/callback` (development)
     - `https://api.verbfy.com/api/auth/oauth/google/callback` (production)

4. **Copy credentials to .env:**
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```

### **Microsoft OAuth Setup:**

1. **Go to Azure Portal:**
   - Visit: https://portal.azure.com/
   - Go to "Azure Active Directory" > "App registrations"

2. **Create new registration:**
   - Name: "Verbfy"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: 
     - `http://localhost:5000/api/auth/oauth/outlook/callback` (development)
     - `https://api.verbfy.com/api/auth/oauth/outlook/callback` (production)

3. **Copy credentials to .env:**
   ```env
   MS_CLIENT_ID=your-application-id-here
   MS_CLIENT_SECRET=your-client-secret-here
   ```

---

## 🚀 QUICK SETUP COMMANDS

### **Generate JWT Secrets:**
```bash
cd backend
npm run generate-secrets
```

### **Validate Environment:**
```bash
cd backend
npm run validate-env
```

### **Start Development Servers:**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd verbfy-app
npm run dev
```

---

## ✅ TESTING AFTER SETUP

### **1. Test WebSocket Connection:**
- Open browser console
- Login to the application
- Should see: "🔌 Socket connected successfully"

### **2. Test OAuth Authentication:**
- Go to login page
- Click "Continue with Google" 
- Should open popup and authenticate successfully

### **3. Test Dashboard Features:**
- Login as student
- Navigate to `/dashboard/student`
- Should load data without errors

---

## 🚨 TROUBLESHOOTING

### **WebSocket Issues:**
- Check `FRONTEND_URL` and `CORS_EXTRA_ORIGINS` in backend .env
- Verify Socket.IO server is running on correct port
- Check browser console for connection errors

### **OAuth Issues:**
- Verify OAuth credentials are correctly set
- Check redirect URIs match exactly
- Ensure popup is not blocked by browser

### **Dashboard Issues:**
- Check API endpoints are returning data
- Verify authentication tokens are valid
- Check browser network tab for failed requests

---

*After setting up these environment files, restart both servers and test the functionality.*
