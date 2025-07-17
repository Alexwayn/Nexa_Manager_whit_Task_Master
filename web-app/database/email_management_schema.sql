-- Email Management System Database Schema
-- This script creates the necessary tables for the email management system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Create indexes for performance optimization
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

-- Enable Row Level Security (RLS)
ALTER TABLE email_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sync_status ENABLE ROW LEVEL SECURITY;

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
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM emails
      WHERE emails.id = email_attachments.email_id
      AND emails.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert attachments for their own emails" ON email_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM emails
      WHERE emails.id = email_attachments.email_id
      AND emails.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update attachments of their own emails" ON email_attachments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM emails
      WHERE emails.id = email_attachments.email_id
      AND emails.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete attachments of their own emails" ON email_attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM emails
      WHERE emails.id = email_attachments.email_id
      AND emails.user_id = auth.uid()
    )
  );

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
CREATE POLICY "Users can view sync status of their own email accounts" ON email_sync_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_sync_status.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert sync status for their own email accounts" ON email_sync_status
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_sync_status.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update sync status of their own email accounts" ON email_sync_status
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_sync_status.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete sync status of their own email accounts" ON email_sync_status
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_sync_status.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

-- Insert default system folders for new users
INSERT INTO email_folders (name, type, icon, user_id) 
SELECT 'Inbox', 'system', 'inbox', id FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM email_folders 
  WHERE name = 'Inbox' AND type = 'system' AND user_id = auth.users.id
);

INSERT INTO email_folders (name, type, icon, user_id) 
SELECT 'Sent', 'system', 'paper-airplane', id FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM email_folders 
  WHERE name = 'Sent' AND type = 'system' AND user_id = auth.users.id
);

INSERT INTO email_folders (name, type, icon, user_id) 
SELECT 'Drafts', 'system', 'document-text', id FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM email_folders 
  WHERE name = 'Drafts' AND type = 'system' AND user_id = auth.users.id
);

INSERT INTO email_folders (name, type, icon, user_id) 
SELECT 'Starred', 'system', 'star', id FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM email_folders 
  WHERE name = 'Starred' AND type = 'system' AND user_id = auth.users.id
);

INSERT INTO email_folders (name, type, icon, user_id) 
SELECT 'Trash', 'system', 'trash', id FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM email_folders 
  WHERE name = 'Trash' AND type = 'system' AND user_id = auth.users.id
);

-- Function to create default email folders for new users
CREATE OR REPLACE FUNCTION create_default_email_folders_for_user()
RETURNS trigger AS $$
BEGIN
  -- Create default system folders
  INSERT INTO email_folders (name, type, icon, user_id) VALUES
    ('Inbox', 'system', 'inbox', NEW.id),
    ('Sent', 'system', 'paper-airplane', NEW.id),
    ('Drafts', 'system', 'document-text', NEW.id),
    ('Starred', 'system', 'star', NEW.id),
    ('Trash', 'system', 'trash', NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default email folders when a new user signs up
CREATE OR REPLACE TRIGGER create_email_folders_after_user_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_email_folders_for_user();

-- Function to update folder counts
CREATE OR REPLACE FUNCTION update_folder_counts()
RETURNS trigger AS $$
BEGIN
  -- Update unread count for the folder
  UPDATE email_folders 
  SET unread_count = (
    SELECT COUNT(*) FROM emails 
    WHERE folder_id = COALESCE(NEW.folder_id, OLD.folder_id) 
    AND is_read = FALSE
  ),
  total_count = (
    SELECT COUNT(*) FROM emails 
    WHERE folder_id = COALESCE(NEW.folder_id, OLD.folder_id)
  )
  WHERE id = COALESCE(NEW.folder_id, OLD.folder_id);
  
  -- If folder changed, update old folder counts too
  IF TG_OP = 'UPDATE' AND OLD.folder_id IS DISTINCT FROM NEW.folder_id THEN
    UPDATE email_folders 
    SET unread_count = (
      SELECT COUNT(*) FROM emails 
      WHERE folder_id = OLD.folder_id 
      AND is_read = FALSE
    ),
    total_count = (
      SELECT COUNT(*) FROM emails 
      WHERE folder_id = OLD.folder_id
    )
    WHERE id = OLD.folder_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to update folder counts
CREATE OR REPLACE TRIGGER update_folder_counts_on_email_change
AFTER INSERT OR UPDATE OR DELETE ON emails
FOR EACH ROW
EXECUTE FUNCTION update_folder_counts();