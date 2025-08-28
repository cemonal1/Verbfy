# 🔒 Verbfy Backend Security Guide

## ⚠️ ÖNEMLİ GÜVENLİK UYARILARI

### 🚨 SECRET'LAR ASLA GİT'E COMMIT EDİLMEZ!

1. **`.env` dosyası** git repository'de **ASLA** bulunmamalı
2. **Secret'lar** kod içinde **ASLA** hardcode edilmemeli
3. **Environment variables** sadece sunucuda tutulmalı

### ✅ Güvenli Deployment

```bash
# 1. .env dosyasını sunucuda oluştur (git'e commit etme!)
nano .env

# 2. Secret'ları ekle
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# 3. Ecosystem config ile başlat
pm2 start ecosystem.config.js
```

### 🔐 Environment Variables

**Güvenli:**
- `.env` dosyası sadece sunucuda
- `dotenv` ile otomatik yükleme
- PM2 ecosystem config'de secret'lar yok

**Güvensiz:**
- Secret'ları kod içinde yazmak
- `.env` dosyasını git'e commit etmek
- Secret'ları log'larda göstermek

### 📁 Güvenli Dosya Yapısı

```
backend/
├── .env                    # ⚠️ GİT'E COMMIT ETME!
├── .gitignore             # ✅ .env ve logs ignore edilir
├── ecosystem.config.js    # ✅ Sadece non-secret config
├── src/                   # ✅ Source code
└── logs/                  # ⚠️ GİT'E COMMIT ETME!
```

### 🚀 PM2 Ecosystem Config

```javascript
// ✅ GÜVENLİ - Secret'lar yok
module.exports = {
  apps: [{
    name: 'verbfy-backend',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
      // Secret'lar .env'den otomatik yüklenir
    }
  }]
};
```

### 🔍 Güvenlik Kontrol Listesi

- [ ] `.env` dosyası `.gitignore`'da
- [ ] Secret'lar kod içinde hardcode değil
- [ ] `ecosystem.config.js`'de secret'lar yok
- [ ] Log'larda secret'lar görünmüyor
- [ ] Production'da debug mode kapalı

### 🆘 Güvenlik İhlali Durumunda

1. **Hemen** tüm secret'ları değiştir
2. **Git history**'den secret'ları temizle
3. **Access log**'ları kontrol et
4. **Security audit** yap

---

**⚠️ UNUTMA: Güvenlik her zaman öncelik! Secret'ları asla public yapma!**
