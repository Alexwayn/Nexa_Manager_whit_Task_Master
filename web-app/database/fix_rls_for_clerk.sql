-- =====================================================
-- TEMPORARY FIX: DISABLE RLS FOR CLERK COMPATIBILITY
-- =====================================================
-- This script temporarily disables RLS on integration tables
-- since we're using Clerk instead of Supabase auth

-- Disable RLS on all integration tables
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_integrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE integration_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configurations DISABLE ROW LEVEL SECURITY;

-- Drop existing policies (they won't work with Clerk)
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;

DROP POLICY IF EXISTS "Users can view their own integrations" ON third_party_integrations;
DROP POLICY IF EXISTS "Users can create their own integrations" ON third_party_integrations;
DROP POLICY IF EXISTS "Users can update their own integrations" ON third_party_integrations;
DROP POLICY IF EXISTS "Users can delete their own integrations" ON third_party_integrations;

DROP POLICY IF EXISTS "Users can view their own activity" ON integration_activity;
DROP POLICY IF EXISTS "Users can create activity logs" ON integration_activity;

DROP POLICY IF EXISTS "Users can view their own webhooks" ON webhook_configurations;
DROP POLICY IF EXISTS "Users can create their own webhooks" ON webhook_configurations;
DROP POLICY IF EXISTS "Users can update their own webhooks" ON webhook_configurations;
DROP POLICY IF EXISTS "Users can delete their own webhooks" ON webhook_configurations;

-- Create new tables with correct user_id reference to users table instead of auth.users
-- First, we need to modify the foreign key constraints

-- Drop and recreate foreign key constraints to reference the users table instead of auth.users
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_user_id_fkey;
ALTER TABLE api_keys ADD CONSTRAINT api_keys_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE third_party_integrations DROP CONSTRAINT IF EXISTS third_party_integrations_user_id_fkey;
ALTER TABLE third_party_integrations ADD CONSTRAINT third_party_integrations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE integration_activity DROP CONSTRAINT IF EXISTS integration_activity_user_id_fkey;
ALTER TABLE integration_activity ADD CONSTRAINT integration_activity_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE webhook_configurations DROP CONSTRAINT IF EXISTS webhook_configurations_user_id_fkey;
ALTER TABLE webhook_configurations ADD CONSTRAINT webhook_configurations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- SUCCESS MESSAGE
SELECT 'RLS disabled and foreign keys fixed for Clerk compatibility! 🎉' as message; 