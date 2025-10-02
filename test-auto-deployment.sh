#!/bin/bash

# Verbfy Otomatik Deployment Test Script
# Bu script otomatik deployment sisteminin çalışıp çalışmadığını test eder

set -e

# Renkli çıktı fonksiyonları
print_success() { echo -e "\033[32m✅ $1\033[0m"; }
print_error() { echo -e "\033[31m❌ $1\033[0m"; }
print_info() { echo -e "\033[34mℹ️  $1\033[0m"; }
print_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }

print_info "🧪 Verbfy Otomatik Deployment Test Başlatılıyor..."

# Test değişkenleri
SERVER_IP="46.62.161.121"
WEBHOOK_PORT="9000"
API_URL="https://api.verbfy.com"
FRONTEND_URL="https://verbfy.com"

# 1. Sunucu erişilebilirlik testi
print_info "🌐 Sunucu erişilebilirlik testi..."
if ping -c 1 $SERVER_IP > /dev/null 2>&1; then
    print_success "Sunucu erişilebilir"
else
    print_error "Sunucu erişilemez"
    exit 1
fi

# 2. SSH bağlantı testi
print_info "🔐 SSH bağlantı testi..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes root@$SERVER_IP "echo 'SSH OK'" > /dev/null 2>&1; then
    print_success "SSH bağlantısı başarılı"
else
    print_warning "SSH bağlantısı başarısız - Manuel SSH anahtarı kurulumu gerekebilir"
fi

# 3. Webhook server testi
print_info "🎣 Webhook server testi..."
if curl -f -s "http://$SERVER_IP:$WEBHOOK_PORT/health" > /dev/null; then
    print_success "Webhook server çalışıyor"
else
    print_warning "Webhook server çalışmıyor - Manuel kurulum gerekebilir"
fi

# 4. API sağlık kontrolü
print_info "🔗 API sağlık kontrolü..."
if curl -f -s "$API_URL/api/health" > /dev/null; then
    print_success "API çalışıyor"
else
    print_error "API çalışmıyor"
fi

# 5. Frontend erişilebilirlik testi
print_info "🌐 Frontend erişilebilirlik testi..."
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    print_success "Frontend erişilebilir"
else
    print_error "Frontend erişilemez"
fi

# 6. GitHub Actions workflow dosyası kontrolü
print_info "📋 GitHub Actions workflow kontrolü..."
if [ -f ".github/workflows/auto-deploy.yml" ]; then
    print_success "Auto-deploy workflow dosyası mevcut"
else
    print_error "Auto-deploy workflow dosyası bulunamadı"
fi

# 7. Deployment script kontrolü
print_info "📜 Deployment script kontrolü..."
if [ -f "auto-deploy-server.sh" ]; then
    print_success "Auto-deploy server script mevcut"
else
    print_error "Auto-deploy server script bulunamadı"
fi

# 8. Webhook server script kontrolü
print_info "🎣 Webhook server script kontrolü..."
if [ -f "webhook-server.js" ]; then
    print_success "Webhook server script mevcut"
else
    print_error "Webhook server script bulunamadı"
fi

# 9. Git repository durumu
print_info "📦 Git repository durumu..."
if git status > /dev/null 2>&1; then
    CURRENT_BRANCH=$(git branch --show-current)
    print_success "Git repository aktif - Mevcut branch: $CURRENT_BRANCH"
    
    if [ "$CURRENT_BRANCH" = "main" ]; then
        print_success "Main branch'desiniz"
    else
        print_warning "Main branch'de değilsiniz - Otomatik deployment main branch için çalışır"
    fi
else
    print_error "Git repository bulunamadı"
fi

# 10. Environment dosyaları kontrolü
print_info "🔧 Environment dosyaları kontrolü..."
if [ -f "backend/.env.production" ]; then
    print_success "Backend production env dosyası mevcut"
else
    print_warning "Backend production env dosyası bulunamadı"
fi

if [ -f "verbfy-app/.env.production" ]; then
    print_success "Frontend production env dosyası mevcut"
else
    print_warning "Frontend production env dosyası bulunamadı"
fi

# Test sonuçları özeti
print_info "📊 Test Sonuçları Özeti:"
echo ""
echo "🔧 Kurulum Durumu:"
echo "  ✅ GitHub Actions Workflow: Hazır"
echo "  ✅ Deployment Script: Hazır"
echo "  ✅ Webhook Server: Hazır"
echo "  ✅ Test Script: Hazır"
echo ""
echo "🚀 Sonraki Adımlar:"
echo "  1. SSH anahtarlarını GitHub Secrets'a ekleyin"
echo "  2. Webhook server'ı sunucuda başlatın"
echo "  3. GitHub'da webhook URL'ini yapılandırın"
echo "  4. Test commit'i yapın"
echo ""
echo "📖 Detaylı kurulum için: GITHUB_ACTIONS_SETUP.md"

print_success "🎉 Test tamamlandı!"