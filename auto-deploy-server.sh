#!/bin/bash

# Verbfy Auto Deployment Script
# Bu script GitHub'dan otomatik güncellemeleri alır ve uygulamayı deploy eder

set -e

# Renkli çıktı fonksiyonları
print_success() { echo -e "\033[32m✅ $1\033[0m"; }
print_error() { echo -e "\033[31m❌ $1\033[0m"; }
print_info() { echo -e "\033[34mℹ️  $1\033[0m"; }
print_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }

# Log dosyası
LOG_FILE="/var/log/verbfy-deploy.log"
BACKUP_DIR="/root/verbfy-backups"
PROJECT_DIR="/root/Verbfy"

# Log fonksiyonu
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Hata durumunda rollback fonksiyonu
rollback() {
    print_error "Deployment başarısız! Rollback yapılıyor..."
    log "ERROR: Deployment failed, starting rollback"
    
    if [ -d "$BACKUP_DIR/latest" ]; then
        cd "$PROJECT_DIR"
        git reset --hard HEAD~1
        docker-compose -f docker-compose.production.yml down
        docker-compose -f docker-compose.production.yml up -d
        print_info "Rollback tamamlandı"
        log "INFO: Rollback completed"
    fi
    exit 1
}

# Trap hata durumları
trap rollback ERR

print_info "🚀 Verbfy Otomatik Deployment Başlatılıyor..."
log "INFO: Starting auto deployment"

# Dizin kontrolü
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Proje dizini bulunamadı: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Backup dizini oluştur
mkdir -p "$BACKUP_DIR"

# Mevcut durumu yedekle
print_info "📦 Mevcut durum yedekleniyor..."
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
cp -r "$PROJECT_DIR" "$BACKUP_DIR/$BACKUP_NAME"
ln -sfn "$BACKUP_DIR/$BACKUP_NAME" "$BACKUP_DIR/latest"
log "INFO: Backup created: $BACKUP_NAME"

# Git durumunu kontrol et
print_info "🔍 Git durumu kontrol ediliyor..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Uncommitted değişiklikler var, stash yapılıyor..."
    git stash
    log "WARNING: Uncommitted changes stashed"
fi

# Uzak repository'den güncellemeleri al
print_info "📥 GitHub'dan güncellemeler alınıyor..."
git fetch origin
CURRENT_COMMIT=$(git rev-parse HEAD)
LATEST_COMMIT=$(git rev-parse origin/main)

if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
    print_info "✨ Zaten en güncel sürümdesiniz!"
    log "INFO: Already up to date"
    exit 0
fi

print_info "🔄 Yeni commit'ler bulundu, güncelleme yapılıyor..."
log "INFO: New commits found, updating from $CURRENT_COMMIT to $LATEST_COMMIT"

# Güncellemeyi uygula
git reset --hard origin/main

# Environment dosyalarını kontrol et
print_info "🔧 Environment dosyaları kontrol ediliyor..."
if [ ! -f "backend/.env.production" ]; then
    print_error "backend/.env.production dosyası bulunamadı!"
    exit 1
fi

if [ ! -f "verbfy-app/.env.production" ]; then
    print_error "verbfy-app/.env.production dosyası bulunamadı!"
    exit 1
fi

# Dependencies güncelle
print_info "📦 Backend dependencies güncelleniyor..."
cd backend
npm ci --production
cd ..

print_info "📦 Frontend dependencies güncelleniyor..."
cd verbfy-app
npm ci --production
cd ..

# Build işlemleri
print_info "🏗️  Backend build ediliyor..."
cd backend
npm run build
cd ..

print_info "🏗️  Frontend build ediliyor..."
cd verbfy-app
npm run build
cd ..

# Docker servislerini güncelle
print_info "🐳 Docker servisleri güncelleniyor..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d --build

# Servis sağlık kontrolü
print_info "🔍 Servis sağlık kontrolü yapılıyor..."
sleep 30

# API sağlık kontrolü
for i in {1..5}; do
    if curl -f -s https://api.verbfy.com/api/health > /dev/null; then
        print_success "API sağlık kontrolü başarılı"
        break
    elif [ $i -eq 5 ]; then
        print_error "API sağlık kontrolü başarısız"
        rollback
    else
        print_info "API kontrolü $i/5, tekrar deneniyor..."
        sleep 10
    fi
done

# Frontend sağlık kontrolü
for i in {1..5}; do
    if curl -f -s https://verbfy.com > /dev/null; then
        print_success "Frontend sağlık kontrolü başarılı"
        break
    elif [ $i -eq 5 ]; then
        print_error "Frontend sağlık kontrolü başarısız"
        rollback
    else
        print_info "Frontend kontrolü $i/5, tekrar deneniyor..."
        sleep 10
    fi
done

# Eski backup'ları temizle (7 günden eski)
print_info "🧹 Eski backup'lar temizleniyor..."
find "$BACKUP_DIR" -name "backup-*" -type d -mtime +7 -exec rm -rf {} \;

# Docker temizliği
print_info "🧹 Docker temizliği yapılıyor..."
docker system prune -f

print_success "🎉 Deployment başarıyla tamamlandı!"
log "INFO: Deployment completed successfully"

# Deployment bilgilerini göster
print_info "📊 Deployment Bilgileri:"
echo "  📅 Tarih: $(date)"
echo "  🔗 Commit: $LATEST_COMMIT"
echo "  🌐 Frontend: https://verbfy.com"
echo "  🔗 API: https://api.verbfy.com"
echo "  📝 Log: $LOG_FILE"

log "INFO: Deployment summary - Commit: $LATEST_COMMIT, Status: Success"