// Document sharing service implementation
import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';
import emailNotificationService from '@/lib/emailNotificationService';
import type { 
  ProcessedDocument, 
  AccessLogEntry,
  SharingSettings 
} from '@/types/scanner';
import { AccessLevel } from '@/types/scanner';

export interface ShareDocumentRequest {
  documentId: string;
  sharedWith: {
    email: string;
    accessLevel: AccessLevel;
  }[];
  message?: string;
  expiresAt?: Date;
  allowPublicLink?: boolean;
}

export interface ShareDocumentResponse {
  success: boolean;
  shareId?: string;
  publicLink?: string;
  error?: string;
}

export interface DocumentShare {
  id: string;
  documentId: string;
  sharedBy: string;
  sharedWith: string;
  accessLevel: AccessLevel;
  shareToken: string;
  publicLink?: string;
  message?: string;
  expiresAt?: Date;
  createdAt: Date;
  lastAccessedAt?: Date;
  accessCount?: number;
  isActive: boolean;
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canEdit: boolean;
    canShare: boolean;
    canDelete: boolean;
  };
}

export interface AccessTrackingData {
  shareId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: 'view' | 'download' | 'edit';
  timestamp: Date;
}

export class DocumentSharingService {
  private readonly SHARES_TABLE = 'document_shares';
  private readonly ACCESS_LOG_TABLE = 'document_access_log';

  /**
   * Share a document with specified users
   */
  async shareDocument(request: ShareDocumentRequest, sharedBy: string): Promise<ShareDocumentResponse> {
    try {
      // Validate document exists and user has permission
      const document = await this.getDocumentWithPermissionCheck(request.documentId, sharedBy);
      if (!document) {
        return { success: false, error: 'Document not found or access denied' };
      }

      // Generate share records for each recipient
      const shareRecords = [];
      let publicLink: string | undefined;

      for (const recipient of request.sharedWith) {
        const shareToken = this.generateShareToken();
        const shareId = this.generateShareId();

        const shareRecord = {
          id: shareId,
          document_id: request.documentId,
          shared_by: sharedBy,
          shared_with_email: recipient.email,
          access_level: recipient.accessLevel,
          share_token: shareToken,
          message: request.message || null,
          expires_at: request.expiresAt?.toISOString() || null,
          created_at: new Date().toISOString(),
          access_count: 0,
          is_active: true
        };

        shareRecords.push(shareRecord);

        // Generate public link if requested (only for first recipient for simplicity)
        if (request.allowPublicLink && !publicLink) {
          publicLink = this.generatePublicLink(shareToken);
          (shareRecord as any).public_link = publicLink;
        }
      }

      // Insert share records
      const { data: shares, error: shareError } = await supabase
        .from(this.SHARES_TABLE)
        .insert(shareRecords)
        .select();

      if (shareError) {
        Logger.error('Failed to create document shares:', shareError);
        return { success: false, error: 'Failed to create document shares' };
      }

      // Update document sharing settings
      await this.updateDocumentSharingSettings(request.documentId, {
        isShared: true,
        accessLevel: this.getHighestAccessLevel(request.sharedWith.map(r => r.accessLevel)),
        sharedWith: request.sharedWith.map(recipient => ({
          userId: '', // Will be populated when user accepts
          email: recipient.email,
          accessLevel: recipient.accessLevel,
          sharedAt: new Date()
        })),
        publicLink,
        expiresAt: request.expiresAt
      });

      // Send email notifications
      await this.sendSharingNotifications(document, request, sharedBy);

      // Log sharing activity
      await this.logDocumentAccess(request.documentId, sharedBy, 'share', {
        sharedWith: request.sharedWith.map(r => r.email),
        accessLevels: request.sharedWith.map(r => r.accessLevel)
      });

      return {
        success: true,
        shareId: shares[0]?.id,
        publicLink
      };
    } catch (error) {
      Logger.error('Failed to share document:', error);
      return { success: false, error: 'Failed to share document' };
    }
  }

  /**
   * Get document with permission check
   */
  private async getDocumentWithPermissionCheck(documentId: string, userId: string): Promise<ProcessedDocument | null> {
    try {
      const { data, error } = await supabase
        .from('scanned_documents')
        .select('*')
        .eq('id', documentId)
        .eq('created_by', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapDatabaseRecordToDocument(data);
    } catch (error) {
      Logger.error('Failed to get document with permission check:', error);
      return null;
    }
  }

  /**
   * Update document sharing settings
   */
  private async updateDocumentSharingSettings(documentId: string, sharingSettings: SharingSettings): Promise<void> {
    try {
      const { error } = await supabase
        .from('scanned_documents')
        .update({
          sharing_settings: sharingSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        Logger.error('Failed to update document sharing settings:', error);
        throw error;
      }
    } catch (error) {
      Logger.error('Failed to update document sharing settings:', error);
      throw error;
    }
  }

  /**
   * Send sharing notifications via email
   */
  private async sendSharingNotifications(
    document: ProcessedDocument, 
    request: ShareDocumentRequest, 
    sharedBy: string
  ): Promise<void> {
    try {
      // Get sharer information
      const { data: sharerData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', sharedBy)
        .single();

      const sharerName = sharerData?.full_name || sharerData?.email || 'Someone';

      for (const recipient of request.sharedWith) {
        const notification = {
          id: `document_shared_${document.id}_${Date.now()}`,
          type: 'document_shared',
          title: 'Document Shared With You',
          message: `${sharerName} shared "${document.title}" with you`,
          subtitle: `Access level: ${recipient.accessLevel}`,
          userId: recipient.email, // Using email as identifier for external users
          priority: 'medium' as const,
          timestamp: new Date(),
          read: false,
          actions: [
            {
              id: 'view_document',
              label: 'View Document',
              type: 'primary' as const,
            },
            {
              id: 'decline_share',
              label: 'Decline',
              type: 'secondary' as const,
            },
          ],
          data: {
            documentId: document.id,
            documentTitle: document.title,
            sharedBy: sharerName,
            accessLevel: recipient.accessLevel,
            message: request.message,
            expiresAt: request.expiresAt?.toISOString(),
          },
        };

        // Queue notification for processing
        await emailNotificationService.queueNotification(notification);
      }
    } catch (error) {
      Logger.error('Failed to send sharing notifications:', error);
      // Don't throw error as this is not critical for sharing functionality
    }
  }

  /**
   * Revoke document share
   */
  async revokeDocumentShare(shareId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify user has permission to revoke
      const { data: share, error: shareError } = await supabase
        .from(this.SHARES_TABLE)
        .select('*')
        .eq('id', shareId)
        .eq('shared_by', userId)
        .single();

      if (shareError || !share) {
        return { success: false, error: 'Share not found or access denied' };
      }

      // Deactivate share
      const { error: updateError } = await supabase
        .from(this.SHARES_TABLE)
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', shareId);

      if (updateError) {
        Logger.error('Failed to revoke document share:', updateError);
        return { success: false, error: 'Failed to revoke share' };
      }

      // Update document sharing settings if no active shares remain
      await this.updateDocumentSharingSettingsAfterRevoke(share.document_id);

      // Log revocation
      await this.logDocumentAccess(share.document_id, userId, 'revoke_share', {
        shareId,
        revokedUser: share.shared_with_email
      });

      // Send notification to revoked user
      await this.sendRevocationNotification(share);

      return { success: true };
    } catch (error) {
      Logger.error('Failed to revoke document share:', error);
      return { success: false, error: 'Failed to revoke share' };
    }
  }

  /**
   * Update document sharing settings after revocation
   */
  private async updateDocumentSharingSettingsAfterRevoke(documentId: string): Promise<void> {
    try {
      // Check if any active shares remain
      const { data: activeShares, error } = await supabase
        .from(this.SHARES_TABLE)
        .select('shared_with_email, access_level')
        .eq('document_id', documentId)
        .eq('is_active', true);

      if (error) {
        Logger.error('Failed to check active shares:', error);
        return;
      }

      const sharingSettings: SharingSettings = {
        isShared: activeShares.length > 0,
        accessLevel: activeShares.length > 0 
          ? this.getHighestAccessLevel(activeShares.map(s => s.access_level as AccessLevel))
          : AccessLevel.View,
        sharedWith: activeShares.map(share => ({
          userId: '',
          email: share.shared_with_email,
          accessLevel: share.access_level as AccessLevel,
          sharedAt: new Date()
        }))
      };

      await this.updateDocumentSharingSettings(documentId, sharingSettings);
    } catch (error) {
      Logger.error('Failed to update sharing settings after revoke:', error);
    }
  }

  /**
   * Send revocation notification
   */
  private async sendRevocationNotification(share: any): Promise<void> {
    try {
      const notification = {
        id: `document_share_revoked_${share.id}_${Date.now()}`,
        type: 'document_share_revoked',
        title: 'Document Access Revoked',
        message: `Access to "${share.document_title || 'document'}" has been revoked`,
        userId: share.shared_with_email,
        priority: 'low' as const,
        timestamp: new Date(),
        read: false,
        data: {
          documentId: share.document_id,
          shareId: share.id,
        },
      };

      await emailNotificationService.queueNotification(notification);
    } catch (error) {
      Logger.error('Failed to send revocation notification:', error);
    }
  }

  /**
   * Access shared document
   */
  async accessSharedDocument(
    shareToken: string, 
    action: 'view' | 'download' | 'edit',
    accessData?: Partial<AccessTrackingData>
  ): Promise<{ success: boolean; document?: ProcessedDocument; error?: string }> {
    try {
      // Find active share by token
      const { data: share, error: shareError } = await supabase
        .from(this.SHARES_TABLE)
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single();

      if (shareError || !share) {
        return { success: false, error: 'Invalid or expired share link' };
      }

      // Check if share has expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return { success: false, error: 'Share link has expired' };
      }

      // Check if action is allowed based on access level
      if (!this.isActionAllowed(action, share.access_level as AccessLevel)) {
        return { success: false, error: 'Action not permitted with current access level' };
      }

      // Get document
      const { data: documentData, error: docError } = await supabase
        .from('scanned_documents')
        .select('*')
        .eq('id', share.document_id)
        .single();

      if (docError || !documentData) {
        return { success: false, error: 'Document not found' };
      }

      const document = this.mapDatabaseRecordToDocument(documentData);

      // Track access
      await this.trackDocumentAccess(share.id, action, accessData);

      // Update share access count and last accessed time
      await supabase
        .from(this.SHARES_TABLE)
        .update({
          access_count: share.access_count + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', share.id);

      return { success: true, document };
    } catch (error) {
      Logger.error('Failed to access shared document:', error);
      return { success: false, error: 'Failed to access document' };
    }
  }

  /**
   * Check if action is allowed based on access level
   */
  private isActionAllowed(action: string, accessLevel: AccessLevel): boolean {
    switch (accessLevel) {
      case AccessLevel.View:
        return action === 'view';
      case AccessLevel.Download:
        return action === 'view' || action === 'download';
      case AccessLevel.Edit:
        return true; // All actions allowed
      default:
        return false;
    }
  }

  /**
   * Track document access for analytics
   */
  private async trackDocumentAccess(
    shareId: string, 
    action: string, 
    accessData?: Partial<AccessTrackingData>
  ): Promise<void> {
    try {
      const accessRecord = {
        share_id: shareId,
        user_id: accessData?.userId || null,
        ip_address: accessData?.ipAddress || null,
        user_agent: accessData?.userAgent || null,
        action,
        timestamp: new Date().toISOString(),
        ...accessData
      };

      const { error } = await supabase
        .from(this.ACCESS_LOG_TABLE)
        .insert([accessRecord]);

      if (error) {
        Logger.error('Failed to track document access:', error);
      }
    } catch (error) {
      Logger.error('Failed to track document access:', error);
    }
  }

  /**
   * Get document shares for a document
   */
  async getDocumentShares(documentId: string, userId: string): Promise<{
    success: boolean;
    shares?: DocumentShare[];
    error?: string;
  }> {
    try {
      // Verify user owns the document
      const document = await this.getDocumentWithPermissionCheck(documentId, userId);
      if (!document) {
        return { success: false, error: 'Document not found or access denied' };
      }

      const { data: shares, error } = await supabase
        .from(this.SHARES_TABLE)
        .select('*')
        .eq('document_id', documentId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        Logger.error('Failed to get document shares:', error);
        return { success: false, error: 'Failed to retrieve shares' };
      }

      const mappedShares: DocumentShare[] = shares.map(share => ({
        id: share.id,
        documentId: share.document_id,
        sharedBy: share.shared_by,
        sharedWith: share.shared_with_email || share.shared_with || '',
        accessLevel: share.access_level as AccessLevel,
        shareToken: share.share_token,
        publicLink: share.public_link,
        message: share.message,
        expiresAt: share.expires_at ? new Date(share.expires_at) : undefined,
        createdAt: new Date(share.created_at),
        lastAccessedAt: share.last_accessed_at ? new Date(share.last_accessed_at) : undefined,
        accessCount: share.access_count,
        isActive: share.is_active,
        permissions: {
          canView: true,
          canDownload: share.access_level === AccessLevel.Download || share.access_level === AccessLevel.Edit,
          canEdit: share.access_level === AccessLevel.Edit,
          canShare: false,
          canDelete: false
        }
      }));

      return { success: true, shares: mappedShares };
    } catch (error) {
      Logger.error('Failed to get document shares:', error);
      return { success: false, error: 'Failed to retrieve shares' };
    }
  }

  /**
   * Get access history for a document
   */
  async getDocumentAccessHistory(documentId: string, userId: string): Promise<{
    success: boolean;
    accessHistory?: AccessLogEntry[];
    error?: string;
  }> {
    try {
      // Verify user owns the document
      const document = await this.getDocumentWithPermissionCheck(documentId, userId);
      if (!document) {
        return { success: false, error: 'Document not found or access denied' };
      }

      // Get access history through shares
      const { data: accessLogs, error } = await supabase
        .from(this.ACCESS_LOG_TABLE)
        .select(`
          *,
          document_shares!inner(document_id)
        `)
        .eq('document_shares.document_id', documentId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        Logger.error('Failed to get document access history:', error);
        return { success: false, error: 'Failed to retrieve access history' };
      }

      const accessHistory: AccessLogEntry[] = accessLogs.map(log => ({
        userId: log.user_id || 'anonymous',
        action: log.action,
        timestamp: new Date(log.timestamp),
        ipAddress: log.ip_address
      }));

      return { success: true, accessHistory };
    } catch (error) {
      Logger.error('Failed to get document access history:', error);
      return { success: false, error: 'Failed to retrieve access history' };
    }
  }

  /**
   * Generate secure share token
   */
  private generateShareToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate share ID
   */
  private generateShareId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate public link from share token
   */
  private generatePublicLink(shareToken: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${shareToken}`;
  }

  /**
   * Get highest access level from array
   */
  private getHighestAccessLevel(levels: AccessLevel[]): AccessLevel {
    if (levels.includes(AccessLevel.Edit)) return AccessLevel.Edit;
    if (levels.includes(AccessLevel.Download)) return AccessLevel.Download;
    return AccessLevel.View;
  }

  /**
   * Log document access to document's access log
   */
  private async logDocumentAccess(
    documentId: string, 
    userId: string, 
    action: string, 
    metadata?: any
  ): Promise<void> {
    try {
      // Get current document to append to access log
      const { data: document, error } = await supabase
        .from('scanned_documents')
        .select('access_log')
        .eq('id', documentId)
        .single();

      if (error) {
        Logger.error('Failed to get document for access logging:', error);
        return;
      }

      const accessEntry: AccessLogEntry = {
        userId,
        action,
        timestamp: new Date(),
        ipAddress: metadata?.ipAddress
      };

      const updatedAccessLog = [...(document.access_log || []), accessEntry];

      await supabase
        .from('scanned_documents')
        .update({
          access_log: updatedAccessLog,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);
    } catch (error) {
      Logger.error('Failed to log document access:', error);
    }
  }

  /**
   * Map database record to ProcessedDocument
   */
  private mapDatabaseRecordToDocument(record: any): ProcessedDocument {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      tags: record.tags || [],
      clientId: record.client_id,
      projectId: record.project_id,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      createdBy: record.created_by,
      originalFile: {
        url: record.original_file_url,
        name: record.original_file_name,
        size: record.original_file_size,
        type: record.original_file_type
      },
      enhancedFile: {
        url: record.enhanced_file_url,
        size: record.enhanced_file_size
      },
      pdfFile: record.pdf_file_url ? {
        url: record.pdf_file_url,
        size: record.pdf_file_size
      } : undefined,
      textContent: record.text_content,
      ocrConfidence: record.ocr_confidence,
      ocrLanguage: record.ocr_language,
      status: record.status,
      processingErrors: record.processing_errors,
      sharingSettings: record.sharing_settings || {
        isShared: false,
        accessLevel: AccessLevel.View,
        sharedWith: []
      },
      accessLog: record.access_log || []
    };
  }
}

// Export singleton instance
export const documentSharingService = new DocumentSharingService();