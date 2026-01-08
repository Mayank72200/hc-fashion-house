# Supabase Setup Guide

## 🎯 Quick Setup Checklist

Run these steps in order:

### Step 1: Supabase Dashboard Settings

1. **Go to**: [app.supabase.com](https://app.supabase.com) → Your Project → Authentication → Providers

2. **Enable Email Provider**:
   - Click on "Email"
   - Toggle ON "Enable Email provider"
   - Toggle ON "Enable email confirmations" (optional for MVP)
   - Click "Save"

3. **Go to**: Authentication → Settings

4. **Configure Auth Settings**:
   | Setting | Value |
   |---------|-------|
   | Site URL | `http://localhost:3000` |
   | Redirect URLs | `http://localhost:3000/*`, `https://yourdomain.com/*` |
   | JWT expiry | `3600` (1 hour) |

5. **(Optional) Enable Google Login**:
   - Go to Authentication → Providers → Google
   - Toggle ON
   - Add your Google OAuth credentials

---

### Step 2: Create Database Tables

1. **Go to**: SQL Editor (left sidebar)

2. **Copy & paste** the entire contents of `database/supabase_schema.sql`

3. **Click "Run"**

This will create:
- ✅ `user_profile` table
- ✅ `roles` table (with ADMIN, CUSTOMER, DELIVERY seeded)
- ✅ `user_roles` table
- ✅ `auth_meta` table
- ✅ `user_preferences` table
- ✅ `user_audit_log` table
- ✅ Row Level Security (RLS) policies
- ✅ Auto-create trigger for new users

---

### Step 3: Get API Keys

1. **Go to**: Settings → API

2. **Copy these values to your `.env` file**:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend!

---

### Step 4: Test Authentication

1. **Create a test user**:
   - Go to Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Click "Create user"

2. **Test the API**:
   ```bash
   # Get access token (use Supabase client or Dashboard)
   # Then test the /auth/me endpoint:
   
   curl -X GET "http://localhost:8000/api/v1/auth/me" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `database/supabase_schema.sql` | SQL to create all user tables in Supabase |
| `services/auth_service.py` | Service layer for Supabase Postgres queries |
| `utils/supabase_config.py` | Supabase client configuration |
| `utils/auth_dependencies.py` | FastAPI auth dependencies |
| `routers/v1/auth_router.py` | Auth API endpoints |

---

## ✅ Verification Checklist

After setup, verify these work:

| Test | Expected Result |
|------|-----------------|
| `GET /api/v1/auth/me` with valid JWT | Returns user profile |
| `GET /api/v1/auth/me` without token | Returns 401 Unauthorized |
| New user signup | Auto-creates `user_profile` + assigns CUSTOMER role |
| Admin endpoints | Only work with ADMIN role |

---

## 🔐 How Authentication Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  Supabase   │────▶│   Backend   │
│             │     │    Auth     │     │  (FastAPI)  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │
      │  1. Login          │                    │
      │───────────────────▶│                    │
      │                    │                    │
      │  2. JWT Token      │                    │
      │◀───────────────────│                    │
      │                    │                    │
      │  3. API Request with Token             │
      │────────────────────────────────────────▶│
      │                    │                    │
      │                    │  4. Verify JWT     │
      │                    │◀───────────────────│
      │                    │                    │
      │                    │  5. Return user    │
      │                    │───────────────────▶│
      │                    │                    │
      │  6. Response                           │
      │◀────────────────────────────────────────│
```

---

## 🚨 Common Issues

### "User profile not found"
- The auto-create trigger may not have run
- Check if `user_profile` table has a row for the user
- Run the trigger SQL again if needed

### "Invalid token"
- Token may be expired (1 hour default)
- Make sure you're using the access_token, not refresh_token
- Check SUPABASE_URL and SUPABASE_ANON_KEY are correct

### "Role required" error
- User doesn't have the required role
- Go to Supabase → SQL Editor and assign role:
  ```sql
  INSERT INTO user_roles (user_id, role_id)
  SELECT 'user-uuid-here', role_id FROM roles WHERE role_name = 'ADMIN';
  ```

