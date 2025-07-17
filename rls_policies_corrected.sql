-- =====================================================
-- CORRECTED RLS POLICIES FOR YOUR ACTUAL DATABASE SCHEMA
-- =====================================================

-- =====================================================
-- SECTION 1: DROP EXISTING CONFLICTING POLICIES
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- =====================================================
-- SECTION 2: CREATE RLS POLICIES FOR EXISTING TABLES
-- =====================================================

-- API KEYS
CREATE POLICY "api_keys_select_own" ON api_keys
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "api_keys_insert_own" ON api_keys
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "api_keys_update_own" ON api_keys
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "api_keys_delete_own" ON api_keys
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- APPOINTMENTS
CREATE POLICY "appointments_select_own" ON appointments
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "appointments_insert_own" ON appointments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "appointments_update_own" ON appointments
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "appointments_delete_own" ON appointments
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- BUSINESS PROFILES
CREATE POLICY "business_profiles_select_own" ON business_profiles
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "business_profiles_insert_own" ON business_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "business_profiles_update_own" ON business_profiles
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "business_profiles_delete_own" ON business_profiles
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- CLIENTS
CREATE POLICY "clients_select_own" ON clients
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "clients_insert_own" ON clients
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "clients_update_own" ON clients
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "clients_delete_own" ON clients
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- DEADLINES
CREATE POLICY "deadlines_select_own" ON deadlines
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "deadlines_insert_own" ON deadlines
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "deadlines_update_own" ON deadlines
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "deadlines_delete_own" ON deadlines
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- DOCUMENTS
CREATE POLICY "documents_select_own" ON documents
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "documents_insert_own" ON documents
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "documents_update_own" ON documents
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "documents_delete_own" ON documents
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- EMAIL SETTINGS
CREATE POLICY "email_settings_select_own" ON email_settings
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "email_settings_insert_own" ON email_settings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "email_settings_update_own" ON email_settings
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "email_settings_delete_own" ON email_settings
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- EMAIL TEMPLATES
CREATE POLICY "email_templates_select_own_or_system" ON email_templates
    FOR SELECT USING (auth.uid()::text = user_id::text OR is_system = TRUE);
CREATE POLICY "email_templates_insert_own" ON email_templates
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "email_templates_update_own" ON email_templates
    FOR UPDATE USING (auth.uid()::text = user_id::text AND is_system = FALSE);
CREATE POLICY "email_templates_delete_own" ON email_templates
    FOR DELETE USING (auth.uid()::text = user_id::text AND is_system = FALSE);

-- EVENT TABLES
CREATE POLICY "event_attachments_select_own" ON event_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_attachments.event_id 
            AND events.user_id::text = auth.uid()::text
        )
    );
CREATE POLICY "event_attachments_insert_own" ON event_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_attachments.event_id 
            AND events.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "event_attendees_select_own" ON event_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_attendees.event_id 
            AND events.user_id::text = auth.uid()::text
        )
    );
CREATE POLICY "event_attendees_insert_own" ON event_attendees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_attendees.event_id 
            AND events.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "event_comments_select_own" ON event_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_comments.event_id 
            AND events.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "event_invitations_select_own" ON event_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_invitations.event_id 
            AND events.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "event_reminders_select_own" ON event_reminders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_reminders.event_id 
            AND events.user_id::text = auth.uid()::text
        )
    );

-- EVENTS
CREATE POLICY "events_select_own" ON events
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "events_insert_own" ON events
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "events_update_own" ON events
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "events_delete_own" ON events
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- EXPENSE CATEGORIES
CREATE POLICY "expense_categories_select_all" ON expense_categories
    FOR SELECT USING (user_id IS NULL OR auth.uid()::text = user_id::text);
CREATE POLICY "expense_categories_insert_own" ON expense_categories
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "expense_categories_update_own" ON expense_categories
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- EXPENSES
CREATE POLICY "expenses_select_own" ON expenses
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "expenses_insert_own" ON expenses
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "expenses_update_own" ON expenses
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "expenses_delete_own" ON expenses
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- IN APP NOTIFICATIONS
CREATE POLICY "in_app_notifications_select_own" ON in_app_notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "in_app_notifications_insert_own" ON in_app_notifications
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "in_app_notifications_update_own" ON in_app_notifications
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- INCOME
CREATE POLICY "income_select_own" ON income
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "income_insert_own" ON income
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "income_update_own" ON income
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "income_delete_own" ON income
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- INCOME CATEGORIES
CREATE POLICY "income_categories_select_all" ON income_categories
    FOR SELECT USING (user_id IS NULL OR auth.uid()::text = user_id::text);
CREATE POLICY "income_categories_insert_own" ON income_categories
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "income_categories_update_own" ON income_categories
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- INTEGRATION ACTIVITY
CREATE POLICY "integration_activity_select_own" ON integration_activity
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "integration_activity_insert_own" ON integration_activity
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- INVOICE ITEMS
CREATE POLICY "invoice_items_select_own" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id::text = auth.uid()::text
        )
    );
CREATE POLICY "invoice_items_insert_own" ON invoice_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id::text = auth.uid()::text
        )
    );

-- INVOICE LINE ITEMS
CREATE POLICY "invoice_line_items_select_own" ON invoice_line_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_line_items.invoice_id 
            AND invoices.user_id::text = auth.uid()::text
        )
    );

-- INVOICE TEMPLATES
CREATE POLICY "invoice_templates_select_own_or_system" ON invoice_templates
    FOR SELECT USING (auth.uid()::text = user_id::text OR is_system = TRUE);
CREATE POLICY "invoice_templates_insert_own" ON invoice_templates
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "invoice_templates_update_own" ON invoice_templates
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- INVOICES
CREATE POLICY "invoices_select_own" ON invoices
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "invoices_insert_own" ON invoices
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "invoices_update_own" ON invoices
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "invoices_delete_own" ON invoices
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- NOTIFICATION QUEUE
CREATE POLICY "notification_queue_select_own" ON notification_queue
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "notification_queue_insert_own" ON notification_queue
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ORGANIZATION MEMBERSHIPS
CREATE POLICY "organization_memberships_select_own" ON organization_memberships
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "organization_memberships_insert_own" ON organization_memberships
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ORGANIZATIONS
CREATE POLICY "organizations_select_member" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_memberships 
            WHERE organization_memberships.organization_id = organizations.id 
            AND organization_memberships.user_id::text = auth.uid()::text
        )
    );

-- PAYMENTS
CREATE POLICY "payments_select_own" ON payments
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "payments_insert_own" ON payments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "payments_update_own" ON payments
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- PERMISSIONS
CREATE POLICY "permissions_select_all" ON permissions
    FOR SELECT USING (true);

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- QUOTE ITEMS
CREATE POLICY "quote_items_select_own" ON quote_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quotes 
            WHERE quotes.id = quote_items.quote_id 
            AND quotes.user_id::text = auth.uid()::text
        )
    );

-- QUOTE LINE ITEMS
CREATE POLICY "quote_line_items_select_own" ON quote_line_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quotes 
            WHERE quotes.id = quote_line_items.quote_id 
            AND quotes.user_id::text = auth.uid()::text
        )
    );

-- QUOTES
CREATE POLICY "quotes_select_own" ON quotes
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "quotes_insert_own" ON quotes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "quotes_update_own" ON quotes
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "quotes_delete_own" ON quotes
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- RECURRENCE RULES
CREATE POLICY "recurrence_rules_select_own" ON recurrence_rules
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "recurrence_rules_insert_own" ON recurrence_rules
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ROLE PERMISSIONS
CREATE POLICY "role_permissions_select_all" ON role_permissions
    FOR SELECT USING (true);

-- ROLES
CREATE POLICY "roles_select_all" ON roles
    FOR SELECT USING (true);

-- SECURITY AUDIT LOGS
CREATE POLICY "security_audit_logs_select_own" ON security_audit_logs
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "security_audit_logs_insert_own" ON security_audit_logs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- THIRD PARTY INTEGRATIONS
CREATE POLICY "third_party_integrations_select_own" ON third_party_integrations
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "third_party_integrations_insert_own" ON third_party_integrations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "third_party_integrations_update_own" ON third_party_integrations
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- USER NOTIFICATION PREFERENCES
CREATE POLICY "user_notification_preferences_select_own" ON user_notification_preferences
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "user_notification_preferences_insert_own" ON user_notification_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "user_notification_preferences_update_own" ON user_notification_preferences
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- USER ROLES
CREATE POLICY "user_roles_select_own" ON user_roles
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "user_roles_insert_own" ON user_roles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- USER SESSIONS
CREATE POLICY "user_sessions_select_own" ON user_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "user_sessions_insert_own" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "user_sessions_update_own" ON user_sessions
    FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "user_sessions_delete_own" ON user_sessions
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- USERS
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- WEBHOOK CONFIGURATIONS
CREATE POLICY "webhook_configurations_select_own" ON webhook_configurations
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "webhook_configurations_insert_own" ON webhook_configurations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "webhook_configurations_update_own" ON webhook_configurations
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- WEBHOOK LOGS
CREATE POLICY "webhook_logs_select_own" ON webhook_logs
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "webhook_logs_insert_own" ON webhook_logs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- =====================================================
-- SECTION 3: VERIFICATION
-- =====================================================

-- Check RLS status
SELECT 
    'RLS STATUS:' as status,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check policy count
SELECT 
    'POLICY COUNT:' as status,
    t.tablename,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' AND t.rowsecurity = true
GROUP BY t.tablename
ORDER BY t.tablename;