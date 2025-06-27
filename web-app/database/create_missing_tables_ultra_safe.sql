-- =====================================================
-- CREATE MISSING TABLES (ULTRA SAFE VERSION)
-- =====================================================
-- Only creates child tables if parent tables exist with user_id
-- Only creates indexes if the columns exist
-- Fixed: Generated columns cannot reference other generated columns
-- Added: Better error handling and verification
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE INVOICE_ITEMS TABLE (ONLY IF INVOICES EXISTS WITH USER_ID)
-- =====================================================
DO $$
BEGIN
    -- Check if invoices table exists and has user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'user_id'
    ) THEN
        -- Create invoice_items table
        CREATE TABLE IF NOT EXISTS public.invoice_items (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
            user_id text NOT NULL,
            description text NOT NULL,
            quantity numeric(10,2) DEFAULT 1.00,
            unit_price numeric(10,2) NOT NULL,
            total_amount numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
            tax_rate numeric(5,2) DEFAULT 0.00,
            tax_amount numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price * tax_rate / 100) STORED,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );

        -- Create indexes only if table and columns exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'invoice_id') THEN
            CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_invoice_items_user_id ON public.invoice_items(user_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_invoice_items_created_at ON public.invoice_items(created_at);
        END IF;

        -- Enable RLS only if table exists
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invoice_items' AND schemaname = 'public') THEN
            ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
        END IF;

        RAISE NOTICE '✅ SUCCESS: invoice_items table created with indexes and RLS enabled';
    ELSE
        RAISE NOTICE '⚠️  SKIPPED: invoice_items table - parent invoices table missing or no user_id column';
    END IF;
END $$;

-- =====================================================
-- 2. CREATE QUOTE_ITEMS TABLE (ONLY IF QUOTES EXISTS WITH USER_ID)
-- =====================================================
DO $$
BEGIN
    -- Check if quotes table exists and has user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'quotes' 
        AND column_name = 'user_id'
    ) THEN
        -- Create quote_items table
        CREATE TABLE IF NOT EXISTS public.quote_items (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
            user_id text NOT NULL,
            description text NOT NULL,
            quantity numeric(10,2) DEFAULT 1.00,
            unit_price numeric(10,2) NOT NULL,
            total_amount numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
            tax_rate numeric(5,2) DEFAULT 0.00,
            tax_amount numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price * tax_rate / 100) STORED,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );

        -- Create indexes only if table and columns exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quote_items' AND column_name = 'quote_id') THEN
            CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quote_items' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_quote_items_user_id ON public.quote_items(user_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quote_items' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_quote_items_created_at ON public.quote_items(created_at);
        END IF;

        -- Enable RLS only if table exists
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'quote_items' AND schemaname = 'public') THEN
            ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
        END IF;

        RAISE NOTICE '✅ SUCCESS: quote_items table created with indexes and RLS enabled';
    ELSE
        RAISE NOTICE '⚠️  SKIPPED: quote_items table - parent quotes table missing or no user_id column';
    END IF;
END $$;

-- =====================================================
-- 3. CREATE EVENT_INVITATIONS TABLE (ONLY IF EVENTS EXISTS WITH USER_ID)
-- =====================================================
DO $$
BEGIN
    -- Check if events table exists and has user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'user_id'
    ) THEN
        -- Create event_invitations table
        CREATE TABLE IF NOT EXISTS public.event_invitations (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
            user_id text NOT NULL,
            invitee_email text NOT NULL,
            invitee_name text,
            status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
            invited_at timestamp with time zone DEFAULT now(),
            responded_at timestamp with time zone,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            UNIQUE(event_id, invitee_email)
        );

        -- Create indexes only if table and columns exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'event_invitations' AND column_name = 'event_id') THEN
            CREATE INDEX IF NOT EXISTS idx_event_invitations_event_id ON public.event_invitations(event_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'event_invitations' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_event_invitations_user_id ON public.event_invitations(user_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'event_invitations' AND column_name = 'invitee_email') THEN
            CREATE INDEX IF NOT EXISTS idx_event_invitations_invitee_email ON public.event_invitations(invitee_email);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'event_invitations' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_event_invitations_status ON public.event_invitations(status);
        END IF;

        -- Enable RLS only if table exists
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'event_invitations' AND schemaname = 'public') THEN
            ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
        END IF;

        RAISE NOTICE '✅ SUCCESS: event_invitations table created with indexes and RLS enabled';
    ELSE
        RAISE NOTICE '⚠️  SKIPPED: event_invitations table - parent events table missing or no user_id column';
    END IF;
END $$;

-- =====================================================
-- 4. CREATE EMAIL_SETTINGS TABLE (STANDALONE TABLE)
-- =====================================================
DO $$
BEGIN
    -- Create email_settings table (doesn't depend on other tables)
    CREATE TABLE IF NOT EXISTS public.email_settings (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id text NOT NULL,
        smtp_host text,
        smtp_port integer DEFAULT 587,
        smtp_username text,
        smtp_password text, -- Should be encrypted in production
        smtp_use_tls boolean DEFAULT true,
        from_email text NOT NULL,
        from_name text NOT NULL,
        reply_to_email text,
        email_signature text,
        auto_send_invoices boolean DEFAULT false,
        auto_send_quotes boolean DEFAULT false,
        auto_send_reminders boolean DEFAULT false,
        reminder_days_before integer DEFAULT 3,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        UNIQUE(user_id)
    );

    -- Create indexes only if table and columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_settings' AND column_name = 'user_id') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_email_settings_user_id ON public.email_settings(user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_settings' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_email_settings_created_at ON public.email_settings(created_at);
    END IF;

    -- Enable RLS only if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_settings' AND schemaname = 'public') THEN
        ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
    END IF;

    RAISE NOTICE '✅ SUCCESS: email_settings table created with indexes and RLS enabled';
END $$;

-- =====================================================
-- 5. CREATE UPDATE TRIGGERS FOR ALL NEW TABLES
-- =====================================================
DO $$
BEGIN
    -- Create or replace the update_updated_at_column function if it doesn't exist
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;

    -- Add update triggers for tables that exist
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invoice_items' AND schemaname = 'public') THEN
        DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON public.invoice_items;
        CREATE TRIGGER update_invoice_items_updated_at
            BEFORE UPDATE ON public.invoice_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ SUCCESS: Update trigger added to invoice_items';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'quote_items' AND schemaname = 'public') THEN
        DROP TRIGGER IF EXISTS update_quote_items_updated_at ON public.quote_items;
        CREATE TRIGGER update_quote_items_updated_at
            BEFORE UPDATE ON public.quote_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ SUCCESS: Update trigger added to quote_items';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'event_invitations' AND schemaname = 'public') THEN
        DROP TRIGGER IF EXISTS update_event_invitations_updated_at ON public.event_invitations;
        CREATE TRIGGER update_event_invitations_updated_at
            BEFORE UPDATE ON public.event_invitations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ SUCCESS: Update trigger added to event_invitations';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_settings' AND schemaname = 'public') THEN
        DROP TRIGGER IF EXISTS update_email_settings_updated_at ON public.email_settings;
        CREATE TRIGGER update_email_settings_updated_at
            BEFORE UPDATE ON public.email_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ SUCCESS: Update trigger added to email_settings';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- 6. FINAL STATUS REPORT
-- =====================================================
SELECT 
    'CREATED TABLES SUMMARY' as summary,
    COUNT(*) as total_new_tables
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('invoice_items', 'quote_items', 'event_invitations', 'email_settings');

-- Show which tables were actually created
SELECT 
    tablename as created_table,
    '✅ EXISTS' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('invoice_items', 'quote_items', 'event_invitations', 'email_settings')
ORDER BY tablename; 