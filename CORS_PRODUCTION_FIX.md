# 🔧 CORS Production Fix - Verbfy

## 🚨 ISSUE IDENTIFIED

The production deployment has a CORS configuration mismatch:

- **Frontend URL**: `https://www.verbfy.com` 
- **Backend Expected**: `https://verbfy.com`
- **API Endpoint**: `https://api.verbfy.com`

## 🛠️ IMMEDIATE FIXES NEEDED

### 1. Backend CORS Configuration
The backend needs to allow both `verbfy.com` and `www.verbfy.com`:

```typescript
// In backend/src/config/cors.ts
const PRODUCTION_DOMAINS = [
  'https://verbfy.com',
  'https://www.verbfy.com',  // ✅ ADD THIS
  'https://api.verbfy.com',
  'https://app.verbfy.com'
];
```

### 2. Environment Variables Update
Update production environment to include both domains:

```bash
FRONTEND_URL=https://www.verbfy.com
CORS_EXTRA_ORIGINS=https://verbfy.com,https://www.verbfy.com,https://api.verbfy.com
```

### 3. Nginx Configuration
Ensure Nginx properly handles both domains and CORS headers.

## 🚀 DEPLOYMENT STEPS

1. **Update Backend CORS Config**
2. **Update Environment Variables**  
3. **Restart Backend Service**
4. **Test CORS Endpoints**
5. **Verify Frontend Connectivity**

## 🔍 TESTING COMMANDS

```bash
# Test CORS from frontend domain
curl -H "Origin: https://www.verbfy.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://api.verbfy.com/api/auth/login

# Test API health
curl -I https://api.verbfy.com/api/health
```

## 📋 CHECKLIST

- [ ] Update CORS configuration
- [ ] Update environment variables
- [ ] Restart backend service
- [ ] Test CORS preflight
- [ ] Test actual API calls
- [ ] Verify frontend login works