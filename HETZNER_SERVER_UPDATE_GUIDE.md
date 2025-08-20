# 🖥️ HETZNER SERVER UPDATE GUIDE

## 🚀 GitHub Push Completed Successfully!

**Commit:** `57a9233` - Fix critical system issues: WebSocket, OAuth, and Dashboard  
**Repository:** https://github.com/cemonal1/Verbfy.git

---

## 🔧 HETZNER SERVER UPDATE STEPS

### **1. SSH into Hetzner Server**
```bash
ssh root@your-hetzner-server-ip
# or
ssh your-username@your-hetzner-server-ip
```

### **2. Navigate to Project Directory**
```bash
cd /path/to/verbfy  # Adjust path as needed
# or typically:
cd /var/www/verbfy
# or
cd /home/verbfy/app
```

### **3. Pull Latest Changes**
```bash
# Backup current version (optional)
cp -r . ../verbfy-backup-$(date +%Y%m%d)

# Pull latest changes from GitHub
git pull origin main

# Should show the new commit:
# 57a9233 - Fix critical system issues: WebSocket, OAuth, and Dashboard
```

### **4. Verify Environment Variables**
Since you mentioned .env files are already on Hetzner, verify they contain the required variables:

```bash
# Check backend environment
cat backend/.env | grep -E "(MONGO_URI|JWT_SECRET|GOOGLE_CLIENT|FRONTEND_URL|CORS_EXTRA)"

# Should contain:
# MONGO_URI=mongodb+srv://...
# JWT_SECRET=your-32-char-secret
# JWT_REFRESH_SECRET=your-different-32-char-secret  
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# FRONTEND_URL=https://verbfy.com
# CORS_EXTRA_ORIGINS=https://verbfy.com,https://www.verbfy.com
```

### **5. Install Dependencies (if needed)**
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies (if building on server)
cd ../verbfy-app
npm install
```

### **6. Restart Backend Service**

**Option A: If using PM2:**
```bash
pm2 restart verbfy-backend
# or
pm2 restart all
```

**Option B: If using systemd:**
```bash
sudo systemctl restart verbfy-backend
```

**Option C: If using Docker:**
```bash
# Rebuild and restart containers
docker-compose down
docker-compose up -d --build
```

**Option D: Manual restart:**
```bash
# Kill existing process
pkill -f "node.*verbfy"

# Start backend
cd backend
npm run start
# or for development
npm run dev
```

### **7. Check Service Status**
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...}

# Check logs for any errors
tail -f /var/log/verbfy/backend.log
# or if using PM2:
pm2 logs verbfy-backend
```

---

## 🌐 CLOUDFLARE FRONTEND DEPLOYMENT

### **Cloudflare Pages Environment Variables:**

Add these to your Cloudflare Pages environment settings:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.verbfy.com
NODE_ENV=production
```

### **Cloudflare Pages Build Settings:**
- **Build command:** `npm run build`
- **Build output directory:** `out`
- **Root directory:** `verbfy-app`

---

## ✅ VERIFICATION CHECKLIST

After updating the Hetzner server:

### **1. Backend Health Check**
```bash
curl https://api.verbfy.com/api/health
```
**Expected:** `{"status":"ok",...}`

### **2. WebSocket Connection Test**
```bash
# Test Socket.IO endpoint
curl -I https://api.verbfy.com/socket.io/
```
**Expected:** HTTP 200 response

### **3. OAuth Endpoint Test**
```bash
curl -I https://api.verbfy.com/api/auth/oauth/google
```
**Expected:** HTTP 302 redirect to Google

### **4. API Endpoints Test**
```bash
# Test auth endpoint
curl https://api.verbfy.com/api/auth/me
```
**Expected:** Proper authentication response

---

## 🔍 TROUBLESHOOTING

### **If WebSocket Still Fails:**

1. **Check backend logs:**
```bash
pm2 logs verbfy-backend
# Look for Socket.IO initialization messages
```

2. **Verify CORS settings:**
```bash
grep -n "CORS_EXTRA_ORIGINS" backend/.env
```

3. **Test Socket.IO directly:**
```bash
curl -v https://api.verbfy.com/socket.io/?transport=polling
```

### **If OAuth Still Fails:**

1. **Check OAuth environment variables:**
```bash
grep -n "GOOGLE_CLIENT" backend/.env
```

2. **Test OAuth redirect:**
```bash
curl -v https://api.verbfy.com/api/auth/oauth/google
```

3. **Check OAuth relay script:**
```bash
curl https://api.verbfy.com/api/auth/oauth/relay.js
```

### **If Dashboard Still Has Issues:**

1. **Check reservation endpoints:**
```bash
# Test with authentication token
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.verbfy.com/api/reservations/student/reservations
```

2. **Check backend logs for API errors:**
```bash
tail -f /var/log/verbfy/backend.log | grep -i error
```

---

## 📋 DEPLOYMENT SEQUENCE

### **Recommended Order:**

1. ✅ **GitHub push completed** ✅
2. 🔄 **Update Hetzner server** (your next step)
3. 🔄 **Restart backend services**
4. 🔄 **Verify backend health**
5. 🔄 **Deploy frontend to Cloudflare Pages**
6. 🔄 **Test complete system**

---

## 📞 POST-DEPLOYMENT TESTING

After both backend and frontend deployments:

### **1. Full System Test:**
- Visit https://verbfy.com
- Test login (both email and Google OAuth)
- Check dashboard functionality
- Verify real-time notifications
- Test WebSocket connection in browser console

### **2. Monitor Logs:**
```bash
# Backend logs
pm2 logs verbfy-backend --lines 100

# System logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

**🎯 Hetzner sunucusunu güncelledikten sonra tüm kritik sorunlar çözülmüş olacak!**

*Sunucu güncellemesi tamamlandığında test sonuçlarını paylaşabilirsiniz.*
