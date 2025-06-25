-- Fix email_templates table to allow NULL user_id for system templates
-- Execute this script in the Supabase SQL Editor

-- Step 1: Drop existing table and recreate with proper constraints
DROP TABLE IF EXISTS email_templates CASCADE;

-- Step 2: Create email_templates table with NULL user_id support
CREATE TABLE email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system templates
    template_key VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    variables JSONB DEFAULT '[]',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    language VARCHAR(5) DEFAULT 'en',
    version INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, template_key) -- User-specific template keys must be unique
);

-- Step 3: Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view own and system templates" ON email_templates
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own templates" ON email_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON email_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON email_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Create indexes for performance
CREATE INDEX idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_key ON email_templates(template_key);
CREATE INDEX idx_email_templates_system ON email_templates(user_id) WHERE user_id IS NULL;

-- Step 5.1: Create unique constraint for system templates (user_id IS NULL)
CREATE UNIQUE INDEX idx_email_templates_system_unique 
    ON email_templates(template_key) 
    WHERE user_id IS NULL;

-- Step 6: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Step 7: Insert system email templates (user_id = NULL for system templates)
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

-- Verification: Check that system templates were inserted correctly
SELECT 
    template_key, 
    name, 
    category, 
    is_default,
    CASE 
        WHEN user_id IS NULL THEN 'System Template'
        ELSE 'User Template'
    END as template_type
FROM email_templates 
WHERE user_id IS NULL
ORDER BY category, template_key; 