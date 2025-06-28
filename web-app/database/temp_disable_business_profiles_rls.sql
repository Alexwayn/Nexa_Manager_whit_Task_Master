-- Temporary disable RLS for business_profiles table
-- This is for testing purposes only - ENABLE RLS AGAIN AFTER TESTING!

-- Disable RLS on business_profiles table
ALTER TABLE business_profiles DISABLE ROW LEVEL SECURITY;

-- Add a comment to remember to re-enable
COMMENT ON TABLE business_profiles IS 'RLS TEMPORARILY DISABLED FOR TESTING - REMEMBER TO RE-ENABLE!';

-- To re-enable RLS later, run:
-- ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
