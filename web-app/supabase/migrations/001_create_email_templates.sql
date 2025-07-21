-- Create email_templates table for email template management
-- This migration adds support for email templates with variable substitution

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  content_text TEXT NOT NULL,
  content_html TEXT,
  variables JSONB DEFAULT '[]',
  category VARCHAR NOT NULL DEFAULT 'custom',
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id VARCHAR DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_organization_id ON email_templates(organization_id);

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_templates
CREATE POLICY "email_templates_select_own_or_system" ON email_templates
  FOR SELECT USING (auth.uid()::text = user_id::text OR is_system = TRUE);

CREATE POLICY "email_templates_insert_own" ON email_templates
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "email_templates_update_own" ON email_templates
  FOR UPDATE USING (auth.uid()::text = user_id::text AND is_system = FALSE);

CREATE POLICY "email_templates_delete_own" ON email_templates
  FOR DELETE USING (auth.uid()::text = user_id::text AND is_system = FALSE);

-- Insert predefined system templates
INSERT INTO email_templates (
  name, 
  description, 
  subject, 
  content_text, 
  content_html, 
  variables, 
  category, 
  is_system, 
  user_id
) VALUES 
(
  'Professional Business Email',
  'Clean and professional template for business communications',
  'Message from {company_name}',
  'Dear {client_name},

{content}

Best regards,
{company_name}
Contact us: {company_email}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #2563eb; color: #ffffff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">{company_name}</h1>
    </div>
    <div style="padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 16px 0;">Dear {client_name},</p>
      <div style="margin: 20px 0;">{content}</div>
      <p style="margin: 16px 0 0 0;">Best regards,<br><strong>{company_name}</strong></p>
    </div>
    <div style="background-color: #1f2937; color: #ffffff; padding: 15px; text-align: center; font-size: 12px;">
      <p style="margin: 0;">Contact us: {company_email}</p>
    </div>
  </div>',
  '["client_name", "company_name", "company_email", "content"]',
  'business',
  TRUE,
  NULL
),
(
  'Invoice Email Template',
  'Template for invoice delivery and payment notices',
  'Invoice {invoice_number} - {company_name}',
  'Dear {client_name},

Please find attached invoice #{invoice_number} for the amount of {total_amount}.

Invoice Details:
- Invoice Number: {invoice_number}
- Due Date: {due_date}
- Total Amount: {total_amount}

If you have any questions, please don''t hesitate to contact us.

Best regards,
{company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #2563eb; color: #ffffff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Invoice {invoice_number}</h1>
    </div>
    <div style="padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 16px 0;">Dear {client_name},</p>
      <p>Please find attached invoice #{invoice_number} for the amount of <strong style="background-color: #fef3c7; padding: 2px 4px; border-radius: 2px;">{total_amount}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;"><strong>Invoice Number:</strong></td><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">{invoice_number}</td></tr>
        <tr><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;"><strong>Due Date:</strong></td><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">{due_date}</td></tr>
        <tr><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;"><strong>Total Amount:</strong></td><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;"><strong>{total_amount}</strong></td></tr>
      </table>
      <p>If you have any questions, please don''t hesitate to contact us.</p>
      <p style="margin: 16px 0 0 0;">Best regards,<br><strong>{company_name}</strong></p>
    </div>
    <div style="background-color: #1f2937; color: #ffffff; padding: 15px; text-align: center; font-size: 12px;">
      <p style="margin: 0;">This is an automated message from {company_name}</p>
    </div>
  </div>',
  '["client_name", "company_name", "invoice_number", "total_amount", "due_date"]',
  'invoice',
  TRUE,
  NULL
),
(
  'Payment Reminder',
  'Friendly reminder template for overdue payments',
  'Payment Reminder - Invoice {invoice_number}',
  'Dear {client_name},

This is a friendly reminder that invoice #{invoice_number} is now {days_overdue} days overdue.

Outstanding Amount: {total_amount}

Please arrange payment as soon as possible to avoid any late fees.

Thank you for your prompt attention to this matter.
{company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #f59e0b; color: #ffffff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Payment Reminder</h1>
    </div>
    <div style="padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 16px 0;">Dear {client_name},</p>
      <p>This is a friendly reminder that invoice #{invoice_number} is now <strong>{days_overdue} days overdue</strong>.</p>
      <div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-weight: bold;">Outstanding Amount: {total_amount}</p>
      </div>
      <p>Please arrange payment as soon as possible to avoid any late fees.</p>
      <p style="margin: 16px 0 0 0;">Thank you for your prompt attention to this matter.<br><strong>{company_name}</strong></p>
    </div>
    <div style="background-color: #1f2937; color: #ffffff; padding: 15px; text-align: center; font-size: 12px;">
      <p style="margin: 0;">Contact us if you have any questions about this invoice</p>
    </div>
  </div>',
  '["client_name", "invoice_number", "days_overdue", "total_amount", "company_name"]',
  'reminder',
  TRUE,
  NULL
),
(
  'Quote Email Template',
  'Template for sending quotes to clients',
  'Quote {quote_number} - {company_name}',
  'Dear {client_name},

Thank you for your interest in our services. Please find attached quote #{quote_number} for the amount of {total_amount}.

Quote Details:
- Quote Number: {quote_number}
- Issue Date: {issue_date}
- Valid Until: {expiry_date}
- Total Amount: {total_amount}

This quote is valid until {expiry_date}. Please let us know if you have any questions or would like to proceed.

Best regards,
{company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #059669; color: #ffffff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Quote {quote_number}</h1>
    </div>
    <div style="padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 16px 0;">Dear {client_name},</p>
      <p>Thank you for your interest in our services. Please find attached quote #{quote_number} for the amount of <strong style="background-color: #d1fae5; padding: 2px 4px; border-radius: 2px;">{total_amount}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;"><strong>Quote Number:</strong></td><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">{quote_number}</td></tr>
        <tr><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;"><strong>Issue Date:</strong></td><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">{issue_date}</td></tr>
        <tr><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;"><strong>Valid Until:</strong></td><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">{expiry_date}</td></tr>
        <tr><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;"><strong>Total Amount:</strong></td><td style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;"><strong>{total_amount}</strong></td></tr>
      </table>
      <p>This quote is valid until <strong>{expiry_date}</strong>. Please let us know if you have any questions or would like to proceed.</p>
      <p style="margin: 16px 0 0 0;">Best regards,<br><strong>{company_name}</strong></p>
    </div>
    <div style="background-color: #1f2937; color: #ffffff; padding: 15px; text-align: center; font-size: 12px;">
      <p style="margin: 0;">This quote was generated by {company_name}</p>
    </div>
  </div>',
  '["client_name", "company_name", "quote_number", "total_amount", "issue_date", "expiry_date"]',
  'quote',
  TRUE,
  NULL
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_email_templates_updated_at_trigger
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();