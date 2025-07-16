# Design Document

## Overview

This design document outlines the implementation of two new modal components for the Documents page: RequestDocumentModal and ArchiveDocumentsModal. These modals will provide functionality for requesting documents from external parties and archiving existing documents. The design follows the existing modal patterns established in the codebase and maintains consistency with the current UI/UX standards.

## Architecture

### Component Structure
```
src/components/documents/
├── RequestDocumentModal.jsx
├── ArchiveDocumentsModal.jsx
└── (existing modals...)
```

### Integration Points
- Documents.jsx page will import and use both new modals
- Modal state management will follow the existing pattern using useState hooks
- Translation keys will be added to the documents.json translation files
- Form validation will use the existing validation patterns

## Components and Interfaces

### RequestDocumentModal Component

**Props Interface:**
```javascript
{
  isOpen: boolean,
  onClose: function,
  onSubmitRequest: function,
  currentPath?: string
}
```

**State Management:**
- Form data (recipient email, document type, description, due date)
- Loading state for form submission
- Error state for validation and submission errors
- Form validation state

**Key Features:**
- Email input with validation
- Document type selection dropdown
- Description textarea
- Due date picker
- Priority level selection
- Form validation with real-time feedback
- Loading states during submission

### ArchiveDocumentsModal Component

**Props Interface:**
```javascript
{
  isOpen: boolean,
  onClose: function,
  onArchiveDocuments: function,
  availableDocuments: array,
  preSelectedDocuments?: array
}
```

**State Management:**
- Selected documents list
- Confirmation state
- Loading state for archive operation
- Error state for operation failures

**Key Features:**
- Document selection interface with checkboxes
- Search/filter functionality for document selection
- Bulk selection controls (select all, clear all)
- Confirmation step with selected documents preview
- Archive reason/notes (optional)
- Progress indicator during archive operation

## Data Models

### RequestDocumentData
```javascript
{
  recipientEmail: string,
  recipientName?: string,
  documentType: string,
  description: string,
  dueDate: Date,
  priority: 'low' | 'medium' | 'high',
  requestedBy: string,
  requestedAt: Date,
  status: 'pending' | 'fulfilled' | 'expired',
  notes?: string
}
```

### ArchiveDocumentData
```javascript
{
  documentIds: array<string>,
  archivedAt: Date,
  archivedBy: string,
  reason?: string,
  notes?: string,
  originalStatus: string,
  canRestore: boolean
}
```

## Error Handling

### RequestDocumentModal Error Scenarios
- Invalid email format validation
- Required field validation
- Network errors during submission
- Server-side validation errors
- Due date validation (cannot be in the past)

### ArchiveDocumentsModal Error Scenarios
- No documents selected validation
- Documents already archived
- Insufficient permissions
- Network errors during archive operation
- Bulk operation partial failures

### Error Display Strategy
- Inline validation errors for form fields
- Toast notifications for operation success/failure
- Modal-level error messages for critical failures
- Detailed error messages with actionable guidance

## Testing Strategy

### Unit Tests
- Component rendering with different prop combinations
- Form validation logic
- State management and user interactions
- Error handling scenarios
- Translation key usage

### Integration Tests
- Modal opening/closing behavior
- Form submission flow
- Document selection and archive flow
- API integration points
- Error recovery scenarios

### Accessibility Tests
- Keyboard navigation
- Screen reader compatibility
- Focus management
- ARIA labels and descriptions
- Color contrast compliance

## Translation Keys Structure

### RequestDocumentModal Keys
```json
{
  "modals": {
    "requestDocument": {
      "title": "Request Document",
      "description": "Request documents from clients or team members",
      "recipientEmail": "Recipient Email",
      "recipientName": "Recipient Name (Optional)",
      "documentType": "Document Type",
      "description": "Description",
      "dueDate": "Due Date",
      "priority": "Priority",
      "priorities": {
        "low": "Low",
        "medium": "Medium", 
        "high": "High"
      },
      "documentTypes": {
        "contract": "Contract",
        "invoice": "Invoice",
        "receipt": "Receipt",
        "report": "Report",
        "other": "Other"
      },
      "placeholders": {
        "email": "Enter recipient email",
        "name": "Enter recipient name",
        "description": "Describe what document you need"
      },
      "validation": {
        "emailRequired": "Email is required",
        "emailInvalid": "Please enter a valid email",
        "descriptionRequired": "Description is required",
        "dueDateRequired": "Due date is required",
        "dueDatePast": "Due date cannot be in the past"
      },
      "submit": "Send Request",
      "submitting": "Sending...",
      "cancel": "Cancel"
    }
  }
}
```

### ArchiveDocumentsModal Keys
```json
{
  "modals": {
    "archive": {
      "title": "Archive Documents",
      "description": "Archive documents you no longer need",
      "selectDocuments": "Select Documents to Archive",
      "selectedCount": "{{count}} documents selected",
      "searchPlaceholder": "Search documents...",
      "selectAll": "Select All",
      "clearAll": "Clear All",
      "confirmTitle": "Confirm Archive",
      "confirmMessage": "Are you sure you want to archive {{count}} documents?",
      "reason": "Archive Reason (Optional)",
      "reasonPlaceholder": "Why are you archiving these documents?",
      "validation": {
        "noDocuments": "Please select at least one document",
        "alreadyArchived": "Some documents are already archived"
      },
      "archive": "Archive Documents",
      "archiving": "Archiving...",
      "cancel": "Cancel",
      "back": "Back"
    }
  }
}
```

## UI/UX Design Specifications

### Modal Layout
- Consistent with existing modal design patterns
- Responsive design for mobile and desktop
- Maximum width of 600px for RequestDocumentModal
- Maximum width of 800px for ArchiveDocumentsModal
- Proper spacing and typography following existing design system

### Visual Hierarchy
- Clear modal headers with icons
- Logical form field grouping
- Prominent primary action buttons
- Secondary actions clearly distinguished
- Progress indicators for multi-step processes

### Interaction Design
- Smooth modal transitions
- Form field focus management
- Real-time validation feedback
- Loading states with appropriate spinners
- Success/error state visual feedback

### Color Scheme
- Primary blue (#3B82F6) for main actions
- Red (#EF4444) for destructive actions and errors
- Green (#10B981) for success states
- Gray scale for secondary elements
- Consistent with existing design tokens