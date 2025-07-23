-- Check the exact structure of the email_templates table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'email_templates'
ORDER BY ordinal_position;

-- Also check if there are any existing records
SELECT COUNT(*) as total_records FROM email_templates;

-- Show a sample of existing data structure
SELECT * FROM email_templates LIMIT 3;