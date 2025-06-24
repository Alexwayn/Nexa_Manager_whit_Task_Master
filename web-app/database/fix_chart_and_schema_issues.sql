-- Fix for missing avatar_url column in profiles table
-- This addresses the error: column profiles.avatar_url does not exist

-- Add avatar_url column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Verify the column was added successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'avatar_url'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Column avatar_url exists in profiles table';
    ELSE
        RAISE WARNING 'Failed to add avatar_url column to profiles table';
    END IF;
END $$;

-- Optional: Set a default value for existing users
UPDATE public.profiles 
SET avatar_url = NULL 
WHERE avatar_url IS NULL;

COMMIT; 