-- Complete Email Management System Setup Script for Supabase
-- This script sets up the entire email management system database schema
-- Execute this script in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PART 1: EMAIL MANAGEMENT SCHEMA
-- =====================================================

-- 1. Email Folders Table
CREATE TABLE IF NOT EXISTS email_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('system', 'custom')) DEFAULT 'custom',
  icon VARCHAR(100),
  color VARCHAR(7), -- hex color code
  parent_id UUID REFERENCES email_folders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unread_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subject TEXT NOT NULL,
  content_text TEXT NOT NULL,
  content_html TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Email Accounts Table (for IMAP/SMTP configuration)
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  provider VARCHAR(100), -- gmail, outlook, custom, etc.
  imap_host VARCHAR(255),
  imap_port INTEGER DEFAULT 993,
  imap_secure BOOLEAN DEFAULT TRUE,
  smtp_host VARCHAR(255),
  smtp_port INTEGER DEFAULT 587,
  smtp_secure BOOLEAN DEFAULT TRUE,
  username VARCHAR(255),
  password_encrypted TEXT, -- encrypted password
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Emails Table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id VARCHAR(255) UNIQUE NOT NULL,
  thread_id VARCHAR(255),
  folder_id UUID REFERENCES email_folders(id) ON DELETE SET NULL,
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  recipients JSONB NOT NULL DEFAULT '{}'::jsonb, -- {to: [], cc: [], bcc: []}
  content_text TEXT,
  content_html TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  labels JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  is_draft BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  related_documents JSONB DEFAULT '[]'::jsonb, -- [{type: 'invoice', id: 'uuid'}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Email Attachments Table (for detailed attachment management)
CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100),
  size_bytes INTEGER,
  file_path TEXT, -- path to stored file
  is_inline BOOLEAN DEFAULT FALSE,
  content_id VARCHAR(255), -- for inline attachments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Email Labels Table
CREATE TABLE IF NOT EXISTS email_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7), -- hex color code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Email Rules Table (for automatic email organization)
CREATE TABLE IF NOT EXISTS email_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  conditions JSONB NOT NULL, -- [{field: 'sender', operator: 'contains', value: 'example.com'}]
  actions JSONB NOT NULL, -- [{action: 'move_to_folder', folder_id: 'uuid'}, {action: 'add_label', label_id: 'uuid'}]
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Email Sync Status Table (for tracking synchronization)
CREATE TABLE IF NOT EXISTS email_sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE NOT NULL,
  folder_name VARCHAR(255) NOT NULL,
  last_sync_date TIMESTAMP WITH TIME ZONE,
  last_uid INTEGER DEFAULT 0,
  sync_in_progress BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, folder_name)
);

-- =====================================================
-- PART 2: EMAIL ANALYTICS SCHEMA
-- =====================================================

-- 1. Email Tracking Events Table
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'spam', 'unsubscribed')),
  event_data JSONB DEFAULT '{}'::jsonb, -- Additional event-specific data
  ip_address INET,
  user_agent TEXT,
  location JSONB, -- {country, city, region}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Email Performance Metrics Table
CREATE TABLE IF NOT EXISTS email_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Timing metrics
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  first_opened_at TIMESTAMP WITH TIME ZONE,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  
  -- Count metrics
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  
  -- Response time metrics (in minutes)
  response_time_minutes INTEGER,
  
  -- Status flags
  is_delivered BOOLEAN DEFAULT FALSE,
  is_opened BOOLEAN DEFAULT FALSE,
  is_clicked BOOLEAN DEFAULT FALSE,
  is_replied BOOLEAN DEFAULT FALSE,
  is_bounced BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Email Campaign Analytics Table
CREATE TABLE IF NOT EXISTS email_campaign_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Campaign metrics
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  
  -- Calculated rates (stored for performance)
  delivery_rate DECIMAL(5,2) DEFAULT 0.00,
  open_rate DECIMAL(5,2) DEFAULT 0.00,
  click_rate DECIMAL(5,2) DEFAULT 0.00,
  reply_rate DECIMAL(5,2) DEFAULT 0.00,
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Campaign period
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Client Communication Analytics Table
CREATE TABLE IF NOT EXISTS client_communication_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Communication volume
  total_emails_sent INTEGER DEFAULT 0,
  total_emails_received INTEGER DEFAULT 0,
  total_emails_replied INTEGER DEFAULT 0,
  
  -- Response metrics
  avg_response_time_hours DECIMAL(8,2) DEFAULT 0.00,
  fastest_response_time_minutes INTEGER,
  slowest_response_time_hours INTEGER,
  
  -- Engagement metrics
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0.00, -- Calculated engagement score
  
  -- Communication patterns
  preferred_contact_time JSONB, -- {hour: 14, day_of_week: 2}
  communication_frequency DECIMAL(5,2) DEFAULT 0.00, -- emails per week
  
  -- Last activity
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  last_email_received_at TIMESTAMP WITH TIME ZONE,
  last_response_at TIMESTAMP WITH TIME ZONE,
  
  -- Period for analytics (monthly aggregation)
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(client_id, user_id, period_start, period_end)
);

-- 5. Email Usage Reports Table
CREATE TABLE IF NOT EXISTS email_usage_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  
  -- Usage metrics
  emails_sent INTEGER DEFAULT 0,
  emails_received INTEGER DEFAULT 0,
  emails_read INTEGER DEFAULT 0,
  emails_starred INTEGER DEFAULT 0,
  emails_deleted INTEGER DEFAULT 0,
  
  -- Template usage
  templates_used INTEGER DEFAULT 0,
  most_used_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  
  -- Storage metrics
  total_storage_bytes BIGINT DEFAULT 0,
  attachment_storage_bytes BIGINT DEFAULT 0,
  
  -- Performance metrics
  avg_response_time_hours DECIMAL(8,2) DEFAULT 0.00,
  total_opens_received INTEGER DEFAULT 0,
  total_clicks_received INTEGER DEFAULT 0,
  
  -- Report period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, report_type, period_start, period_end)
);

-- 6. Email Activity Timeline Table
CREATE TABLE IF NOT EXISTS email_activity_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('email_sent', 'email_received', 'email_read', 'email_starred', 'email_deleted', 'template_used', 'folder_created')),
  activity_data JSONB DEFAULT '{}'::jsonb,
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PART 3: PERFORMANCE INDEXES
-- =====================================================

-- Email Management Indexes
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_folder_id ON emails(folder_id);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_sender_email ON emails(sender_email);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read);
CREATE INDEX IF NOT EXISTS idx_emails_is_starred ON emails(is_starred);
CREATE INDEX IF NOT EXISTS idx_emails_client_id ON emails(client_id);
CREATE INDEX IF NOT EXISTS idx_emails_account_id ON emails(account_id);

-- Full-text search index for email content
CREATE INDEX IF NOT EXISTS idx_emails_search ON emails USING gin(
  to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(content_text, '') || ' ' || coalesce(sender_name, ''))
);

CREATE INDEX IF NOT EXISTS idx_email_folders_user_id ON email_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_email_folders_parent_id ON email_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email_address ON email_accounts(email_address);
CREATE INDEX IF NOT EXISTS idx_email_attachments_email_id ON email_attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_email_labels_user_id ON email_labels(user_id);
CREATE INDEX IF NOT EXISTS idx_email_rules_user_id ON email_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sync_status_account_id ON email_sync_status(account_id);

-- Email Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_email_id ON email_tracking_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_user_id ON email_tracking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_type_created ON email_tracking_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_created_at ON email_tracking_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_performance_metrics_email_id ON email_performance_metrics(email_id);
CREATE INDEX IF NOT EXISTS idx_email_performance_metrics_user_id ON email_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_email_performance_metrics_template_id ON email_performance_metrics(template_id);
CREATE INDEX IF NOT EXISTS idx_email_performance_metrics_client_id ON email_performance_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_email_performance_metrics_sent_at ON email_performance_metrics(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_campaign_analytics_user_id ON email_campaign_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_analytics_template_id ON email_campaign_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_analytics_started_at ON email_campaign_analytics(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_communication_analytics_client_id ON client_communication_analytics(client_id);
CREATE INDEX IF NOT EXISTS idx_client_communication_analytics_user_id ON client_communication_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_client_communication_analytics_period ON client_communication_analytics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_email_usage_reports_user_id ON email_usage_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_email_usage_reports_type_period ON email_usage_reports(report_type, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_email_activity_timeline_user_id ON email_activity_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_email_activity_timeline_type_created ON email_activity_timeline(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_activity_timeline_email_id ON email_activity_timeline(email_id);
CREATE INDEX IF NOT EXISTS idx_email_activity_timeline_client_id ON email_activity_timeline(client_id);

-- =====================================================
-- PART 4: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE email_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_communication_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_usage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_activity_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_folders
CREATE POLICY "Users can view their own email folders" ON email_folders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email folders" ON email_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email folders" ON email_folders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own email folders" ON email_folders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for email_templates
CREATE POLICY "Users can view their own email templates" ON email_templates
  FOR SELECT USING (auth.uid() = user_id OR is_system = TRUE);
CREATE POLICY "Users can insert their own email templates" ON email_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email templates" ON email_templates
  FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);
CREATE POLICY "Users can delete their own email templates" ON email_templates
  FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- RLS Policies for email_accounts
CREATE POLICY "Users can view their own email accounts" ON email_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email accounts" ON email_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email accounts" ON email_accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own email accounts" ON email_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for emails
CREATE POLICY "Users can view their own emails" ON emails
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own emails" ON emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own emails" ON emails
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own emails" ON emails
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for email_attachments
CREATE POLICY "Users can view attachments of their own emails" ON email_attachments
  FOR SELECT USING (EXISTS (SELECT 1 FROM emails WHERE emails.id = email_attachments.email_id AND emails.user_id = auth.uid()));
CREATE POLICY "Users can insert attachments for their own emails" ON email_attachments
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM emails WHERE emails.id = email_attachments.email_id AND emails.user_id = auth.uid()));
CREATE POLICY "Users can update attachments of their own emails" ON email_attachments
  FOR UPDATE USING (EXISTS (SELECT 1 FROM emails WHERE emails.id = email_attachments.email_id AND emails.user_id = auth.uid()));
CREATE POLICY "Users can delete attachments of their own emails" ON email_attachments
  FOR DELETE USING (EXISTS (SELECT 1 FROM emails WHERE emails.id = email_attachments.email_id AND emails.user_id = auth.uid()));

-- RLS Policies for email_labels
CREATE POLICY "Users can view their own email labels" ON email_labels
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email labels" ON email_labels
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email labels" ON email_labels
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own email labels" ON email_labels
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for email_rules
CREATE POLICY "Users can view their own email rules" ON email_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email rules" ON email_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email rules" ON email_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own email rules" ON email_rules
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for email_sync_status
CREATE POLICY "Users can view sync status of their own accounts" ON email_sync_status
  FOR SELECT USING (EXISTS (SELECT 1 FROM email_accounts WHERE email_accounts.id = email_sync_status.account_id AND email_accounts.user_id = auth.uid()));
CREATE POLICY "Users can insert sync status for their own accounts" ON email_sync_status
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM email_accounts WHERE email_accounts.id = email_sync_status.account_id AND email_accounts.user_id = auth.uid()));
CREATE POLICY "Users can update sync status of their own accounts" ON email_sync_status
  FOR UPDATE USING (EXISTS (SELECT 1 FROM email_accounts WHERE email_accounts.id = email_sync_status.account_id AND email_accounts.user_id = auth.uid()));
CREATE POLICY "Users can delete sync status of their own accounts" ON email_sync_status
  FOR DELETE USING (EXISTS (SELECT 1 FROM email_accounts WHERE email_accounts.id = email_sync_status.account_id AND email_accounts.user_id = auth.uid()));

-- RLS Policies for email_tracking_events
CREATE POLICY "Users can view their own email tracking events" ON email_tracking_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email tracking events" ON email_tracking_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for email_performance_metrics
CREATE POLICY "Users can view their own email performance metrics" ON email_performance_metrics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email performance metrics" ON email_performance_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email performance metrics" ON email_performance_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for email_campaign_analytics
CREATE POLICY "Users can view their own email campaign analytics" ON email_campaign_analytics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email campaign analytics" ON email_campaign_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email campaign analytics" ON email_campaign_analytics
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for client_communication_analytics
CREATE POLICY "Users can view their own client communication analytics" ON client_communication_analytics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own client communication analytics" ON client_communication_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own client communication analytics" ON client_communication_analytics
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for email_usage_reports
CREATE POLICY "Users can view their own email usage reports" ON email_usage_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email usage reports" ON email_usage_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email usage reports" ON email_usage_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for email_activity_timeline
CREATE POLICY "Users can view their own email activity timeline" ON email_activity_timeline
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email activity timeline" ON email_activity_timeline
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PART 5: DEFAULT EMAIL TEMPLATES
-- =====================================================

-- Insert default system email templates
INSERT INTO email_templates (name, category, subject, content_text, content_html, variables, is_system, user_id) VALUES
(
  'Invoice Notification',
  'invoice',
  'Invoice #{invoice_number} - {company_name}',
  'Dear {client_name},

Please find attached invoice #{invoice_number} for the amount of {invoice_total}.

Invoice Details:
- Invoice Number: {invoice_number}
- Date: {invoice_date}
- Due Date: {due_date}
- Amount: {invoice_total}

You can view and pay this invoice online at: {payment_link}

If you have any questions, please don''t hesitate to contact us.

Best regards,
{company_name}
{company_email}
{company_phone}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Invoice #{invoice_number}</h2>
    <p>Dear {client_name},</p>
    <p>Please find attached invoice #{invoice_number} for the amount of <strong>{invoice_total}</strong>.</p>
    <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <h3 style="margin-top: 0;">Invoice Details:</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Invoice Number:</strong> {invoice_number}</li>
        <li><strong>Date:</strong> {invoice_date}</li>
        <li><strong>Due Date:</strong> {due_date}</li>
        <li><strong>Amount:</strong> {invoice_total}</li>
      </ul>
    </div>
    <p><a href="{payment_link}" style="background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View & Pay Invoice</a></p>
    <p>If you have any questions, please don''t hesitate to contact us.</p>
    <p>Best regards,<br>
    {company_name}<br>
    {company_email}<br>
    {company_phone}</p>
  </div>',
  '["client_name", "invoice_number", "invoice_date", "due_date", "invoice_total", "payment_link", "company_name", "company_email", "company_phone"]'::jsonb,
  TRUE,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Quote Proposal',
  'quote',
  'Quote #{quote_number} - {company_name}',
  'Dear {client_name},

Thank you for your interest in our services. Please find attached quote #{quote_number}.

Quote Details:
- Quote Number: {quote_number}
- Date: {quote_date}
- Valid Until: {expiry_date}
- Total Amount: {quote_total}

This quote is valid until {expiry_date}. To accept this quote, please reply to this email or contact us directly.

We look forward to working with you.

Best regards,
{company_name}
{company_email}
{company_phone}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Quote #{quote_number}</h2>
    <p>Dear {client_name},</p>
    <p>Thank you for your interest in our services. Please find attached quote #{quote_number}.</p>
    <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <h3 style="margin-top: 0;">Quote Details:</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Quote Number:</strong> {quote_number}</li>
        <li><strong>Date:</strong> {quote_date}</li>
        <li><strong>Valid Until:</strong> {expiry_date}</li>
        <li><strong>Total Amount:</strong> {quote_total}</li>
      </ul>
    </div>
    <p style="background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">
      <strong>Note:</strong> This quote is valid until {expiry_date}.
    </p>
    <p>To accept this quote, please reply to this email or contact us directly.</p>
    <p>We look forward to working with you.</p>
    <p>Best regards,<br>
    {company_name}<br>
    {company_email}<br>
    {company_phone}</p>
  </div>',
  '["client_name", "quote_number", "quote_date", "expiry_date", "quote_total", "company_name", "company_email", "company_phone"]'::jsonb,
  TRUE,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Payment Reminder',
  'reminder',
  'Payment Reminder - Invoice #{invoice_number}',
  'Dear {client_name},

This is a friendly reminder that invoice #{invoice_number} for {invoice_total} was due on {due_date}.

Invoice Details:
- Invoice Number: {invoice_number}
- Original Due Date: {due_date}
- Amount Due: {invoice_total}
- Days Overdue: {days_overdue}

Please arrange payment at your earliest convenience. You can pay online at: {payment_link}

If you have already made this payment, please disregard this reminder.

If you have any questions or concerns, please contact us immediately.

Best regards,
{company_name}
{company_email}
{company_phone}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #d9534f;">Payment Reminder</h2>
    <p>Dear {client_name},</p>
    <p>This is a friendly reminder that invoice #{invoice_number} for <strong>{invoice_total}</strong> was due on {due_date}.</p>
    <div style="background: #f2dede; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #d9534f;">
      <h3 style="margin-top: 0; color: #d9534f;">Overdue Invoice Details:</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Invoice Number:</strong> {invoice_number}</li>
        <li><strong>Original Due Date:</strong> {due_date}</li>
        <li><strong>Amount Due:</strong> {invoice_total}</li>
        <li><strong>Days Overdue:</strong> {days_overdue}</li>
      </ul>
    </div>
    <p><a href="{payment_link}" style="background: #d9534f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Pay Now</a></p>
    <p><small>If you have already made this payment, please disregard this reminder.</small></p>
    <p>If you have any questions or concerns, please contact us immediately.</p>
    <p>Best regards,<br>
    {company_name}<br>
    {company_email}<br>
    {company_phone}</p>
  </div>',
  '["client_name", "invoice_number", "due_date", "invoice_total", "days_overdue", "payment_link", "company_name", "company_email", "company_phone"]'::jsonb,
  TRUE,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Payment Confirmation',
  'confirmation',
  'Payment Received - Invoice #{invoice_number}',
  'Dear {client_name},

Thank you! We have received your payment for invoice #{invoice_number}.

Payment Details:
- Invoice Number: {invoice_number}
- Payment Amount: {payment_amount}
- Payment Date: {payment_date}
- Payment Method: {payment_method}

Your account is now up to date. A receipt has been attached to this email for your records.

We appreciate your business and prompt payment.

Best regards,
{company_name}
{company_email}
{company_phone}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #5cb85c;">Payment Received</h2>
    <p>Dear {client_name},</p>
    <p><strong>Thank you!</strong> We have received your payment for invoice #{invoice_number}.</p>
    <div style="background: #dff0d8; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #5cb85c;">
      <h3 style="margin-top: 0; color: #5cb85c;">Payment Details:</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Invoice Number:</strong> {invoice_number}</li>
        <li><strong>Payment Amount:</strong> {payment_amount}</li>
        <li><strong>Payment Date:</strong> {payment_date}</li>
        <li><strong>Payment Method:</strong> {payment_method}</li>
      </ul>
    </div>
    <p style="background: #d4edda; padding: 10px; border-radius: 5px; border-left: 4px solid #5cb85c;">
      ✓ Your account is now up to date. A receipt has been attached to this email for your records.
    </p>
    <p>We appreciate your business and prompt payment.</p>
    <p>Best regards,<br>
    {company_name}<br>
    {company_email}<br>
    {company_phone}</p>
  </div>',
  '["client_name", "invoice_number", "payment_amount", "payment_date", "payment_method", "company_name", "company_email", "company_phone"]'::jsonb,
  TRUE,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Meeting Follow-up',
  'meeting',
  'Follow-up: {meeting_subject}',
  'Dear {client_name},

Thank you for taking the time to meet with us on {meeting_date} to discuss {meeting_subject}.

Meeting Summary:
- Date: {meeting_date}
- Attendees: {attendees}
- Duration: {meeting_duration}

Key Discussion Points:
{discussion_points}

Next Steps:
{next_steps}

Action Items:
{action_items}

Please let me know if I missed anything or if you have any questions about our discussion.

I look forward to our continued collaboration.

Best regards,
{sender_name}
{company_name}
{sender_email}
{sender_phone}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Follow-up: {meeting_subject}</h2>
    <p>Dear {client_name},</p>
    <p>Thank you for taking the time to meet with us on {meeting_date} to discuss <strong>{meeting_subject}</strong>.</p>
    
    <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <h3 style="margin-top: 0;">Meeting Summary:</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Date:</strong> {meeting_date}</li>
        <li><strong>Attendees:</strong> {attendees}</li>
        <li><strong>Duration:</strong> {meeting_duration}</li>
      </ul>
    </div>

    <div style="margin: 20px 0;">
      <h3>Key Discussion Points:</h3>
      <div style="background: #e7f3ff; padding: 10px; border-radius: 5px;">
        {discussion_points}
      </div>
    </div>

    <div style="margin: 20px 0;">
      <h3>Next Steps:</h3>
      <div style="background: #fff3cd; padding: 10px; border-radius: 5px;">
        {next_steps}
      </div>
    </div>

    <div style="margin: 20px 0;">
      <h3>Action Items:</h3>
      <div style="background: #f8d7da; padding: 10px; border-radius: 5px;">
        {action_items}
      </div>
    </div>

    <p>Please let me know if I missed anything or if you have any questions about our discussion.</p>
    <p>I look forward to our continued collaboration.</p>
    
    <p>Best regards,<br>
    {sender_name}<br>
    {company_name}<br>
    {sender_email}<br>
    {sender_phone}</p>
  </div>',
  '["client_name", "meeting_date", "meeting_subject", "attendees", "meeting_duration", "discussion_points", "next_steps", "action_items", "sender_name", "company_name", "sender_email", "sender_phone"]'::jsonb,
  TRUE,
  '00000000-0000-0000-0000-000000000000'
);

-- =====================================================
-- PART 6: FUNCTIONS AND TRIGGERS
-- =====================================================

-- Functions for automatic metric updates
CREATE OR REPLACE FUNCTION update_email_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update performance metrics when tracking events are inserted
  IF NEW.event_type = 'delivered' THEN
    UPDATE email_performance_metrics 
    SET is_delivered = TRUE, delivered_at = NEW.created_at, updated_at = NOW()
    WHERE email_id = NEW.email_id;
  ELSIF NEW.event_type = 'opened' THEN
    UPDATE email_performance_metrics 
    SET is_opened = TRUE, 
        open_count = open_count + 1,
        first_opened_at = COALESCE(first_opened_at, NEW.created_at),
        last_opened_at = NEW.created_at,
        updated_at = NOW()
    WHERE email_id = NEW.email_id;
  ELSIF NEW.event_type = 'clicked' THEN
    UPDATE email_performance_metrics 
    SET is_clicked = TRUE, 
        click_count = click_count + 1,
        updated_at = NOW()
    WHERE email_id = NEW.email_id;
  ELSIF NEW.event_type = 'replied' THEN
    UPDATE email_performance_metrics 
    SET is_replied = TRUE, 
        reply_count = reply_count + 1,
        replied_at = NEW.created_at,
        response_time_minutes = EXTRACT(EPOCH FROM (NEW.created_at - sent_at)) / 60,
        updated_at = NOW()
    WHERE email_id = NEW.email_id;
  ELSIF NEW.event_type = 'bounced' THEN
    UPDATE email_performance_metrics 
    SET is_bounced = TRUE, updated_at = NOW()
    WHERE email_id = NEW.email_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic metric updates
CREATE TRIGGER trigger_update_email_performance_metrics
  AFTER INSERT ON email_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION update_email_performance_metrics();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_total_opens INTEGER,
  p_total_clicks INTEGER,
  p_total_emails INTEGER
) RETURNS DECIMAL(5,2) AS $$
BEGIN
  IF p_total_emails = 0 THEN
    RETURN 0.00;
  END IF;
  
  -- Engagement score formula: (opens * 1 + clicks * 2) / total_emails * 100
  RETURN ROUND(
    ((p_total_opens * 1.0 + p_total_clicks * 2.0) / p_total_emails * 100.0)::DECIMAL(5,2), 
    2
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 7: VERIFICATION
-- =====================================================

-- Verification queries to check if everything was created successfully
DO $$
DECLARE
    table_count INTEGER;
    analytics_table_count INTEGER;
    index_count INTEGER;
    template_count INTEGER;
BEGIN
    -- Check if all main tables were created
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'email_folders', 'email_templates', 'email_accounts', 'emails', 
        'email_attachments', 'email_labels', 'email_rules', 'email_sync_status'
    );
    
    -- Check if analytics tables were created
    SELECT COUNT(*) INTO analytics_table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'email_tracking_events', 'email_performance_metrics', 'email_campaign_analytics',
        'client_communication_analytics', 'email_usage_reports', 'email_activity_timeline'
    );
    
    -- Check if indexes were created
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_email%';
    
    -- Check if default templates were inserted
    SELECT COUNT(*) INTO template_count
    FROM email_templates 
    WHERE is_system = TRUE;
    
    RAISE NOTICE 'Email Management Setup Complete:';
    RAISE NOTICE '- Main tables created: %', table_count;
    RAISE NOTICE '- Analytics tables created: %', analytics_table_count;
    RAISE NOTICE '- Indexes created: %', index_count;
    RAISE NOTICE '- Default templates: %', template_count;
    
    IF table_count < 8 THEN
        RAISE WARNING 'Some main tables may not have been created successfully';
    END IF;
    
    IF analytics_table_count < 6 THEN
        RAISE WARNING 'Some analytics tables may not have been created successfully';
    END IF;
    
    IF template_count < 5 THEN
        RAISE WARNING 'Default templates may not have been inserted successfully';
    END IF;
END $$;