import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';
import emailNotificationService from '@/features/email/services/emailNotificationService';
import { 
  DocumentShare, 
  AccessLevel, 
  SharePermissions,
  AccessEvent,
  AccessStatistics 
} from '@/types/scanner';

/**
 * Document Sharing Service
 * Handles document sharing, access control, and tracking
 */
export class DocumentSharingService {
  constructor() {
    // emailNotificationService is already an instance, no need to instantiate
  }

  /**
   * Share a document with a user
   */
  async shareDocument(
    documentId: string,
    sharedBy: string,
    sharedWithEmail: string,
    accessLevel: AccessLevel,
    message?: string,
    expiresAt?: Date
  ): Promise<{ success: boolean; share?: DocumentShare; error?: string }> {
    try {
      Logger.info('Sharing document:', { documentId, sharedBy, sharedWithEmail, accessLevel });

      // Generate share token
      const shareToken = this.generateShareToken();
      
      // Create share record
      const shareData = {
        document_id: documentId,
        shared_by: sharedBy,
        shared_with_email: sharedWithEmail,
        access_level: accessLevel,
        share_token: shareToken,
        message: message || null,
        expires_at: expiresAt?.toISOString() || null,
        created_at: new Date().toISOString(),
        access_count: 0,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('document_shares')
        .insert(shareData)
        .select()
        .single();

      if (error) {
        Logger.error('Error creating document share:', error);
        return { success: false, error: error.message };
      }

      // Convert to DocumentShare interface
      const documentShare: DocumentShare = {
        id: data.id,
        documentId: data.document_id,
        sharedBy: data.shared_by,
        sharedWith: data.shared_with_email,
        accessLevel: data.access_level as AccessLevel,
        createdAt: new Date(data.created_at),
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        isActive: data.is_active,
        shareToken: data.share_token,
        permissions: this.getPermissionsForAccessLevel(data.access_level as AccessLevel),
        message: data.message || undefined,
        accessCount: data.access_count,
      };

      // Send notification email
      await this.sendShareNotification(documentShare);

      Logger.info('Document shared successfully:', documentShare.id);
      return { success: true, share: documentShare };
    } catch (error) {
      Logger.error('Error sharing document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get shares for a document
   */
  async getDocumentShares(documentId: string): Promise<{ success: boolean; shares?: DocumentShare[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('document_shares')
        .select('*')
        .eq('document_id', documentId)
        .eq('is_active', true);

      if (error) {
        Logger.error('Error fetching document shares:', error);
        return { success: false, error: error.message };
      }

      const shares: DocumentShare[] = data.map(share => ({
        id: share.id,
        documentId: share.document_id,
        sharedBy: share.shared_by,
        sharedWith: share.shared_with_email,
        accessLevel: share.access_level as AccessLevel,
        createdAt: new Date(share.created_at),
        expiresAt: share.expires_at ? new Date(share.expires_at) : undefined,
        isActive: share.is_active,
        shareToken: share.share_token,
        permissions: this.getPermissionsForAccessLevel(share.access_level as AccessLevel),
        message: share.message || undefined,
        accessCount: share.access_count,
        lastAccessedAt: share.last_accessed_at ? new Date(share.last_accessed_at) : undefined,
      }));

      return { success: true, shares };
    } catch (error) {
      Logger.error('Error getting document shares:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Revoke a document share
   */
  async revokeShare(shareId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('document_shares')
        .update({ is_active: false })
        .eq('id', shareId);

      if (error) {
        Logger.error('Error revoking share:', error);
        return { success: false, error: error.message };
      }

      Logger.info('Share revoked successfully:', shareId);
      return { success: true };
    } catch (error) {
      Logger.error('Error revoking share:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Track document access
   */
  async trackAccess(
    shareToken: string,
    action: string,
    userEmail?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get share info
      const { data: shareData, error: shareError } = await supabase
        .from('document_shares')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single();

      if (shareError || !shareData) {
        return { success: false, error: 'Invalid or expired share token' };
      }

      // Check if share has expired
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        return { success: false, error: 'Share has expired' };
      }

      // Create access event
      const accessEvent = {
        document_id: shareData.document_id,
        share_id: shareData.id,
        user_email: userEmail || shareData.shared_with_email,
        action,
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: new Date().toISOString(),
      };

      const { error: accessError } = await supabase
        .from('document_access_events')
        .insert(accessEvent);

      if (accessError) {
        Logger.error('Error tracking access:', accessError);
        return { success: false, error: accessError.message };
      }

      // Update access count
      const { error: updateError } = await supabase
        .from('document_shares')
        .update({ 
          access_count: shareData.access_count + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', shareData.id);

      if (updateError) {
        Logger.warn('Error updating access count:', updateError);
      }

      return { success: true };
    } catch (error) {
      Logger.error('Error tracking access:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get access statistics for a document
   */
  async getAccessStatistics(documentId: string): Promise<{ success: boolean; stats?: AccessStatistics; error?: string }> {
    try {
      // Get access events
      const { data: events, error: eventsError } = await supabase
        .from('document_access_events')
        .select('*')
        .eq('document_id', documentId)
        .order('timestamp', { ascending: false });

      if (eventsError) {
        Logger.error('Error fetching access events:', eventsError);
        return { success: false, error: eventsError.message };
      }

      // Calculate statistics
      const totalViews = events.filter(e => e.action === 'view').length;
      const totalDownloads = events.filter(e => e.action === 'download').length;
      const uniqueViewers = new Set(events.map(e => e.user_email)).size;

      // Group by date
      const viewsByDate: Record<string, number> = {};
      events.forEach(event => {
        const date = new Date(event.timestamp).toISOString().split('T')[0];
        viewsByDate[date] = (viewsByDate[date] || 0) + 1;
      });

      // Top viewers
      const viewerCounts: Record<string, { count: number; lastAccess: Date }> = {};
      events.forEach(event => {
        const email = event.user_email;
        if (!viewerCounts[email]) {
          viewerCounts[email] = { count: 0, lastAccess: new Date(event.timestamp) };
        }
        viewerCounts[email].count++;
        if (new Date(event.timestamp) > viewerCounts[email].lastAccess) {
          viewerCounts[email].lastAccess = new Date(event.timestamp);
        }
      });

      const topViewers = Object.entries(viewerCounts)
        .map(([email, data]) => ({
          userId: '', // We don't have userId in this context
          userEmail: email,
          viewCount: data.count,
          lastAccess: data.lastAccess,
        }))
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 10);

      const stats: AccessStatistics = {
        totalViews,
        uniqueViewers,
        totalDownloads,
        recentActivity: events.slice(0, 20).map(event => ({
          id: event.id,
          documentId: event.document_id,
          userId: '', // We don't have userId in this context
          userEmail: event.user_email,
          action: event.action,
          timestamp: new Date(event.timestamp),
          ipAddress: event.ip_address,
          userAgent: event.user_agent,
        })),
        viewsByDate,
        topViewers,
      };

      return { success: true, stats };
    } catch (error) {
      Logger.error('Error getting access statistics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Generate a secure share token
   */
  private generateShareToken(): string {
    return crypto.randomUUID() + '-' + Date.now().toString(36);
  }

  /**
   * Get permissions for access level
   */
  private getPermissionsForAccessLevel(accessLevel: AccessLevel): SharePermissions {
    switch (accessLevel) {
      case AccessLevel.View:
        return {
          canView: true,
          canDownload: false,
          canEdit: false,
          canShare: false,
          canDelete: false,
        };
      case AccessLevel.Download:
        return {
          canView: true,
          canDownload: true,
          canEdit: false,
          canShare: false,
          canDelete: false,
        };
      case AccessLevel.Edit:
        return {
          canView: true,
          canDownload: true,
          canEdit: true,
          canShare: true,
          canDelete: false,
        };
      default:
        return {
          canView: false,
          canDownload: false,
          canEdit: false,
          canShare: false,
          canDelete: false,
        };
    }
  }

  /**
   * Send share notification email
   */
  private async sendShareNotification(share: DocumentShare): Promise<void> {
    try {
      // Send notification to recipient
      const notification = {
        userId: share.sharedWith,
        type: 'document_share',
        title: 'Document Shared With You',
        message: share.message || 'A document has been shared with you',
        priority: 'normal',
        data: {
          shareToken: share.shareToken,
          accessLevel: share.accessLevel,
        }
      };
      
      await emailNotificationService.sendEmailNotification(notification);
      
      Logger.info('Share notification sent to:', share.sharedWith);
    } catch (error) {
      Logger.error('Error sending share notification:', error);
    }
  }
}

// Export singleton instance
export const documentSharingService = new DocumentSharingService();
export default documentSharingService;