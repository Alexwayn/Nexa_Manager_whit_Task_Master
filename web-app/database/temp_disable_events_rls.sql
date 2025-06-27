-- Temporary script to disable RLS on events table for testing
-- This allows the calendar to work while we configure proper Clerk-Supabase integration

-- Disable RLS temporarily
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- Note: This is for testing only. In production, we need proper Clerk-Supabase JWT integration
-- To re-enable RLS later, run: ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
