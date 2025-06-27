-- Schema for profiles table (if not already exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Clerk user ID
  username TEXT,
  full_name TEXT,
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
  notification_settings JSONB DEFAULT '{"emailNotifications": true, "smsNotifications": false, "promotionalEmails": true, "weeklyDigest": true, "monthlyReport": true, "securityAlerts": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create row level security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for row level security
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid()::text = id);

-- Create function to automatically create a profile for a new user
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    phone,
    business_type,
    vat_number,
    created_at, 
    updated_at
  )
  VALUES (
    new.id, 
    coalesce(new.raw_user_meta_data->>'username', new.email),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', NULL),
    coalesce(new.raw_user_meta_data->>'business_type', NULL),
    coalesce(new.raw_user_meta_data->>'vat_number', NULL),
    now(), 
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_user();