# Clerk Authentication Migration Guide

This guide explains how to migrate your Supabase database to work with Clerk authentication.

## Overview

The migration changes the database schema to support Clerk's string-based user IDs instead of Supabase's UUID-based auth system. This involves:

1. Changing `user_id` columns from `UUID` to `TEXT`
2. Dropping foreign key constraints to `auth.users`
3. Creating new RLS policies that work with Clerk user IDs
4. Setting up custom functions for user context

## ⚠️ Important Warning

**This migration will delete all existing data** since we're changing the authentication system. Make sure to:

1. **Backup your important data** before running the migration
2. Run this in a development environment first
3. Test thoroughly before applying to production

## Migration Steps

### 1. Run the Migration Script

In your Supabase dashboard, go to the SQL Editor and run the migration script:

```sql
-- Copy and paste the entire content of clerk_migration.sql here
```

Or run it via the Supabase CLI:

```bash
supabase db reset --linked
supabase db push
```

### 2. Verify the Migration

After running the migration, verify that:

1. All tables now use `TEXT` for `user_id` columns
2. RLS policies are active
3. The custom functions `set_current_user_id` and `get_current_user_id` exist

You can check this by running:

```sql
-- Check user_id column types
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE column_name = 'user_id';

-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN ('set_current_user_id', 'get_current_user_id');

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies;
```

### 3. Test the Application

1. Start your application
2. Sign in with Clerk
3. Try creating, reading, updating, and deleting clients
4. Check the browser console for any errors

## How the New System Works

### User Context in Database

Since Clerk doesn't integrate with Supabase's built-in auth system, we use a custom approach:

1. Before each database operation, we call `set_current_user_id(user_id)` 
2. This sets a session variable that RLS policies can access
3. The `withUserContext()` helper function handles this automatically

### Application Code Changes

The application now uses:

```javascript
import { withUserContext } from '@lib/supabaseClient';

// Instead of:
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('user_id', userId);

// We now use:
const result = await withUserContext(userId, async () => {
  return await supabase
    .from('clients')
    .select('*');
});
```

## Troubleshooting

### Common Issues

1. **400 Bad Request errors**: Usually means the migration hasn't been run or failed
2. **RLS policy violations**: Check that the user context is being set correctly
3. **Function not found errors**: The custom functions weren't created properly

### Debug Steps

1. Check Supabase logs for detailed error messages
2. Verify the migration completed successfully
3. Test with a simple query in the SQL editor:

```sql
-- Test setting user context
SELECT set_current_user_id('test_user_123');
SELECT get_current_user_id();
```

### Rollback Plan

If you need to rollback to the original Supabase auth system:

1. Restore your database from backup
2. Remove Clerk components from the application
3. Restore the original auth context and components

## Production Deployment

For production deployment:

1. **Schedule maintenance downtime** (data will be cleared)
2. **Backup production data** 
3. **Run migration during low-traffic period**
4. **Monitor application logs** after deployment
5. **Have rollback plan ready**

## Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Review Supabase dashboard logs
3. Verify all environment variables are set correctly
4. Test in development environment first

## Files Modified

- `web-app/src/lib/supabaseClient.js` - Added user context utilities
- `web-app/src/hooks/useClients.js` - Updated to use new auth pattern
- All other hooks updated to use Clerk instead of AuthContext
- Database schema modified for string user IDs 