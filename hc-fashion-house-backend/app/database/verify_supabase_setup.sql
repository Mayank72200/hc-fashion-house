-- ============================================
-- VERIFICATION QUERIES FOR SUPABASE SETUP
-- Run each section in Supabase SQL Editor to verify
-- ============================================

-- ============================================
-- 1. VERIFY TABLES EXIST
-- ============================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('roles', 'user_profile', 'user_roles', 'auth_meta', 'user_preferences', 'user_audit_log')
ORDER BY table_name;

-- Expected output:
-- auth_meta
-- roles
-- user_audit_log
-- user_preferences
-- user_profile
-- user_roles

-- ============================================
-- 2. VERIFY ROLES ARE SEEDED
-- ============================================
SELECT * FROM public.roles ORDER BY role_id;

-- Expected output:
-- role_id | role_name
-- 1       | ADMIN
-- 2       | CUSTOMER
-- 3       | DELIVERY

-- ============================================
-- 3. VERIFY RLS IS ENABLED ON ALL TABLES
-- ============================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('roles', 'user_profile', 'user_roles', 'auth_meta', 'user_preferences', 'user_audit_log')
ORDER BY tablename;

-- Expected output: All should show 'true' for rowsecurity
-- tablename        | rowsecurity
-- auth_meta        | true
-- roles            | false (roles table doesn't need RLS)
-- user_audit_log   | true
-- user_preferences | true
-- user_profile     | true
-- user_roles       | true

-- ============================================
-- 4. VERIFY RLS POLICIES EXIST
-- ============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected policies per table:
-- user_profile: "Users can read own profile", "Users can update own profile", "Service role full access"
-- user_roles: "Users can read own roles", "Service role full access"
-- auth_meta: "Users can read own auth_meta", "Service role full access"
-- user_preferences: "Users can read/update/insert own preferences", "Service role full access"
-- user_audit_log: "Users can read own audit_log", "Service role full access"

-- ============================================
-- 5. VERIFY TRIGGER EXISTS
-- ============================================
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth' OR trigger_schema = 'public'
ORDER BY trigger_name;

-- Expected: on_auth_user_created trigger on auth.users

-- ============================================
-- 6. VERIFY FUNCTIONS EXIST
-- ============================================
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'update_updated_at_column');

-- Expected:
-- handle_new_user | FUNCTION
-- update_updated_at_column | FUNCTION

-- ============================================
-- 7. VERIFY TABLE COLUMNS (user_profile)
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profile'
ORDER BY ordinal_position;

-- Expected columns: id, full_name, email, phone, dob, status, created_at, updated_at

-- ============================================
-- 8. VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Expected foreign keys:
-- user_profile.id -> auth.users.id
-- user_roles.user_id -> user_profile.id
-- user_roles.role_id -> roles.role_id
-- auth_meta.user_id -> user_profile.id
-- user_preferences.user_id -> user_profile.id
-- user_audit_log.user_id -> user_profile.id

-- ============================================
-- QUICK SUMMARY QUERY (Run this one!)
-- ============================================
SELECT
    'Tables' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 6 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('roles', 'user_profile', 'user_roles', 'auth_meta', 'user_preferences', 'user_audit_log')

UNION ALL

SELECT
    'Roles Seeded' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM public.roles

UNION ALL

SELECT
    'RLS Enabled Tables' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 5 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_profile', 'user_roles', 'auth_meta', 'user_preferences', 'user_audit_log')
AND rowsecurity = true

UNION ALL

SELECT
    'RLS Policies' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 10 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_policies
WHERE schemaname = 'public';

