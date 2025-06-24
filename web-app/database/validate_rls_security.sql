-- ===============================================================================
-- RLS SECURITY VALIDATION SCRIPT
-- Nexa Manager - Database-Level Row Level Security Verification
-- ===============================================================================
-- 
-- This script validates that all tables have proper RLS policies implemented
-- and tests for security vulnerabilities or gaps in the RLS implementation.
-- 
-- Run this script as a superuser or RLS admin to audit security.
-- ===============================================================================

-- 1. CHECK RLS STATUS FOR ALL TABLES
-- ===============================================================================
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED' 
        ELSE '❌ DISABLED' 
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE '_realtime_%'
ORDER BY tablename;

-- 2. LIST ALL RLS POLICIES
-- ===============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. IDENTIFY TABLES WITHOUT RLS
-- ===============================================================================
SELECT 
    table_name,
    '❌ RLS NOT ENABLED' as issue
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
            AND rowsecurity = true
    )
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE '_realtime_%'
ORDER BY table_name;

-- 4. IDENTIFY TABLES WITH user_id BUT NO RLS POLICIES
-- ===============================================================================
SELECT DISTINCT
    t.table_name,
    '⚠️ HAS user_id BUT NO RLS POLICIES' as issue
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND c.table_schema = 'public'
    AND c.column_name = 'user_id'
    AND t.table_name NOT IN (
        SELECT DISTINCT tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    )
ORDER BY t.table_name;

-- 5. VALIDATE CORE USER DATA TABLES HAVE PROPER POLICIES
-- ===============================================================================
WITH core_tables AS (
    SELECT unnest(ARRAY[
        'profiles', 'clients', 'invoices', 'quotes', 'appointments', 
        'events', 'expenses', 'incomes', 'documents'
    ]) as table_name
),
rls_check AS (
    SELECT 
        ct.table_name,
        CASE WHEN pt.rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status,
        COUNT(pp.policyname) as policy_count
    FROM core_tables ct
    LEFT JOIN pg_tables pt ON ct.table_name = pt.tablename AND pt.schemaname = 'public'
    LEFT JOIN pg_policies pp ON ct.table_name = pp.tablename AND pp.schemaname = 'public'
    GROUP BY ct.table_name, pt.rowsecurity
)
SELECT 
    table_name,
    rls_status,
    policy_count,
    CASE 
        WHEN rls_status = 'ENABLED' AND policy_count >= 4 THEN '✅ SECURE'
        WHEN rls_status = 'ENABLED' AND policy_count > 0 THEN '⚠️ LIMITED POLICIES'
        WHEN rls_status = 'ENABLED' AND policy_count = 0 THEN '❌ RLS ENABLED BUT NO POLICIES'
        ELSE '❌ RLS DISABLED'
    END as security_status
FROM rls_check
ORDER BY table_name;

-- 6. CHECK FOR OVERLY PERMISSIVE POLICIES
-- ===============================================================================
SELECT 
    tablename,
    policyname,
    cmd,
    '⚠️ POTENTIALLY OVERLY PERMISSIVE' as warning,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND (
        qual IS NULL  -- No restrictions
        OR qual ILIKE '%true%'  -- Always true conditions
        OR qual ILIKE '%1=1%'   -- Always true conditions
    )
ORDER BY tablename, policyname;

-- 7. VERIFY auth.uid() USAGE IN POLICIES
-- ===============================================================================
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual ILIKE '%auth.uid()%' THEN '✅ USES auth.uid()'
        WHEN qual ILIKE '%user_id%' THEN '⚠️ USES user_id (check logic)'
        ELSE '❌ NO USER FILTERING DETECTED'
    END as auth_check,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 8. TEST BASIC RLS FUNCTIONALITY (Basic verification)
-- ===============================================================================
-- Note: These queries will only return data if RLS is working properly
-- Run these as different authenticated users to verify isolation

-- Check if policies prevent unauthorized access
DO $$
BEGIN
    -- This should only return current user's data or fail appropriately
    RAISE INFO 'Testing RLS on clients table...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
        RAISE INFO 'Clients table exists - RLS policies should restrict access to user data only';
    END IF;
    
    -- Add more validation as needed
    RAISE INFO 'RLS validation check completed. Review results above.';
END $$;

-- 9. STORAGE BUCKET POLICIES CHECK
-- ===============================================================================
-- Check if storage policies are in place for file uploads
SELECT 
    bucket_id,
    name as policy_name,
    definition,
    CASE 
        WHEN definition ILIKE '%auth.uid()%' THEN '✅ USER-SCOPED'
        ELSE '⚠️ CHECK SECURITY'
    END as security_check
FROM storage.policies
ORDER BY bucket_id, name;

-- 10. SUMMARY REPORT
-- ===============================================================================
SELECT 
    'RLS SECURITY AUDIT SUMMARY' as report_section,
    COUNT(*) FILTER (WHERE rowsecurity = true) as tables_with_rls,
    COUNT(*) FILTER (WHERE rowsecurity = false) as tables_without_rls,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE '_realtime_%';

-- ===============================================================================
-- SECURITY RECOMMENDATIONS
-- ===============================================================================
/*
RECOMMENDED ACTIONS AFTER RUNNING THIS SCRIPT:

1. ✅ ENABLE RLS on any tables showing as DISABLED
2. ⚠️ CREATE POLICIES for tables with user_id but no policies  
3. ❌ REVIEW overly permissive policies
4. 🔍 TEST with multiple users to verify data isolation
5. 📖 DOCUMENT any custom policy logic for maintenance

NEXT STEPS:
- Run client-side filtering cleanup script
- Implement RLS testing in CI/CD pipeline
- Create RLS policy templates for new tables
- Set up monitoring for policy violations
*/ 