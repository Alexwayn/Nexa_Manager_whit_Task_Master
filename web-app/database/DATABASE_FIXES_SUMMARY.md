# Database Schema Fixes Summary

## Issues Resolved

### 1. UUID to TEXT Conversion for Clerk Authentication
- **Problem**: Multiple schema files had `user_id` columns defined as `UUID` with foreign key references to `auth.users(id)`
- **Solution**: Converted all `user_id` columns to `TEXT` type and removed foreign key constraints
- **Files Modified**:
  - `invoice_settings_schema.sql`
  - `integrations_schema.sql`
  - `create_missing_financial_tables.sql`
  - `create_events_table.sql`
  - `event_invitations_schema.sql`
  - `profiles_trigger.sql`

### 2. RLS Policy Authentication Method
- **Problem**: RLS policies were using `auth.uid()::text` which causes "text = uuid" operator errors with Clerk
- **Solution**: Updated all policies to use `auth.jwt() ->> 'sub'` for Clerk compatibility
- **Files Modified**:
  - `email_settings_schema.sql`
  - `documents_schema.sql`
  - `recurring_events_schema.sql`
  - `invoice_settings_schema.sql`

### 3. Policy and Trigger Conflicts
- **Problem**: Existing policies and triggers causing conflicts during schema deployment
- **Solution**: Added `DROP POLICY IF EXISTS` and `DROP TRIGGER IF EXISTS` statements
- **Files Modified**:
  - `event_invitations_schema.sql` (trigger conflict)
  - `invoice_settings_schema.sql` (policy and trigger conflicts)
  - `recurring_events_schema.sql` (policy conflicts)

### 4. Index Conflicts
- **Problem**: Existing indexes causing conflicts during schema deployment
- **Solution**: Added `DROP INDEX IF EXISTS` statements before `CREATE INDEX`
- **Files Modified**:
  - `invoice_settings_schema.sql` (all indexes)

### 5. Trigger Name Conflicts
- **Problem**: Duplicate trigger names across different schema files
- **Solution**: Fixed in previous session - `roles_and_permissions_schema.sql`

## New Helper Scripts Created

### 1. `fix_policy_conflicts.sql`
Drops existing policies that might conflict during schema deployment:
- Invoice template policies
- Document policies
- Recurring event policies
- Notification queue policies
- User notification preferences policies

### 2. `fix_database_issues.sql` (from previous session)
Comprehensive cleanup script for problematic tables and triggers.

## Recommended Execution Order

1. **First, run cleanup scripts**:
   ```sql
   -- Run these in order:
   \i fix_database_issues.sql
   \i fix_policy_conflicts.sql
   ```

2. **Then run schema files in this order**:
   ```sql
   \i security_tables_schema.sql
   \i roles_and_permissions_schema.sql
   \i profiles_trigger.sql
   \i invoice_settings_schema.sql
   \i integrations_schema.sql
   \i create_missing_financial_tables.sql
   \i create_events_table.sql
   \i event_invitations_schema.sql
   \i email_settings_schema.sql
   \i documents_schema.sql
   \i recurring_events_schema.sql
   ```

## Key Changes Made

### Authentication Method Changes
- **Before**: `auth.uid()::text = user_id`
- **After**: `auth.jwt() ->> 'sub' = user_id`

### User ID Column Changes
- **Before**: `user_id UUID NOT NULL REFERENCES auth.users(id)`
- **After**: `user_id TEXT NOT NULL, -- Clerk user ID`

### Conflict Prevention
- Added `DROP POLICY IF EXISTS` statements
- Added `DROP TRIGGER IF EXISTS` statements

## Status After Fixes

✅ **Successfully Deployed**:
- security_tables_schema.sql
- roles_and_permissions_schema.sql
- profiles_trigger.sql
- integrations_schema.sql
- create_events_table.sql
- create_missing_financial_tables.sql

🔧 **Fixed and Ready for Redeployment**:
- invoice_settings_schema.sql (policy conflict + trigger conflict resolved)
- event_invitations_schema.sql (trigger conflict resolved)
- email_settings_schema.sql (UUID comparison fixed)
- documents_schema.sql (UUID comparison fixed)
- recurring_events_schema.sql (UUID comparison + policy conflict resolved)

## Notes

- All schema files are now compatible with Clerk authentication
- Foreign key constraints to `auth.users` have been removed
- RLS policies use proper Clerk JWT token extraction
- Conflicts have been resolved with proper DROP statements
- The database should now deploy without errors