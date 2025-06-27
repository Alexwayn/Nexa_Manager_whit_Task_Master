-- =====================================================
-- CHECK USER_ID STATUS (SIMPLE VERSION)
-- =====================================================
-- Shows which tables have user_id columns using SELECT
-- =====================================================

-- Check which tables have user_id column
SELECT 
    t.tablename as table_name,
    CASE 
        WHEN c.column_name IS NOT NULL THEN '✅ HAS user_id'
        ELSE '❌ MISSING user_id'
    END as user_id_status,
    CASE 
        WHEN c.column_name IS NOT NULL THEN c.data_type
        ELSE 'N/A'
    END as user_id_type
FROM pg_tables t
LEFT JOIN information_schema.columns c ON (
    c.table_schema = 'public' 
    AND c.table_name = t.tablename 
    AND c.column_name = 'user_id'
)
WHERE t.schemaname = 'public'
AND t.tablename IN (
    'business_profiles', 'clients', 'income', 'expenses', 
    'invoices', 'quotes', 'receipts', 'documents', 
    'events', 'recurring_events', 'integrations', 
    'roles_permissions', 'security_settings'
)
ORDER BY t.tablename;

-- Show summary count
SELECT 
    COUNT(*) FILTER (WHERE c.column_name IS NOT NULL) as tables_with_user_id,
    COUNT(*) FILTER (WHERE c.column_name IS NULL) as tables_missing_user_id,
    COUNT(*) as total_tables_checked
FROM pg_tables t
LEFT JOIN information_schema.columns c ON (
    c.table_schema = 'public' 
    AND c.table_name = t.tablename 
    AND c.column_name = 'user_id'
)
WHERE t.schemaname = 'public'
AND t.tablename IN (
    'business_profiles', 'clients', 'income', 'expenses', 
    'invoices', 'quotes', 'receipts', 'documents', 
    'events', 'recurring_events', 'integrations', 
    'roles_permissions', 'security_settings'
); 