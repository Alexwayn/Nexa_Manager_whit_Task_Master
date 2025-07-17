-- =====================================================
-- RLS POLICY TESTING SCRIPT
-- =====================================================
-- This script tests that RLS policies are working correctly
-- Run this after applying the RLS remediation plan

-- =====================================================
-- SETUP TEST ENVIRONMENT
-- =====================================================

-- Create test users (these should be real Clerk user IDs in production)
-- For testing purposes, we'll use mock UUIDs
DO $$
DECLARE
    test_user_1 UUID := '11111111-1111-1111-1111-111111111111';
    test_user_2 UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
    -- Note: In real environment, these would be actual Clerk user IDs
    -- This is just for testing RLS policy logic
    
    RAISE NOTICE 'Test users: % and %', test_user_1, test_user_2;
END $$;

-- =====================================================
-- TEST 1: VERIFY RLS IS ENABLED ON ALL TABLES
-- =====================================================

SELECT 
    'TEST 1: RLS STATUS CHECK' as test_name,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED' 
        ELSE '❌ DISABLED' 
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT IN ('spatial_ref_sys', 'rls_backup_%')
ORDER BY tablename;

-- =====================================================
-- TEST 2: VERIFY ALL TABLES HAVE POLICIES
-- =====================================================

SELECT 
    'TEST 2: POLICY COUNT CHECK' as test_name,
    t.tablename,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN COUNT(p.policyname) > 0 THEN '✅ HAS POLICIES'
        ELSE '❌ NO POLICIES'
    END as policy_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
    AND t.rowsecurity = true
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT IN ('spatial_ref_sys', 'rls_backup_%')
GROUP BY t.tablename
ORDER BY t.tablename;

-- =====================================================
-- TEST 3: LIST ALL POLICIES BY TABLE
-- =====================================================

SELECT 
    'TEST 3: POLICY DETAILS' as test_name,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'WITH CONDITION'
        ELSE 'NO CONDITION'
    END as has_condition,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK'
        ELSE 'NO CHECK'
    END as has_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- TEST 4: VERIFY AUTH.UID() FUNCTION EXISTS
-- =====================================================

SELECT 
    'TEST 4: AUTH FUNCTION CHECK' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'uid' 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
        ) THEN '✅ auth.uid() EXISTS'
        ELSE '❌ auth.uid() MISSING'
    END as auth_function_status;

-- =====================================================
-- TEST 5: SIMULATE USER CONTEXT TESTING
-- =====================================================

-- Note: This test simulates what would happen with different user contexts
-- In a real environment, you would test with actual authenticated users

CREATE OR REPLACE FUNCTION test_rls_with_user_context(test_user_id UUID)
RETURNS TABLE(
    test_name TEXT,
    table_name TEXT,
    operation TEXT,
    result TEXT
) AS $$
DECLARE
    rec RECORD;
    test_result TEXT;
BEGIN
    -- Test each table that should have user_id based RLS
    FOR rec IN 
        SELECT t.tablename 
        FROM pg_tables t
        WHERE t.schemaname = 'public' 
            AND t.rowsecurity = true
            AND EXISTS (
                SELECT 1 FROM information_schema.columns c
                WHERE c.table_schema = 'public'
                    AND c.table_name = t.tablename
                    AND c.column_name = 'user_id'
            )
        ORDER BY t.tablename
    LOOP
        BEGIN
            -- Test SELECT policy
            EXECUTE format('SET LOCAL row_security = on');
            EXECUTE format('SET LOCAL "request.jwt.claims" = ''{"sub": "%s"}''', test_user_id);
            
            EXECUTE format('SELECT COUNT(*) FROM %I WHERE user_id = $1', rec.tablename) 
            USING test_user_id;
            
            test_result := '✅ SELECT OK';
            
        EXCEPTION WHEN OTHERS THEN
            test_result := '❌ SELECT FAILED: ' || SQLERRM;
        END;
        
        RETURN QUERY SELECT 
            'TEST 5: USER CONTEXT SIMULATION'::TEXT,
            rec.tablename::TEXT,
            'SELECT'::TEXT,
            test_result::TEXT;
    END LOOP;
    
    -- Reset context
    RESET row_security;
    RESET "request.jwt.claims";
END;
$$ LANGUAGE plpgsql;

-- Run the user context test
SELECT * FROM test_rls_with_user_context('11111111-1111-1111-1111-111111111111');

-- =====================================================
-- TEST 6: CHECK FOR COMMON RLS POLICY PATTERNS
-- =====================================================

SELECT 
    'TEST 6: POLICY PATTERN CHECK' as test_name,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN '✅ USES auth.uid()'
        WHEN qual LIKE '%user_id%' THEN '✅ USES user_id'
        ELSE '⚠️  UNKNOWN PATTERN'
    END as pattern_check,
    qual as condition
FROM pg_policies 
WHERE schemaname = 'public'
    AND qual IS NOT NULL
ORDER BY tablename, policyname;

-- =====================================================
-- TEST 7: CHECK FOR TABLES WITHOUT USER_ID COLUMN
-- =====================================================

SELECT 
    'TEST 7: MISSING USER_ID CHECK' as test_name,
    t.tablename,
    CASE 
        WHEN c.column_name IS NULL THEN '⚠️  NO user_id COLUMN'
        ELSE '✅ HAS user_id COLUMN'
    END as user_id_status
FROM pg_tables t
LEFT JOIN information_schema.columns c ON (
    c.table_schema = 'public' 
    AND c.table_name = t.tablename 
    AND c.column_name = 'user_id'
)
WHERE t.schemaname = 'public' 
    AND t.rowsecurity = true
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT IN ('spatial_ref_sys', 'rls_backup_%')
ORDER BY t.tablename;

-- =====================================================
-- TEST 8: PERFORMANCE IMPACT CHECK
-- =====================================================

-- Check if indexes exist for RLS-related columns
SELECT 
    'TEST 8: RLS INDEX CHECK' as test_name,
    t.tablename,
    CASE 
        WHEN i.indexname IS NOT NULL THEN '✅ HAS user_id INDEX'
        ELSE '⚠️  NO user_id INDEX'
    END as index_status,
    i.indexname
FROM pg_tables t
LEFT JOIN pg_indexes i ON (
    i.schemaname = 'public' 
    AND i.tablename = t.tablename 
    AND i.indexdef LIKE '%user_id%'
)
WHERE t.schemaname = 'public' 
    AND t.rowsecurity = true
    AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public'
            AND c.table_name = t.tablename
            AND c.column_name = 'user_id'
    )
ORDER BY t.tablename;

-- =====================================================
-- TEST 9: SECURITY AUDIT
-- =====================================================

-- Check for potentially insecure policies
SELECT 
    'TEST 9: SECURITY AUDIT' as test_name,
    tablename,
    policyname,
    CASE 
        WHEN qual IS NULL OR qual = 'true' THEN '❌ ALLOWS ALL ACCESS'
        WHEN qual LIKE '%OR%' AND qual NOT LIKE '%auth.uid()%' THEN '⚠️  COMPLEX OR CONDITION'
        WHEN qual LIKE '%auth.uid()%' THEN '✅ SECURE'
        ELSE '⚠️  REVIEW NEEDED'
    END as security_status,
    qual as condition
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY 
    CASE 
        WHEN qual IS NULL OR qual = 'true' THEN 1
        WHEN qual LIKE '%OR%' AND qual NOT LIKE '%auth.uid()%' THEN 2
        ELSE 3
    END,
    tablename, policyname;

-- =====================================================
-- TEST 10: CLEANUP TEST FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS test_rls_with_user_context(UUID);

-- =====================================================
-- SUMMARY REPORT
-- =====================================================

SELECT 
    'SUMMARY REPORT' as section,
    'Total tables with RLS enabled: ' || COUNT(*) as summary
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

SELECT 
    'SUMMARY REPORT' as section,
    'Total RLS policies created: ' || COUNT(*) as summary
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 
    'SUMMARY REPORT' as section,
    'Tables without policies: ' || COUNT(*) as summary
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
    AND t.rowsecurity = true
    AND p.policyname IS NULL;

-- =====================================================
-- RECOMMENDATIONS
-- =====================================================

SELECT 
    'RECOMMENDATIONS' as section,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All tables have RLS enabled'
        ELSE '❌ ' || COUNT(*) || ' tables need RLS enabled'
    END as recommendation
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = false
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT IN ('spatial_ref_sys', 'rls_backup_%');

SELECT 
    'RECOMMENDATIONS' as section,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All RLS-enabled tables have policies'
        ELSE '❌ ' || COUNT(*) || ' tables need policies created'
    END as recommendation
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
    AND t.rowsecurity = true
    AND p.policyname IS NULL;