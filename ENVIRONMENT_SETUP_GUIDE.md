# 🔧 Environment Variables Setup Guide

## 📁 **Backend Environment (.env)**

`backend/.env` dosyasını oluşturun ve aşağıdaki içeriği ekleyin:

```bash
# Database Configuration
MONGO_URI=mongodb+srv://Verbfy:Verbfy@verbfy.kxzpcit.mongodb.net/verbfy?retryWrites=true&w=majority&appName=Verbfy

# JWT Configuration
JWT_SECRET=ddb2070e412a4e227a233c3ed275d1cc6603ce9f9a0bfda81ecbbbbab81fd491
JWT_REFRESH_SECRET=ddb2070e412a4e227a233c3ed275d1cc6603ce9f9a0bfda81ecbbbbab81fd491_refresh

# Server Configuration
PORT=5000
NODE_ENV=production

# Frontend/Backend URLs
FRONTEND_URL=https://verbfy.com
BACKEND_URL=https://api.verbfy.com

# CORS Configuration
CORS_ORIGIN=https://verbfy.com

# LiveKit Configuration (Cloud)
LIVEKIT_CLOUD_API_KEY=uAPI5TmtswTciPkf
LIVEKIT_CLOUD_API_SECRET=7OVLtpvDCTAlVLjffhmheWIff44SVq70shF8LUGEGu1A
LIVEKIT_CLOUD_URL=wss://livekit.verbfy.com

# LiveKit Configuration (Self-Hosted)
LIVEKIT_SELF_API_KEY=uc4eRZW1iYWcX2UXeoQ/v1JJ/ackt/qelbFiatS/WwM=
LIVEKIT_SELF_API_SECRET=1M2k3w3MV/PMZIvB2tANCZ0ZXcw93hhkV4N7eyW+QNQ=
LIVEKIT_SELF_URL=wss://livekit.verbfy.com

# Generic LiveKit (Use Cloud configuration as default)
LIVEKIT_API_KEY=uAPI5TmtswTciPkf
LIVEKIT_API_SECRET=7OVLtpvDCTAlVLjffhmheWIff44SVq70shF8LUGEGu1A
LIVEKIT_URL=wss://livekit.verbfy.com

# Email Configuration (SMTP)
SMTP_HOST=privatemail.com
SMTP_PORT=587
SMTP_USER=noreply@verbfy.com
SMTP_PASS=Verbfy1940
SMTP_FROM="Verbfy <noreply@verbfy.com>"

# OAuth Providers (set when needed)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MS_CLIENT_ID=
MS_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=

# Payment Configuration (Stripe - Add when needed)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AWS S3 Configuration (Add when needed)
AWS_REGION=us-east-1
S3_BUCKET=verbfy-uploads
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Security & Monitoring
SENTRY_DSN=
ALLOWED_FRAME_SRC=https://verbfy.com
IDEMPOTENCY_TTL_MINUTES=30
```

## 📁 **Frontend Environment (.env.local)**

`verbfy-app/.env.local` dosyasını oluşturun ve aşağıdaki içeriği ekleyin:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.verbfy.com
NEXT_PUBLIC_API_BASE_URL=https://api.verbfy.com

# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.verbfy.com
NEXT_PUBLIC_LIVEKIT_CLOUD_URL=wss://livekit.verbfy.com

# Payment Configuration (Stripe - Add when needed)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

# Security (Optional - for CSP)
NEXT_PUBLIC_ALLOWED_FRAME_SRC=https://verbfy.com
```

## 🚀 **Quick Setup Commands**

Windows PowerShell için:

```powershell
# Backend .env dosyasını oluştur
notepad backend\.env

# Frontend .env.local dosyasını oluştur  
notepad verbfy-app\.env.local
```

## ✅ **Kontrol Listesi**

### Backend Environment Variables:
- [✅] MONGO_URI - MongoDB bağlantısı
- [✅] JWT_SECRET - JWT güvenlik anahtarı
- [✅] JWT_REFRESH_SECRET - Refresh token anahtarı
- [✅] LIVEKIT_API_KEY - LiveKit API anahtarı
- [✅] LIVEKIT_API_SECRET - LiveKit gizli anahtarı
- [✅] LIVEKIT_URL - LiveKit sunucu URL'si
- [✅] SMTP_HOST - Email sunucu adresi
- [✅] SMTP_USER - Email kullanıcı adı
- [✅] SMTP_PASS - Email şifresi
- [❌] STRIPE_SECRET_KEY - Henüz eklenmedi
- [❌] AWS_ACCESS_KEY_ID - Henüz eklenmedi

### Frontend Environment Variables:
- [✅] NEXT_PUBLIC_API_URL - Backend API URL'si
- [✅] NEXT_PUBLIC_LIVEKIT_URL - LiveKit URL'si
- [❌] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Henüz eklenmedi

## 🔒 **Güvenlik Notları**

- ✅ Production JWT secrets kullanılıyor
- ✅ HTTPS URL'leri kullanılıyor
- ✅ Email SMTP konfigürasyonu yapıldı
- ⚠️ Stripe anahtarları henüz eklenmedi
- ⚠️ AWS S3 anahtarları henüz eklenmedi
- ⚠️ OAuth providers henüz konfigüre edilmedi

## 🎯 **Sonraki Adımlar**

1. **Stripe Integration** - Ödeme sistemi için gerekli
2. **AWS S3 Setup** - Dosya yükleme için gerekli  
3. **OAuth Providers** - Sosyal medya giriş için
4. **Monitoring Setup** - Sentry/Analytics için

