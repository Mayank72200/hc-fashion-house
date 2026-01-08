-- ============================================
-- E-Commerce User Management Tables for Supabase
-- Run this SQL in Supabase Dashboard -> SQL Editor
-- ============================================

-- ============================================
-- 1. ROLES TABLE (Create first - no dependencies)
-- ============================================
CREATE TABLE IF NOT EXISTS public.roles (
    role_id SERIAL PRIMARY KEY,
    role_name TEXT UNIQUE NOT NULL CHECK (role_name IN ('ADMIN', 'CUSTOMER', 'DELIVERY'))
);

-- Seed default roles
INSERT INTO public.roles (role_name) VALUES ('ADMIN'), ('CUSTOMER'), ('DELIVERY')
ON CONFLICT (role_name) DO NOTHING;

-- ============================================
-- 2. USER PROFILE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profile (
    id UUID PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    dob DATE,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED', 'DELETED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user_profile_auth FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profile_email ON public.user_profile(email);
CREATE INDEX IF NOT EXISTS idx_user_profile_phone ON public.user_profile(phone);
CREATE INDEX IF NOT EXISTS idx_user_profile_status ON public.user_profile(status);

-- ============================================
-- 3. USER ROLES TABLE (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID NOT NULL,
    role_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES public.user_profile(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- ============================================
-- 4. AUTH META TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.auth_meta (
    user_id UUID PRIMARY KEY,
    last_login_at TIMESTAMPTZ,
    login_provider TEXT CHECK (login_provider IN ('EMAIL', 'GOOGLE', 'GITHUB', 'INSTAGRAM')),
    failed_login_count INTEGER DEFAULT 0,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_auth_meta_user FOREIGN KEY (user_id) REFERENCES public.user_profile(id) ON DELETE CASCADE
);

-- ============================================
-- 5. USER PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY,
    preferred_language TEXT DEFAULT 'en',
    preferred_size TEXT,
    preferred_color TEXT,
    communication_channel TEXT DEFAULT 'EMAIL' CHECK (communication_channel IN ('EMAIL', 'WHATSAPP', 'INSTAGRAM')),
    CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES public.user_profile(id) ON DELETE CASCADE
);

-- ============================================
-- 6. USER AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_audit_log (
    audit_id SERIAL PRIMARY KEY,
    user_id UUID,
    action TEXT NOT NULL CHECK (action IN ('LOGIN', 'LOGOUT', 'PROFILE_UPDATE', 'ROLE_ASSIGNED', 'ROLE_REMOVED')),
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_audit_log_user FOREIGN KEY (user_id) REFERENCES public.user_profile(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON public.user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_action ON public.user_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_created_at ON public.user_audit_log(created_at DESC);

-- ============================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS POLICIES - USER PROFILE
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.user_profile FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.user_profile FOR UPDATE
USING (auth.uid() = id);

-- Service role can do everything (for backend)
CREATE POLICY "Service role full access to user_profile"
ON public.user_profile FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- 9. RLS POLICIES - USER ROLES
-- ============================================

-- Users can read their own roles
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage roles
CREATE POLICY "Service role full access to user_roles"
ON public.user_roles FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- 10. RLS POLICIES - AUTH META
-- ============================================

-- Users can read their own auth meta
CREATE POLICY "Users can read own auth_meta"
ON public.auth_meta FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage auth meta
CREATE POLICY "Service role full access to auth_meta"
ON public.auth_meta FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- 11. RLS POLICIES - USER PREFERENCES
-- ============================================

-- Users can read their own preferences
CREATE POLICY "Users can read own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role can manage preferences
CREATE POLICY "Service role full access to user_preferences"
ON public.user_preferences FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- 12. RLS POLICIES - USER AUDIT LOG
-- ============================================

-- Users can read their own audit logs
CREATE POLICY "Users can read own audit_log"
ON public.user_audit_log FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage audit logs
CREATE POLICY "Service role full access to user_audit_log"
ON public.user_audit_log FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- 13. TRIGGER: Auto-create user_profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO public.user_profile (id, email, full_name, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        'ACTIVE'
    );

    -- Create auth meta
    INSERT INTO public.auth_meta (user_id, login_provider, is_email_verified)
    VALUES (
        NEW.id,
        CASE
            WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN 'GOOGLE'
            WHEN NEW.raw_app_meta_data->>'provider' = 'github' THEN 'GITHUB'
            ELSE 'EMAIL'
        END,
        NEW.email_confirmed_at IS NOT NULL
    );

    -- Create default preferences
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);

    -- Assign default CUSTOMER role
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT NEW.id, role_id FROM public.roles WHERE role_name = 'CUSTOMER';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 14. TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profile_updated_at ON public.user_profile;
CREATE TRIGGER update_user_profile_updated_at
    BEFORE UPDATE ON public.user_profile
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DONE!
-- ============================================
-- After running this SQL:
-- 1. Go to Authentication -> Providers
--    - Enable Email provider
--    - Enable Password login
--    - (Optional) Enable Google login
-- 2. Go to Authentication -> Settings
--    - Set JWT expiry = 3600 (1 hour)
--    - Enable refresh tokens
--    - Add redirect URLs:
--      - http://localhost:3000/*
--      - https://yourdomain.com/*
-- ============================================

