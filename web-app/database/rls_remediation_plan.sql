-- =====================================================
-- COMPREHENSIVE RLS REMEDIATION PLAN
-- =====================================================
-- This script removes authentication bypasses and restores proper RLS
-- Execute sections in order, testing after each section

-- =====================================================
-- SECTION 1: BACKUP CURRENT STATE
-- =====================================================

-- Create backup of current policies before making changes
CREATE TABLE IF NOT EXISTS rls_backup_policies AS
SELECT * FROM pg_policies WHERE schemaname = 'public';

CREATE TABLE IF NOT EXISTS rls_backup_table_status AS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables WHERE schemaname = 'public';

-- =====================================================
-- SECTION 2: ENABLE RLS ON ALL CORE TABLES
-- =====================================================

-- Core business tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;

-- Financial tables
ALTER TABLE IF EXISTS income ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expense_categories ENABLE ROW LEVEL SECURITY;

-- Event/Calendar tables
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_reminders ENABLE ROW LEVEL SECURITY;

-- Settings and configuration tables
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS third_party_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS integration_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoice_templates ENABLE ROW LEVEL SECURITY;

-- Business profile tables
ALTER TABLE IF EXISTS business_profiles ENABLE ROW LEVEL SECURITY;

-- Email management tables (newly created)
ALTER TABLE IF EXISTS email_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_sync_status ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 3: CREATE COMPREHENSIVE RLS POLICIES
-- =====================================================

-- Drop existing policies that might conflict
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
-- PROFILES TABLE POLICIES
-- =====================================================
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- CLIENTS TABLE POLICIES
-- =====================================================
CREATE POLICY "clients_select_own" ON clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "clients_insert_own" ON clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update_own" ON clients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "clients_delete_own" ON clients
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- APPOINTMENTS/EVENTS TABLE POLICIES
-- =====================================================
CREATE POLICY "appointments_select_own" ON appointments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "appointments_insert_own" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments_update_own" ON appointments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "appointments_delete_own" ON appointments
    FOR DELETE USING (auth.uid() = user_id);

-- Events table (if exists)
CREATE POLICY "events_select_own" ON events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "events_insert_own" ON events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_update_own" ON events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "events_delete_own" ON events
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- INVOICES AND RELATED TABLES POLICIES
-- =====================================================
CREATE POLICY "invoices_select_own" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "invoices_insert_own" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoices_update_own" ON invoices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "invoices_delete_own" ON invoices
    FOR DELETE USING (auth.uid() = user_id);

-- Invoice items (related through invoice)
CREATE POLICY "invoice_items_select_own" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "invoice_items_insert_own" ON invoice_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "invoice_items_update_own" ON invoice_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "invoice_items_delete_own" ON invoice_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

-- =====================================================
-- QUOTES AND RELATED TABLES POLICIES
-- =====================================================
CREATE POLICY "quotes_select_own" ON quotes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quotes_insert_own" ON quotes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quotes_update_own" ON quotes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "quotes_delete_own" ON quotes
    FOR DELETE USING (auth.uid() = user_id);

-- Quote items (related through quote)
CREATE POLICY "quote_items_select_own" ON quote_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quotes 
            WHERE quotes.id = quote_items.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

CREATE POLICY "quote_items_insert_own" ON quote_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM quotes 
            WHERE quotes.id = quote_items.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

CREATE POLICY "quote_items_update_own" ON quote_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM quotes 
            WHERE quotes.id = quote_items.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

CREATE POLICY "quote_items_delete_own" ON quote_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM quotes 
            WHERE quotes.id = quote_items.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

-- =====================================================
-- FINANCIAL TABLES POLICIES
-- =====================================================
CREATE POLICY "incomes_select_own" ON incomes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "incomes_insert_own" ON incomes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "incomes_update_own" ON incomes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "incomes_delete_own" ON incomes
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "expenses_select_own" ON expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "expenses_insert_own" ON expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expenses_update_own" ON expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "expenses_delete_own" ON expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Alternative income/expense tables (if they exist)
CREATE POLICY "income_select_own" ON income
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "income_insert_own" ON income
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "income_update_own" ON income
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "income_delete_own" ON income
    FOR DELETE USING (auth.uid() = user_id);

-- Categories (shared or user-specific)
CREATE POLICY "income_categories_select_all" ON income_categories
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "income_categories_insert_own" ON income_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "income_categories_update_own" ON income_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "income_categories_delete_own" ON income_categories
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "expense_categories_select_all" ON expense_categories
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "expense_categories_insert_own" ON expense_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expense_categories_update_own" ON expense_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "expense_categories_delete_own" ON expense_categories
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- SETTINGS AND CONFIGURATION TABLES POLICIES
-- =====================================================

-- User sessions
CREATE POLICY "user_sessions_select_own" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_sessions_insert_own" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_sessions_update_own" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_sessions_delete_own" ON user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Security audit logs
CREATE POLICY "security_audit_logs_select_own" ON security_audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "security_audit_logs_insert_own" ON security_audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Email settings
CREATE POLICY "email_settings_select_own" ON email_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "email_settings_insert_own" ON email_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_settings_update_own" ON email_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "email_settings_delete_own" ON email_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Notification preferences
CREATE POLICY "notification_preferences_select_own" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences_insert_own" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_preferences_update_own" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences_delete_own" ON notification_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- API keys
CREATE POLICY "api_keys_select_own" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "api_keys_insert_own" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_update_own" ON api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "api_keys_delete_own" ON api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Third party integrations
CREATE POLICY "third_party_integrations_select_own" ON third_party_integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "third_party_integrations_insert_own" ON third_party_integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "third_party_integrations_update_own" ON third_party_integrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "third_party_integrations_delete_own" ON third_party_integrations
    FOR DELETE USING (auth.uid() = user_id);

-- Business profiles
CREATE POLICY "business_profiles_select_own" ON business_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "business_profiles_insert_own" ON business_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "business_profiles_update_own" ON business_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "business_profiles_delete_own" ON business_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- EMAIL MANAGEMENT TABLES POLICIES (from our new schema)
-- =====================================================

-- Email folders
CREATE POLICY "email_folders_select_own" ON email_folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "email_folders_insert_own" ON email_folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_folders_update_own" ON email_folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "email_folders_delete_own" ON email_folders
    FOR DELETE USING (auth.uid() = user_id);

-- Email templates (system templates readable by all, user templates only by owner)
CREATE POLICY "email_templates_select_own_or_system" ON email_templates
    FOR SELECT USING (auth.uid() = user_id OR is_system = TRUE);

CREATE POLICY "email_templates_insert_own" ON email_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_templates_update_own" ON email_templates
    FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "email_templates_delete_own" ON email_templates
    FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- Email accounts
CREATE POLICY "email_accounts_select_own" ON email_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "email_accounts_insert_own" ON email_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_accounts_update_own" ON email_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "email_accounts_delete_own" ON email_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Emails
CREATE POLICY "emails_select_own" ON emails
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "emails_insert_own" ON emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emails_update_own" ON emails
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "emails_delete_own" ON emails
    FOR DELETE USING (auth.uid() = user_id);

-- Email attachments (through emails)
CREATE POLICY "email_attachments_select_own" ON email_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM emails 
            WHERE emails.id = email_attachments.email_id 
            AND emails.user_id = auth.uid()
        )
    );

CREATE POLICY "email_attachments_insert_own" ON email_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM emails 
            WHERE emails.id = email_attachments.email_id 
            AND emails.user_id = auth.uid()
        )
    );

CREATE POLICY "email_attachments_update_own" ON email_attachments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM emails 
            WHERE emails.id = email_attachments.email_id 
            AND emails.user_id = auth.uid()
        )
    );

CREATE POLICY "email_attachments_delete_own" ON email_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM emails 
            WHERE emails.id = email_attachments.email_id 
            AND emails.user_id = auth.uid()
        )
    );

-- Email labels
CREATE POLICY "email_labels_select_own" ON email_labels
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "email_labels_insert_own" ON email_labels
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_labels_update_own" ON email_labels
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "email_labels_delete_own" ON email_labels
    FOR DELETE USING (auth.uid() = user_id);

-- Email rules
CREATE POLICY "email_rules_select_own" ON email_rules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "email_rules_insert_own" ON email_rules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_rules_update_own" ON email_rules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "email_rules_delete_own" ON email_rules
    FOR DELETE USING (auth.uid() = user_id);

-- Email sync status (through email accounts)
CREATE POLICY "email_sync_status_select_own" ON email_sync_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM email_accounts 
            WHERE email_accounts.id = email_sync_status.account_id 
            AND email_accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "email_sync_status_insert_own" ON email_sync_status
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM email_accounts 
            WHERE email_accounts.id = email_sync_status.account_id 
            AND email_accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "email_sync_status_update_own" ON email_sync_status
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM email_accounts 
            WHERE email_accounts.id = email_sync_status.account_id 
            AND email_accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "email_sync_status_delete_own" ON email_sync_status
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM email_accounts 
            WHERE email_accounts.id = email_sync_status.account_id 
            AND email_accounts.user_id = auth.uid()
        )
    );

-- =====================================================
-- SECTION 4: VERIFICATION QUERIES
-- =====================================================

-- Check that all tables now have RLS enabled
SELECT 
    'RLS STATUS AFTER REMEDIATION:' as status,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check that all tables have policies
SELECT 
    'POLICY COUNT BY TABLE:' as status,
    t.tablename,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' AND t.rowsecurity = true
GROUP BY t.tablename
ORDER BY t.tablename;