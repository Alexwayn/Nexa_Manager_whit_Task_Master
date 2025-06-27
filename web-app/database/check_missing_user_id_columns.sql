-- =====================================================
-- CHECK MISSING USER_ID COLUMNS
-- =====================================================
-- This script identifies which tables are missing user_id columns
-- =====================================================

DO $$
DECLARE
    table_record RECORD;
    column_record RECORD;
    has_user_id BOOLEAN;
BEGIN
    RAISE NOTICE '=== CHECKING USER_ID COLUMNS IN ALL TABLES ===';
    RAISE NOTICE '';
    
    -- Check each table that might need user_id
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN (
            'business_profiles', 'clients', 'income', 'expenses', 
            'invoices', 'quotes', 'receipts', 'documents', 
            'events', 'recurring_events', 'integrations', 
            'roles_permissions', 'security_settings'
        )
        ORDER BY tablename
    LOOP
        -- Check if user_id column exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = table_record.tablename
            AND column_name = 'user_id'
        ) INTO has_user_id;
        
        IF has_user_id THEN
            RAISE NOTICE '✅ % - HAS user_id column', table_record.tablename;
        ELSE
            RAISE NOTICE '❌ % - MISSING user_id column', table_record.tablename;
            
            -- Show what columns this table actually has
            RAISE NOTICE '   Existing columns:';
            FOR column_record IN
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = table_record.tablename
                ORDER BY ordinal_position
            LOOP
                RAISE NOTICE '     - %: %', column_record.column_name, column_record.data_type;
            END LOOP;
            RAISE NOTICE '';
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== SUMMARY ===';
    RAISE NOTICE 'Tables missing user_id will need to either:';
    RAISE NOTICE '1. Have user_id column added, OR';
    RAISE NOTICE '2. Be excluded from RLS policies';
    RAISE NOTICE '';
END $$; 