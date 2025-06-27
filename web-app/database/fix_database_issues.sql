-- Fix Database Issues Script
-- This script addresses the common errors encountered during schema deployment

-- 1. Drop existing triggers that might conflict
DROP TRIGGER IF EXISTS set_timestamp ON roles;
DROP TRIGGER IF EXISTS set_timestamp ON permissions;
DROP TRIGGER IF EXISTS trigger_documents_updated_at ON documents;

-- 2. Drop and recreate user_sessions table if session_token issues persist
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS security_audit_logs CASCADE;

-- 3. Drop any existing problematic tables that might have UUID user_id columns
DROP TABLE IF EXISTS invoice_settings CASCADE;
DROP TABLE IF EXISTS invoice_numbering CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS third_party_integrations CASCADE;
DROP TABLE IF EXISTS integration_activity CASCADE;
DROP TABLE IF EXISTS webhook_configurations CASCADE;
DROP TABLE IF EXISTS income_categories CASCADE;
DROP TABLE IF EXISTS income CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS event_invitations CASCADE;
DROP TABLE IF EXISTS event_comments CASCADE;
DROP TABLE IF EXISTS event_attachments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 4. Clear any existing auth.users references that might cause conflicts
-- Note: This is safe as we're moving to Clerk authentication

COMMIT;

-- Instructions:
-- 1. Run this script first to clean up existing problematic tables
-- 2. Then run the schema files in this order:
--    - security_tables_schema.sql
--    - roles_and_permissions_schema.sql
--    - profiles_trigger.sql
--    - invoice_settings_schema.sql
--    - integrations_schema.sql
--    - create_missing_financial_tables.sql
--    - create_events_table.sql
--    - event_invitations_schema.sql
--    - email_settings_schema.sql
--    - documents_schema.sql
--    - recurring_events_schema.sql