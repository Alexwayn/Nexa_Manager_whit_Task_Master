-- Email Settings and Template Management Schema
-- Supports SMTP configuration, email templates, and notification preferences

-- Create email_settings table for SMTP and provider configuration
CREATE TABLE IF NOT EXISTS email_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID (no foreign key constraint)
    
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
    ses_region VARCHAR(50) DEFAULT 'us-east-1',
    emailjs_service_id VARCHAR(255),
    emailjs_user_id VARCHAR(255),
    
    -- From Address Configuration
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) NOT NULL,
    reply_to_email VARCHAR(255),
    
    -- General Settings
    is_active BOOLEAN DEFAULT true,
    test_mode BOOLEAN DEFAULT false,
    max_daily_emails INTEGER DEFAULT 500,
    rate_limit_per_hour INTEGER DEFAULT 50,
    
    -- Signature and Footer
    default_signature TEXT,
    email_footer TEXT,
    include_unsubscribe BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active setting per user
    CONSTRAINT unique_user_email_settings UNIQUE (user_id)
);

-- Create email_templates table for customizable email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT, -- Clerk user ID (NULL for system templates)
    
    -- Template Identification
    template_key VARCHAR(50) NOT NULL, -- invoice_sent, payment_reminder, etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(30) DEFAULT 'invoice', -- invoice, payment, quote, client, system
    
    -- Template Content
    subject VARCHAR(500) NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    variables JSONB DEFAULT '[]', -- Available template variables
    
    -- Template Configuration
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    language VARCHAR(10) DEFAULT 'en',
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique template keys per user
    CONSTRAINT unique_user_template_key UNIQUE (user_id, template_key)
);

-- Create notification_preferences table for email notification settings
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    
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
    quote_expired BOOLEAN DEFAULT false,
    
    -- Client Notifications
    client_created BOOLEAN DEFAULT false,
    client_updated BOOLEAN DEFAULT false,
    client_deleted BOOLEAN DEFAULT false,
    
    -- System Notifications
    system_backup BOOLEAN DEFAULT true,
    system_maintenance BOOLEAN DEFAULT true,
    system_security BOOLEAN DEFAULT true,
    system_updates BOOLEAN DEFAULT false,
    
    -- General Preferences
    daily_summary BOOLEAN DEFAULT false,
    weekly_report BOOLEAN DEFAULT false,
    monthly_report BOOLEAN DEFAULT true,
    promotional_emails BOOLEAN DEFAULT false,
    
    -- Delivery Preferences
    email_digest BOOLEAN DEFAULT false,
    digest_frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preference record per user
    CONSTRAINT unique_user_notification_prefs UNIQUE (user_id)
);

-- Create email_activity table for tracking email history
CREATE TABLE IF NOT EXISTS email_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    
    -- Email Identification
    template_id UUID REFERENCES email_templates(id),
    template_key VARCHAR(50),
    
    -- Recipients and Content
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    
    -- Related Records
    invoice_id UUID,
    quote_id UUID,
    client_id UUID,
    
    -- Email Status and Tracking
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, failed, bounced
    provider_message_id VARCHAR(255),
    error_message TEXT,
    
    -- Delivery Tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_activity ENABLE ROW LEVEL SECURITY;

-- Email Settings Policies
CREATE POLICY "Users can view own email settings" ON email_settings
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own email settings" ON email_settings
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own email settings" ON email_settings
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own email settings" ON email_settings
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Email Templates Policies
CREATE POLICY "Users can view own and system email templates" ON email_templates
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own email templates" ON email_templates
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own email templates" ON email_templates
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own email templates" ON email_templates
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Notification Preferences Policies
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own notification preferences" ON notification_preferences
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Email Activity Policies
CREATE POLICY "Users can view own email activity" ON email_activity
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own email activity" ON email_activity
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own email activity" ON email_activity
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_settings_updated_at 
    BEFORE UPDATE ON email_settings 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_email_activity_updated_at 
    BEFORE UPDATE ON email_activity 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_email_settings_user_id ON email_settings(user_id);
CREATE INDEX idx_email_settings_provider ON email_settings(provider);
CREATE INDEX idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX idx_email_templates_key ON email_templates(template_key);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_email_activity_user_id ON email_activity(user_id);
CREATE INDEX idx_email_activity_status ON email_activity(status);
CREATE INDEX idx_email_activity_recipient ON email_activity(recipient_email);
CREATE INDEX idx_email_activity_template ON email_activity(template_key);
CREATE INDEX idx_email_activity_sent_at ON email_activity(sent_at);

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

-- Note: Default notification preferences should be created manually
-- when a new user is registered through Clerk webhook or application logic
-- since auth.users table is not used with Clerk authentication