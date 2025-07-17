-- Check the actual column structure of all public tables
-- This will help us understand which tables have user_id columns and their data types

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- Also check for any columns that might be used for user identification
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND (
    column_name ILIKE '%user%' 
    OR column_name ILIKE '%owner%' 
    OR column_name ILIKE '%created_by%'
    OR column_name = 'id'
  )
ORDER BY table_name, column_name;