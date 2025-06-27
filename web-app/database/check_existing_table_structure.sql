-- =====================================================
-- CHECK EXISTING TABLE STRUCTURE
-- =====================================================
-- This script checks what columns actually exist in your tables
-- to understand the correct foreign key relationships
-- =====================================================

-- Check existing tables and their columns
DO $$
DECLARE
    table_record RECORD;
    column_record RECORD;
BEGIN
    RAISE NOTICE '=== EXISTING TABLE STRUCTURES ===';
    
    -- Check each table that might be referenced
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('invoices', 'quotes', 'events', 'clients')
        ORDER BY tablename
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE '📋 TABLE: %', table_record.tablename;
        RAISE NOTICE '----------------------------------------';
        
        -- Show all columns for this table
        FOR column_record IN
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_record.tablename
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '   %-20s | %-15s | NULL: %-3s | Default: %', 
                column_record.column_name,
                column_record.data_type,
                column_record.is_nullable,
                COALESCE(column_record.column_default, 'none');
        END LOOP;
        
        -- Check for user-related columns specifically
        PERFORM 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = table_record.tablename
        AND column_name LIKE '%user%';
        
        IF FOUND THEN
            RAISE NOTICE '   ✅ Has user-related columns';
        ELSE
            RAISE NOTICE '   ❌ No user-related columns found';
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== MISSING TABLES CHECK ===';
    
    -- Check for missing tables
    PERFORM 1 FROM pg_tables WHERE tablename = 'invoice_items' AND schemaname = 'public';
    IF NOT FOUND THEN
        RAISE NOTICE '❌ invoice_items table MISSING';
    ELSE
        RAISE NOTICE '✅ invoice_items table exists';
    END IF;
    
    PERFORM 1 FROM pg_tables WHERE tablename = 'quote_items' AND schemaname = 'public';
    IF NOT FOUND THEN
        RAISE NOTICE '❌ quote_items table MISSING';
    ELSE
        RAISE NOTICE '✅ quote_items table exists';
    END IF;
    
    PERFORM 1 FROM pg_tables WHERE tablename = 'event_invitations' AND schemaname = 'public';
    IF NOT FOUND THEN
        RAISE NOTICE '❌ event_invitations table MISSING';
    ELSE
        RAISE NOTICE '✅ event_invitations table exists';
    END IF;
    
    PERFORM 1 FROM pg_tables WHERE tablename = 'email_settings' AND schemaname = 'public';
    IF NOT FOUND THEN
        RAISE NOTICE '❌ email_settings table MISSING';
    ELSE
        RAISE NOTICE '✅ email_settings table exists';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== SUMMARY ===';
    RAISE NOTICE 'Use this information to understand:';
    RAISE NOTICE '1. What user-related columns exist in parent tables';
    RAISE NOTICE '2. Which child tables are missing';
    RAISE NOTICE '3. How to create proper foreign key relationships';
    
END $$;

-- Simple query to see what user-related columns exist
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('invoices', 'quotes', 'events', 'clients')
AND (column_name ILIKE '%user%' OR column_name ILIKE '%client%' OR column_name = 'id')
ORDER BY table_name, column_name; 