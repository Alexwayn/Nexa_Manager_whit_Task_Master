-- Check the exact structure of the existing email_templates table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'email_templates'
ORDER BY ordinal_position;

-- Check if is_system column exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'email_templates' 
  AND column_name = 'is_system'
) as is_system_column_exists;

-- Check existing data in email_templates
SELECT id, name, category, created_at
FROM email_templates
LIMIT 5;