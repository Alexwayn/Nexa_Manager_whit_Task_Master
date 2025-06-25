-- Email Settings Schema for Advanced Email Settings and Template Management
-- This schema supports comprehensive email configuration and template management
-- Fixed version with correct table creation order and NULL user_id support for system templates

-- Create email_templates table first (referenced by email_settings)
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system templates
    template_key VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- invoice, payment, quote, client, system
    subject VARCHAR(500) NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    variables JSONB DEFAULT '[]', -- Available template variables
    is_default BOOLEAN DEFAULT false, -- System default templates
    is_active BOOLEAN DEFAULT true,
    language VARCHAR(5) DEFAULT 'en',
    version INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, template_key), -- User-specific template keys must be unique
    UNIQUE(template_key) WHERE user_id IS NULL -- System template keys must be unique
);

-- Create email_settings table for SMTP and provider configuration
CREATE TABLE IF NOT EXISTS email_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Provider Configuration
    provider VARCHAR(20) DEFAULT 'smtp', -- smtp, sendgrid, mailgun, ses, emailjs
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_username VARCHAR(255),
    smtp_password TEXT, -- Encrypted
    smtp_encryption VARCHAR(10) DEFAULT 'tls', -- tls, ssl, none
    
    -- Provider API Keys (encrypted)
    sendgrid_api_key TEXT,
    mailgun_api_key TEXT,
    mailgun_domain VARCHAR(255),
    ses_access_key TEXT,
    ses_secret_key TEXT,
    ses_region VARCHAR(20) DEFAULT 'us-east-1',
    emailjs_service_id VARCHAR(255),
    emailjs_template_id VARCHAR(255),
    emailjs_public_key TEXT,
    
    -- From Address Configuration
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    reply_to_email VARCHAR(255),
    
    -- General Settings
    is_active BOOLEAN DEFAULT true,
    test_mode BOOLEAN DEFAULT true,
    rate_limit INTEGER DEFAULT 100, -- emails per hour
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one settings record per user
    UNIQUE(user_id)
);

-- Create notification_preferences table for granular notification control
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Invoice Notifications
    invoice_sent BOOLEAN DEFAULT true,
    invoice_viewed BOOLEAN DEFAULT true,
    invoice_paid BOOLEAN DEFAULT true,
    invoice_overdue BOOLEAN DEFAULT true,
    invoice_cancelled BOOLEAN DEFAULT false,
    
    -- Payment Notifications
    payment_received BOOLEAN DEFAULT true,
    payment_failed BOOLEAN DEFAULT true,
    payment_refunded BOOLEAN DEFAULT true,
    payment_reminder_sent BOOLEAN DEFAULT false,
    
    -- Quote Notifications
    quote_sent BOOLEAN DEFAULT true,
    quote_accepted BOOLEAN DEFAULT true,
    quote_declined BOOLEAN DEFAULT true,
    quote_expired BOOLEAN DEFAULT true,
    
    -- Client Notifications
    client_created BOOLEAN DEFAULT false,
    client_updated BOOLEAN DEFAULT false,
    
    -- System Notifications
    system_backup BOOLEAN DEFAULT false,
    system_maintenance BOOLEAN DEFAULT true,
    system_security BOOLEAN DEFAULT true,
    system_updates BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preferences record per user
    UNIQUE(user_id)
);

-- Create email_activity table for tracking email delivery
CREATE TABLE IF NOT EXISTS email_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_key VARCHAR(100),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500),
    
    -- Delivery tracking
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed, bounced
    provider_id VARCHAR(255), -- External provider message ID
    error_message TEXT,
    
    -- Metadata
    template_variables JSONB DEFAULT '{}',
    provider_used VARCHAR(20),
    
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_activity ENABLE ROW LEVEL SECURITY;

-- Email templates policies
CREATE POLICY "Users can view own and system templates" ON email_templates
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own templates" ON email_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON email_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON email_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Email settings policies
CREATE POLICY "Users can view own email settings" ON email_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email settings" ON email_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email settings" ON email_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email settings" ON email_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences" ON notification_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Email activity policies
CREATE POLICY "Users can view own email activity" ON email_activity
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email activity" ON email_activity
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email activity" ON email_activity
    FOR UPDATE USING (auth.uid() = user_id);

-- Create or replace function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_email_settings_updated_at 
    BEFORE UPDATE ON email_settings 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_email_activity_updated_at 
    BEFORE UPDATE ON email_activity 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_key ON email_templates(template_key);
CREATE INDEX idx_email_templates_system ON email_templates(user_id) WHERE user_id IS NULL;

CREATE INDEX idx_email_settings_user_id ON email_settings(user_id);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

CREATE INDEX idx_email_activity_user_id ON email_activity(user_id);
CREATE INDEX idx_email_activity_status ON email_activity(status);
CREATE INDEX idx_email_activity_sent_at ON email_activity(sent_at);
CREATE INDEX idx_email_activity_template ON email_activity(template_key);

-- Insert default system email templates (user_id = NULL for system templates)
INSERT INTO email_templates (user_id, template_key, name, description, category, subject, body_text, variables, is_default, is_active, language) VALUES
-- Invoice Templates
(NULL, 'invoice_sent', 'Invoice Sent', 'Default template for sending invoices to clients', 'invoice', 
'New Invoice #{invoice_number} - {company_name}', 
'Dear {client_name},

Please find attached invoice no. {invoice_number} dated {issue_date}.

Invoice Details:
- Amount: {total_amount}
- Due Date: {due_date}
- Payment Terms: {payment_terms} days

You can view and pay your invoice online: {invoice_link}

Thank you for your business!

Best regards,
{company_name}
{company_email}', 
'["invoice_number", "client_name", "company_name", "issue_date", "total_amount", "due_date", "payment_terms", "invoice_link", "company_email"]', 
true, true, 'en'),

(NULL, 'payment_received', 'Payment Received', 'Template for payment confirmation', 'payment',
'Payment Received - Invoice #{invoice_number}',
'Dear {client_name},

Thank you! We have received your payment for invoice #{invoice_number}.

Payment Details:
- Amount Paid: {payment_amount}
- Payment Date: {payment_date}
- Payment Method: {payment_method}
- Transaction ID: {transaction_id}

Your account is now up to date. A receipt has been attached for your records.

Best regards,
{company_name}',
'["client_name", "invoice_number", "payment_amount", "payment_date", "payment_method", "transaction_id", "company_name"]',
true, true, 'en'),

(NULL, 'payment_reminder', 'Payment Reminder', 'Template for payment reminders', 'payment',
'Payment Reminder - Invoice #{invoice_number} Due',
'Dear {client_name},

This is a friendly reminder that payment for invoice #{invoice_number} is now due.

Invoice Details:
- Original Amount: {total_amount}
- Due Date: {due_date}
- Days Overdue: {days_overdue}

Please make your payment as soon as possible: {payment_link}

If you have already sent payment, please disregard this notice.

Best regards,
{company_name}',
'["client_name", "invoice_number", "total_amount", "due_date", "days_overdue", "payment_link", "company_name"]',
true, true, 'en'),

(NULL, 'quote_sent', 'Quote Sent', 'Template for sending quotes', 'quote',
'New Quote #{quote_number} - {company_name}',
'Dear {client_name},

Thank you for your interest in our services. Please find attached quote #{quote_number}.

Quote Details:
- Quote Amount: {quote_amount}
- Valid Until: {expiry_date}
- Estimated Delivery: {delivery_estimate}

You can view and accept your quote online: {quote_link}

If you have any questions, please don''t hesitate to contact us.

Best regards,
{company_name}',
'["client_name", "quote_number", "company_name", "quote_amount", "expiry_date", "delivery_estimate", "quote_link"]',
true, true, 'en'),

(NULL, 'welcome_client', 'Welcome New Client', 'Template for welcoming new clients', 'client',
'Welcome to {company_name}!',
'Dear {client_name},

Welcome to {company_name}! We''re excited to work with you.

Your client portal is now active where you can:
- View invoices and quotes
- Make payments online
- Download receipts and documents
- Update your contact information

Portal Access: {portal_link}
Username: {client_email}

If you need assistance, please contact us at {support_email}.

Best regards,
{company_name} Team',
'["client_name", "company_name", "portal_link", "client_email", "support_email"]',
true, true, 'en');

-- Create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences for new users
CREATE TRIGGER create_user_notification_preferences
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences(); 