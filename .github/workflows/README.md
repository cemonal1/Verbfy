# GitHub Actions Workflows

Bu klasör Verbfy projesinin GitHub Actions workflow dosyalarını içerir.

## Workflow Dosyaları

### `ci.yml`
- **Amaç**: Ana CI/CD pipeline
- **Tetikleyici**: Push ve pull request'ler (main branch)
- **İşlevler**: Build, test ve deployment

### `test-secrets.yml`
- **Amaç**: Repository secrets'larının doğru yapılandırılıp yapılandırılmadığını test eder
- **Tetikleyici**: Manuel olarak çalıştırılır (`workflow_dispatch`)
- **İşlevler**: Required ve optional secrets'ları kontrol eder

## GitHub Actions Extension Uyarıları

GitHub Actions VS Code extension'ı `test-secrets.yml` dosyasında "Context access might be invalid" uyarıları gösterebilir. Bu uyarılar **normal ve beklenen** bir durumdur çünkü:

1. **Secrets sadece GitHub repository'de tanımlanır** - Local development ortamında mevcut değildir
2. **Extension local context'te secrets'ları göremez** - Bu güvenlik açısından doğru bir davranıştır
3. **Workflow GitHub'da çalıştığında secrets'lar mevcut olur** - Production ortamında sorun yaşanmaz

### Uyarıları Gidermek İçin

Bu uyarılar zararsızdır ve görmezden gelinebilir. Ancak isterseniz:

1. VS Code'da GitHub Actions extension'ını devre dışı bırakabilirsiniz
2. Workspace settings'te bu uyarıları gizleyebilirsiniz
3. `.vscode/settings.json` dosyasına şu ayarı ekleyebilirsiniz:

```json
{
  "github-actions.workflows.pinned.workflows": [],
  "github-actions.workflows.pinned.refresh.enabled": false
}
```

## Secrets Yapılandırması

Production deployment için gerekli secrets'ların listesi ve yapılandırma talimatları için `GITHUB_SECRETS_SETUP.md` dosyasına bakın.

## Test Etme

Secrets'ların doğru yapılandırılıp yapılandırılmadığını test etmek için:

1. GitHub repository'ye gidin
2. Actions sekmesine tıklayın
3. "Test Secrets Configuration" workflow'unu seçin
4. "Run workflow" butonuna tıklayın

Bu test production deployment öncesi secrets'ların eksik olup olmadığını kontrol etmenizi sağlar.