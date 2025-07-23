-- Email Management System Setup Script - CORRECTED VERSION
-- This script works with the existing email_templates table structure
-- Execute this script in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PART 1: SAFE TABLE CREATION AND COLUMN ADDITIONS
-- =====================================================

-- 1. Create email_folders table if it doesn't exist
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

-- 2. email_templates table already exists - just add is_system column if missing
-- Add is_system column to email_templates if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'email_templates' 
    AND column_name = 'is_system'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN is_system BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 3. Create email_accounts table if it doesn't exist
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

-- 4. Create emails table if it doesn't exist
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add client_id column to emails if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'emails' 
    AND column_name = 'client_id'
  ) THEN
    -- Check if clients table exists before adding foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      ALTER TABLE emails ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE emails ADD COLUMN client_id UUID;
    END IF;
  END IF;
END $$;

-- Add related_documents column to emails if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'emails' 
    AND column_name = 'related_documents'
  ) THEN
    ALTER TABLE emails ADD COLUMN related_documents JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 5. Create email_attachments table if it doesn't exist
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

-- 6. Create email_labels table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7), -- hex color code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create email_rules table if it doesn't exist
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

-- 8. Create email_sync_status table if it doesn't exist
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
  client_id UUID, -- Will reference clients(id) if table exists
  
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

-- Add foreign key constraint for client_id if clients table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'email_performance_metrics' 
      AND constraint_name = 'email_performance_metrics_client_id_fkey'
    ) THEN
      ALTER TABLE email_performance_metrics 
      ADD CONSTRAINT email_performance_metrics_client_id_fkey 
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

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
  client_id UUID, -- Will reference clients(id) if table exists
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

-- Add foreign key constraint for client_id if clients table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'client_communication_analytics' 
      AND constraint_name = 'client_communication_analytics_client_id_fkey'
    ) THEN
      ALTER TABLE client_communication_analytics 
      ADD CONSTRAINT client_communication_analytics_client_id_fkey 
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

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
  client_id UUID, -- Will reference clients(id) if table exists
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for client_id if clients table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'email_activity_timeline' 
      AND constraint_name = 'email_activity_timeline_client_id_fkey'
    ) THEN
      ALTER TABLE email_activity_timeline 
      ADD CONSTRAINT email_activity_timeline_client_id_fkey 
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

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

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own email folders" ON email_folders;
DROP POLICY IF EXISTS "Users can insert their own email folders" ON email_folders;
DROP POLICY IF EXISTS "Users can update their own email folders" ON email_folders;
DROP POLICY IF EXISTS "Users can delete their own email folders" ON email_folders;

DROP POLICY IF EXISTS "Users can view their own email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can insert their own email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can update their own email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can delete their own email templates" ON email_templates;

-- RLS Policies for email_folders
CREATE POLICY "Users can view their own email folders" ON email_folders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email folders" ON email_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email folders" ON email_folders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own email folders" ON email_folders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for email_templates (updated to work with existing structure)
CREATE POLICY "Users can view their own email templates" ON email_templates
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL OR is_system = TRUE OR is_default = TRUE);
CREATE POLICY "Users can insert their own email templates" ON email_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email templates" ON email_templates
  FOR UPDATE USING (auth.uid() = user_id AND (is_system = FALSE OR is_system IS NULL) AND (is_default = FALSE OR is_default IS NULL));
CREATE POLICY "Users can delete their own email templates" ON email_templates
  FOR DELETE USING (auth.uid() = user_id AND (is_system = FALSE OR is_system IS NULL) AND (is_default = FALSE OR is_default IS NULL));

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
CREATE POLICY "Users can insert attachments to their own emails" ON email_attachments
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
CREATE POLICY "Users can update their own email tracking events" ON email_tracking_events
  FOR UPDATE USING (auth.uid() = user_id);

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
CREATE POLICY "Users can update their own email activity timeline" ON email_activity_timeline
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- PART 5: DEFAULT EMAIL FOLDERS
-- =====================================================

-- Insert default system folders (only if they don't exist)
INSERT INTO email_folders (name, type, icon, color, user_id, created_at, updated_at)
SELECT 'Inbox', 'system', 'inbox', '#3B82F6', auth.uid(), NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM email_folders 
  WHERE name = 'Inbox' AND type = 'system' AND user_id = auth.uid()
) AND auth.uid() IS NOT NULL;

INSERT INTO email_folders (name, type, icon, color, user_id, created_at, updated_at)
SELECT 'Sent', 'system', 'send', '#10B981', auth.uid(), NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM email_folders 
  WHERE name = 'Sent' AND type = 'system' AND user_id = auth.uid()
) AND auth.uid() IS NOT NULL;

INSERT INTO email_folders (name, type, icon, color, user_id, created_at, updated_at)
SELECT 'Drafts', 'system', 'edit', '#F59E0B', auth.uid(), NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM email_folders 
  WHERE name = 'Drafts' AND type = 'system' AND user_id = auth.uid()
) AND auth.uid() IS NOT NULL;

INSERT INTO email_folders (name, type, icon, color, user_id, created_at, updated_at)
SELECT 'Trash', 'system', 'trash', '#EF4444', auth.uid(), NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM email_folders 
  WHERE name = 'Trash' AND type = 'system' AND user_id = auth.uid()
) AND auth.uid() IS NOT NULL;

INSERT INTO email_folders (name, type, icon, color, user_id, created_at, updated_at)
SELECT 'Spam', 'system', 'shield-exclamation', '#F97316', auth.uid(), NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM email_folders 
  WHERE name = 'Spam' AND type = 'system' AND user_id = auth.uid()
) AND auth.uid() IS NOT NULL;

-- =====================================================
-- PART 6: ANALYTICS FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update email performance metrics when tracking events are added
CREATE OR REPLACE FUNCTION update_email_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert performance metrics
  INSERT INTO email_performance_metrics (
    email_id, user_id, template_id, client_id,
    sent_at, delivered_at, first_opened_at, last_opened_at, replied_at,
    open_count, click_count, reply_count,
    is_delivered, is_opened, is_clicked, is_replied, is_bounced,
    created_at, updated_at
  )
  SELECT 
    NEW.email_id,
    NEW.user_id,
    e.template_id,
    e.client_id,
    CASE WHEN NEW.event_type = 'sent' THEN NEW.created_at END,
    CASE WHEN NEW.event_type = 'delivered' THEN NEW.created_at END,
    CASE WHEN NEW.event_type = 'opened' THEN NEW.created_at END,
    CASE WHEN NEW.event_type = 'opened' THEN NEW.created_at END,
    CASE WHEN NEW.event_type = 'replied' THEN NEW.created_at END,
    CASE WHEN NEW.event_type = 'opened' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'clicked' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'replied' THEN 1 ELSE 0 END,
    NEW.event_type = 'delivered',
    NEW.event_type = 'opened',
    NEW.event_type = 'clicked',
    NEW.event_type = 'replied',
    NEW.event_type = 'bounced',
    NOW(),
    NOW()
  FROM emails e
  WHERE e.id = NEW.email_id
  ON CONFLICT (email_id) DO UPDATE SET
    delivered_at = CASE WHEN NEW.event_type = 'delivered' THEN NEW.created_at ELSE email_performance_metrics.delivered_at END,
    first_opened_at = CASE 
      WHEN NEW.event_type = 'opened' AND email_performance_metrics.first_opened_at IS NULL 
      THEN NEW.created_at 
      ELSE email_performance_metrics.first_opened_at 
    END,
    last_opened_at = CASE WHEN NEW.event_type = 'opened' THEN NEW.created_at ELSE email_performance_metrics.last_opened_at END,
    replied_at = CASE WHEN NEW.event_type = 'replied' THEN NEW.created_at ELSE email_performance_metrics.replied_at END,
    open_count = CASE WHEN NEW.event_type = 'opened' THEN email_performance_metrics.open_count + 1 ELSE email_performance_metrics.open_count END,
    click_count = CASE WHEN NEW.event_type = 'clicked' THEN email_performance_metrics.click_count + 1 ELSE email_performance_metrics.click_count END,
    reply_count = CASE WHEN NEW.event_type = 'replied' THEN email_performance_metrics.reply_count + 1 ELSE email_performance_metrics.reply_count END,
    is_delivered = email_performance_metrics.is_delivered OR NEW.event_type = 'delivered',
    is_opened = email_performance_metrics.is_opened OR NEW.event_type = 'opened',
    is_clicked = email_performance_metrics.is_clicked OR NEW.event_type = 'clicked',
    is_replied = email_performance_metrics.is_replied OR NEW.event_type = 'replied',
    is_bounced = email_performance_metrics.is_bounced OR NEW.event_type = 'bounced',
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email performance metrics updates
DROP TRIGGER IF EXISTS trigger_update_email_performance_metrics ON email_tracking_events;
CREATE TRIGGER trigger_update_email_performance_metrics
  AFTER INSERT ON email_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION update_email_performance_metrics();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_total_opens INTEGER,
  p_total_clicks INTEGER,
  p_total_replies INTEGER,
  p_total_sent INTEGER
)
RETURNS DECIMAL(5,2) AS $$
BEGIN
  IF p_total_sent = 0 THEN
    RETURN 0.00;
  END IF;
  
  -- Weighted engagement score: opens (1x) + clicks (2x) + replies (3x)
  RETURN ROUND(
    ((p_total_opens * 1.0) + (p_total_clicks * 2.0) + (p_total_replies * 3.0)) / (p_total_sent * 6.0) * 100,
    2
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 7: VERIFICATION QUERIES
-- =====================================================

-- Verify table creation
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'email_folders', 'email_templates', 'email_accounts', 'emails', 
      'email_attachments', 'email_labels', 'email_rules', 'email_sync_status'
    ) THEN 'Email Management'
    WHEN table_name IN (
      'email_tracking_events', 'email_performance_metrics', 'email_campaign_analytics',
      'client_communication_analytics', 'email_usage_reports', 'email_activity_timeline'
    ) THEN 'Email Analytics'
    ELSE 'Other'
  END as category
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'email_%'
ORDER BY category, table_name;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'email_%'
ORDER BY tablename;

-- Verify indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'email_%'
ORDER BY tablename, indexname;

-- Show email_templates structure to confirm is_system column
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'email_templates'
ORDER BY ordinal_position;