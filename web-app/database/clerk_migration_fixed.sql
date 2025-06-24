-- Fixed Clerk Authentication Migration
-- This script properly handles RLS policies that depend on columns we need to alter

BEGIN;

-- 1. First, drop ALL RLS policies from ALL tables to avoid dependency issues
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all existing policies to avoid column dependencies
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on table %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- 2. Disable RLS on all tables temporarily
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename IN ('profiles', 'clients', 'appointments', 'expenses')
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Disabled RLS on table %', tbl.tablename;
    END LOOP;
END $$;

-- 3. Clear all data (since we're migrating auth systems)
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename IN ('profiles', 'clients', 'appointments', 'expenses')
    LOOP
        EXECUTE format('TRUNCATE TABLE %I CASCADE', tbl.tablename);
        RAISE NOTICE 'Cleared data from table %', tbl.tablename;
    END LOOP;
END $$;

-- 4. Drop all foreign key constraints to auth.users
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN
        SELECT 
            tc.table_name, 
            tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND tc.table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                      constraint_rec.table_name, constraint_rec.constraint_name);
        RAISE NOTICE 'Dropped foreign key constraint % from table %', 
                     constraint_rec.constraint_name, constraint_rec.table_name;
    END LOOP;
END $$;

-- 5. Alter column types for existing tables
DO $$
BEGIN
    -- Handle profiles table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;
        RAISE NOTICE 'Changed profiles.id to TEXT';
    END IF;
    
    -- Handle clients table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        ALTER TABLE clients ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Changed clients.user_id to TEXT';
    END IF;
    
    -- Handle appointments table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments') THEN
        ALTER TABLE appointments ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Changed appointments.user_id to TEXT';
    END IF;
    
    -- Handle expenses table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
        ALTER TABLE expenses ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Changed expenses.user_id to TEXT';
    END IF;
END $$;

-- 6. Create helper functions for user context
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Re-enable RLS on all tables
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename IN ('profiles', 'clients', 'appointments', 'expenses')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Re-enabled RLS on table %', tbl.tablename;
    END LOOP;
END $$;

-- 8. Create new RLS policies for existing tables

-- Profiles policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE POLICY "Users can view their own profile" ON profiles
          FOR SELECT USING (id = get_current_user_id());
        CREATE POLICY "Users can update their own profile" ON profiles
          FOR UPDATE USING (id = get_current_user_id());
        CREATE POLICY "Users can insert their own profile" ON profiles
          FOR INSERT WITH CHECK (id = get_current_user_id());
        
        RAISE NOTICE 'Created RLS policies for profiles table';
    END IF;
END $$;

-- Clients policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        CREATE POLICY "Users can view their own clients" ON clients
          FOR SELECT USING (user_id = get_current_user_id());
        CREATE POLICY "Users can insert their own clients" ON clients
          FOR INSERT WITH CHECK (user_id = get_current_user_id());
        CREATE POLICY "Users can update their own clients" ON clients
          FOR UPDATE USING (user_id = get_current_user_id());
        CREATE POLICY "Users can delete their own clients" ON clients
          FOR DELETE USING (user_id = get_current_user_id());
        
        RAISE NOTICE 'Created RLS policies for clients table';
    END IF;
END $$;

-- Appointments policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments') THEN
        CREATE POLICY "Users can view their own appointments" ON appointments
          FOR SELECT USING (user_id = get_current_user_id());
        CREATE POLICY "Users can insert their own appointments" ON appointments
          FOR INSERT WITH CHECK (user_id = get_current_user_id());
        CREATE POLICY "Users can update their own appointments" ON appointments
          FOR UPDATE USING (user_id = get_current_user_id());
        CREATE POLICY "Users can delete their own appointments" ON appointments
          FOR DELETE USING (user_id = get_current_user_id());
        
        RAISE NOTICE 'Created RLS policies for appointments table';
    END IF;
END $$;

-- Expenses policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
        CREATE POLICY "Users can view their own expenses" ON expenses
          FOR SELECT USING (user_id = get_current_user_id());
        CREATE POLICY "Users can insert their own expenses" ON expenses
          FOR INSERT WITH CHECK (user_id = get_current_user_id());
        CREATE POLICY "Users can update their own expenses" ON expenses
          FOR UPDATE USING (user_id = get_current_user_id());
        CREATE POLICY "Users can delete their own expenses" ON expenses
          FOR DELETE USING (user_id = get_current_user_id());
        
        RAISE NOTICE 'Created RLS policies for expenses table';
    END IF;
END $$;

COMMIT;

-- Final verification
DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'Tables migrated for Clerk authentication:';
    
    -- Show updated column types
    FOR rec IN 
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE (column_name = 'user_id' OR column_name = 'id')
        AND table_schema = 'public'
        ORDER BY table_name, column_name
    LOOP
        RAISE NOTICE '% - %: %', rec.table_name, rec.column_name, rec.data_type;
    END LOOP;
END $$; 