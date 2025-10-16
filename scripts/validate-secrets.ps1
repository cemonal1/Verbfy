# GitHub Secrets Validation Script
param([switch]$CheckOptional)

Write-Host "GitHub Secrets Validation" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$RequiredSecrets = @(
    "MONGO_URI",
    "JWT_SECRET", 
    "JWT_REFRESH_SECRET",
    "FRONTEND_URL",
    "BACKEND_URL",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_BACKEND_URL",
    "PRODUCTION_HOST",
    "PRODUCTION_USER",
    "PRODUCTION_SSH_KEY"
)

$OptionalSecrets = @(
    "PRODUCTION_PORT",
    "LIVEKIT_CLOUD_API_KEY",
    "LIVEKIT_CLOUD_API_SECRET", 
    "LIVEKIT_CLOUD_URL",
    "NEXT_PUBLIC_LIVEKIT_URL",
    "NEXT_PUBLIC_LIVEKIT_CLOUD_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "MS_CLIENT_ID", 
    "MS_CLIENT_SECRET",
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "AWS_REGION",
    "S3_BUCKET",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "SENTRY_DSN",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "SLACK_WEBHOOK_URL"
)

Write-Host ""
Write-Host "Required Secrets Checklist:" -ForegroundColor Yellow
Write-Host "===========================" -ForegroundColor Yellow

foreach ($secret in $RequiredSecrets) {
    Write-Host "  [ ] $secret" -ForegroundColor White
}

if ($CheckOptional) {
    Write-Host ""
    Write-Host "Optional Secrets Checklist:" -ForegroundColor Green
    Write-Host "===========================" -ForegroundColor Green
    
    foreach ($secret in $OptionalSecrets) {
        Write-Host "  [ ] $secret" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Instructions:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host "1. Go to your GitHub repository" -ForegroundColor White
Write-Host "2. Click Settings -> Secrets and variables -> Actions" -ForegroundColor White
Write-Host "3. Add each required secret using 'New repository secret'" -ForegroundColor White
Write-Host "4. See GITHUB_SECRETS_SETUP.md for detailed configuration guide" -ForegroundColor White

Write-Host ""
Write-Host "Testing:" -ForegroundColor Magenta
Write-Host "========" -ForegroundColor Magenta
Write-Host "After configuring secrets, test by:" -ForegroundColor White
Write-Host "- Pushing to main branch (triggers auto-deploy)" -ForegroundColor White
Write-Host "- Or manually trigger workflow in GitHub Actions tab" -ForegroundColor White

Write-Host ""
Write-Host "The workflow will now:" -ForegroundColor Green
Write-Host "- Validate all required secrets before deployment" -ForegroundColor White
Write-Host "- Use default values for optional secrets" -ForegroundColor White
Write-Host "- Provide clear error messages for missing secrets" -ForegroundColor White
Write-Host "- Continue deployment only if all requirements are met" -ForegroundColor White

Write-Host ""
Write-Host "Done!" -ForegroundColor Green