-- Safe Clerk Authentication Migration
-- This script checks for table and column existence before making changes

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

-- 3. Drop ALL foreign key constraints
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

-- 4. Clear data and alter column types only for existing tables/columns
DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
    table_name TEXT;
BEGIN
    -- Handle profiles table
    SELECT EXISTS (
        SELECT FROM information_schema.tables t
        WHERE t.table_name = 'profiles' AND t.table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        TRUNCATE TABLE profiles CASCADE;
        RAISE NOTICE 'Cleared data from profiles table';
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'id' AND table_schema = 'public'
        ) INTO column_exists;
        
        IF column_exists THEN
            ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;
            RAISE NOTICE 'Changed profiles.id to TEXT';
        END IF;
    END IF;
    
    -- Handle clients table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'clients' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        TRUNCATE TABLE clients CASCADE;
        RAISE NOTICE 'Cleared data from clients table';
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'clients' AND column_name = 'user_id' AND table_schema = 'public'
        ) INTO column_exists;
        
        IF column_exists THEN
            ALTER TABLE clients ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed clients.user_id to TEXT';
        END IF;
    END IF;
    
    -- Handle expenses table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'expenses' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        TRUNCATE TABLE expenses CASCADE;
        RAISE NOTICE 'Cleared data from expenses table';
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'user_id' AND table_schema = 'public'
        ) INTO column_exists;
        
        IF column_exists THEN
            ALTER TABLE expenses ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed expenses.user_id to TEXT';
        END IF;
    END IF;
    
    -- Handle other potential tables dynamically
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        AND t.table_name IN ('appointments', 'documents', 'events', 'event_invitations', 'recurring_events', 'invoices', 'quotes', 'transactions')
    LOOP
        -- Clear data first
        EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
        RAISE NOTICE 'Cleared data from % table', table_name;
        
        -- Check for user_id column and alter if exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns c
            WHERE c.table_name = table_name AND c.column_name = 'user_id' AND c.table_schema = 'public'
        ) INTO column_exists;
        
        IF column_exists THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN user_id TYPE TEXT', table_name);
            RAISE NOTICE 'Changed %.user_id to TEXT', table_name;
        END IF;
    END LOOP;
    
END $$;

-- 5. Create helper functions for user context
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

DO $$
BEGIN
    RAISE NOTICE 'Created helper functions for user context';
END $$;

-- 6. Re-enable RLS and create policies only for existing tables with the right columns
DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    -- Profiles table policies
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'id' AND table_schema = 'public'
        ) INTO column_exists;
        
        IF column_exists THEN
            CREATE POLICY "Users can view their own profile" ON profiles
              FOR SELECT USING (id = get_current_user_id());
            CREATE POLICY "Users can update their own profile" ON profiles
              FOR UPDATE USING (id = get_current_user_id());
            CREATE POLICY "Users can insert their own profile" ON profiles
              FOR INSERT WITH CHECK (id = get_current_user_id());
            
            RAISE NOTICE 'Created RLS policies for profiles table';
        END IF;
    END IF;
    
    -- Clients table policies
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'clients' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'clients' AND column_name = 'user_id' AND table_schema = 'public'
        ) INTO column_exists;
        
        IF column_exists THEN
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
    END IF;
    
    -- Expenses table policies
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'expenses' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'user_id' AND table_schema = 'public'
        ) INTO column_exists;
        
        IF column_exists THEN
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
    END IF;
    
END $$;

-- 7. Handle other tables dynamically (only if they have user_id column)
DO $$
DECLARE
    tbl_name TEXT;
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    FOR tbl_name IN 
        SELECT unnest(ARRAY['appointments', 'documents', 'events', 'event_invitations', 'recurring_events', 'invoices', 'quotes', 'transactions'])
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = tbl_name AND table_schema = 'public'
        ) INTO table_exists;
        
        IF table_exists THEN
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = tbl_name AND column_name = 'user_id' AND table_schema = 'public'
            ) INTO column_exists;
            
            IF column_exists THEN
                EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name);
                
                EXECUTE format('CREATE POLICY "Users can view their own %I" ON %I FOR SELECT USING (user_id = get_current_user_id())', tbl_name, tbl_name);
                EXECUTE format('CREATE POLICY "Users can insert their own %I" ON %I FOR INSERT WITH CHECK (user_id = get_current_user_id())', tbl_name, tbl_name);
                EXECUTE format('CREATE POLICY "Users can update their own %I" ON %I FOR UPDATE USING (user_id = get_current_user_id())', tbl_name, tbl_name);
                EXECUTE format('CREATE POLICY "Users can delete their own %I" ON %I FOR DELETE USING (user_id = get_current_user_id())', tbl_name, tbl_name);
                
                RAISE NOTICE 'Created RLS policies for % table', tbl_name;
            ELSE
                RAISE NOTICE 'Skipped % table - no user_id column found', tbl_name;
            END IF;
        ELSE
            RAISE NOTICE 'Skipped % table - table does not exist', tbl_name;
        END IF;
    END LOOP;
END $$;

COMMIT;

-- Final verification and summary
DO $$
DECLARE
    rec RECORD;
    table_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== CLERK MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables and columns migrated:';
    
    FOR rec IN 
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE (column_name = 'user_id' OR column_name = 'id')
        AND table_schema = 'public'
        AND data_type = 'text'
        ORDER BY table_name, column_name
    LOOP
        RAISE NOTICE '  % - %: %', rec.table_name, rec.column_name, rec.data_type;
        table_count := table_count + 1;
    END LOOP;
    
    IF table_count = 0 THEN
        RAISE NOTICE '  No user_id or id columns found with TEXT type.';
        RAISE NOTICE '  This might be normal if your database schema is different.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Database migration completed!';
    RAISE NOTICE 'Test your application with Clerk login.';
END $$; 