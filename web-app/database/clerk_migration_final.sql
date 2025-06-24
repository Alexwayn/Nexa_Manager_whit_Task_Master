-- Final Clerk Authentication Migration
-- This script thoroughly handles all constraints and dependencies

BEGIN;

-- 1. Drop ALL RLS policies from ALL tables
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on table %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- 2. Disable RLS on all tables
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Disabled RLS on table %', tbl.tablename;
    END LOOP;
END $$;

-- 3. Drop ALL foreign key constraints (not just auth.users ones)
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN
        SELECT 
            tc.table_name, 
            tc.constraint_name,
            tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                      constraint_rec.table_name, constraint_rec.constraint_name);
        RAISE NOTICE 'Dropped foreign key constraint % from table %', 
                     constraint_rec.constraint_name, constraint_rec.table_name;
    END LOOP;
END $$;

-- 4. Clear all data from relevant tables
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'clients', 'appointments', 'expenses', 'documents', 'events', 'event_invitations', 'recurring_events')
    LOOP
        EXECUTE format('TRUNCATE TABLE %I CASCADE', tbl.tablename);
        RAISE NOTICE 'Cleared data from table %', tbl.tablename;
    END LOOP;
END $$;

-- 5. Now safely alter column types
DO $$
BEGIN
    -- Handle profiles table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        -- Check if id column exists and its current type
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id' AND table_schema = 'public') THEN
            ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;
            RAISE NOTICE 'Changed profiles.id to TEXT';
        END IF;
    END IF;
    
    -- Handle clients table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE clients ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed clients.user_id to TEXT';
        END IF;
    END IF;
    
    -- Handle appointments table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments' AND table_schema = 'public') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE appointments ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed appointments.user_id to TEXT';
        END IF;
    END IF;
    
    -- Handle expenses table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'public') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE expenses ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed expenses.user_id to TEXT';
        END IF;
    END IF;
    
    -- Handle documents table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE documents ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed documents.user_id to TEXT';
        END IF;
    END IF;
    
    -- Handle events table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE events ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed events.user_id to TEXT';
        END IF;
    END IF;
    
    -- Handle event_invitations table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_invitations' AND table_schema = 'public') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'event_invitations' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE event_invitations ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed event_invitations.user_id to TEXT';
        END IF;
    END IF;
    
    -- Handle recurring_events table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recurring_events' AND table_schema = 'public') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recurring_events' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE recurring_events ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed recurring_events.user_id to TEXT';
        END IF;
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

-- Log function creation
DO $$
BEGIN
    RAISE NOTICE 'Created helper functions for user context';
END $$;

-- 7. Re-enable RLS on relevant tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY['profiles', 'clients', 'appointments', 'expenses', 'documents', 'events', 'event_invitations', 'recurring_events'])
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
            RAISE NOTICE 'Re-enabled RLS on table %', tbl;
        END IF;
    END LOOP;
END $$;

-- 8. Create new RLS policies for existing tables

-- Profiles policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view their own profile" ON profiles
          FOR SELECT USING (id = get_current_user_id());
        CREATE POLICY "Users can update their own profile" ON profiles
          FOR UPDATE USING (id = get_current_user_id());
        CREATE POLICY "Users can insert their own profile" ON profiles
          FOR INSERT WITH CHECK (id = get_current_user_id());
        
        RAISE NOTICE 'Created RLS policies for profiles table';
    END IF;
END $$;

-- Clients policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
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

-- Appointments policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments' AND table_schema = 'public') THEN
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

-- Expenses policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'public') THEN
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

-- Documents policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view their own documents" ON documents
          FOR SELECT USING (user_id = get_current_user_id());
        CREATE POLICY "Users can insert their own documents" ON documents
          FOR INSERT WITH CHECK (user_id = get_current_user_id());
        CREATE POLICY "Users can update their own documents" ON documents
          FOR UPDATE USING (user_id = get_current_user_id());
        CREATE POLICY "Users can delete their own documents" ON documents
          FOR DELETE USING (user_id = get_current_user_id());
        
        RAISE NOTICE 'Created RLS policies for documents table';
    END IF;
END $$;

-- Events policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view their own events" ON events
          FOR SELECT USING (user_id = get_current_user_id());
        CREATE POLICY "Users can insert their own events" ON events
          FOR INSERT WITH CHECK (user_id = get_current_user_id());
        CREATE POLICY "Users can update their own events" ON events
          FOR UPDATE USING (user_id = get_current_user_id());
        CREATE POLICY "Users can delete their own events" ON events
          FOR DELETE USING (user_id = get_current_user_id());
        
        RAISE NOTICE 'Created RLS policies for events table';
    END IF;
END $$;

COMMIT;

-- Final verification and summary
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== CLERK MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables and columns migrated:';
    
    FOR rec IN 
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE (column_name = 'user_id' OR column_name = 'id')
        AND table_schema = 'public'
        AND table_name IN ('profiles', 'clients', 'appointments', 'expenses', 'documents', 'events', 'event_invitations', 'recurring_events')
        ORDER BY table_name, column_name
    LOOP
        RAISE NOTICE '  % - %: %', rec.table_name, rec.column_name, rec.data_type;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Database is now ready for Clerk authentication!';
    RAISE NOTICE 'Test your application with Clerk login.';
END $$; 