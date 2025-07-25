# Document Sharing System

## Overview

The Document Sharing System provides comprehensive document sharing capabilities with secure access controls, permission management, and activity tracking. It's fully integrated with the Document Scanner system and Supabase backend.

## Features

### 🔐 Secure Sharing
- **Permission-based Access Control** - Granular permissions (view, download, edit)
- **Secure Token Generation** - Cryptographically secure 32-character share tokens
- **Expiration Management** - Optional expiration dates for shared links
- **Access Validation** - Real-time permission checking and validation

### 👥 Multi-User Support
- **Bulk Sharing** - Share with multiple recipients simultaneously
- **External Users** - Support for users outside the organization
- **Email Integration** - Automated notifications for sharing events
- **User Management** - Track and manage shared user access

### 📊 Activity Tracking
- **Access Logging** - Comprehensive tracking of document access
- **Usage Analytics** - Access counts, timestamps, and user activity
- **Audit Trails** - Complete history of sharing and access events
- **IP Tracking** - Optional IP address logging for security

### 🔗 Public Links
- **Secure Link Generation** - Public shareable links with token validation
- **Access Control** - Permission-based actions on public links
- **Expiration Support** - Time-limited public access
- **Usage Monitoring** - Track public link usage and access patterns

## Architecture

### Core Components

```
sharing/
├── services/
│   └── documentSharingService.ts    # Main sharing service
├── components/
│   ├── DocumentSharingDialog.tsx    # Share document dialog
│   ├── DocumentSharesManager.tsx    # Manage existing shares
│   ├── DocumentAccessHistory.tsx    # View access history
│   ├── SharedDocumentViewer.tsx     # View shared documents
│   └── DocumentNotificationSettings.tsx # Notification preferences
└── types/
    └── sharing.ts                   # TypeScript definitions
```

### Database Schema

#### document_shares Table
```sql
CREATE TABLE document_shares (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES scanned_documents(id),
  shared_by TEXT NOT NULL,
  shared_with_email TEXT NOT NULL,
  access_level TEXT NOT NULL CHECK (access_level IN ('view', 'download', 'edit')),
  share_token TEXT UNIQUE NOT NULL,
  public_link TEXT,
  message TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX idx_document_shares_shared_by ON document_shares(shared_by);
CREATE INDEX idx_document_shares_token ON document_shares(share_token);
CREATE INDEX idx_document_shares_email ON document_shares(shared_with_email);
```

#### document_access_log Table
```sql
CREATE TABLE document_access_log (
  id SERIAL PRIMARY KEY,
  share_id TEXT NOT NULL REFERENCES document_shares(id),
  user_id TEXT,
  ip_address INET,
  user_agent TEXT,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_document_access_log_share_id ON document_access_log(share_id);
CREATE INDEX idx_document_access_log_timestamp ON document_access_log(timestamp);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on both tables
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

-- Users can only see shares they created or were shared with
CREATE POLICY "Users can view their own shares" ON document_shares
  FOR SELECT USING (
    shared_by = auth.uid()::text OR 
    shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Users can only create shares for documents they own
CREATE POLICY "Users can create shares for their documents" ON document_shares
  FOR INSERT WITH CHECK (
    shared_by = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM scanned_documents 
      WHERE id = document_id AND created_by = auth.uid()::text
    )
  );

-- Users can only update/delete shares they created
CREATE POLICY "Users can manage their own shares" ON document_shares
  FOR UPDATE USING (shared_by = auth.uid()::text);

CREATE POLICY "Users can delete their own shares" ON document_shares
  FOR DELETE USING (shared_by = auth.uid()::text);

-- Access log policies
CREATE POLICY "Users can view access logs for their shares" ON document_access_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_shares 
      WHERE id = share_id AND shared_by = auth.uid()::text
    )
  );
```

## TypeScript Interfaces

### Core Types

```typescript
interface ShareDocumentRequest {
  documentId: string;
  sharedWith: {
    email: string;
    accessLevel: AccessLevel;
  }[];
  message?: string;
  expiresAt?: Date;
  allowPublicLink?: boolean;
}

interface ShareDocumentResponse {
  success: boolean;
  shareId?: string;
  publicLink?: string;
  error?: string;
}

interface DocumentShare {
  id: string;
  documentId: string;
  sharedBy: string;
  sharedWith: string;
  sharedWithEmail: string;
  accessLevel: AccessLevel;
  shareToken: string;
  publicLink?: string;
  message?: string;
  expiresAt?: Date;
  createdAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  isActive: boolean;
}

enum AccessLevel {
  View = 'view',
  Download = 'download',
  Edit = 'edit'
}

interface AccessTrackingData {
  shareId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: 'view' | 'download' | 'edit';
  timestamp: Date;
}
```

### Service Interface

```typescript
interface DocumentSharingService {
  // Core sharing operations
  shareDocument(request: ShareDocumentRequest, sharedBy: string): Promise<ShareDocumentResponse>;
  revokeDocumentShare(shareId: string, userId: string): Promise<{ success: boolean; error?: string }>;
  
  // Access operations
  accessSharedDocument(
    shareToken: string, 
    action: 'view' | 'download' | 'edit',
    accessData?: Partial<AccessTrackingData>
  ): Promise<{ success: boolean; document?: ProcessedDocument; error?: string }>;
  
  // Management operations
  getDocumentShares(documentId: string, userId: string): Promise<{
    success: boolean;
    shares?: DocumentShare[];
    error?: string;
  }>;
  
  getDocumentAccessHistory(documentId: string, userId: string): Promise<{
    success: boolean;
    accessHistory?: AccessLogEntry[];
    error?: string;
  }>;
}
```

## Usage Examples

### Basic Document Sharing

```typescript
import { documentSharingService } from '@/services/scanner/documentSharingService';
import { AccessLevel } from '@/types/scanner';

// Share document with multiple users
const shareDocument = async () => {
  const shareRequest = {
    documentId: 'doc-123',
    sharedWith: [
      { email: 'colleague@company.com', accessLevel: AccessLevel.Edit },
      { email: 'client@external.com', accessLevel: AccessLevel.View }
    ],
    message: 'Please review this contract and provide feedback',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    allowPublicLink: true
  };

  const result = await documentSharingService.shareDocument(shareRequest, currentUserId);
  
  if (result.success) {
    console.log('Document shared successfully');
    console.log('Share ID:', result.shareId);
    console.log('Public link:', result.publicLink);
    
    // Show success message to user
    showNotification('Document shared successfully', 'success');
  } else {
    console.error('Failed to share document:', result.error);
    showNotification(result.error || 'Failed to share document', 'error');
  }
};
```

### Accessing Shared Documents

```typescript
// Access document via share token (from URL parameter)
const accessSharedDocument = async (shareToken: string) => {
  const accessResult = await documentSharingService.accessSharedDocument(
    shareToken,
    'view',
    {
      userId: currentUserId,
      ipAddress: await getUserIP(),
      userAgent: navigator.userAgent
    }
  );

  if (accessResult.success && accessResult.document) {
    console.log('Document accessed:', accessResult.document.title);
    
    // Display document content
    setDocument(accessResult.document);
    setCanDownload(checkDownloadPermission(shareToken));
    setCanEdit(checkEditPermission(shareToken));
  } else {
    console.error('Access denied:', accessResult.error);
    showNotification(accessResult.error || 'Access denied', 'error');
  }
};

// Download shared document
const downloadSharedDocument = async (shareToken: string) => {
  const downloadResult = await documentSharingService.accessSharedDocument(
    shareToken,
    'download',
    { userId: currentUserId }
  );

  if (downloadResult.success && downloadResult.document) {
    // Trigger download
    const link = document.createElement('a');
    link.href = downloadResult.document.pdfFile?.url || downloadResult.document.originalFile.url;
    link.download = downloadResult.document.title;
    link.click();
  }
};
```

### Managing Document Shares

```typescript
// Get all shares for a document
const loadDocumentShares = async (documentId: string) => {
  const sharesResult = await documentSharingService.getDocumentShares(documentId, currentUserId);
  
  if (sharesResult.success && sharesResult.shares) {
    setShares(sharesResult.shares);
    
    // Display share information
    sharesResult.shares.forEach(share => {
      console.log(`Shared with: ${share.sharedWithEmail}`);
      console.log(`Access level: ${share.accessLevel}`);
      console.log(`Access count: ${share.accessCount}`);
      console.log(`Last accessed: ${share.lastAccessedAt}`);
    });
  }
};

// Revoke a share
const revokeShare = async (shareId: string) => {
  const confirmRevoke = await showConfirmDialog(
    'Revoke Share',
    'Are you sure you want to revoke this share? The user will no longer be able to access the document.'
  );
  
  if (confirmRevoke) {
    const revokeResult = await documentSharingService.revokeDocumentShare(shareId, currentUserId);
    
    if (revokeResult.success) {
      showNotification('Share revoked successfully', 'success');
      // Refresh shares list
      loadDocumentShares(documentId);
    } else {
      showNotification(revokeResult.error || 'Failed to revoke share', 'error');
    }
  }
};
```

### Access History and Analytics

```typescript
// Load and display access history
const loadAccessHistory = async (documentId: string) => {
  const historyResult = await documentSharingService.getDocumentAccessHistory(documentId, currentUserId);
  
  if (historyResult.success && historyResult.accessHistory) {
    setAccessHistory(historyResult.accessHistory);
    
    // Process access history for analytics
    const analytics = processAccessHistory(historyResult.accessHistory);
    setAccessAnalytics(analytics);
    
    // Display recent activity
    historyResult.accessHistory.slice(0, 10).forEach(entry => {
      console.log(`${entry.userId} performed ${entry.action} at ${entry.timestamp}`);
      if (entry.ipAddress) {
        console.log(`  IP: ${entry.ipAddress}`);
      }
    });
  }
};

// Process access history for analytics
const processAccessHistory = (history: AccessLogEntry[]) => {
  const totalAccesses = history.length;
  const uniqueUsers = new Set(history.map(entry => entry.userId)).size;
  const actionCounts = history.reduce((acc, entry) => {
    acc[entry.action] = (acc[entry.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const recentActivity = history
    .filter(entry => entry.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000))
    .length;
  
  return {
    totalAccesses,
    uniqueUsers,
    actionCounts,
    recentActivity
  };
};
```

## Security Features

### Token Security
- **Cryptographically Secure Tokens**: 32-character tokens using secure random generation
- **Unique Token Validation**: Collision prevention and uniqueness enforcement
- **Token Expiration**: Time-based token invalidation
- **Single-Use Options**: Optional single-use token support

### Permission Validation
- **Real-time Validation**: Permission checking on every access attempt
- **Action-based Permissions**: Different permissions for view, download, edit actions
- **Expiration Checking**: Automatic expiration date validation
- **User Context Validation**: User identity and organization validation

### Access Control
- **Row Level Security**: Database-level access control with RLS policies
- **User Data Isolation**: Complete separation of user data
- **Organization Boundaries**: Respect organization-based access controls
- **Audit Compliance**: Complete audit trails for compliance requirements

### Privacy Protection
- **IP Address Hashing**: Optional IP address hashing for privacy
- **User Agent Sanitization**: Clean user agent strings for storage
- **Data Retention**: Configurable data retention policies
- **GDPR Compliance**: Support for data deletion and export requests

## Email Notifications

### Notification Types

#### Share Notifications
```typescript
const shareNotification = {
  type: 'document_shared',
  title: 'Document Shared With You',
  message: `${sharerName} shared "${documentTitle}" with you`,
  subtitle: `Access level: ${accessLevel}`,
  actions: [
    { id: 'view_document', label: 'View Document', type: 'primary' },
    { id: 'decline_share', label: 'Decline', type: 'secondary' }
  ]
};
```

#### Revocation Notifications
```typescript
const revocationNotification = {
  type: 'document_share_revoked',
  title: 'Document Access Revoked',
  message: `Access to "${documentTitle}" has been revoked`,
  priority: 'low'
};
```

#### Access Alerts (Optional)
```typescript
const accessAlert = {
  type: 'document_accessed',
  title: 'Document Accessed',
  message: `${userName} accessed "${documentTitle}"`,
  priority: 'low'
};
```

### Email Templates

The system supports customizable email templates for different notification types:

- **Share Invitation Template**: Welcome message with document details and access instructions
- **Revocation Notice Template**: Professional notification of access removal
- **Access Summary Template**: Periodic summary of document access activity

## Error Handling

### Common Error Scenarios

#### Permission Errors
```typescript
// Document not found or access denied
{
  success: false,
  error: 'Document not found or access denied'
}

// Invalid access level for action
{
  success: false,
  error: 'Action not permitted with current access level'
}
```

#### Validation Errors
```typescript
// Invalid email address
{
  success: false,
  error: 'Invalid email address format'
}

// Expired share link
{
  success: false,
  error: 'Share link has expired'
}
```

#### System Errors
```typescript
// Database connection error
{
  success: false,
  error: 'Failed to create document shares'
}

// Email notification failure (non-critical)
// Logged but doesn't fail the sharing operation
```

### Error Recovery

- **Graceful Degradation**: Non-critical features (like email notifications) don't block core functionality
- **Retry Logic**: Automatic retry for transient failures
- **User Feedback**: Clear, actionable error messages for users
- **Logging**: Comprehensive error logging for debugging and monitoring

## Performance Optimization

### Database Optimization
- **Proper Indexing**: Indexes on frequently queried columns
- **Query Optimization**: Efficient queries with minimal data transfer
- **Connection Pooling**: Efficient database connection management
- **Batch Operations**: Bulk operations for multiple shares

### Caching Strategy
- **Share Token Caching**: Cache valid tokens to reduce database queries
- **Permission Caching**: Cache permission checks for active sessions
- **Document Metadata Caching**: Cache document information for shared documents
- **Access History Caching**: Cache recent access history for analytics

### Frontend Optimization
- **Lazy Loading**: Load sharing components only when needed
- **Debounced Validation**: Debounce email validation during input
- **Optimistic Updates**: Update UI immediately with rollback on failure
- **Progressive Enhancement**: Core functionality works without JavaScript

## Monitoring and Analytics

### Key Metrics
- **Share Creation Rate**: Number of shares created over time
- **Access Patterns**: Document access frequency and timing
- **User Engagement**: Active users and sharing behavior
- **Security Events**: Failed access attempts and suspicious activity

### Dashboards
- **Document Owner Dashboard**: Share management and access analytics
- **Admin Dashboard**: System-wide sharing statistics and security monitoring
- **User Dashboard**: Documents shared with the user and access history

### Alerts
- **Security Alerts**: Unusual access patterns or failed authentication attempts
- **Usage Alerts**: High-volume sharing or access activity
- **System Alerts**: Service health and performance issues

---

This comprehensive document sharing system provides secure, scalable, and user-friendly document collaboration capabilities integrated seamlessly with the Document Scanner system.