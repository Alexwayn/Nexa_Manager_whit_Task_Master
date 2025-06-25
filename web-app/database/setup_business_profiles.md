# Business Profiles Table Setup

## Quick Setup Instructions

⚠️ **Important**: This will recreate the `business_profiles` table. If you have existing data, it will be lost.

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project: `bmumnhsdiiryyxpjrggs`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Business Profiles Schema**
   - Copy the contents of `business_profiles_schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

4. **Verify Table Creation**
   - Go to "Table Editor" in the left sidebar
   - You should see the new `business_profiles` table
   - Check that RLS is enabled (should show a shield icon)

## What This Creates

- ✅ `business_profiles` table with Clerk-compatible schema
- ✅ `user_id` field as TEXT (not UUID) to work with Clerk IDs
- ✅ Row Level Security (RLS) policies (permissive for now)
- ✅ Indexes for performance
- ✅ Triggers for automatic timestamps

## Schema Changes Made

- **Changed `user_id` from UUID to TEXT** to support Clerk user IDs like `user_2yyhN4lw9ritLheD4CxN5RRMXUR`
- **Removed auth.users foreign key reference** since we're using Clerk (not Supabase Auth)
- **Simplified RLS policies** since `auth.uid()` doesn't work with Clerk

## Security Note

The current RLS policy is permissive (`FOR ALL USING (true)`). In production, you should implement proper RLS policies based on your Clerk integration or rely on application-level security checks.

## Test the Setup

After running the SQL, try the onboarding process again. The UUID error should be resolved.

## Troubleshooting

If you get permission errors:
1. Make sure you're logged in as the project owner
2. Check that the SQL is running in the correct project
3. Verify that the `auth.users` table exists (it should by default)

If you get "table already exists" errors:
- This is fine, it means the table was already created
- The `IF NOT EXISTS` clause prevents conflicts 