# GitHub Actions Otomatik Deployment Kurulum Rehberi

Bu rehber, Verbfy projesinin GitHub'dan Hetzner sunucusuna otomatik deployment yapmasını sağlar.

## 🔑 SSH Anahtarları Kurulumu

### 1. SSH Anahtarı Oluşturma

Yerel bilgisayarınızda yeni bir SSH anahtarı oluşturun:

```bash
ssh-keygen -t ed25519 -C "github-actions@verbfy.com" -f ~/.ssh/verbfy_deploy
```

### 2. Public Key'i Sunucuya Ekleme

Public key'i Hetzner sunucusuna ekleyin:

```bash
# Public key'i kopyalayın
cat ~/.ssh/verbfy_deploy.pub

# Sunucuya SSH ile bağlanın
ssh root@46.62.161.121

# Authorized keys dosyasına ekleyin
echo "BURAYA_PUBLIC_KEY_YAPIŞTIRIN" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Known Hosts Oluşturma

```bash
ssh-keyscan -H 46.62.161.121 > known_hosts
```

## 🔐 GitHub Secrets Yapılandırması

GitHub repository'nizde Settings > Secrets and variables > Actions bölümüne gidin ve şu secrets'ları ekleyin:

### HETZNER_SSH_KEY
```
# Private key içeriği (tüm satırlar dahil)
-----BEGIN OPENSSH PRIVATE KEY-----
...private key içeriği...
-----END OPENSSH PRIVATE KEY-----
```

### HETZNER_KNOWN_HOSTS
```
# Known hosts içeriği
46.62.161.121 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...
```

## 🚀 Deployment Workflow'u

### Otomatik Tetikleme
- `main` branch'e her push işleminde otomatik çalışır
- Manuel olarak GitHub Actions sekmesinden tetiklenebilir

### Deployment Süreci
1. ✅ Kodu checkout eder
2. ✅ Node.js kurulumunu yapar
3. ✅ SSH anahtarını yükler
4. ✅ Sunucuya bağlanır ve deployment script'ini çalıştırır
5. ✅ Sağlık kontrollerini yapar
6. ✅ Sonuçları raporlar

## 📋 Sunucu Hazırlığı

### 1. Deployment Script'ini Sunucuya Yükleme

```bash
# Sunucuya bağlanın
ssh root@46.62.161.121

# Verbfy dizinine gidin
cd /root/Verbfy

# Auto-deploy script'ini oluşturun (bu script zaten oluşturuldu)
chmod +x auto-deploy-server.sh

# Log dizinini oluşturun
mkdir -p /var/log
touch /var/log/verbfy-deploy.log
```

### 2. Environment Dosyalarını Kontrol Edin

```bash
# Production environment dosyalarının var olduğundan emin olun
ls -la backend/.env.production
ls -la verbfy-app/.env.production
```

## 🔍 Test ve Doğrulama

### Manuel Test
```bash
# Sunucuda manuel deployment testi
cd /root/Verbfy
./auto-deploy-server.sh
```

### GitHub Actions Test
1. GitHub repository'de küçük bir değişiklik yapın
2. `main` branch'e push edin
3. Actions sekmesinde workflow'un çalıştığını kontrol edin

## 📊 Monitoring ve Loglar

### Deployment Logları
```bash
# Sunucuda deployment loglarını görüntüleme
tail -f /var/log/verbfy-deploy.log
```

### GitHub Actions Logları
- GitHub repository > Actions sekmesinde detaylı logları görüntüleyebilirsiniz

## 🛠️ Troubleshooting

### SSH Bağlantı Sorunları
```bash
# SSH bağlantısını test edin
ssh -i ~/.ssh/verbfy_deploy root@46.62.161.121

# SSH agent'a anahtarı ekleyin
ssh-add ~/.ssh/verbfy_deploy
```

### Deployment Sorunları
```bash
# Sunucuda Docker durumunu kontrol edin
docker ps
docker-compose -f docker-compose.production.yml logs

# Servis durumlarını kontrol edin
curl -I https://api.verbfy.com/api/health
curl -I https://verbfy.com
```

## 🔄 Rollback Prosedürü

Deployment başarısız olursa otomatik rollback yapılır. Manuel rollback için:

```bash
cd /root/Verbfy
git reset --hard HEAD~1
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

## 📈 Gelişmiş Özellikler

### Backup Sistemi
- Her deployment öncesi otomatik backup alınır
- 7 günden eski backup'lar otomatik silinir
- Backup dizini: `/root/verbfy-backups`

### Sağlık Kontrolleri
- API endpoint kontrolü
- Frontend erişilebilirlik kontrolü
- Docker container durumu kontrolü

### Güvenlik
- SSH anahtarı tabanlı kimlik doğrulama
- Encrypted GitHub secrets
- Otomatik Docker temizliği

## 🎯 Sonraki Adımlar

1. ✅ SSH anahtarlarını oluşturun ve yapılandırın
2. ✅ GitHub secrets'ları ekleyin
3. ✅ İlk deployment'ı test edin
4. ✅ Monitoring sistemini kurun
5. ✅ Takım üyelerini bilgilendirin

Bu kurulum tamamlandığında, her `main` branch'e yapılan push işlemi otomatik olarak production sunucusuna deploy edilecektir.