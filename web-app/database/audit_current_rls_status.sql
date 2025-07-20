-- Comprehensive RLS Status Audit Script
-- This script checks the current state of all tables and their RLS configuration

-- 1. List all tables and their RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'ENABLED' 
        ELSE 'DISABLED' 
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. List all RLS policies currently in place
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as condition
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Check for tables that should have RLS but don't
SELECT 
    'TABLES WITHOUT RLS:' as audit_section,
    tablename
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = false
    AND tablename NOT IN ('spatial_ref_sys') -- Exclude system tables
ORDER BY tablename;

-- 4. Check for tables with RLS but no policies
SELECT 
    'TABLES WITH RLS BUT NO POLICIES:' as audit_section,
    t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
    AND t.rowsecurity = true
    AND p.policyname IS NULL
ORDER BY t.tablename;

-- 5. List all user-related columns that should be used for RLS
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND (column_name LIKE '%user_id%' OR column_name = 'id' AND table_name = 'profiles')
ORDER BY table_name, column_name;

-- 6. Check for authentication functions
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND (routine_name LIKE '%auth%' OR routine_name LIKE '%user%')
ORDER BY routine_name;

-- 7. Check current database roles and permissions
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolreplication,
    rolbypassrls
FROM pg_roles 
WHERE rolname NOT LIKE 'pg_%' 
    AND rolname NOT IN ('postgres', 'rds_superuser')
ORDER BY rolname;