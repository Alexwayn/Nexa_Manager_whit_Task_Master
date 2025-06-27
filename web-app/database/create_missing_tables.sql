-- =====================================================
-- CREATE MISSING TABLES FOR NEXA MANAGER
-- =====================================================
-- Run this BEFORE the RLS policies script
-- Creates tables that are referenced in RLS but don't exist yet
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE INVOICE_ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    user_id UUID NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (
        (quantity * unit_price * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0) / 100))
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_items_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Validation constraints
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_unit_price_positive CHECK (unit_price >= 0),
    CONSTRAINT chk_discount_valid CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    CONSTRAINT chk_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

-- =====================================================
-- 2. CREATE QUOTE_ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL,
    user_id UUID NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (
        (quantity * unit_price * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0) / 100))
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_quote_items_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_quote_items_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Validation constraints
    CONSTRAINT chk_quote_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_quote_unit_price_positive CHECK (unit_price >= 0),
    CONSTRAINT chk_quote_discount_valid CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    CONSTRAINT chk_quote_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

-- =====================================================
-- 3. CREATE EVENT_INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.event_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    user_id UUID NOT NULL, -- Event owner
    invitee_user_id UUID, -- Invited user (can be null for external invites)
    invitee_email TEXT, -- Email for external invites
    invitee_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_event_invitations_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_invitations_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_invitations_invitee FOREIGN KEY (invitee_user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Validation constraints
    CONSTRAINT chk_invitee_contact CHECK (invitee_user_id IS NOT NULL OR invitee_email IS NOT NULL),
    CONSTRAINT chk_valid_email CHECK (invitee_email IS NULL OR invitee_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    
    -- Unique constraint to prevent duplicate invitations
    CONSTRAINT uq_event_invitation_user UNIQUE (event_id, invitee_user_id),
    CONSTRAINT uq_event_invitation_email UNIQUE (event_id, invitee_email)
);

-- =====================================================
-- 4. CREATE EMAIL_SETTINGS TABLE (Non-critical but referenced)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    smtp_host TEXT,
    smtp_port INTEGER DEFAULT 587,
    smtp_username TEXT,
    smtp_password TEXT, -- Should be encrypted in production
    smtp_use_tls BOOLEAN DEFAULT true,
    smtp_use_ssl BOOLEAN DEFAULT false,
    from_name TEXT,
    from_email TEXT,
    reply_to_email TEXT,
    signature TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_email_settings_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Validation constraints
    CONSTRAINT chk_smtp_port_valid CHECK (smtp_port > 0 AND smtp_port <= 65535),
    CONSTRAINT chk_from_email_valid CHECK (from_email IS NULL OR from_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_reply_to_email_valid CHECK (reply_to_email IS NULL OR reply_to_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Invoice items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_user_id ON invoice_items(user_id);

-- Quote items indexes
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_user_id ON quote_items(user_id);

-- Event invitations indexes
CREATE INDEX IF NOT EXISTS idx_event_invitations_event_id ON event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_user_id ON event_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_invitee_user_id ON event_invitations(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_status ON event_invitations(status);

-- Email settings indexes
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);

-- =====================================================
-- 6. CREATE UPDATE TIMESTAMP TRIGGERS
-- =====================================================

-- Update timestamp function (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;
CREATE TRIGGER update_invoice_items_updated_at
    BEFORE UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quote_items_updated_at ON quote_items;
CREATE TRIGGER update_quote_items_updated_at
    BEFORE UPDATE ON quote_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_invitations_updated_at ON event_invitations;
CREATE TRIGGER update_event_invitations_updated_at
    BEFORE UPDATE ON event_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_settings_updated_at ON email_settings;
CREATE TRIGGER update_email_settings_updated_at
    BEFORE UPDATE ON email_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=== MISSING TABLES CREATION COMPLETED ===';
    RAISE NOTICE 'Created tables: invoice_items, quote_items, event_invitations, email_settings';
    RAISE NOTICE 'Next step: Run complete_rls_policies.sql';
    RAISE NOTICE '================================================';
END $$; 