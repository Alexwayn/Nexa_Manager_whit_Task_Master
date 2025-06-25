-- Business Profiles Table Schema
-- This table stores business information for users during onboarding
-- Note: Using Clerk authentication, so user_id is a TEXT field (not UUID)

-- Drop the table if it exists to recreate with correct schema
DROP TABLE IF EXISTS business_profiles;

-- Create the business_profiles table
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk user ID (e.g., user_2yyhN4lw9ritLheD4CxN5RRMXUR)
  company_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  industry TEXT,
  tax_id TEXT,
  website TEXT,
  phone TEXT,
  address JSONB DEFAULT '{}',
  employee_count TEXT,
  description TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Note: Since we're using Clerk, we can't use auth.uid())
-- We'll rely on application-level security for now
CREATE POLICY "Allow all operations for business_profiles" ON business_profiles
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_company_name ON business_profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_business_profiles_business_type ON business_profiles(business_type);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_business_profiles_updated_at ON business_profiles;
CREATE TRIGGER trigger_update_business_profiles_updated_at
    BEFORE UPDATE ON business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_business_profiles_updated_at();

-- Insert some sample business types and industries for reference
COMMENT ON COLUMN business_profiles.business_type IS 'Valid values: sole_proprietorship, partnership, corporation, llc, nonprofit';
COMMENT ON COLUMN business_profiles.industry IS 'Industry sector of the business';
COMMENT ON COLUMN business_profiles.employee_count IS 'Valid values: 1, 2-10, 11-50, 51-200, 201-500, 500+';
COMMENT ON COLUMN business_profiles.address IS 'JSON object containing street, city, state, zipCode, country'; 