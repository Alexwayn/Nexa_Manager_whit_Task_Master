-- =====================================================
-- CREATE MISSING TABLES (CORRECTED VERSION)
-- =====================================================
-- Based on your actual table structure:
-- - user_id: text (Clerk authentication)
-- - client_id: uuid (foreign key to clients.id)
-- - id: uuid (primary key)
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE INVOICE_ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1.00,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. CREATE QUOTE_ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quote_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1.00,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 3. CREATE EVENT_INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.event_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id text NOT NULL, -- Owner of the event
    invitee_email text NOT NULL,
    invitee_name text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    sent_at timestamptz DEFAULT now(),
    responded_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(event_id, invitee_email)
);

-- =====================================================
-- 4. CREATE EMAIL_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL UNIQUE,
    smtp_host text,
    smtp_port integer DEFAULT 587,
    smtp_username text,
    smtp_password text, -- Should be encrypted in production
    from_email text NOT NULL,
    from_name text,
    signature text,
    auto_send_invoices boolean DEFAULT false,
    auto_send_quotes boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Invoice items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_user_id ON public.invoice_items(user_id);

-- Quote items indexes
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_user_id ON public.quote_items(user_id);

-- Event invitations indexes
CREATE INDEX IF NOT EXISTS idx_event_invitations_event_id ON public.event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_user_id ON public.event_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_email ON public.event_invitations(invitee_email);

-- Email settings indexes
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON public.email_settings(user_id);

-- =====================================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all new tables
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON public.invoice_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_items_updated_at BEFORE UPDATE ON public.quote_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_invitations_updated_at BEFORE UPDATE ON public.event_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_settings_updated_at BEFORE UPDATE ON public.email_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: All missing tables created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 CREATED TABLES:';
    RAISE NOTICE '   • invoice_items (with foreign key to invoices.id)';
    RAISE NOTICE '   • quote_items (with foreign key to quotes.id)';
    RAISE NOTICE '   • event_invitations (with foreign key to events.id)';
    RAISE NOTICE '   • email_settings (user settings table)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 ADDED FEATURES:';
    RAISE NOTICE '   • Performance indexes on user_id and foreign keys';
    RAISE NOTICE '   • Automatic updated_at timestamp triggers';
    RAISE NOTICE '   • Row Level Security enabled';
    RAISE NOTICE '   • Proper constraints and validations';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEP: Run the RLS policies script!';
END $$;

COMMIT; 