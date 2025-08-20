# 🚨 ACİL DURUM ÇÖZÜMÜ

## Problem 1: GitHub Push Hatası
```
! [rejected] main -> main (non-fast-forward)
```

## Problem 2: PM2 Process Bulunamıyor
```
[PM2][ERROR] Process or Namespace verbfy-backend not found
```

---

## 🔧 HEMEN YAPILACAKLAR

### **1. GitHub Push Sorunu Çözümü:**

```bash
# Local terminal'de:
cd C:\Users\cemon\Verbfy
git pull origin main
git push origin main
```

### **2. Hetzner Sunucusunda PM2 Durumu Kontrol:**

```bash
# Hetzner sunucusunda:
pm2 list
pm2 status
```

Bu komutlar hangi process'lerin çalıştığını gösterecek.

### **3. Eğer PM2'de Hiç Process Yoksa:**

#### **A. Backend'i Manuel Başlat:**
```bash
cd /opt/verbfy/backend
npm run dev
# veya production için:
npm run start
```

#### **B. Veya PM2 ile Başlat:**
```bash
cd /opt/verbfy/backend
pm2 start dist/index.js --name verbfy-backend
# veya
pm2 start npm --name verbfy-backend -- start
```

### **4. Nginx Durumu Kontrol:**
```bash
sudo systemctl status nginx
sudo nginx -t
```

### **5. Backend Durumu Test:**
```bash
curl http://localhost:5000/api/health
```

---

## 🔍 DURUM TESPİTİ

Hetzner sunucusunda şu komutları çalıştırın ve sonuçları paylaşın:

```bash
# 1. PM2 durumu
pm2 list

# 2. Port 5000 dinleniyor mu?
netstat -tlnp | grep :5000

# 3. Backend klasörü var mı?
ls -la /opt/verbfy/backend/

# 4. Node.js çalışıyor mu?
ps aux | grep node

# 5. Nginx durumu
sudo systemctl status nginx
```

---

## 🚀 HIZLI ÇÖZÜM ADIMI

### **Hetzner'da Backend'i Hızlıca Başlat:**

```bash
# 1. Verbfy klasörüne git
cd /opt/verbfy

# 2. Git pull yap
git pull origin main

# 3. Backend'e git
cd backend

# 4. Dependencies kontrol
npm install

# 5. Build yap (eğer TypeScript varsa)
npm run build

# 6. PM2 ile başlat
pm2 start dist/index.js --name verbfy-backend --env production

# 7. PM2 save et
pm2 save

# 8. Test et
curl http://localhost:5000/api/health
```

---

## 📱 FRONTEND ÇÖZÜMÜ

### **Local'de GitHub Push Sorunu:**

```bash
# Windows PowerShell'de:
cd C:\Users\cemon\Verbfy
git status
git pull origin main
git push origin main
```

---

## ⚡ ÖNCE BU KOMUTU ÇALIŞTIRIN

**Hetzner sunucusunda:**
```bash
pm2 list
```

Bu komutun çıktısını paylaşın, ona göre doğru çözümü uygulayacağız!
