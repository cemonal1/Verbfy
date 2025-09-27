# 🚨 ACİL ÇÖZÜM KOMUTLARI

## 1. 💻 LOCAL GIT SORUNU ÇÖZÜMÜ

### Windows PowerShell'de şunları çalıştır:

```bash
# Git merge sorununu çöz
cd C:\Users\cemon\Verbfy
rm .git/MERGE_MSG.swp
git reset --hard HEAD
git pull origin main
git add .
git commit -m "🚨 Emergency auth debug fixes"
git push origin main
```

---

## 2. 🖥️ HETZNER SUNUCUSU ÇÖZÜMÜ

### PM2'de hiç process yok, backend'i başlatalım:

```bash
# 1. Verbfy klasörüne git
cd /opt/verbfy

# 2. Git pull yap
git pull origin main

# 3. Backend klasörüne git
cd backend

# 4. Dependencies yükle
npm install

# 5. TypeScript build yap
npm run build

# 6. PM2 ile başlat
pm2 start dist/index.js --name verbfy-backend --env production

# 7. PM2'yi kaydet
pm2 save

# 8. PM2'yi sistem başlangıcında otomatik başlat
pm2 startup
```

### Test Et:
```bash
# Backend çalışıyor mu kontrol et
curl http://localhost:5000/api/health

# PM2 durumu
pm2 list

# Logları kontrol et
pm2 logs verbfy-backend
```

---

## 3. 🔧 EĞER HALA SORUN VARSA

### Backend'i manuel başlat:
```bash
cd /opt/verbfy/backend
NODE_ENV=production npm start
```

### Nginx'i kontrol et:
```bash
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. ✅ BAŞARILI OLDUĞUNDA GÖRECEKLER

### Backend loglarında:
```
🚀 Server running on port 5000
✅ MongoDB connected successfully
🔌 Socket.IO: Enabled for real-time communication
```

### Curl test:
```bash
curl http://localhost:5000/api/health
# Sonuç: {"status":"ok","timestamp":"..."}
```

### PM2 list:
```
┌────┬──────────────────┬─────────┬─────────┬─────────┬──────────┬────────┐
│ id │ name             │ mode    │ ↺       │ status  │ cpu      │ memory │
├────┼──────────────────┼─────────┼─────────┼─────────┼──────────┼────────┤
│ 0  │ verbfy-backend   │ fork    │ 0       │ online  │ 0%       │ 50.2mb │
└────┴──────────────────┴─────────┴─────────┴─────────┴──────────┴────────┘
```

---

**ÖNCE LOCAL GIT SORUNUNU ÇÖZ, SONRA HETZNER'DA BACKEND'İ BAŞLAT!**
