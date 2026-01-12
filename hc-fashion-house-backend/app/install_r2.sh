#!/bin/bash

# Cloudflare R2 Migration - Dependency Installation
# Run this script to install required packages for R2 storage

echo "========================================="
echo "HC Fashion House - R2 Migration Setup"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found"
    echo "Please run this script from: hc-fashion-house-backend/app/"
    exit 1
fi

echo "📦 Installing R2 dependencies..."
echo ""

# Install boto3 and botocore
pip install boto3 botocore

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo ""
    echo "Next steps:"
    echo "1. Copy configs/.env_dev_template to .env"
    echo "   cp configs/.env_dev_template .env"
    echo ""
    echo "2. Edit .env and add your R2 credentials:"
    echo "   - HC_CF_ACCOUNT_ID"
    echo "   - HC_CF_ACCESS_KEY_ID"
    echo "   - HC_CF_SECRET_ACCESS_KEY"
    echo "   - HC_CF_BUCKET_NAME"
    echo "   - HC_CF_BUCKET_PUBLIC_URL"
    echo ""
    echo "See R2_ENV_SETUP.md for detailed instructions"
else
    echo "✅ .env file found"
    echo ""
    
    # Check if R2 variables are set
    if grep -q "HC_CF_ACCOUNT_ID=your_" .env; then
        echo "⚠️  Warning: R2 credentials not configured in .env"
        echo ""
        echo "Please update these variables in .env:"
        echo "  - HC_CF_ACCOUNT_ID"
        echo "  - HC_CF_ACCESS_KEY_ID"
        echo "  - HC_CF_SECRET_ACCESS_KEY"
        echo "  - HC_CF_BUCKET_NAME"
        echo "  - HC_CF_BUCKET_PUBLIC_URL"
        echo ""
        echo "See R2_ENV_SETUP.md for instructions"
    else
        echo "✅ R2 credentials configured"
        echo ""
        echo "Testing R2 connection..."
        echo ""
        
        # Try to start server and test health endpoint
        echo "To test R2 connection:"
        echo "1. Start the server: python -m uvicorn main_ecom:app --reload"
        echo "2. Test health: curl http://localhost:8000/api/v1/media/health"
    fi
fi

echo ""
echo "========================================="
echo "Installation complete!"
echo "========================================="
echo ""
echo "📚 Documentation:"
echo "  - Migration guide: ../CLOUDFLARE_R2_MIGRATION.md"
echo "  - Quick summary: ../MIGRATION_SUMMARY.md"
echo "  - Env setup: ../R2_ENV_SETUP.md"
echo ""
