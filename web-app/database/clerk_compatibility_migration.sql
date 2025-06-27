-- CLERK COMPATIBILITY MIGRATION
-- =====================================================
-- Fixes UUID/TEXT compatibility issues for Clerk authentication
-- Clerk user IDs are strings, not UUIDs

-- =====================================================
-- BACKUP EXISTING DATA (if any)
-- =====================================================
-- Create backup table for existing profiles
CREATE TABLE IF NOT EXISTS profiles_backup AS 
SELECT * FROM profiles WHERE 1=0; -- Empty backup table structure

-- =====================================================
-- DROP EXISTING CONSTRAINTS AND POLICIES
-- =====================================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Drop existing triggers
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- =====================================================
-- RECREATE PROFILES TABLE WITH TEXT ID
-- =====================================================
-- Drop and recreate profiles table with TEXT id for Clerk compatibility
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id TEXT PRIMARY KEY, -- Clerk user ID (string format)
  username TEXT,
  full_name TEXT,
  email TEXT, -- Add email field for easier queries
  phone TEXT,
  business_type TEXT,
  vat_number TEXT,
  address TEXT,
  company_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  first_name TEXT,
  last_name TEXT,
  position TEXT,
  notification_settings JSONB DEFAULT '{
    "emailNotifications": true, 
    "smsNotifications": false, 
    "promotionalEmails": true, 
    "weeklyDigest": true, 
    "monthlyReport": true, 
    "securityAlerts": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE POLICIES FOR CLERK AUTHENTICATION
-- =====================================================
-- Policy for users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.jwt() ->> 'sub');

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.jwt() ->> 'sub');

-- Policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.jwt() ->> 'sub');

-- Admin policies for full access
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.jwt() ->> 'sub'
      AND r.name IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.jwt() ->> 'sub'
      AND r.name IN ('super_admin', 'admin')
    )
  );

-- =====================================================
-- CREATE UPDATED_AT TRIGGER
-- =====================================================
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE profiles IS 'User profiles compatible with Clerk authentication';
COMMENT ON COLUMN profiles.id IS 'Clerk user ID in string format (e.g., user_2yyhN4lw9ritLheD4CxN5RRMXUR)';
COMMENT ON COLUMN profiles.email IS 'User email address from Clerk';
COMMENT ON COLUMN profiles.notification_settings IS 'JSON object containing user notification preferences';