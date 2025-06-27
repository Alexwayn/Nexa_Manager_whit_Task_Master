-- =====================================================
-- QUICK FINANCIAL TABLES CHECK (ERROR-FREE VERSION)
-- =====================================================
-- Simple script to check what financial tables exist
-- and provide clear next steps for Classic View setup
-- =====================================================

-- Check which critical tables exist
SELECT 
    'TABLE STATUS' as check_type,
    'clients' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'clients' AND schemaname = 'public') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'TABLE STATUS' as check_type,
    'income' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'income' AND schemaname = 'public') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'TABLE STATUS' as check_type,
    'expenses' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'expenses' AND schemaname = 'public') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'TABLE STATUS' as check_type,
    'invoices' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invoices' AND schemaname = 'public') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'TABLE STATUS' as check_type,
    'events' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'events' AND schemaname = 'public') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Simple RLS check
SELECT 
    'RLS STATUS' as check_type,
    t.tablename as table_name,
    CASE WHEN c.relrowsecurity THEN '✅ RLS ENABLED' ELSE '⚠️ RLS DISABLED' END as status
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('clients', 'income', 'expenses', 'invoices', 'events')
ORDER BY t.tablename;

-- Generate simple recommendations
SELECT 
    'RECOMMENDATION' as check_type,
    CASE 
        -- Check for missing income table (main cause of your error)
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'income' AND schemaname = 'public')
        THEN 'STEP 1: Run create_missing_financial_tables.sql (income table is missing)'
        
        -- Check for missing invoices table
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invoices' AND schemaname = 'public')
        THEN 'STEP 1: Run create_missing_invoices_table.sql (invoices table is missing)'
        
        -- If tables exist but RLS is missing
        WHEN EXISTS (
            SELECT 1 FROM pg_tables t
            LEFT JOIN pg_class c ON c.relname = t.tablename
            WHERE t.tablename IN ('income', 'expenses', 'invoices', 'clients')
            AND t.schemaname = 'public'
            AND (c.relrowsecurity IS FALSE OR c.relrowsecurity IS NULL)
        )
        THEN 'STEP 1: Run complete_rls_policies.sql (tables exist but need RLS)'
        
        ELSE 'STEP 1: Database appears ready - test your Classic View'
    END as next_action,
    
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'income' AND schemaname = 'public')
        THEN 'STEP 2: Then run complete_rls_policies.sql'
        
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invoices' AND schemaname = 'public')
        THEN 'STEP 2: Then run complete_rls_policies.sql'
        
        ELSE 'STEP 2: Monitor browser console for any remaining errors'
    END as follow_up_action;

-- Show email settings status (since your first check mentioned this)
SELECT 
    'EMAIL SETTINGS' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_settings' AND schemaname = 'public') 
         THEN '✅ EXISTS' ELSE '❌ MISSING (but not critical for Classic View)' END as status; 