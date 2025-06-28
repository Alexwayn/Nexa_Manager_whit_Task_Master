-- Fix business_profiles RLS policies to work with Clerk JWT

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own business profile" ON business_profiles;
DROP POLICY IF EXISTS "Users can insert their own business profile" ON business_profiles;
DROP POLICY IF EXISTS "Users can update their own business profile" ON business_profiles;
DROP POLICY IF EXISTS "Users can delete their own business profile" ON business_profiles;
DROP POLICY IF EXISTS "Allow all operations for business_profiles" ON business_profiles;

-- Create new policies that work with Clerk JWT
-- Try multiple approaches to handle different JWT structures

-- Policy 1: Try auth.jwt() ->> 'sub' (Clerk's default)
CREATE POLICY "Users can view their own business profile v1" ON business_profiles
    FOR SELECT USING (
        user_id = auth.jwt() ->> 'sub' OR 
        user_id = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "Users can insert their own business profile v1" ON business_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.jwt() ->> 'sub' OR 
        user_id = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "Users can update their own business profile v1" ON business_profiles
    FOR UPDATE USING (
        user_id = auth.jwt() ->> 'sub' OR 
        user_id = auth.jwt() ->> 'user_id'
    ) WITH CHECK (
        user_id = auth.jwt() ->> 'sub' OR 
        user_id = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "Users can delete their own business profile v1" ON business_profiles
    FOR DELETE USING (
        user_id = auth.jwt() ->> 'sub' OR 
        user_id = auth.jwt() ->> 'user_id'
    );

-- Enable RLS
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
