-- =====================================================
-- COMPLETE RLS POLICIES FOR NEXA MANAGER
-- =====================================================
-- This script implements comprehensive Row Level Security
-- for all user tables using Clerk authentication
-- Execute this after all table schemas are created
-- =====================================================

BEGIN;

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES TO START FRESH
-- =====================================================
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

-- =====================================================
-- 2. ENSURE ALL USER TABLES HAVE RLS ENABLED
-- =====================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CLIENTS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own clients" ON clients
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own clients" ON clients
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own clients" ON clients
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id)
    WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own clients" ON clients
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- 4. INVOICES TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own invoices" ON invoices
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own invoices" ON invoices
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id)
    WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own invoices" ON invoices
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- 5. INVOICE_ITEMS TABLE POLICIES (CHILD TABLE)
-- =====================================================
CREATE POLICY "Users can view their own invoice items" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert their own invoice items" ON invoice_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update their own invoice items" ON invoice_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can delete their own invoice items" ON invoice_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.jwt() ->> 'sub'
        )
    );

-- =====================================================
-- 6. QUOTES TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own quotes" ON quotes
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own quotes" ON quotes
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own quotes" ON quotes
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id)
    WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own quotes" ON quotes
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- 7. QUOTE_ITEMS TABLE POLICIES (CHILD TABLE)
-- =====================================================
CREATE POLICY "Users can view their own quote items" ON quote_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quotes
            WHERE quotes.id = quote_items.quote_id
            AND quotes.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert their own quote items" ON quote_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM quotes
            WHERE quotes.id = quote_items.quote_id
            AND quotes.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update their own quote items" ON quote_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM quotes
            WHERE quotes.id = quote_items.quote_id
            AND quotes.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can delete their own quote items" ON quote_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM quotes
            WHERE quotes.id = quote_items.quote_id
            AND quotes.user_id = auth.jwt() ->> 'sub'
        )
    );

-- =====================================================
-- 8. EXPENSES TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own expenses" ON expenses
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own expenses" ON expenses
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id)
    WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own expenses" ON expenses
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- 9. INCOME TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own income" ON income
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own income" ON income
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own income" ON income
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id)
    WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own income" ON income
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- 10. EVENTS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own events" ON events
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own events" ON events
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id)
    WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- 11. EVENT_INVITATIONS TABLE POLICIES (SPECIAL CASE)
-- =====================================================
-- Allow both event owner and invitee access
CREATE POLICY "Users can view invitations for their events" ON event_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_invitations.event_id
            AND events.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Invitees can view their own invitations" ON event_invitations
    FOR SELECT USING (invitee_email = auth.email() OR invitation_token IS NOT NULL);

CREATE POLICY "Users can create invitations for their events" ON event_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_invitations.event_id
            AND events.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update invitations for their events" ON event_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_invitations.event_id
            AND events.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Invitees can update their RSVP status" ON event_invitations
    FOR UPDATE USING (invitee_email = auth.email() OR invitation_token IS NOT NULL)
    WITH CHECK (invitee_email = auth.email() OR invitation_token IS NOT NULL);

CREATE POLICY "Users can delete invitations for their events" ON event_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_invitations.event_id
            AND events.user_id = auth.jwt() ->> 'sub'
        )
    );

-- =====================================================
-- 12. DOCUMENTS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT USING (auth.jwt() ->> 'sub' = created_by);

CREATE POLICY "Users can insert their own documents" ON documents
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = created_by);

CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (auth.jwt() ->> 'sub' = created_by)
    WITH CHECK (auth.jwt() ->> 'sub' = created_by);

CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (auth.jwt() ->> 'sub' = created_by);

-- =====================================================
-- 13. BUSINESS_PROFILES TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own business profile" ON business_profiles
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own business profile" ON business_profiles
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own business profile" ON business_profiles
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id)
    WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own business profile" ON business_profiles
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- 14. INVOICE_SETTINGS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own invoice settings" ON invoice_settings
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own invoice settings" ON invoice_settings
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own invoice settings" ON invoice_settings
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id)
    WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own invoice settings" ON invoice_settings
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- 15. EMAIL_SETTINGS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own email settings" ON email_settings
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own email settings" ON email_settings
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own email settings" ON email_settings
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id)
    WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own email settings" ON email_settings
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- 16. RECURRING_EVENTS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own recurring events" ON recurring_events
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own recurring events" ON recurring_events
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own recurring events" ON recurring_events
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id)
    WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own recurring events" ON recurring_events
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- 17. NOTIFICATION_QUEUE TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own notifications" ON notification_queue
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own notifications" ON notification_queue
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own notifications" ON notification_queue
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id)
    WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own notifications" ON notification_queue
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- 18. USER_NOTIFICATION_PREFERENCES TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own notification preferences" ON user_notification_preferences
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON user_notification_preferences
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own notification preferences" ON user_notification_preferences
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id)
    WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own notification preferences" ON user_notification_preferences
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- 19. CREATE PERFORMANCE INDEXES FOR RLS
-- =====================================================
-- Indexes for better RLS query performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_settings_user_id ON invoice_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_events_user_id ON recurring_events(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- =====================================================
-- 20. VERIFICATION QUERIES
-- =====================================================
-- Query to verify RLS is enabled on all tables
DO $$
DECLARE
    table_record RECORD;
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE 'RLS VERIFICATION REPORT:';
    RAISE NOTICE '========================';
    
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN ('clients', 'invoices', 'invoice_items', 'quotes', 'quote_items', 
                         'expenses', 'income', 'events', 'event_invitations', 'documents',
                         'business_profiles', 'invoice_settings', 'email_settings', 
                         'recurring_events', 'notification_queue', 'user_notification_preferences')
    LOOP
        -- Check if RLS is enabled
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class 
        WHERE relname = table_record.tablename;
        
        -- Count policies
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE tablename = table_record.tablename;
        
        RAISE NOTICE 'Table: % | RLS: % | Policies: %', 
                     table_record.tablename, 
                     CASE WHEN rls_enabled THEN 'ENABLED' ELSE 'DISABLED' END,
                     policy_count;
    END LOOP;
    
    RAISE NOTICE '========================';
    RAISE NOTICE 'RLS setup completed successfully!';
END $$;

COMMIT; 