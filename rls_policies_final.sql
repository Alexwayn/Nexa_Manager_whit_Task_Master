-- =====================================================
-- FINAL RLS POLICIES BASED ON ACTUAL DATABASE SCHEMA
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

-- API KEYS (user_id: text)
CREATE POLICY "api_keys_select_own" ON api_keys
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "api_keys_insert_own" ON api_keys
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "api_keys_update_own" ON api_keys
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "api_keys_delete_own" ON api_keys
    FOR DELETE USING (auth.uid()::text = user_id);

-- APPOINTMENTS (no user_id column - need to check if there's another way to identify ownership)
-- Skipping for now - needs investigation

-- BUSINESS PROFILES (user_id: text)
CREATE POLICY "business_profiles_select_own" ON business_profiles
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "business_profiles_insert_own" ON business_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "business_profiles_update_own" ON business_profiles
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "business_profiles_delete_own" ON business_profiles
    FOR DELETE USING (auth.uid()::text = user_id);

-- CLIENTS (user_id: text)
CREATE POLICY "clients_select_own" ON clients
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "clients_insert_own" ON clients
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "clients_update_own" ON clients
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "clients_delete_own" ON clients
    FOR DELETE USING (auth.uid()::text = user_id);

-- DEADLINES (no user_id column - skipping for now)

-- DOCUMENTS (created_by: text)
CREATE POLICY "documents_select_own" ON documents
    FOR SELECT USING (auth.uid()::text = created_by);
CREATE POLICY "documents_insert_own" ON documents
    FOR INSERT WITH CHECK (auth.uid()::text = created_by);
CREATE POLICY "documents_update_own" ON documents
    FOR UPDATE USING (auth.uid()::text = created_by);
CREATE POLICY "documents_delete_own" ON documents
    FOR DELETE USING (auth.uid()::text = created_by);

-- EMAIL SETTINGS (user_id: text)
CREATE POLICY "email_settings_select_own" ON email_settings
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "email_settings_insert_own" ON email_settings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "email_settings_update_own" ON email_settings
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "email_settings_delete_own" ON email_settings
    FOR DELETE USING (auth.uid()::text = user_id);

-- EMAIL TEMPLATES (user_id: uuid)
CREATE POLICY "email_templates_select_own" ON email_templates
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "email_templates_insert_own" ON email_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "email_templates_update_own" ON email_templates
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "email_templates_delete_own" ON email_templates
    FOR DELETE USING (auth.uid() = user_id);

-- EVENT TABLES (no user_id columns - skipping for now)

-- EVENTS (user_id: text)
CREATE POLICY "events_select_own" ON events
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "events_insert_own" ON events
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "events_update_own" ON events
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "events_delete_own" ON events
    FOR DELETE USING (auth.uid()::text = user_id);

-- EXPENSE CATEGORIES (user_id: text)
CREATE POLICY "expense_categories_select_own" ON expense_categories
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "expense_categories_insert_own" ON expense_categories
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "expense_categories_update_own" ON expense_categories
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "expense_categories_delete_own" ON expense_categories
    FOR DELETE USING (auth.uid()::text = user_id);

-- EXPENSES (user_id: text)
CREATE POLICY "expenses_select_own" ON expenses
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "expenses_insert_own" ON expenses
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "expenses_update_own" ON expenses
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "expenses_delete_own" ON expenses
    FOR DELETE USING (auth.uid()::text = user_id);

-- IN APP NOTIFICATIONS (user_id: text)
CREATE POLICY "in_app_notifications_select_own" ON in_app_notifications
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "in_app_notifications_insert_own" ON in_app_notifications
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "in_app_notifications_update_own" ON in_app_notifications
    FOR UPDATE USING (auth.uid()::text = user_id);

-- INCOME (user_id: text)
CREATE POLICY "income_select_own" ON income
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "income_insert_own" ON income
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "income_update_own" ON income
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "income_delete_own" ON income
    FOR DELETE USING (auth.uid()::text = user_id);

-- INCOME CATEGORIES (user_id: text)
CREATE POLICY "income_categories_select_own" ON income_categories
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "income_categories_insert_own" ON income_categories
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "income_categories_update_own" ON income_categories
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "income_categories_delete_own" ON income_categories
    FOR DELETE USING (auth.uid()::text = user_id);

-- INTEGRATION ACTIVITY (user_id: text)
CREATE POLICY "integration_activity_select_own" ON integration_activity
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "integration_activity_insert_own" ON integration_activity
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- INVOICE ITEMS (user_id: text)
CREATE POLICY "invoice_items_select_own" ON invoice_items
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "invoice_items_insert_own" ON invoice_items
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "invoice_items_update_own" ON invoice_items
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "invoice_items_delete_own" ON invoice_items
    FOR DELETE USING (auth.uid()::text = user_id);

-- INVOICE LINE ITEMS (no user_id - needs relationship through invoices)
CREATE POLICY "invoice_line_items_select_own" ON invoice_line_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_line_items.invoice_id 
            AND invoices.user_id = auth.uid()::text
        )
    );

-- INVOICES (user_id: text)
CREATE POLICY "invoices_select_own" ON invoices
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "invoices_insert_own" ON invoices
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "invoices_update_own" ON invoices
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "invoices_delete_own" ON invoices
    FOR DELETE USING (auth.uid()::text = user_id);

-- NOTIFICATION QUEUE (user_id: text)
CREATE POLICY "notification_queue_select_own" ON notification_queue
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "notification_queue_insert_own" ON notification_queue
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- ORGANIZATION MEMBERSHIPS (clerk_user_id: text)
CREATE POLICY "organization_memberships_select_own" ON organization_memberships
    FOR SELECT USING (auth.uid()::text = clerk_user_id);
CREATE POLICY "organization_memberships_insert_own" ON organization_memberships
    FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id);

-- ORGANIZATIONS (no user relationship available - allow all for now)
CREATE POLICY "organizations_select_all" ON organizations
    FOR SELECT USING (true);

-- PAYMENTS (user_id: uuid)
CREATE POLICY "payments_select_own" ON payments
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_own" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payments_update_own" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- PERMISSIONS (system table - allow all to read)
CREATE POLICY "permissions_select_all" ON permissions
    FOR SELECT USING (true);

-- PROFILES (id: text - this IS the user id)
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- QUOTE ITEMS (no user_id - needs relationship through quotes)
CREATE POLICY "quote_items_select_own" ON quote_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quotes 
            WHERE quotes.id = quote_items.quote_id 
            AND quotes.user_id = auth.uid()::text
        )
    );

-- QUOTE LINE ITEMS (no user_id - needs relationship through quotes)
CREATE POLICY "quote_line_items_select_own" ON quote_line_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quotes 
            WHERE quotes.id = quote_line_items.quote_id 
            AND quotes.user_id = auth.uid()::text
        )
    );

-- QUOTES (user_id: text)
CREATE POLICY "quotes_select_own" ON quotes
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "quotes_insert_own" ON quotes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "quotes_update_own" ON quotes
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "quotes_delete_own" ON quotes
    FOR DELETE USING (auth.uid()::text = user_id);

-- RECURRENCE RULES (user_id: text)
CREATE POLICY "recurrence_rules_select_own" ON recurrence_rules
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "recurrence_rules_insert_own" ON recurrence_rules
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- ROLES (system table - allow all to read)
CREATE POLICY "roles_select_all" ON roles
    FOR SELECT USING (true);

-- SECURITY AUDIT LOGS (user_id: text)
CREATE POLICY "security_audit_logs_select_own" ON security_audit_logs
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "security_audit_logs_insert_own" ON security_audit_logs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- THIRD PARTY INTEGRATIONS (user_id: text)
CREATE POLICY "third_party_integrations_select_own" ON third_party_integrations
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "third_party_integrations_insert_own" ON third_party_integrations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "third_party_integrations_update_own" ON third_party_integrations
    FOR UPDATE USING (auth.uid()::text = user_id);

-- USER NOTIFICATION PREFERENCES (user_id: text)
CREATE POLICY "user_notification_preferences_select_own" ON user_notification_preferences
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "user_notification_preferences_insert_own" ON user_notification_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "user_notification_preferences_update_own" ON user_notification_preferences
    FOR UPDATE USING (auth.uid()::text = user_id);

-- USER ROLES (user_id: text)
CREATE POLICY "user_roles_select_own" ON user_roles
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "user_roles_insert_own" ON user_roles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- USER SESSIONS (user_id: text)
CREATE POLICY "user_sessions_select_own" ON user_sessions
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "user_sessions_insert_own" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "user_sessions_update_own" ON user_sessions
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "user_sessions_delete_own" ON user_sessions
    FOR DELETE USING (auth.uid()::text = user_id);

-- USERS (clerk_user_id: text)
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid()::text = clerk_user_id);
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid()::text = clerk_user_id);
CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id);

-- WEBHOOK CONFIGURATIONS (user_id: text)
CREATE POLICY "webhook_configurations_select_own" ON webhook_configurations
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "webhook_configurations_insert_own" ON webhook_configurations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "webhook_configurations_update_own" ON webhook_configurations
    FOR UPDATE USING (auth.uid()::text = user_id);

-- WEBHOOK LOGS (no user_id - skipping for now)

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