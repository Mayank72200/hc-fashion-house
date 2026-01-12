# 🚀 R2 Migration - Quick Start

The backend has been migrated from Cloudinary to Cloudflare R2 for media storage.

---

## 🎯 Quick Setup (3 Steps)

### 1. Install Dependencies

**Windows (PowerShell):**
```powershell
cd hc-fashion-house-backend\app
.\install_r2.ps1
```

**Linux/Mac:**
```bash
cd hc-fashion-house-backend/app
./install_r2.sh
```

**Manual:**
```bash
pip install boto3 botocore
```

### 2. Configure R2 Credentials

Copy environment template:
```bash
cp configs/.env_dev_template .env
```

Edit `.env` and add your R2 credentials:
```env
HC_CF_ACCOUNT_ID=your_cloudflare_account_id
HC_CF_ACCESS_KEY_ID=your_r2_access_key_id
HC_CF_SECRET_ACCESS_KEY=your_r2_secret_access_key
HC_CF_BUCKET_NAME=your_r2_bucket_name
HC_CF_BUCKET_PUBLIC_URL=https://your-bucket-domain.com
```

📖 **Need help?** See [R2_ENV_SETUP.md](R2_ENV_SETUP.md) for detailed instructions.

### 3. Test Connection

Start the backend:
```bash
python -m uvicorn main_ecom:app --reload
```

Test R2 health:
```bash
curl http://localhost:8000/api/v1/media/health
```

✅ Success response:
```json
{
  "connected": true,
  "bucket": "hc-fashion-house",
  "account_id": "abc123***"
}
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) | Quick overview of all changes |
| [CLOUDFLARE_R2_MIGRATION.md](CLOUDFLARE_R2_MIGRATION.md) | Complete migration guide |
| [R2_ENV_SETUP.md](R2_ENV_SETUP.md) | Environment variable setup |

---

## 🔑 Key Changes

### What Changed
- ❌ Removed Cloudinary
- ✅ Added Cloudflare R2 (S3-compatible)
- ✅ New R2 client utility
- ✅ Updated media upload service
- ✅ No API breaking changes

### What Stayed the Same
- ✅ All API endpoints
- ✅ Response formats
- ✅ Database schema
- ✅ Frontend compatibility

---

## 📁 File Structure

```
hc-fashion-house-backend/
├── app/
│   ├── utils/
│   │   └── r2_config.py           ← NEW: R2 client
│   ├── services/
│   │   └── media_upload_service.py ← UPDATED: Uses R2
│   ├── routers/v1/
│   │   └── media_router.py        ← UPDATED: Health endpoint
│   ├── configs/
│   │   └── .env_dev_template      ← UPDATED: R2 vars
│   ├── requirements.txt           ← UPDATED: boto3
│   ├── install_r2.ps1            ← NEW: Windows installer
│   └── install_r2.sh             ← NEW: Linux/Mac installer
├── MIGRATION_SUMMARY.md          ← NEW: Quick summary
├── CLOUDFLARE_R2_MIGRATION.md    ← NEW: Full guide
└── R2_ENV_SETUP.md               ← NEW: Env setup
```

---

## 🧪 Testing

### Manual Test Checklist

1. **Health Check**
   ```bash
   curl http://localhost:8000/api/v1/media/health
   ```

2. **Upload Product Image**
   - Use admin panel or API
   - Verify image uploads to R2
   - Check image accessible via CDN

3. **Upload Catalogue Banner**
   - Test banner upload
   - Verify public URL works

4. **Delete Media**
   - Delete an uploaded image
   - Verify removed from R2 and DB

---

## 🛠️ Troubleshooting

### Common Issues

**"Bucket not found"**
- Check `HC_CF_BUCKET_NAME` in `.env`

**"Access Denied"**
- Verify R2 API token has Read & Write permissions
- Check token not expired

**"Images upload but 403 when accessing"**
- Enable public access on R2 bucket
- Verify `HC_CF_BUCKET_PUBLIC_URL` is correct

**Import errors**
- Run `pip install boto3 botocore`

📖 **More help:** See [CLOUDFLARE_R2_MIGRATION.md](CLOUDFLARE_R2_MIGRATION.md#troubleshooting)

---

## 💡 Benefits

| Feature | Before (Cloudinary) | After (R2) |
|---------|---------------------|------------|
| Cost | $$ | $ |
| Bandwidth | Limited/Paid | Unlimited/Free |
| Control | Limited | Full |
| URLs | Random | Deterministic |
| Standard | Proprietary | S3-compatible |

---

## 🚧 Future Enhancements

- [ ] Image transformations (resize, optimize)
- [ ] Cloudflare Images API integration
- [ ] Automatic WebP conversion
- [ ] Thumbnail generation
- [ ] Migration script for old images

---

## 📞 Support

- Cloudflare R2 Docs: https://developers.cloudflare.com/r2/
- boto3 S3 Docs: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html

---

## ✨ Status

- ✅ Backend migration: **Complete**
- ✅ Testing: **Ready**
- ✅ Documentation: **Complete**
- ❌ Frontend changes: **None required**

---

**Migration Date:** 2024  
**Status:** ✅ Ready for Production  
**Breaking Changes:** None

---

## 🎉 You're all set!

Follow the 3 quick steps above to get started with R2 storage.

Questions? Check the [CLOUDFLARE_R2_MIGRATION.md](CLOUDFLARE_R2_MIGRATION.md) guide.
