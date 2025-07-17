-- Check all existing tables in the public schema
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Also check for any tables that might be in other schemas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname != 'information_schema' 
  AND schemaname != 'pg_catalog'
ORDER BY schemaname, tablename;