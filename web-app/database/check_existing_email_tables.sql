-- Check existing email-related tables and their schemas
-- Run this first to see what already exists in your database

-- Check if email tables exist
SELECT table_name, table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%email%'
ORDER BY table_name;

-- Check email_templates table structure if it exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'email_templates'
ORDER BY ordinal_position;

-- Check email_folders table structure if it exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'email_folders'
ORDER BY ordinal_position;

-- Check emails table structure if it exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'emails'
ORDER BY ordinal_position;

-- Check all existing tables to see what's already there
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;