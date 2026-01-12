# Cloudflare R2 Environment Variables

## Required Variables

Add these to your `.env` file in `hc-fashion-house-backend/app/`:

```env
# Cloudflare R2 Storage
HC_CF_ACCOUNT_ID=your_cloudflare_account_id
HC_CF_ACCESS_KEY_ID=your_r2_access_key_id
HC_CF_SECRET_ACCESS_KEY=your_r2_secret_access_key
HC_CF_BUCKET_NAME=your_r2_bucket_name
HC_CF_BUCKET_PUBLIC_URL=https://your-bucket-domain.com
```

---

## How to Get These Values

### 1. HC_CF_ACCOUNT_ID
1. Log in to Cloudflare Dashboard
2. Go to R2 → Overview
3. Your Account ID is shown on the right sidebar
4. Format: `abc123def456ghi789`

### 2. HC_CF_ACCESS_KEY_ID & HC_CF_SECRET_ACCESS_KEY
1. Go to R2 → Manage R2 API Tokens
2. Click "Create API Token"
3. Configure:
   - **Token name**: `hc-fashion-house-backend`
   - **Permissions**: Object Read & Write
   - **Bucket**: Select your bucket (or "All buckets")
   - **TTL**: No expiry (or set as needed)
4. Click "Create API Token"
5. Copy the **Access Key ID** and **Secret Access Key**
   - ⚠️ Save immediately - secret is shown only once!

### 3. HC_CF_BUCKET_NAME
The name you chose when creating your R2 bucket.
- Example: `hc-fashion-house`
- Must be unique within your account
- Lowercase letters, numbers, hyphens only

### 4. HC_CF_BUCKET_PUBLIC_URL
1. Go to R2 → Your Bucket → Settings
2. Scroll to "Public Access"
3. Two options:

   **Option A: Cloudflare Default Domain** (Quick)
   - Click "Allow Access"
   - Use the provided domain: `https://pub-xxxxx.r2.dev`

   **Option B: Custom Domain** (Recommended)
   - Click "Connect Domain"
   - Enter your domain: `cdn.yourstore.com`
   - Add DNS record as instructed
   - Use: `https://cdn.yourstore.com`

---

## Example .env File

```env
# ========================
# Cloudflare R2 Storage
# ========================
HC_CF_ACCOUNT_ID=abc123def456ghi789jkl012
HC_CF_ACCESS_KEY_ID=3f8b9c2d1e4a5b6c7d8e9f0a
HC_CF_SECRET_ACCESS_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
HC_CF_BUCKET_NAME=hc-fashion-house
HC_CF_BUCKET_PUBLIC_URL=https://pub-abc123.r2.dev
```

---

## Security Best Practices

1. **Never commit .env file to Git**
   - Already in `.gitignore`
   - Use `.env_dev_template` for sharing structure

2. **Rotate API tokens regularly**
   - Delete old tokens after creating new ones
   - Update `.env` file

3. **Use least privilege**
   - API tokens should only have Read & Write permissions
   - No Admin or Account-level permissions needed

4. **Different tokens for different environments**
   - Development: One token
   - Staging: Different token
   - Production: Different token

---

## Verification

Test your configuration:

```bash
# Start the backend
cd hc-fashion-house-backend/app
python -m uvicorn main_ecom:app --reload

# In another terminal, test the health endpoint
curl http://localhost:8000/api/v1/media/health
```

Expected response:
```json
{
  "connected": true,
  "bucket": "hc-fashion-house",
  "account_id": "abc123***",
  "endpoint": "https://abc123def456ghi789jkl012.r2.cloudflarestorage.com"
}
```

---

## Common Issues

### Issue: "Bucket not found"
- **Solution**: Verify `HC_CF_BUCKET_NAME` matches your bucket name exactly

### Issue: "Access Denied"
- **Solution**: 
  - Check API token has Read & Write permissions
  - Verify token is not expired
  - Regenerate token if needed

### Issue: "Invalid credentials"
- **Solution**:
  - Check `HC_CF_ACCESS_KEY_ID` is correct
  - Check `HC_CF_SECRET_ACCESS_KEY` is correct (no spaces/newlines)
  - Ensure no quotes around values in `.env`

### Issue: Images upload but 403 when accessing
- **Solution**:
  - Enable public access on bucket
  - Verify `HC_CF_BUCKET_PUBLIC_URL` is correct
  - Check CORS settings if accessing from browser

---

## CORS Configuration (Optional)

If accessing images directly from browser (frontend):

1. Go to R2 → Your Bucket → Settings → CORS policy
2. Add this configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourstore.com"
    ],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## Need Help?

- Cloudflare R2 Docs: https://developers.cloudflare.com/r2/
- R2 API Reference: https://developers.cloudflare.com/r2/api/
- boto3 S3 Docs: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html

---

**Quick Start**: Copy `.env_dev_template` → `.env` and fill in your values!
