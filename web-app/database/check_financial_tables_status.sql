-- =====================================================
-- FINANCIAL TABLES STATUS CHECK
-- =====================================================
-- This script specifically checks the status of financial tables
-- needed for the Classic View dashboard to work properly
-- =====================================================

-- =====================================================
-- 1. CHECK IF CRITICAL FINANCIAL TABLES EXIST
-- =====================================================
SELECT 
    'FINANCIAL TABLES STATUS' as report_section,
    t.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    CASE 
        WHEN c.relrowsecurity THEN '✅ RLS ENABLED'
        WHEN t.table_name IS NOT NULL THEN '⚠️ RLS DISABLED' 
        ELSE 'N/A'
    END as rls_status,
    COALESCE(p.policy_count, 0) as policy_count
FROM (
    SELECT unnest(ARRAY['clients', 'invoices', 'invoice_items', 'quotes', 'quote_items', 'income', 'expenses', 'events']) as required_table
) req
LEFT JOIN information_schema.tables t ON t.table_name = req.required_table AND t.table_schema = 'public'
LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
LEFT JOIN (
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
) p ON p.tablename = t.table_name
ORDER BY req.required_table;

-- =====================================================
-- 2. CHECK SPECIFIC COLUMNS FOR CLERK COMPATIBILITY
-- =====================================================
SELECT 
    'COLUMN COMPATIBILITY CHECK' as report_section,
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'user_id' AND data_type = 'text' THEN '✅ CLERK COMPATIBLE'
        WHEN column_name = 'user_id' AND data_type != 'text' THEN '⚠️ NEEDS TEXT TYPE'
        WHEN column_name = 'created_by' AND data_type = 'text' THEN '✅ CLERK COMPATIBLE'
        WHEN column_name = 'created_by' AND data_type != 'text' THEN '⚠️ NEEDS TEXT TYPE'
        ELSE '✅ OK'
    END as compatibility_status
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name IN ('clients', 'invoices', 'income', 'expenses', 'events', 'documents')
    AND column_name IN ('user_id', 'created_by')
ORDER BY table_name, column_name;

-- =====================================================
-- 3. CHECK FOR MISSING INDEXES ON USER_ID COLUMNS
-- =====================================================
SELECT 
    'INDEX STATUS CHECK' as report_section,
    t.table_name,
    CASE 
        WHEN i.indexname IS NOT NULL THEN '✅ INDEXED'
        ELSE '⚠️ MISSING INDEX'
    END as index_status,
    COALESCE(i.indexname, 'idx_' || t.table_name || '_user_id') as recommended_index_name
FROM (
    SELECT unnest(ARRAY['clients', 'invoices', 'income', 'expenses', 'events']) as table_name
) t
LEFT JOIN pg_indexes i ON i.tablename = t.table_name 
    AND i.schemaname = 'public'
    AND (i.indexname LIKE '%user_id%' OR i.indexname LIKE '%created_by%')
ORDER BY t.table_name;

-- =====================================================
-- 4. TEST AUTH FUNCTION AVAILABILITY
-- =====================================================
SELECT 
    'AUTH FUNCTIONS CHECK' as report_section,
    'auth.jwt()' as function_name,
    CASE 
        WHEN (SELECT 1 FROM pg_proc WHERE proname = 'jwt' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')) IS NOT NULL
        THEN '✅ AVAILABLE'
        ELSE '❌ NOT AVAILABLE'
    END as status;

-- =====================================================
-- 5. DETAILED ERROR ANALYSIS
-- =====================================================
-- Check for specific errors mentioned in logs
DO $$
DECLARE
    table_exists BOOLEAN;
    missing_tables TEXT[] := '{}';
    current_table TEXT;
BEGIN
    RAISE NOTICE '=== DETAILED ERROR ANALYSIS ===';
    
    -- Check each critical table
    FOREACH current_table IN ARRAY ARRAY['income', 'expenses', 'invoices', 'clients']
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = current_table
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            missing_tables := array_append(missing_tables, current_table);
            RAISE NOTICE 'MISSING TABLE: % (this causes "relation does not exist" errors)', current_table;
        ELSE
            RAISE NOTICE 'TABLE EXISTS: %', current_table;
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'SOLUTION: Create missing tables: %', array_to_string(missing_tables, ', ');
        RAISE NOTICE 'NEXT STEP: Run create_missing_financial_tables.sql';
    ELSE
        RAISE NOTICE 'ALL FINANCIAL TABLES EXIST - Check RLS policies next';
        RAISE NOTICE 'NEXT STEP: Run complete_rls_policies.sql';
    END IF;
END $$;

-- =====================================================
-- 6. GENERATE RECOMMENDED ACTIONS
-- =====================================================
SELECT 
    'RECOMMENDED ACTIONS' as report_section,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'income' AND schemaname = 'public')
        THEN '1. Run: create_missing_financial_tables.sql'
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invoices' AND schemaname = 'public')
        THEN '1. Run: create_missing_invoices_table.sql'
        WHEN EXISTS (
            SELECT 1 FROM pg_tables t
            LEFT JOIN pg_class c ON c.relname = t.tablename
            WHERE t.tablename IN ('income', 'expenses', 'invoices', 'clients')
            AND t.schemaname = 'public'
            AND (c.relrowsecurity IS NULL OR c.relrowsecurity = false)
        )
        THEN '1. Run: complete_rls_policies.sql'
        ELSE '1. ✅ Database appears ready - test your application'
    END as step_1,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'income' AND schemaname = 'public')
        THEN '2. Then run: complete_rls_policies.sql'
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invoices' AND schemaname = 'public')
        THEN '2. Then run: complete_rls_policies.sql'
        ELSE '2. Monitor application logs for remaining errors'
    END as step_2;

-- =====================================================
-- VERIFICATION COMPLETE
-- ===================================================== 