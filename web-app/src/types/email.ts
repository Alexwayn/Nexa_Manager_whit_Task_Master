// Email Management System TypeScript Interfaces

import { BaseEntity } from './api';

/**
 * Email address structure
 */
export interface EmailAddress {
  name?: string;
  email: string;
}

/**
 * Email recipients structure
 */
export interface EmailRecipients {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
}

/**
 * Email content structure
 */
export interface EmailContent {
  text: string;
  html?: string;
}

/**
 * Email attachment structure
 */
export interface EmailAttachment {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  file_path?: string;
  is_inline: boolean;
  content_id?: string;
  created_at: string;
}

/**
 * Related document reference
 */
export interface RelatedDocument {
  type: 'invoice' | 'quote' | 'contract' | 'receipt';
  id: string;
  name?: string;
}

/**
 * Email entity
 */
export interface Email extends BaseEntity {
  message_id: string;
  thread_id?: string;
  folder_id?: string;
  account_id?: string;
  user_id: string;
  subject: string;
  sender_name: string;
  sender_email: string;
  recipients: EmailRecipients;
  content_text?: string;
  content_html?: string;
  attachments: EmailAttachment[];
  labels: string[];
  is_read: boolean;
  is_starred: boolean;
  is_important: boolean;
  is_draft: boolean;
  received_at: string;
  sent_at?: string;
  client_id?: string;
  related_documents: RelatedDocument[];
  
  // Computed properties
  folder?: EmailFolder;
  client?: any; // Reference to Client type from api.ts
}

/**
 * Email folder entity
 */
export interface EmailFolder extends BaseEntity {
  name: string;
  type: 'system' | 'custom';
  icon?: string;
  color?: string;
  parent_id?: string;
  user_id: string;
  unread_count: number;
  total_count: number;
  
  // Computed properties
  children?: EmailFolder[];
  parent?: EmailFolder;
}

/**
 * Email template variable
 */
export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  default_value?: string;
  required: boolean;
  description?: string;
}

/**
 * Email template entity
 */
export interface EmailTemplate extends BaseEntity {
  name: string;
  category: string;
  subject: string;
  content_text: string;
  content_html?: string;
  variables: TemplateVariable[];
  is_system: boolean;
  user_id: string;
}

/**
 * Email account configuration
 */
export interface EmailAccount extends BaseEntity {
  user_id: string;
  name: string;
  email_address: string;
  provider?: string;
  imap_host?: string;
  imap_port: number;
  imap_secure: boolean;
  smtp_host?: string;
  smtp_port: number;
  smtp_secure: boolean;
  username?: string;
  password_encrypted?: string;
  is_active: boolean;
  last_sync?: string;
  sync_enabled: boolean;
}

/**
 * Email label entity
 */
export interface EmailLabel extends BaseEntity {
  user_id: string;
  name: string;
  color?: string;
}

/**
 * Email rule condition
 */
export interface EmailRuleCondition {
  field: 'sender' | 'subject' | 'body' | 'recipient' | 'attachment';
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
  case_sensitive?: boolean;
}

/**
 * Email rule action
 */
export interface EmailRuleAction {
  action: 'move_to_folder' | 'add_label' | 'mark_as_read' | 'mark_as_important' | 'delete' | 'forward';
  folder_id?: string;
  label_id?: string;
  forward_to?: string;
}

/**
 * Email rule entity
 */
export interface EmailRule extends BaseEntity {
  user_id: string;
  name: string;
  conditions: EmailRuleCondition[];
  actions: EmailRuleAction[];
  is_active: boolean;
  priority: number;
}

/**
 * Email sync status
 */
export interface EmailSyncStatus extends BaseEntity {
  account_id: string;
  folder_name: string;
  last_sync_date?: string;
  last_uid: number;
  sync_in_progress: boolean;
  error_message?: string;
}

/**
 * Email composition data
 */
export interface EmailComposition {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  content: EmailContent;
  attachments: File[];
  template_id?: string;
  template_variables?: Record<string, any>;
  scheduled_at?: string;
  priority: 'low' | 'normal' | 'high';
  request_read_receipt?: boolean;
  is_draft: boolean;
}

/**
 * Email search filters
 */
export interface EmailSearchFilters {
  query?: string;
  folder_id?: string;
  sender?: string;
  recipient?: string;
  subject?: string;
  has_attachments?: boolean;
  is_read?: boolean;
  is_starred?: boolean;
  is_important?: boolean;
  labels?: string[];
  date_from?: string;
  date_to?: string;
  client_id?: string;
}

/**
 * Email list options
 */
export interface EmailListOptions {
  page?: number;
  limit?: number;
  sort_by?: 'received_at' | 'sent_at' | 'subject' | 'sender_name';
  sort_order?: 'asc' | 'desc';
  filters?: EmailSearchFilters;
}

/**
 * Email statistics
 */
export interface EmailStatistics {
  total_emails: number;
  unread_count: number;
  sent_count: number;
  draft_count: number;
  starred_count: number;
  today_count: number;
  this_week_count: number;
  this_month_count: number;
  storage_used_mb: number;
  top_senders: Array<{
    email: string;
    name?: string;
    count: number;
  }>;
  email_activity: Array<{
    date: string;
    sent: number;
    received: number;
  }>;
}

/**
 * Email thread
 */
export interface EmailThread {
  thread_id: string;
  subject: string;
  participants: EmailAddress[];
  email_count: number;
  last_email_date: string;
  has_unread: boolean;
  emails: Email[];
}

/**
 * Email provider configuration
 */
export interface EmailProviderConfig {
  name: string;
  display_name: string;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  auth_type: 'password' | 'oauth2';
  oauth_config?: {
    client_id: string;
    scopes: string[];
    auth_url: string;
    token_url: string;
  };
}

/**
 * Email notification settings
 */
export interface EmailNotificationSettings {
  new_email_notifications: boolean;
  important_email_notifications: boolean;
  email_sound_enabled: boolean;
  desktop_notifications: boolean;
  notification_frequency: 'immediate' | 'every_5_min' | 'every_15_min' | 'hourly' | 'disabled';
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

/**
 * Email export options
 */
export interface EmailExportOptions {
  format: 'mbox' | 'eml' | 'pdf' | 'csv';
  include_attachments: boolean;
  date_range?: {
    from: string;
    to: string;
  };
  folders?: string[];
  labels?: string[];
}

/**
 * Email import options
 */
export interface EmailImportOptions {
  source: 'mbox' | 'eml' | 'pst';
  file_path: string;
  target_folder_id?: string;
  preserve_folder_structure: boolean;
  skip_duplicates: boolean;
}

/**
 * Email service response types
 */
export interface EmailServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  is_valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Email quota information
 */
export interface EmailQuotaInfo {
  used_mb: number;
  total_mb: number;
  percentage_used: number;
  warning_threshold: number;
  is_near_limit: boolean;
}

/**
 * Email backup information
 */
export interface EmailBackupInfo {
  id: string;
  created_at: string;
  size_mb: number;
  email_count: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  file_path?: string;
  error_message?: string;
}
