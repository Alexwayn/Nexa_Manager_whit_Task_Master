-- =====================================================
-- SAFE TEST POLICIES FOR DEVELOPMENT/STAGING
-- =====================================================
-- These policies allow access to test data without exposing real user data
-- ONLY USE FOR DEVELOPMENT/STAGING - NEVER IN PRODUCTION WITH REAL DATA
-- =====================================================

-- Create a test user context for development
DO $$
BEGIN
  -- Only create these policies in development environments
  IF current_setting('app.environment', true) = 'development' OR 
     current_setting('app.environment', true) = 'staging' THEN
    
    -- Allow access to test data (user_id starting with 'test_')
    DROP POLICY IF EXISTS "Allow test data access" ON clients;
    CREATE POLICY "Allow test data access" ON clients
        FOR ALL USING (user_id LIKE 'test_%' OR user_id = 'demo_user_123');
    
    DROP POLICY IF EXISTS "Allow test data access" ON invoices;
    CREATE POLICY "Allow test data access" ON invoices
        FOR ALL USING (user_id LIKE 'test_%' OR user_id = 'demo_user_123');
    
    DROP POLICY IF EXISTS "Allow test data access" ON expenses;
    CREATE POLICY "Allow test data access" ON expenses
        FOR ALL USING (user_id LIKE 'test_%' OR user_id = 'demo_user_123');
    
    DROP POLICY IF EXISTS "Allow test data access" ON income;
    CREATE POLICY "Allow test data access" ON income
        FOR ALL USING (user_id LIKE 'test_%' OR user_id = 'demo_user_123');
    
    RAISE NOTICE 'Test policies created for development environment';
  ELSE
    RAISE NOTICE 'Skipped test policies - not in development environment';
  END IF;
END $$;

-- =====================================================
-- ALTERNATIVE: DEMO MODE POLICIES (SAFER)
-- =====================================================
-- These allow public access to demo data only

-- Enable demo mode for specific demo data
DROP POLICY IF EXISTS "Public demo data access" ON clients;
CREATE POLICY "Public demo data access" ON clients
    FOR SELECT USING (user_id = 'demo_public_data');

DROP POLICY IF EXISTS "Public demo data access" ON invoices;
CREATE POLICY "Public demo data access" ON invoices
    FOR SELECT USING (user_id = 'demo_public_data');

-- Insert some demo data (safe to be public)
INSERT INTO clients (id, user_id, name, email, phone, address, created_at) 
VALUES (
  uuid_generate_v4(),
  'demo_public_data',
  'Demo Client SRL',
  'demo@example.com',
  '+39 123 456 7890',
  'Via Demo 123, Roma, RM 00100',
  NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- ENVIRONMENT SETUP FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION set_development_environment() 
RETURNS void AS $$
BEGIN
  -- This can be called to temporarily enable development mode
  PERFORM set_config('app.environment', 'development', false);
  RAISE NOTICE 'Development environment enabled';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PRODUCTION SAFETY CHECK
-- =====================================================
CREATE OR REPLACE FUNCTION ensure_production_security() 
RETURNS void AS $$
BEGIN
  -- Remove any test policies in production
  IF current_setting('app.environment', true) = 'production' THEN
    -- Drop test policies
    DROP POLICY IF EXISTS "Allow test data access" ON clients;
    DROP POLICY IF EXISTS "Allow test data access" ON invoices;
    DROP POLICY IF EXISTS "Allow test data access" ON expenses;
    DROP POLICY IF EXISTS "Allow test data access" ON income;
    
    RAISE NOTICE 'Production security ensured - test policies removed';
  END IF;
END;
$$ LANGUAGE plpgsql; 