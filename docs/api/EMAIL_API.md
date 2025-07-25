# Email Management API Documentation

## Overview

The Email Management API provides comprehensive email functionality integrated with Nexa Manager's business operations. It supports multiple email accounts, advanced organization features, template management, and seamless integration with business processes.

## Base URL

```
Production: https://api.nexamanager.com/v1/email
Development: http://localhost:3001/api/v1/email
```

## Authentication

All API endpoints require authentication via JWT token:

```http
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting

- **Standard Operations**: 100 requests/minute
- **Email Sending**: 20 requests/minute
- **Bulk Operations**: 10 requests/minute
- **Synchronization**: 5 requests/minute

## Response Format

All responses follow the standard format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_VALIDATION_ERROR",
    "message": "Invalid email address format",
    "details": {
      "field": "recipient_email",
      "value": "invalid-email"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Email Management

### GET /emails

Retrieve emails with filtering and pagination.

**Query Parameters:**
- `folder_id` (string, optional): Filter by folder ID
- `account_id` (string, optional): Filter by email account
- `is_read` (boolean, optional): Filter by read status
- `is_starred` (boolean, optional): Filter by starred status
- `is_important` (boolean, optional): Filter by importance
- `has_attachments` (boolean, optional): Filter emails with attachments
- `sender` (string, optional): Filter by sender email
- `subject` (string, optional): Search in subject line
- `query` (string, optional): Full-text search query
- `date_from` (string, optional): Start date filter (ISO 8601)
- `date_to` (string, optional): End date filter (ISO 8601)
- `labels` (array, optional): Filter by labels
- `client_id` (string, optional): Filter by associated client
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `sort_by` (string, optional): Sort field (`received_at`, `sent_at`, `subject`, `sender_name`)
- `sort_order` (string, optional): Sort direction (`asc`, `desc`)

**Example Request:**
```http
GET /emails?folder_id=inbox&is_read=false&limit=10&sort_by=received_at&sort_order=desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "message_id": "CADiJQ7B8K9mJ4N5P6Q7R8S9T0U1V2W3X4Y5Z6@mail.gmail.com",
        "thread_id": "thread_abc123",
        "folder_id": "folder_inbox_123",
        "account_id": "account_456",
        "subject": "Invoice Payment Confirmation",
        "sender_name": "John Doe",
        "sender_email": "john@company.com",
        "recipients": {
          "to": [
            {
              "name": "Business Owner",
              "email": "owner@business.com"
            }
          ],
          "cc": [],
          "bcc": []
        },
        "content_text": "Thank you for your payment...",
        "content_html": "<p>Thank you for your payment...</p>",
        "attachments": [
          {
            "id": "attachment_789",
            "filename": "receipt.pdf",
            "content_type": "application/pdf",
            "size_bytes": 245760,
            "is_inline": false,
            "created_at": "2024-01-15T10:30:00Z"
          }
        ],
        "labels": ["business", "payment"],
        "is_read": false,
        "is_starred": true,
        "is_important": false,
        "is_draft": false,
        "received_at": "2024-01-15T10:30:00Z",
        "client_id": "client_123",
        "related_documents": [
          {
            "type": "invoice",
            "id": "invoice_456",
            "name": "Invoice #INV-2024-001"
          }
        ],
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 156,
      "totalPages": 16,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /emails/{id}

Retrieve a specific email by ID.

**Path Parameters:**
- `id` (string, required): Email ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "message_id": "CADiJQ7B8K9mJ4N5P6Q7R8S9T0U1V2W3X4Y5Z6@mail.gmail.com",
    "thread_id": "thread_abc123",
    "folder": {
      "id": "folder_inbox_123",
      "name": "Inbox",
      "type": "system"
    },
    "account": {
      "id": "account_456",
      "name": "Business Email",
      "email_address": "business@company.com"
    },
    "subject": "Invoice Payment Confirmation",
    "sender_name": "John Doe",
    "sender_email": "john@company.com",
    "recipients": {
      "to": [{"name": "Business Owner", "email": "owner@business.com"}],
      "cc": [],
      "bcc": []
    },
    "content_text": "Thank you for your payment...",
    "content_html": "<p>Thank you for your payment...</p>",
    "attachments": [...],
    "labels": ["business", "payment"],
    "is_read": false,
    "is_starred": true,
    "is_important": false,
    "is_draft": false,
    "received_at": "2024-01-15T10:30:00Z",
    "client": {
      "id": "client_123",
      "name": "ABC Company",
      "email": "contact@abc-company.com"
    },
    "related_documents": [...],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### POST /emails

Send a new email.

**Request Body:**
```json
{
  "account_id": "account_456",
  "to": [
    {
      "name": "Client Name",
      "email": "client@company.com"
    }
  ],
  "cc": [],
  "bcc": [],
  "subject": "Invoice #INV-2024-001",
  "content": {
    "text": "Please find attached your invoice...",
    "html": "<p>Please find attached your invoice...</p>"
  },
  "attachments": [
    {
      "filename": "invoice.pdf",
      "content_type": "application/pdf",
      "content": "base64_encoded_content"
    }
  ],
  "template_id": "template_123",
  "template_variables": {
    "client_name": "ABC Company",
    "invoice_number": "INV-2024-001",
    "amount": "€1,250.00"
  },
  "priority": "normal",
  "request_read_receipt": false,
  "scheduled_at": null,
  "client_id": "client_123",
  "related_documents": [
    {
      "type": "invoice",
      "id": "invoice_456"
    }
  ]
}
```

**Validation:**
- `account_id`: Required, valid email account ID
- `to`: Required, array of valid email addresses
- `subject`: Required, string, max 255 characters
- `content.text`: Required, string
- `priority`: Optional, enum [`low`, `normal`, `high`]
- `scheduled_at`: Optional, ISO 8601 datetime (future)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "message_id": "generated_message_id",
    "status": "sent",
    "sent_at": "2024-01-15T10:35:00Z"
  },
  "message": "Email sent successfully"
}
```

### PUT /emails/{id}

Update email properties (read status, labels, folder, etc.).

**Path Parameters:**
- `id` (string, required): Email ID

**Request Body:**
```json
{
  "is_read": true,
  "is_starred": false,
  "is_important": true,
  "folder_id": "folder_archive_123",
  "labels": ["processed", "important"],
  "client_id": "client_456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "is_read": true,
    "is_starred": false,
    "is_important": true,
    "folder_id": "folder_archive_123",
    "labels": ["processed", "important"],
    "updated_at": "2024-01-15T10:40:00Z"
  },
  "message": "Email updated successfully"
}
```

### DELETE /emails/{id}

Delete an email (move to trash or permanent deletion).

**Path Parameters:**
- `id` (string, required): Email ID

**Query Parameters:**
- `permanent` (boolean, optional): Permanent deletion (default: false)

**Response:**
```json
{
  "success": true,
  "message": "Email moved to trash"
}
```

### POST /emails/bulk

Perform bulk operations on multiple emails.

**Request Body:**
```json
{
  "email_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ],
  "action": "mark_read",
  "parameters": {
    "is_read": true
  }
}
```

**Available Actions:**
- `mark_read`: Mark emails as read/unread
- `star`: Star/unstar emails
- `move_folder`: Move to different folder
- `add_labels`: Add labels to emails
- `remove_labels`: Remove labels from emails
- `delete`: Delete emails

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 2,
    "failed": 0,
    "results": [
      {
        "email_id": "550e8400-e29b-41d4-a716-446655440000",
        "success": true
      },
      {
        "email_id": "550e8400-e29b-41d4-a716-446655440001",
        "success": true
      }
    ]
  },
  "message": "Bulk operation completed"
}
```

---

## Email Folders

### GET /folders

Retrieve email folders.

**Query Parameters:**
- `type` (string, optional): Filter by type (`system`, `custom`)
- `parent_id` (string, optional): Filter by parent folder

**Response:**
```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "id": "folder_inbox_123",
        "name": "Inbox",
        "type": "system",
        "icon": "inbox",
        "color": null,
        "parent_id": null,
        "unread_count": 15,
        "total_count": 156,
        "children": [],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      },
      {
        "id": "folder_custom_456",
        "name": "Clients",
        "type": "custom",
        "icon": "users",
        "color": "#3B82F6",
        "parent_id": null,
        "unread_count": 3,
        "total_count": 45,
        "children": [
          {
            "id": "folder_vip_789",
            "name": "VIP Clients",
            "type": "custom",
            "parent_id": "folder_custom_456",
            "unread_count": 1,
            "total_count": 12
          }
        ],
        "created_at": "2024-01-05T10:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### POST /folders

Create a new email folder.

**Request Body:**
```json
{
  "name": "Important Clients",
  "icon": "star",
  "color": "#F59E0B",
  "parent_id": "folder_custom_456"
}
```

**Validation:**
- `name`: Required, string, max 100 characters, unique within parent
- `icon`: Optional, string
- `color`: Optional, hex color code
- `parent_id`: Optional, valid folder ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "folder_new_789",
    "name": "Important Clients",
    "type": "custom",
    "icon": "star",
    "color": "#F59E0B",
    "parent_id": "folder_custom_456",
    "unread_count": 0,
    "total_count": 0,
    "created_at": "2024-01-15T10:45:00Z",
    "updated_at": "2024-01-15T10:45:00Z"
  },
  "message": "Folder created successfully"
}
```

### PUT /folders/{id}

Update an existing folder.

**Path Parameters:**
- `id` (string, required): Folder ID

**Request Body:**
```json
{
  "name": "VIP Clients Updated",
  "icon": "crown",
  "color": "#8B5CF6"
}
```

### DELETE /folders/{id}

Delete a folder and optionally move emails.

**Path Parameters:**
- `id` (string, required): Folder ID

**Query Parameters:**
- `move_to_folder_id` (string, optional): Move emails to this folder
- `delete_emails` (boolean, optional): Delete all emails in folder

**Response:**
```json
{
  "success": true,
  "data": {
    "emails_moved": 12,
    "emails_deleted": 0
  },
  "message": "Folder deleted successfully"
}
```

---

## Email Templates

### GET /templates

Retrieve email templates.

**Query Parameters:**
- `category` (string, optional): Filter by category
- `is_system` (boolean, optional): Filter system vs user templates

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_123",
        "name": "Invoice Email",
        "category": "billing",
        "subject": "Invoice {{invoice_number}} - {{client_name}}",
        "content_text": "Dear {{client_name}},\n\nPlease find attached invoice {{invoice_number}} for {{amount}}.\n\nBest regards",
        "content_html": "<p>Dear {{client_name}},</p><p>Please find attached invoice {{invoice_number}} for {{amount}}.</p><p>Best regards</p>",
        "variables": [
          {
            "name": "client_name",
            "label": "Client Name",
            "type": "text",
            "required": true,
            "description": "The name of the client"
          },
          {
            "name": "invoice_number",
            "label": "Invoice Number",
            "type": "text",
            "required": true,
            "description": "Invoice number"
          },
          {
            "name": "amount",
            "label": "Amount",
            "type": "text",
            "required": true,
            "description": "Invoice total amount"
          }
        ],
        "is_system": true,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### POST /templates

Create a new email template.

**Request Body:**
```json
{
  "name": "Follow-up Email",
  "category": "sales",
  "subject": "Following up on our conversation - {{client_name}}",
  "content_text": "Hi {{client_name}},\n\nI wanted to follow up on our conversation about {{topic}}.\n\nBest regards,\n{{sender_name}}",
  "content_html": "<p>Hi {{client_name}},</p><p>I wanted to follow up on our conversation about {{topic}}.</p><p>Best regards,<br>{{sender_name}}</p>",
  "variables": [
    {
      "name": "client_name",
      "label": "Client Name",
      "type": "text",
      "required": true,
      "description": "The name of the client"
    },
    {
      "name": "topic",
      "label": "Conversation Topic",
      "type": "text",
      "required": false,
      "description": "What was discussed"
    },
    {
      "name": "sender_name",
      "label": "Sender Name",
      "type": "text",
      "required": true,
      "description": "Name of the person sending"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template_456",
    "name": "Follow-up Email",
    "category": "sales",
    "subject": "Following up on our conversation - {{client_name}}",
    "content_text": "Hi {{client_name}}...",
    "content_html": "<p>Hi {{client_name}}...</p>",
    "variables": [...],
    "is_system": false,
    "created_at": "2024-01-15T10:50:00Z",
    "updated_at": "2024-01-15T10:50:00Z"
  },
  "message": "Template created successfully"
}
```

### POST /templates/{id}/apply

Apply a template with variable substitution.

**Path Parameters:**
- `id` (string, required): Template ID

**Request Body:**
```json
{
  "variables": {
    "client_name": "ABC Company",
    "invoice_number": "INV-2024-001",
    "amount": "€1,250.00"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subject": "Invoice INV-2024-001 - ABC Company",
    "content": {
      "text": "Dear ABC Company,\n\nPlease find attached invoice INV-2024-001 for €1,250.00.\n\nBest regards",
      "html": "<p>Dear ABC Company,</p><p>Please find attached invoice INV-2024-001 for €1,250.00.</p><p>Best regards</p>"
    }
  }
}
```

---

## Email Accounts

### GET /accounts

Retrieve configured email accounts.

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "account_123",
        "name": "Business Email",
        "email_address": "business@company.com",
        "provider": "gmail",
        "is_active": true,
        "sync_enabled": true,
        "last_sync": "2024-01-15T10:30:00Z",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### POST /accounts

Add a new email account.

**Request Body:**
```json
{
  "name": "Support Email",
  "email_address": "support@company.com",
  "provider": "custom",
  "imap_host": "mail.company.com",
  "imap_port": 993,
  "imap_secure": true,
  "smtp_host": "mail.company.com",
  "smtp_port": 587,
  "smtp_secure": true,
  "username": "support@company.com",
  "password": "secure_password",
  "sync_enabled": true
}
```

**Validation:**
- `name`: Required, string, max 100 characters
- `email_address`: Required, valid email format
- `imap_host`: Required, string
- `smtp_host`: Required, string
- `username`: Required, string
- `password`: Required, string (will be encrypted)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "account_456",
    "name": "Support Email",
    "email_address": "support@company.com",
    "provider": "custom",
    "is_active": true,
    "sync_enabled": true,
    "created_at": "2024-01-15T11:00:00Z"
  },
  "message": "Email account added successfully"
}
```

### POST /accounts/{id}/test

Test email account connection.

**Path Parameters:**
- `id` (string, required): Account ID

**Response:**
```json
{
  "success": true,
  "data": {
    "imap_connection": {
      "status": "success",
      "message": "Connected successfully"
    },
    "smtp_connection": {
      "status": "success",
      "message": "Connected successfully"
    }
  },
  "message": "Connection test completed"
}
```

### POST /accounts/{id}/sync

Manually trigger email synchronization.

**Path Parameters:**
- `id` (string, required): Account ID

**Response:**
```json
{
  "success": true,
  "data": {
    "sync_id": "sync_789",
    "status": "started",
    "estimated_time": 30
  },
  "message": "Synchronization started"
}
```

---

## Email Search

### GET /search

Advanced email search with full-text capabilities.

**Query Parameters:**
- `q` (string, required): Search query
- `folder_id` (string, optional): Limit search to folder
- `account_id` (string, optional): Limit search to account
- `sender` (string, optional): Filter by sender
- `recipient` (string, optional): Filter by recipient
- `subject` (string, optional): Search in subject
- `has_attachments` (boolean, optional): Filter emails with attachments
- `date_from` (string, optional): Start date filter
- `date_to` (string, optional): End date filter
- `labels` (array, optional): Filter by labels
- `client_id` (string, optional): Filter by client
- `page` (number, optional): Page number
- `limit` (number, optional): Results per page

**Example Request:**
```http
GET /search?q=invoice payment&has_attachments=true&date_from=2024-01-01&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "subject": "Invoice Payment Confirmation",
        "sender_name": "John Doe",
        "sender_email": "john@company.com",
        "received_at": "2024-01-15T10:30:00Z",
        "snippet": "Thank you for your payment of €1,250.00 for invoice INV-2024-001...",
        "highlights": [
          {
            "field": "subject",
            "text": "<mark>Invoice</mark> <mark>Payment</mark> Confirmation"
          },
          {
            "field": "content",
            "text": "Thank you for your <mark>payment</mark> of €1,250.00 for <mark>invoice</mark> INV-2024-001"
          }
        ],
        "folder": {
          "id": "folder_inbox_123",
          "name": "Inbox"
        },
        "labels": ["business", "payment"],
        "has_attachments": true,
        "is_read": false,
        "is_starred": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "facets": {
      "senders": [
        {
          "email": "john@company.com",
          "count": 12
        }
      ],
      "labels": [
        {
          "name": "business",
          "count": 25
        }
      ],
      "folders": [
        {
          "id": "folder_inbox_123",
          "name": "Inbox",
          "count": 30
        }
      ]
    }
  }
}
```

---

## Email Statistics

### GET /statistics

Retrieve email statistics and analytics.

**Query Parameters:**
- `period` (string, optional): Time period (`week`, `month`, `quarter`, `year`)
- `start_date` (string, optional): Custom start date
- `end_date` (string, optional): Custom end date
- `account_id` (string, optional): Filter by account

**Response:**
```json
{
  "success": true,
  "data": {
    "total_emails": 1250,
    "unread_count": 45,
    "sent_count": 320,
    "draft_count": 8,
    "starred_count": 67,
    "today_count": 12,
    "this_week_count": 89,
    "this_month_count": 456,
    "storage_used_mb": 2048.5,
    "top_senders": [
      {
        "email": "client@company.com",
        "name": "Important Client",
        "count": 45
      }
    ],
    "email_activity": [
      {
        "date": "2024-01-15",
        "sent": 8,
        "received": 15
      }
    ],
    "folder_distribution": [
      {
        "folder_id": "folder_inbox_123",
        "folder_name": "Inbox",
        "count": 156,
        "unread_count": 45
      }
    ],
    "label_usage": [
      {
        "label": "business",
        "count": 234
      }
    ]
  }
}
```

---

## Business Integration

### POST /emails/send-invoice

Send an invoice email using business integration.

**Request Body:**
```json
{
  "invoice_id": "invoice_123",
  "recipient_email": "client@company.com",
  "template_id": "template_invoice_456",
  "custom_message": "Thank you for your business!",
  "include_pdf": true,
  "send_copy_to_self": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "email_id": "550e8400-e29b-41d4-a716-446655440002",
    "invoice": {
      "id": "invoice_123",
      "number": "INV-2024-001",
      "amount": "€1,250.00"
    },
    "sent_at": "2024-01-15T11:15:00Z"
  },
  "message": "Invoice email sent successfully"
}
```

### POST /emails/send-quote

Send a quote email using business integration.

**Request Body:**
```json
{
  "quote_id": "quote_456",
  "recipient_email": "prospect@company.com",
  "template_id": "template_quote_789",
  "custom_message": "We look forward to working with you!",
  "include_pdf": true,
  "follow_up_days": 7
}
```

### GET /emails/client/{client_id}

Retrieve email history for a specific client.

**Path Parameters:**
- `client_id` (string, required): Client ID

**Query Parameters:**
- `limit` (number, optional): Number of emails to return
- `include_sent` (boolean, optional): Include sent emails
- `include_received` (boolean, optional): Include received emails

**Response:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": "client_123",
      "name": "ABC Company",
      "email": "contact@abc-company.com"
    },
    "emails": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "subject": "Invoice Payment Confirmation",
        "direction": "received",
        "received_at": "2024-01-15T10:30:00Z",
        "related_documents": [
          {
            "type": "invoice",
            "id": "invoice_456",
            "name": "Invoice #INV-2024-001"
          }
        ]
      }
    ],
    "statistics": {
      "total_emails": 25,
      "sent_count": 12,
      "received_count": 13,
      "last_contact": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://api.nexamanager.com/v1/email/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your_jwt_token'
}));
```

### Real-time Events

**New Email Notification:**
```json
{
  "type": "new_email",
  "data": {
    "email_id": "550e8400-e29b-41d4-a716-446655440003",
    "folder_id": "folder_inbox_123",
    "subject": "New Message",
    "sender_name": "John Doe",
    "sender_email": "john@company.com",
    "received_at": "2024-01-15T11:30:00Z",
    "is_important": false
  }
}
```

**Email Status Update:**
```json
{
  "type": "email_updated",
  "data": {
    "email_id": "550e8400-e29b-41d4-a716-446655440000",
    "changes": {
      "is_read": true,
      "updated_at": "2024-01-15T11:35:00Z"
    }
  }
}
```

**Sync Progress:**
```json
{
  "type": "sync_progress",
  "data": {
    "account_id": "account_123",
    "progress": 65,
    "stage": "fetching_emails",
    "processed": 650,
    "total": 1000
  }
}
```

---

## Error Codes

### Email-Specific Errors

| Code | Description |
|------|-------------|
| EMAIL_NOT_FOUND | Email not found |
| INVALID_EMAIL_FORMAT | Invalid email address format |
| ACCOUNT_NOT_CONFIGURED | Email account not configured |
| SMTP_CONNECTION_FAILED | SMTP connection failed |
| IMAP_CONNECTION_FAILED | IMAP connection failed |
| TEMPLATE_NOT_FOUND | Email template not found |
| TEMPLATE_VARIABLE_MISSING | Required template variable missing |
| ATTACHMENT_TOO_LARGE | Attachment exceeds size limit |
| FOLDER_NOT_FOUND | Email folder not found |
| SYNC_IN_PROGRESS | Synchronization already in progress |
| QUOTA_EXCEEDED | Email storage quota exceeded |
| SEND_LIMIT_EXCEEDED | Email sending limit exceeded |

---

## Usage Examples

### JavaScript/React

```javascript
// Send email with template
async function sendTemplatedEmail(templateId, variables, recipients) {
  const response = await fetch('/api/v1/email/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      account_id: 'account_123',
      to: recipients,
      template_id: templateId,
      template_variables: variables
    })
  });
  
  return response.json();
}

// Real-time email updates
const ws = new WebSocket('ws://api.nexamanager.com/v1/email/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'new_email':
      // Update UI with new email
      updateEmailList(message.data);
      showNotification(`New email from ${message.data.sender_name}`);
      break;
    case 'email_updated':
      // Update email status in UI
      updateEmailStatus(message.data.email_id, message.data.changes);
      break;
  }
};
```

### cURL Examples

```bash
# Send email
curl -X POST "https://api.nexamanager.com/v1/email/emails" \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "account_123",
    "to": [{"email": "client@company.com", "name": "Client Name"}],
    "subject": "Test Email",
    "content": {"text": "Hello, this is a test email."}
  }'

# Search emails
curl -X GET "https://api.nexamanager.com/v1/email/search?q=invoice&limit=10" \
  -H "Authorization: Bearer your_token"

# Get email statistics
curl -X GET "https://api.nexamanager.com/v1/email/statistics?period=month" \
  -H "Authorization: Bearer your_token"
```

---

For complete implementation details, see the [Email System Documentation](EMAIL_SYSTEM.md) and [TypeScript Types Documentation](TYPESCRIPT_TYPES.md).