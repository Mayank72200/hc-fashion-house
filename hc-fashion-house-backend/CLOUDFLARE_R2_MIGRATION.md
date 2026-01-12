# Cloudflare R2 Migration Guide

## Overview
This document describes the migration from Cloudinary to Cloudflare R2 for media storage.

---

## What Changed

### 1. Storage Backend
- **Before**: Cloudinary (cloud-based image CDN)
- **After**: Cloudflare R2 (S3-compatible object storage with CDN)

### 2. Dependencies
- **Removed**: `cloudinary`
- **Added**: `boto3`, `botocore`

### 3. Configuration
Environment variables in `.env`:
```env
# REMOVED - Cloudinary
# CLOUDINARY_CLOUD_NAME=xxx
# CLOUDINARY_API_KEY=xxx
# CLOUDINARY_API_SECRET=xxx

# ADDED - Cloudflare R2
HC_CF_ACCOUNT_ID=your_cloudflare_account_id
HC_CF_ACCESS_KEY_ID=your_r2_access_key_id
HC_CF_SECRET_ACCESS_KEY=your_r2_secret_access_key
HC_CF_BUCKET_NAME=your_r2_bucket_name
HC_CF_BUCKET_PUBLIC_URL=https://your-bucket-domain.com
```

---

## Migration Steps

### Step 1: Install New Dependencies

```bash
cd hc-fashion-house-backend/app
pip install boto3 botocore
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

### Step 2: Configure Cloudflare R2

1. **Create R2 Bucket** in Cloudflare Dashboard
   - Go to R2 → Create Bucket
   - Name: `hc-fashion-house` (or your choice)
   - Enable public access domain

2. **Create API Tokens**
   - Go to R2 → Manage R2 API Tokens
   - Create new API token with read/write permissions
   - Copy Access Key ID and Secret Access Key

3. **Set Up Public Domain**
   - Go to your bucket → Settings → Public Access
   - Add custom domain or use Cloudflare's default domain
   - Copy the public URL

4. **Update .env file**
   ```env
   HC_CF_ACCOUNT_ID=abc123def456
   HC_CF_ACCESS_KEY_ID=your_access_key
   HC_CF_SECRET_ACCESS_KEY=your_secret_key
   HC_CF_BUCKET_NAME=hc-fashion-house
   HC_CF_BUCKET_PUBLIC_URL=https://pub-xxxxx.r2.dev
   ```

### Step 3: Verify Migration

Test the health endpoint:
```bash
curl http://localhost:8000/api/v1/media/health
```

Expected response:
```json
{
  "connected": true,
  "bucket": "hc-fashion-house",
  "account_id": "abc123***",
  "endpoint": "https://abc123def456.r2.cloudflarestorage.com"
}
```

---

## Architecture Changes

### File Structure

#### Before (Cloudinary)
```
cloudinary.com/
├── hc-fashion-house/
│   ├── products/
│   │   ├── footwear/
│   │   │   └── {brand}/
│   │   │       └── {catalogue}/
│   │   │           └── {product}/
│   │   │               ├── catalogue/
│   │   │               └── lifestyle/
```

#### After (R2)
```
R2 Bucket Root/
├── products/
│   ├── {platform}/
│   │   └── {brand}/
│   │       └── {catalogue}/
│   │           └── {product}/
│   │               ├── catalogue/
│   │               │   ├── hero.jpg
│   │               │   ├── side.jpg
│   │               │   └── back.jpg
│   │               └── lifestyle/
│   │                   └── model-1.jpg
├── catalogues/
│   └── {catalogue}/
│       └── banner.jpg
├── categories/
│   └── {category}/
│       └── banner.jpg
└── global/
    ├── brands/
    ├── offers/
    └── videos/
```

### Path Generation

**Product Images**:
```
products/{platform}/{brand}/{catalogue}/{product}/{usage_type}/{filename}
Example: products/footwear/nike/hr-416/white-grey/catalogue/hero.jpg
```

**Catalogue Banners**:
```
catalogues/{catalogue_slug}/{filename}
Example: catalogues/hr-416/banner.jpg
```

**Category Banners**:
```
categories/{category_slug}/{filename}
Example: categories/men-casual/banner.jpg
```

**Global Media**:
```
global/{folder_type}/{filename}
Example: global/brands/nike-logo.png
```

---

## Code Changes

### Files Modified

1. **`utils/r2_config.py`** (NEW)
   - R2 client with boto3
   - Path generators
   - File utilities

2. **`services/media_upload_service.py`**
   - Replaced `upload_to_cloudinary()` → `upload_to_r2()`
   - Replaced `check_cloudinary_connection()` → `check_r2_connection()`
   - Updated path generation

3. **`routers/v1/media_router.py`**
   - Updated health check endpoint
   - Documentation updates

4. **`requirements.txt`**
   - Removed `cloudinary`
   - Added `boto3`, `botocore`

5. **`configs/.env_dev_template`**
   - Replaced Cloudinary config with R2 config

---

## API Compatibility

### No Breaking Changes

All API endpoints remain the same:
- `POST /api/v1/media/product-variant`
- `POST /api/v1/media/catalogue-banner`
- `POST /api/v1/media/category-banner`
- `POST /api/v1/media/global`
- `GET /api/v1/media/health`

Response formats are unchanged (still use `cloudinary_url` field name for backward compatibility).

---

## Database Schema

### No Migration Required

The `media_assets` table schema remains unchanged:
- `cloudinary_url` → Now stores R2 public URL
- `public_id` → Now stores R2 object path
- `folder_path` → Now stores R2 object path

Future migration: Rename `cloudinary_url` → `media_url` (optional)

---

## Features

### R2 Advantages

1. **Cost**: Much cheaper than Cloudinary
2. **S3 Compatible**: Standard AWS SDK
3. **No Bandwidth Fees**: Cloudflare doesn't charge for bandwidth
4. **Deterministic Paths**: Clean, predictable URLs
5. **Full Control**: Own your storage infrastructure

### Current Limitations

1. **No Image Transformations**: R2 doesn't process images
   - Width, height, aspect_ratio set to NULL for now
   - Future: Add image processing with Cloudflare Images or sharp.js

2. **No Auto-Optimization**: No automatic format conversion
   - Consider adding image optimization before upload

---

## Migration Checklist

- [ ] Install boto3 and botocore
- [ ] Create Cloudflare R2 bucket
- [ ] Generate R2 API tokens
- [ ] Set up public domain
- [ ] Update .env file
- [ ] Test health endpoint
- [ ] Upload test image
- [ ] Verify image is accessible via CDN
- [ ] (Optional) Migrate existing Cloudinary images to R2

---

## Troubleshooting

### Health Check Fails

**Error**: "Could not connect to R2"
- Verify environment variables are set correctly
- Check API token permissions
- Ensure bucket exists

### Upload Fails

**Error**: "Access Denied"
- Verify API token has write permissions
- Check bucket name matches HC_CF_BUCKET_NAME

**Error**: "Invalid file type"
- Allowed image types: jpg, jpeg, png, webp, gif
- Allowed video types: mp4, mov, avi

### Images Not Accessible

**Error**: 403 Forbidden
- Enable public access on bucket
- Verify HC_CF_BUCKET_PUBLIC_URL is correct
- Check object path is correct

---

## Rollback Plan

If you need to rollback to Cloudinary:

1. Revert `requirements.txt`:
   ```bash
   git checkout requirements.txt
   ```

2. Revert code changes:
   ```bash
   git checkout app/services/media_upload_service.py
   git checkout app/routers/v1/media_router.py
   rm app/utils/r2_config.py
   ```

3. Reinstall Cloudinary:
   ```bash
   pip install cloudinary
   ```

4. Restore Cloudinary env vars in `.env`

---

## Future Enhancements

1. **Image Processing**
   - Integrate Cloudflare Images API
   - Or use sharp.js/Pillow for server-side processing
   - Generate thumbnails, resize, optimize

2. **CDN Optimization**
   - Set up Cloudflare cache rules
   - Configure image caching headers
   - Add WebP conversion

3. **Migration Script**
   - Script to migrate existing Cloudinary images to R2
   - Bulk download and re-upload
   - Update database URLs

4. **Monitoring**
   - Add R2 usage metrics
   - Track upload/download bandwidth
   - Monitor storage costs

---

## Support

For issues or questions:
- Check Cloudflare R2 documentation: https://developers.cloudflare.com/r2/
- Review boto3 S3 documentation: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html

---

**Migration completed by**: GitHub Copilot  
**Date**: 2024  
**Status**: ✅ Ready for Testing
