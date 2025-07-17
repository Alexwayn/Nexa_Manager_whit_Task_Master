# TypeScript Types Documentation

## Overview

Nexa Manager uses comprehensive TypeScript interfaces to ensure type safety across the application. This document provides an overview of the type system and key interfaces.

## Type Organization

### Core Type Files

- **`src/types/api.ts`** - Base API types, entities, and response structures
- **`src/types/email.ts`** - Email management system types
- **`src/types/`** - Additional feature-specific type definitions

### Base Types

#### BaseEntity
All database entities extend the `BaseEntity` interface:

```typescript
interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}
```

#### ApiResponse
Standard API response wrapper:

```typescript
interface ApiResponse<T = any> {
  data: T | null;
  error: ApiError | null;
  status: number;
  message?: string;
}
```

## Email Management Types

### Core Email Interfaces

#### Email
The main email entity with comprehensive metadata:

```typescript
interface Email extends BaseEntity {
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
  client?: any;
}
```

#### EmailFolder
Folder organization structure:

```typescript
interface EmailFolder extends BaseEntity {
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
```

#### EmailTemplate
Template system with variable substitution:

```typescript
interface EmailTemplate extends BaseEntity {
  name: string;
  category: string;
  subject: string;
  content_text: string;
  content_html?: string;
  variables: TemplateVariable[];
  is_system: boolean;
  user_id: string;
}
```

### Supporting Email Types

#### EmailAddress
Email address structure used throughout the system:

```typescript
interface EmailAddress {
  name?: string;
  email: string;
}
```

#### EmailRecipients
Comprehensive recipient structure:

```typescript
interface EmailRecipients {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
}
```

#### EmailAttachment
File attachment handling:

```typescript
interface EmailAttachment {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  file_path?: string;
  is_inline: boolean;
  content_id?: string;
  created_at: string;
}
```

#### RelatedDocument
Business document references:

```typescript
interface RelatedDocument {
  type: 'invoice' | 'quote' | 'contract' | 'receipt';
  id: string;
  name?: string;
}
```

### Email Account Management

#### EmailAccount
IMAP/SMTP account configuration:

```typescript
interface EmailAccount extends BaseEntity {
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
```

#### EmailProviderConfig
Provider-specific configuration:

```typescript
interface EmailProviderConfig {
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
```

### Email Composition and Search

#### EmailComposition
Email creation and sending:

```typescript
interface EmailComposition {
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
```

#### EmailSearchFilters
Advanced search and filtering:

```typescript
interface EmailSearchFilters {
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
```

#### EmailListOptions
Email list pagination and sorting:

```typescript
interface EmailListOptions {
  page?: number;
  limit?: number;
  sort_by?: 'received_at' | 'sent_at' | 'subject' | 'sender_name';
  sort_order?: 'asc' | 'desc';
  filters?: EmailSearchFilters;
}
```

### Email Analytics and Statistics

#### EmailStatistics
Comprehensive email analytics:

```typescript
interface EmailStatistics {
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
```

#### EmailThread
Conversation threading:

```typescript
interface EmailThread {
  thread_id: string;
  subject: string;
  participants: EmailAddress[];
  email_count: number;
  last_email_date: string;
  has_unread: boolean;
  emails: Email[];
}
```

### Email Automation

#### EmailRule
Automated email organization:

```typescript
interface EmailRule extends BaseEntity {
  user_id: string;
  name: string;
  conditions: EmailRuleCondition[];
  actions: EmailRuleAction[];
  is_active: boolean;
  priority: number;
}
```

#### EmailRuleCondition
Rule condition definition:

```typescript
interface EmailRuleCondition {
  field: 'sender' | 'subject' | 'body' | 'recipient' | 'attachment';
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
  case_sensitive?: boolean;
}
```

#### EmailRuleAction
Rule action definition:

```typescript
interface EmailRuleAction {
  action: 'move_to_folder' | 'add_label' | 'mark_as_read' | 'mark_as_important' | 'delete' | 'forward';
  folder_id?: string;
  label_id?: string;
  forward_to?: string;
}
```

### Template System

#### TemplateVariable
Template variable definition:

```typescript
interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  default_value?: string;
  required: boolean;
  description?: string;
}
```

### Configuration and Settings

#### EmailNotificationSettings
User notification preferences:

```typescript
interface EmailNotificationSettings {
  new_email_notifications: boolean;
  important_email_notifications: boolean;
  email_sound_enabled: boolean;
  desktop_notifications: boolean;
  notification_frequency: 'immediate' | 'every_5_min' | 'every_15_min' | 'hourly' | 'disabled';
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}
```

### Data Management

#### EmailExportOptions
Email export configuration:

```typescript
interface EmailExportOptions {
  format: 'mbox' | 'eml' | 'pdf' | 'csv';
  include_attachments: boolean;
  date_range?: {
    from: string;
    to: string;
  };
  folders?: string[];
  labels?: string[];
}
```

#### EmailImportOptions
Email import configuration:

```typescript
interface EmailImportOptions {
  source: 'mbox' | 'eml' | 'pst';
  file_path: string;
  target_folder_id?: string;
  preserve_folder_structure: boolean;
  skip_duplicates: boolean;
}
```

### Service Response Types

#### EmailServiceResponse
Standard service response wrapper:

```typescript
interface EmailServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

#### EmailValidationResult
Email validation response:

```typescript
interface EmailValidationResult {
  is_valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}
```

### System Information

#### EmailQuotaInfo
Email storage quota information:

```typescript
interface EmailQuotaInfo {
  used_mb: number;
  total_mb: number;
  percentage_used: number;
  warning_threshold: number;
  is_near_limit: boolean;
}
```

#### EmailBackupInfo
Email backup information:

```typescript
interface EmailBackupInfo {
  id: string;
  created_at: string;
  size_mb: number;
  email_count: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  file_path?: string;
  error_message?: string;
}
```

## Business Integration Types

### Client Integration
Email types integrate with existing client management:

```typescript
// Email can reference clients
interface Email {
  client_id?: string;
  client?: Client; // From api.ts
}

// Search emails by client
interface EmailSearchFilters {
  client_id?: string;
}
```

### Document Integration
Emails can reference business documents:

```typescript
interface RelatedDocument {
  type: 'invoice' | 'quote' | 'contract' | 'receipt';
  id: string;
  name?: string;
}

interface Email {
  related_documents: RelatedDocument[];
}
```

## Type Safety Best Practices

### Strict TypeScript Configuration
The project uses strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Type Guards
Use type guards for runtime type checking:

```typescript
function isEmail(obj: any): obj is Email {
  return obj && typeof obj.message_id === 'string' && typeof obj.subject === 'string';
}
```

### Generic Types
Leverage generic types for reusable interfaces:

```typescript
interface EmailServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Usage
const response: EmailServiceResponse<Email[]> = await fetchEmails();
```

### Union Types
Use union types for controlled values:

```typescript
type EmailStatus = 'draft' | 'sent' | 'delivered' | 'failed';
type FolderType = 'system' | 'custom';
type Priority = 'low' | 'normal' | 'high';
```

## Development Guidelines

### Type Imports
Always use type-only imports when possible:

```typescript
import type { Email, EmailFolder, EmailTemplate } from '@/types/email';
```

### Interface Extensions
Extend base interfaces for consistency:

```typescript
interface CustomEmailData extends Email {
  customField: string;
}
```

### Optional vs Required
Be explicit about optional properties:

```typescript
interface EmailComposition {
  subject: string;        // Required
  content: EmailContent;  // Required
  cc?: EmailAddress[];    // Optional
  bcc?: EmailAddress[];   // Optional
}
```

## Migration and Versioning

### Type Evolution
When updating types, consider backward compatibility:

1. Add new optional properties
2. Use union types for breaking changes
3. Provide migration utilities
4. Update documentation

### Database Schema Alignment
Ensure TypeScript types align with database schema:

- Use consistent naming conventions
- Match data types appropriately
- Include all database constraints in types
- Document computed properties separately

---

For implementation examples and usage patterns, see the [Email System Documentation](EMAIL_SYSTEM.md) and related service files.