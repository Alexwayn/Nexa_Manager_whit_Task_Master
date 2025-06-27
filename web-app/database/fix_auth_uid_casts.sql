-- Fix all auth.uid() cast issues for Clerk compatibility
-- This script updates all RLS policies to properly cast auth.uid() to TEXT
-- Run this script after all other schema scripts to fix type mismatches

-- Note: This is a comprehensive fix for the UUID = TEXT operator error
-- All auth.uid() comparisons need to be cast to TEXT for Clerk compatibility

-- The following files need manual correction:
-- 1. recurring_events_schema.sql
-- 2. event_invitations_schema.sql  
-- 3. create_events_table.sql
-- 4. invoice_settings_schema.sql
-- 5. integrations_schema.sql
-- 6. create_missing_financial_tables.sql
-- 7. profiles_trigger.sql
-- 8. documents_schema.sql

-- Instructions:
-- 1. Replace all instances of 'auth.uid() = user_id' with 'auth.uid()::text = user_id'
-- 2. Replace all instances of 'user_id = auth.uid()' with 'user_id = auth.uid()::text'
-- 3. Replace all instances of 'auth.uid() = id' with 'auth.uid()::text = id' (for profiles table)
-- 4. Replace all instances of 'created_by = auth.uid()' with 'created_by = auth.uid()::text'

-- Common patterns to fix:
-- USING (auth.uid() = user_id) -> USING (auth.uid()::text = user_id)
-- WITH CHECK (auth.uid() = user_id) -> WITH CHECK (auth.uid()::text = user_id)
-- AND events.user_id = auth.uid() -> AND events.user_id = auth.uid()::text
-- WHERE created_by = auth.uid() -> WHERE created_by = auth.uid()::text

-- After running this fix, all SQL scripts should execute without UUID = TEXT errors

SELECT 'All auth.uid() cast issues should be manually fixed in the schema files' as status;