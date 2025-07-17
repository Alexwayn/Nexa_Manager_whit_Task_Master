# Email Management System Database Schema

This document describes the database schema and setup for the Email Management System in Nexa Manager.

## Overview

The Email Management System provides comprehensive email functionality including:
- Email storage and organization with folders and labels
- Email templates for business communications
- Email account configuration for IMAP/SMTP
- Email rules for automatic organization
- Full-text search and filtering capabilities
- Integration with existing business entities (clients, invoices, quotes)

## Database Tables

### Core Email Tables

#### `emails`
Main table storing email messages with full content and metadata.

**Key Fields:**
- `message_id`: Unique email message identifier
- `thread_id`: Groups related emails in conversations
- `folder_id`: Reference to email folder
- `account_id`: Reference to email account
- `subject`, `sender_name`, `sender_email`: Basic email info
- `recipients`: JSONB storing to/cc/bcc recipients
- `content_text`, `content_html`: Email content
- `attachments`: JSONB array of attachment metadata
- `labels`: JSONB array of applied labels
- `is_read`, `is_starred`, `is_important`, `is_draft`: Status flags
- `client_id`: Link to business client
- `related_documents`: JSONB array linking to invoices/quotes

#### `email_folders`
Hierarchical folder structure for email organization.

**Key Fields:**
- `name`: Folder display name
- `type`: 'system' (Inbox, Sent, etc.) or 'custom'
- `parent_id`: For nested folder structure
- `unread_count`, `total_count`: Cached counts for performance

#### `email_templates`
Reusable email templates with variable substitution.

**Key Fields:**
- `name`: Template display name
- `category`: Template category (invoice, quote, reminder, etc.)
- `subject`: Email subject template
- `content_text`, `content_html`: Template content
- `variables`: JSONB array defining template variables
- `is_system`: System templates vs user-created

#### `email_accounts`
Email account configurations for IMAP/SMTP.

**Key Fields:**
- `email_address`: Account email address
- `provider`: Email provider (gmail, outlook, custom)
- `imap_host`, `imap_port`, `imap_secure`: IMAP settings
- `smtp_host`, `smtp_port`, `smtp_secure`: SMTP settings
- `password_encrypted`: Encrypted password storage
- `sync_enabled`: Enable/disable synchronization

### Supporting Tables

#### `email_attachments`
Detailed attachment metadata and file management.

#### `email_labels`
User-defined labels for email categorization.

#### `email_rules`
Automatic email processing rules with conditions and actions.

#### `email_sync_status`
Tracks synchronization status for each email account/folder.

## Setup Instructions

### 1. Execute Database Scripts

Run the following scripts in your Supabase SQL editor in order:

```sql
-- Complete setup (recommended)
\i setup_email_management.sql

-- Or run individually:
\i email_management_schema.sql
\i email_performance_indexes.sql
\i email_default_templates.sql
```

### 2. Verify Installation

After running the setup script, verify that:
- 8 email-related tables were created
- Performance indexes were added
- 5+ default email templates were inserted
- Row Level Security (RLS) policies are active

### 3. Default System Folders

The system automatically creates these folders for each user:
- **Inbox**: Incoming emails
- **Sent**: Sent emails
- **Drafts**: Draft emails
- **Starred**: Starred emails
- **Trash**: Deleted emails

### 4. Default Email Templates

System templates are provided for:
- **Invoice Notification**: Professional invoice emails
- **Quote Proposal**: Business quote emails
- **Payment Reminder**: Overdue payment reminders
- **Payment Confirmation**: Payment received confirmations
- **Meeting Follow-up**: Post-meeting summaries

## Performance Optimizations

### Indexes

The schema includes comprehensive indexes for:
- **User-based queries**: All tables filtered by user_id
- **Date-based queries**: Emails sorted by received_at/sent_at
- **Status-based queries**: Read/unread, starred, important emails
- **Full-text search**: Subject and content search using GIN indexes
- **JSON queries**: Labels, attachments, and related documents
- **Composite queries**: Common filter combinations

### Query Optimization

- **Partial indexes** for common status combinations
- **GIN indexes** for JSONB fields (labels, attachments, etc.)
- **Trigram indexes** for fuzzy text search
- **Composite indexes** for multi-column queries

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own emails and related data
- System templates are readable by all users but not modifiable
- Proper cascade permissions for related tables (attachments, etc.)

### Data Protection

- Email passwords are stored encrypted
- Sensitive email content is protected by RLS
- Audit trails for email operations
- Secure deletion policies

## Integration Points

### Business Entity Integration

The email system integrates with existing Nexa Manager entities:

- **Clients**: Link emails to specific clients via `client_id`
- **Invoices**: Reference invoices in `related_documents` JSONB
- **Quotes**: Reference quotes in `related_documents` JSONB
- **Appointments**: Link emails to calendar events

### Template Variables

Templates support dynamic variables for business data:
- Client information (name, email, company)
- Invoice/quote details (numbers, amounts, dates)
- Company information (name, contact details)
- Custom business data

## Maintenance

### Regular Tasks

1. **Update Statistics**: Run `ANALYZE` on email tables periodically
2. **Clean Old Emails**: Implement retention policies for old emails
3. **Optimize Indexes**: Monitor query performance and adjust indexes
4. **Backup Email Data**: Regular backups of email content and attachments

### Monitoring

Monitor these metrics:
- Email table sizes and growth rates
- Index usage and query performance
- Synchronization success rates
- Storage usage for attachments

## Migration Notes

### From Existing Systems

When migrating from existing email systems:
1. Use the `email_import_options` interface for bulk imports
2. Preserve folder structure using `parent_id` relationships
3. Maintain email threading with `thread_id`
4. Link existing business data via `client_id` and `related_documents`

### Version Updates

For future schema updates:
1. Always backup before applying changes
2. Test migrations on development environment first
3. Update TypeScript interfaces to match schema changes
4. Regenerate database types if using code generation

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Ensure user is authenticated and policies are correct
2. **Index Performance**: Check if indexes are being used with `EXPLAIN ANALYZE`
3. **JSONB Queries**: Use proper JSONB operators for array/object queries
4. **Full-text Search**: Ensure trigram extension is installed

### Debug Queries

```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'email%';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes WHERE schemaname = 'public' AND tablename LIKE 'email%';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'email%';
```