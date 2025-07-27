# Email Feature

## Overview

The Email feature provides comprehensive email management functionality for Nexa Manager, including email composition, template management, campaign automation, email tracking, attachment handling, and integration with external email providers. It serves as the central communication hub for client interactions and business correspondence.

## Architecture

This feature follows a layered architecture:
- **Components**: React components for email management UI
- **Hooks**: Custom hooks for email data management and operations
- **Services**: Business logic for email operations and integrations
- **Utils**: Utility functions for email processing and formatting

## Public API

### Components

#### `EmailComposer`
Rich text editor for composing emails.

```tsx
import { EmailComposer } from '@/features/email';

<EmailComposer 
  onSend={handleSend}
  onSave={handleSaveDraft}
  recipients={recipients}
  template={selectedTemplate}
/>
```

#### `EmailTemplateManager`
Component for managing email templates.

```tsx
import { EmailTemplateManager } from '@/features/email';

<EmailTemplateManager 
  onTemplateSelect={handleTemplateSelect}
  onTemplateCreate={handleTemplateCreate}
  onTemplateEdit={handleTemplateEdit}
/>
```

#### `EmailCampaignManager`
Component for managing email campaigns.

```tsx
import { EmailCampaignManager } from '@/features/email';

<EmailCampaignManager 
  campaigns={campaigns}
  onCampaignCreate={handleCampaignCreate}
  onCampaignLaunch={handleCampaignLaunch}
/>
```

#### `EmailList`
Component for displaying email lists with filtering and sorting.

```tsx
import { EmailList } from '@/features/email';

<EmailList 
  emails={emails}
  onEmailSelect={handleEmailSelect}
  onEmailDelete={handleEmailDelete}
  filter={emailFilter}
/>
```

#### `EmailViewer`
Component for viewing email content and details.

```tsx
import { EmailViewer } from '@/features/email';

<EmailViewer 
  email={selectedEmail}
  onReply={handleReply}
  onForward={handleForward}
  onDelete={handleDelete}
/>
```

#### `EmailAttachmentManager`
Component for managing email attachments.

```tsx
import { EmailAttachmentManager } from '@/features/email';

<EmailAttachmentManager 
  attachments={attachments}
  onAttachmentAdd={handleAttachmentAdd}
  onAttachmentRemove={handleAttachmentRemove}
  maxSize={10485760} // 10MB
/>
```

### Hooks

#### `useEmails`
Main hook for email data management.

```tsx
import { useEmails } from '@/features/email';

const {
  emails,
  loading,
  error,
  sendEmail,
  saveDraft,
  deleteEmail,
  refreshEmails
} = useEmails();
```

#### `useEmailComposer`
Hook for email composition functionality.

```tsx
import { useEmailComposer } from '@/features/email';

const {
  draft,
  recipients,
  subject,
  content,
  attachments,
  updateDraft,
  addRecipient,
  removeRecipient,
  addAttachment,
  sendEmail,
  saveDraft
} = useEmailComposer();
```

#### `useEmailTemplates`
Hook for email template management.

```tsx
import { useEmailTemplates } from '@/features/email';

const {
  templates,
  loading,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate
} = useEmailTemplates();
```

#### `useEmailSearch`
Hook for email search functionality.

```tsx
import { useEmailSearch } from '@/features/email';

const {
  searchResults,
  searchTerm,
  setSearchTerm,
  isSearching,
  searchFilters,
  applyFilter,
  clearSearch
} = useEmailSearch();
```

### Services

#### `emailService`
Core email management service.

```tsx
import { emailService } from '@/features/email';

// Send email
await emailService.send({
  to: ['recipient@example.com'],
  subject: 'Subject',
  content: 'Email content',
  attachments: [attachmentData]
});

// Get emails
const emails = await emailService.getEmails();
const email = await emailService.getById(emailId);

// Email operations
await emailService.markAsRead(emailId);
await emailService.archive(emailId);
await emailService.delete(emailId);
```

#### `emailTemplateService`
Email template management service.

```tsx
import { emailTemplateService } from '@/features/email';

// Template operations
const templates = await emailTemplateService.getAll();
const template = await emailTemplateService.getById(templateId);
const newTemplate = await emailTemplateService.create(templateData);
await emailTemplateService.update(templateId, updates);

// Template rendering
const renderedContent = await emailTemplateService.render(templateId, variables);
```

#### `emailCampaignService`
Email campaign management service.

```tsx
import { emailCampaignService } from '@/features/email';

// Campaign operations
const campaigns = await emailCampaignService.getAll();
const newCampaign = await emailCampaignService.create(campaignData);
await emailCampaignService.launch(campaignId);
await emailCampaignService.pause(campaignId);

// Campaign analytics
const analytics = await emailCampaignService.getAnalytics(campaignId);
```

#### `emailAutomationService`
Email automation and workflow service.

```tsx
import { emailAutomationService } from '@/features/email';

// Automation rules
const rules = await emailAutomationService.getRules();
await emailAutomationService.createRule(ruleData);
await emailAutomationService.enableRule(ruleId);

// Trigger automation
await emailAutomationService.triggerWorkflow(workflowId, data);
```

#### `emailTrackingService`
Email tracking and analytics service.

```tsx
import { emailTrackingService } from '@/features/email';

// Email tracking
await emailTrackingService.trackOpen(emailId);
await emailTrackingService.trackClick(emailId, linkId);

// Analytics
const openRate = await emailTrackingService.getOpenRate(campaignId);
const clickRate = await emailTrackingService.getClickRate(campaignId);
```

## Dependencies

### Internal Dependencies
- `@/features/clients` - Client data for email recipients
- `@/features/auth` - Authentication and authorization
- `@/shared/components` - Shared UI components
- `@/shared/hooks` - Shared custom hooks
- `@/shared/types` - Shared type definitions
- `@/shared/utils` - Shared utility functions

### External Dependencies
- `@tanstack/react-query` - Data fetching and caching
- `react-hook-form` - Form management
- `@supabase/supabase-js` - Database operations
- `@tiptap/react` - Rich text editor
- `nodemailer` - Email sending (server-side)
- `mjml` - Email template rendering

## Integration Patterns

### Cross-Feature Communication

#### With Clients Feature
```tsx
// Sending email to clients
import { useClients } from '@/features/clients';
import { emailService } from '@/features/email';

const { clients } = useClients();
const clientEmails = clients.map(client => client.email);

await emailService.sendBulk({
  recipients: clientEmails,
  subject: 'Newsletter',
  template: 'newsletter',
  data: newsletterData
});
```

#### With Financial Feature
```tsx
// Sending invoice via email
import { invoiceService } from '@/features/financial';
import { emailService } from '@/features/email';

const invoice = await invoiceService.getById(invoiceId);
const pdfBuffer = await invoiceService.generatePDF(invoiceId);

await emailService.send({
  to: [invoice.clientEmail],
  subject: `Invoice ${invoice.number}`,
  template: 'invoice',
  data: { invoice },
  attachments: [{
    filename: `invoice-${invoice.number}.pdf`,
    content: pdfBuffer
  }]
});
```

#### With Calendar Feature
```tsx
// Sending calendar invitations
import { calendarService } from '@/features/calendar';
import { emailService } from '@/features/email';

const event = await calendarService.getById(eventId);

await emailService.send({
  to: event.attendees,
  subject: `Invitation: ${event.title}`,
  template: 'calendar-invitation',
  data: { event },
  attachments: [{
    filename: 'invitation.ics',
    content: calendarService.generateICS(event)
  }]
});
```

## Data Models

### Email Type
```typescript
interface Email {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  htmlContent?: string;
  attachments: EmailAttachment[];
  status: 'draft' | 'sent' | 'delivered' | 'failed' | 'bounced';
  priority: 'low' | 'normal' | 'high';
  isRead: boolean;
  isArchived: boolean;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  threadId?: string;
  campaignId?: string;
  templateId?: string;
}

interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url?: string;
  content?: Buffer;
}
```

### Email Template Type
```typescript
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  htmlContent?: string;
  variables: TemplateVariable[];
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
  description?: string;
}
```

### Email Campaign Type
```typescript
interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  templateId: string;
  recipients: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  scheduledAt?: Date;
  sentAt?: Date;
  analytics: CampaignAnalytics;
  createdAt: Date;
  updatedAt: Date;
}

interface CampaignAnalytics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}
```

## Testing Approach

### Unit Tests
```tsx
// Test email service operations
describe('emailService', () => {
  test('should send email successfully', async () => {
    const emailData = {
      to: ['test@example.com'],
      subject: 'Test Email',
      content: 'Test content'
    };
    
    const result = await emailService.send(emailData);
    expect(result.status).toBe('sent');
    expect(result.id).toBeDefined();
  });
  
  test('should handle email sending failure', async () => {
    const invalidEmailData = {
      to: ['invalid-email'],
      subject: 'Test',
      content: 'Test'
    };
    
    await expect(emailService.send(invalidEmailData))
      .rejects.toThrow('Invalid email address');
  });
});

// Test email hooks
describe('useEmails', () => {
  test('should load emails on mount', async () => {
    const { result } = renderHook(() => useEmails());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.emails).toHaveLength(0);
    });
  });
});
```

### Integration Tests
```tsx
// Test email composition flow
test('should compose and send email', async () => {
  render(<EmailComposer />);
  
  // Fill email form
  fireEvent.change(screen.getByLabelText('To'), { 
    target: { value: 'test@example.com' } 
  });
  fireEvent.change(screen.getByLabelText('Subject'), { 
    target: { value: 'Test Subject' } 
  });
  fireEvent.change(screen.getByLabelText('Content'), { 
    target: { value: 'Test content' } 
  });
  
  fireEvent.click(screen.getByText('Send'));
  
  await waitFor(() => {
    expect(screen.getByText('Email sent successfully')).toBeInTheDocument();
  });
});
```

### Test Utilities
```tsx
// Mock email data
export const mockEmail = {
  id: '1',
  from: 'sender@example.com',
  to: ['recipient@example.com'],
  subject: 'Test Email',
  content: 'Test content',
  status: 'sent',
  isRead: false,
  createdAt: new Date(),
  attachments: []
};

// Test helper for email operations
export const createTestEmail = (overrides = {}) => ({
  ...mockEmail,
  ...overrides,
  id: Math.random().toString(36).substr(2, 9)
});
```

## Performance Considerations

### Email Loading
- Use React Query for efficient email caching
- Implement pagination for large email lists
- Use virtual scrolling for performance with many emails

### Template Rendering
- Cache rendered templates to avoid re-processing
- Use web workers for complex template rendering
- Implement lazy loading for template previews

### Attachment Handling
- Stream large attachments to avoid memory issues
- Implement progressive upload for large files
- Use compression for attachment storage

## Configuration

### Database Schema
```sql
-- Emails table
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_address VARCHAR NOT NULL,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  subject VARCHAR NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  status VARCHAR DEFAULT 'draft',
  priority VARCHAR DEFAULT 'normal',
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  thread_id UUID,
  campaign_id UUID,
  template_id UUID
);

-- Email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  variables JSONB,
  category VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);
```

### Environment Variables
```env
# Email configuration
VITE_EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
VITE_EMAIL_FROM_ADDRESS=noreply@nexamanager.com
VITE_EMAIL_FROM_NAME=Nexa Manager
VITE_MAX_ATTACHMENT_SIZE=10485760
```

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SMTP configuration
   - Verify authentication credentials
   - Check firewall and port settings

2. **Templates not rendering**
   - Verify template syntax
   - Check variable substitution
   - Validate template data

3. **Attachments failing to upload**
   - Check file size limits
   - Verify file type restrictions
   - Check storage permissions

### Debug Tools
```tsx
// Enable email service debugging
import { emailService } from '@/features/email';

emailService.enableDebugMode();

// Email queue monitoring
import { emailQueueService } from '@/features/email';

const queueStatus = await emailQueueService.getQueueStatus();
console.log('Email queue status:', queueStatus);
```