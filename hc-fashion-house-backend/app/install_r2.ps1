# Cloudflare R2 Migration - Dependency Installation (Windows)
# Run this script to install required packages for R2 storage

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "HC Fashion House - R2 Migration Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "requirements.txt")) {
    Write-Host "❌ Error: requirements.txt not found" -ForegroundColor Red
    Write-Host "Please run this script from: hc-fashion-house-backend\app\" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing R2 dependencies..." -ForegroundColor Yellow
Write-Host ""

# Install boto3 and botocore
pip install boto3 botocore

Write-Host ""
Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Copy configs\.env_dev_template to .env" -ForegroundColor White
    Write-Host "   Copy-Item configs\.env_dev_template .env" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Edit .env and add your R2 credentials:" -ForegroundColor White
    Write-Host "   - HC_CF_ACCOUNT_ID" -ForegroundColor Gray
    Write-Host "   - HC_CF_ACCESS_KEY_ID" -ForegroundColor Gray
    Write-Host "   - HC_CF_SECRET_ACCESS_KEY" -ForegroundColor Gray
    Write-Host "   - HC_CF_BUCKET_NAME" -ForegroundColor Gray
    Write-Host "   - HC_CF_BUCKET_PUBLIC_URL" -ForegroundColor Gray
    Write-Host ""
    Write-Host "See R2_ENV_SETUP.md for detailed instructions" -ForegroundColor Cyan
} else {
    Write-Host "✅ .env file found" -ForegroundColor Green
    Write-Host ""
    
    # Check if R2 variables are set
    $envContent = Get-Content .env -Raw
    if ($envContent -match "HC_CF_ACCOUNT_ID=your_") {
        Write-Host "⚠️  Warning: R2 credentials not configured in .env" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please update these variables in .env:" -ForegroundColor White
        Write-Host "  - HC_CF_ACCOUNT_ID" -ForegroundColor Gray
        Write-Host "  - HC_CF_ACCESS_KEY_ID" -ForegroundColor Gray
        Write-Host "  - HC_CF_SECRET_ACCESS_KEY" -ForegroundColor Gray
        Write-Host "  - HC_CF_BUCKET_NAME" -ForegroundColor Gray
        Write-Host "  - HC_CF_BUCKET_PUBLIC_URL" -ForegroundColor Gray
        Write-Host ""
        Write-Host "See R2_ENV_SETUP.md for instructions" -ForegroundColor Cyan
    } else {
        Write-Host "✅ R2 credentials configured" -ForegroundColor Green
        Write-Host ""
        Write-Host "Testing R2 connection..." -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "To test R2 connection:" -ForegroundColor White
        Write-Host "1. Start the server: python -m uvicorn main_ecom:app --reload" -ForegroundColor Gray
        Write-Host "2. Test health: curl http://localhost:8000/api/v1/media/health" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor White
Write-Host "  - Migration guide: ..\CLOUDFLARE_R2_MIGRATION.md" -ForegroundColor Gray
Write-Host "  - Quick summary: ..\MIGRATION_SUMMARY.md" -ForegroundColor Gray
Write-Host "  - Env setup: ..\R2_ENV_SETUP.md" -ForegroundColor Gray
Write-Host ""
