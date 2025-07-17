-- Email Management Performance Indexes
-- Additional indexes for optimizing email search, filtering, and common queries

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_emails_user_folder_received ON emails(user_id, folder_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_user_read_received ON emails(user_id, is_read, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_user_starred_received ON emails(user_id, is_starred, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_user_important_received ON emails(user_id, is_important, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_user_draft_updated ON emails(user_id, is_draft, updated_at DESC);

-- Indexes for client-related email queries
CREATE INDEX IF NOT EXISTS idx_emails_client_received ON emails(client_id, received_at DESC) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_user_client_received ON emails(user_id, client_id, received_at DESC) WHERE client_id IS NOT NULL;

-- Indexes for thread-based queries
CREATE INDEX IF NOT EXISTS idx_emails_thread_received ON emails(thread_id, received_at DESC) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_user_thread_received ON emails(user_id, thread_id, received_at DESC) WHERE thread_id IS NOT NULL;

-- Indexes for attachment-related queries
CREATE INDEX IF NOT EXISTS idx_emails_has_attachments ON emails(user_id, received_at DESC) WHERE jsonb_array_length(attachments) > 0;

-- Indexes for label-based queries (using GIN for JSONB)
CREATE INDEX IF NOT EXISTS idx_emails_labels_gin ON emails USING gin(labels);
CREATE INDEX IF NOT EXISTS idx_emails_user_labels ON emails(user_id) WHERE jsonb_array_length(labels) > 0;

-- Indexes for related documents queries
CREATE INDEX IF NOT EXISTS idx_emails_related_docs_gin ON emails USING gin(related_documents);
CREATE INDEX IF NOT EXISTS idx_emails_user_related_docs ON emails(user_id) WHERE jsonb_array_length(related_documents) > 0;

-- Partial indexes for common status combinations
CREATE INDEX IF NOT EXISTS idx_emails_unread_not_draft ON emails(user_id, folder_id, received_at DESC) 
  WHERE is_read = FALSE AND is_draft = FALSE;
CREATE INDEX IF NOT EXISTS idx_emails_starred_not_draft ON emails(user_id, received_at DESC) 
  WHERE is_starred = TRUE AND is_draft = FALSE;
CREATE INDEX IF NOT EXISTS idx_emails_important_unread ON emails(user_id, received_at DESC) 
  WHERE is_important = TRUE AND is_read = FALSE;

-- Indexes for email account synchronization
CREATE INDEX IF NOT EXISTS idx_emails_account_sync ON emails(account_id, received_at DESC) WHERE account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_account_message_id ON emails(account_id, message_id) WHERE account_id IS NOT NULL;

-- Indexes for date-based queries (common in email filtering)
CREATE INDEX IF NOT EXISTS idx_emails_user_date_range ON emails(user_id, received_at) WHERE received_at >= CURRENT_DATE - INTERVAL '1 year';
CREATE INDEX IF NOT EXISTS idx_emails_sent_date ON emails(user_id, sent_at DESC) WHERE sent_at IS NOT NULL;

-- Indexes for sender-based queries
CREATE INDEX IF NOT EXISTS idx_emails_sender_email_received ON emails(sender_email, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_user_sender_received ON emails(user_id, sender_email, received_at DESC);

-- Text search optimization indexes
CREATE INDEX IF NOT EXISTS idx_emails_subject_trgm ON emails USING gin(subject gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_emails_sender_name_trgm ON emails USING gin(sender_name gin_trgm_ops);

-- Enable trigram extension for better text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes for email folders
CREATE INDEX IF NOT EXISTS idx_folders_user_type ON email_folders(user_id, type);
CREATE INDEX IF NOT EXISTS idx_folders_parent_user ON email_folders(parent_id, user_id) WHERE parent_id IS NOT NULL;

-- Indexes for email templates
CREATE INDEX IF NOT EXISTS idx_templates_user_category ON email_templates(user_id, category);
CREATE INDEX IF NOT EXISTS idx_templates_category_system ON email_templates(category, is_system);
CREATE INDEX IF NOT EXISTS idx_templates_user_system ON email_templates(user_id, is_system);

-- Indexes for email accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_active ON email_accounts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_accounts_user_sync ON email_accounts(user_id, sync_enabled, last_sync);

-- Indexes for email rules
CREATE INDEX IF NOT EXISTS idx_rules_user_active_priority ON email_rules(user_id, is_active, priority);

-- Indexes for email sync status
CREATE INDEX IF NOT EXISTS idx_sync_status_account_folder ON email_sync_status(account_id, folder_name);
CREATE INDEX IF NOT EXISTS idx_sync_status_sync_progress ON email_sync_status(sync_in_progress, last_sync_date);

-- Statistics update for better query planning
ANALYZE emails;
ANALYZE email_folders;
ANALYZE email_templates;
ANALYZE email_accounts;
ANALYZE email_attachments;
ANALYZE email_labels;
ANALYZE email_rules;
ANALYZE email_sync_status;