// Document access tracking service implementation
import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';
import emailNotificationService from '@/lib/emailNotificationService';
import type { AccessLogEntry, ProcessedDocument, AccessEvent, AccessStatistics } from '@/types/scanner';

export interface NotificationPreferences {
  userId: string;
  documentAccess: boolean;
  documentDownload: boolean;
  documentShare: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

export class DocumentAccessTrackingService {
  private readonly ACCESS_LOG_TABLE = 'document_access_log';
  private readonly NOTIFICATION_PREFS_TABLE = 'document_notification_preferences';

  /**
   * Track document access event
   */
  async trackAccess(event: Omit<AccessEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const accessRecord = {
        id: this.generateAccessId(),
        document_id: event.documentId,
        share_id: null, // shareId is not part of AccessEvent interface
        user_id: event.userId || null,
        user_email: event.userEmail || null,
        action: event.action,
        ip_address: event.ipAddress || null,
        user_agent: event.userAgent || null,
        timestamp: new Date().toISOString(),
        metadata: event.details || {}
      };

      const { error } = await supabase
        .from(this.ACCESS_LOG_TABLE)
        .insert([accessRecord]);

      if (error) {
        Logger.error('Failed to track document access:', error);
        return;
      }

      // Send notifications for significant events
      await this.processAccessNotifications(event);

      // Update document access log
      await this.updateDocumentAccessLog(event);

    } catch (error) {
      Logger.error('Failed to track document access:', error);
    }
  }

  /**
   * Get access history for a document
   */
  async getDocumentAccessHistory(
    documentId: string, 
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      action?: string;
      dateRange?: { start: Date; end: Date };
    } = {}
  ): Promise<{
    success: boolean;
    accessHistory?: AccessEvent[];
    totalCount?: number;
    error?: string;
  }> {
    try {
      // Verify user owns the document
      const { data: document, error: docError } = await supabase
        .from('scanned_documents')
        .select('id')
        .eq('id', documentId)
        .eq('created_by', userId)
        .single();

      if (docError || !document) {
        return { success: false, error: 'Document not found or access denied' };
      }

      let query = supabase
        .from(this.ACCESS_LOG_TABLE)
        .select('*', { count: 'exact' })
        .or(`document_id.eq.${documentId},share_id.in.(select id from document_shares where document_id = '${documentId}')`)
        .order('timestamp', { ascending: false });

      // Apply filters
      if (options.action) {
        query = query.eq('action', options.action);
      }

      if (options.dateRange) {
        query = query
          .gte('timestamp', options.dateRange.start.toISOString())
          .lte('timestamp', options.dateRange.end.toISOString());
      }

      // Apply pagination
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        Logger.error('Failed to get document access history:', error);
        return { success: false, error: 'Failed to retrieve access history' };
      }

      const accessHistory: AccessEvent[] = (data || []).map(record => ({
        id: record.id,
        documentId: record.document_id,
        userId: record.user_id || record.user_email || 'anonymous',
        userEmail: record.user_email || '',
        action: record.action,
        timestamp: new Date(record.timestamp),
        ipAddress: record.ip_address,
        userAgent: record.user_agent,
        details: record.metadata
      }));

      return {
        success: true,
        accessHistory,
        totalCount: count || 0
      };
    } catch (error) {
      Logger.error('Failed to get document access history:', error);
      return { success: false, error: 'Failed to retrieve access history' };
    }
  }

  /**
   * Get access statistics for a document
   */
  async getDocumentAccessStatistics(
    documentId: string, 
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    success: boolean;
    statistics?: AccessStatistics;
    error?: string;
  }> {
    try {
      // Verify user owns the document
      const { data: document, error: docError } = await supabase
        .from('scanned_documents')
        .select('id')
        .eq('id', documentId)
        .eq('created_by', userId)
        .single();

      if (docError || !document) {
        return { success: false, error: 'Document not found or access denied' };
      }

      // Build base query
      let query = supabase
        .from(this.ACCESS_LOG_TABLE)
        .select('*')
        .or(`document_id.eq.${documentId},share_id.in.(select id from document_shares where document_id = '${documentId}')`);

      if (dateRange) {
        query = query
          .gte('timestamp', dateRange.start.toISOString())
          .lte('timestamp', dateRange.end.toISOString());
      }

      const { data: accessLogs, error } = await query;

      if (error) {
        Logger.error('Failed to get access statistics:', error);
        return { success: false, error: 'Failed to retrieve statistics' };
      }

      // Calculate statistics
      const statistics = this.calculateAccessStatistics(accessLogs || []);

      return { success: true, statistics };
    } catch (error) {
      Logger.error('Failed to get document access statistics:', error);
      return { success: false, error: 'Failed to retrieve statistics' };
    }
  }

  /**
   * Calculate access statistics from raw access logs
   */
  private calculateAccessStatistics(accessLogs: any[]): AccessStatistics {
    const uniqueUsers = new Set<string>();
    const userAccessCounts = new Map<string, { count: number; lastAccess: Date }>();
    const dailyAccesses = new Map<string, number>();

    let viewCount = 0;
    let downloadCount = 0;
    let editCount = 0;
    let shareCount = 0;

    accessLogs.forEach(log => {
      const userKey = log.user_email || log.user_id || 'anonymous';
      uniqueUsers.add(userKey);

      // Count by action type
      switch (log.action) {
        case 'view':
          viewCount++;
          break;
        case 'download':
          downloadCount++;
          break;
        case 'edit':
          editCount++;
          break;
        case 'share':
          shareCount++;
          break;
      }

      // Track user access counts
      const current = userAccessCounts.get(userKey) || { count: 0, lastAccess: new Date(0) };
      userAccessCounts.set(userKey, {
        count: current.count + 1,
        lastAccess: new Date(Math.max(current.lastAccess.getTime(), new Date(log.timestamp).getTime()))
      });

      // Track daily accesses
      const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
      dailyAccesses.set(dateKey, (dailyAccesses.get(dateKey) || 0) + 1);
    });

    // Get top accessors
    const topViewers = Array.from(userAccessCounts.entries())
      .map(([userEmail, data]) => ({
        userId: userEmail,
        userEmail,
        viewCount: data.count,
        lastAccess: data.lastAccess
      }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10);

    // Get access trends (last 30 days)
    const viewsByDate: Record<string, number> = {};
    Array.from(dailyAccesses.entries())
      .slice(-30)
      .forEach(([date, count]) => {
        viewsByDate[date] = count;
      });

    // Get recent accesses
    const recentActivity: AccessEvent[] = accessLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
      .map(log => ({
        id: log.id,
        documentId: log.document_id,
        userId: log.user_id || log.user_email || 'anonymous',
        userEmail: log.user_email || '',
        action: log.action,
        timestamp: new Date(log.timestamp),
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        details: log.metadata
      }));

    return {
      totalViews: viewCount,
      uniqueViewers: uniqueUsers.size,
      totalDownloads: downloadCount,
      recentActivity,
      topViewers,
      viewsByDate
    };
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(userId: string): Promise<{
    success: boolean;
    preferences?: NotificationPreferences;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from(this.NOTIFICATION_PREFS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        Logger.error('Failed to get notification preferences:', error);
        return { success: false, error: 'Failed to retrieve preferences' };
      }

      // Return default preferences if none found
      const preferences: NotificationPreferences = data || {
        userId,
        documentAccess: true,
        documentDownload: true,
        documentShare: true,
        dailyDigest: false,
        weeklyReport: false,
        emailNotifications: true,
        inAppNotifications: true
      };

      return { success: true, preferences };
    } catch (error) {
      Logger.error('Failed to get notification preferences:', error);
      return { success: false, error: 'Failed to retrieve preferences' };
    }
  }

  /**
   * Update notification preferences for a user
   */
  async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from(this.NOTIFICATION_PREFS_TABLE)
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        Logger.error('Failed to update notification preferences:', error);
        return { success: false, error: 'Failed to update preferences' };
      }

      return { success: true };
    } catch (error) {
      Logger.error('Failed to update notification preferences:', error);
      return { success: false, error: 'Failed to update preferences' };
    }
  }

  /**
   * Process access notifications
   */
  private async processAccessNotifications(event: Omit<AccessEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Get document owner
      const { data: document, error: docError } = await supabase
        .from('scanned_documents')
        .select('created_by, title')
        .eq('id', event.documentId)
        .single();

      if (docError || !document) {
        return;
      }

      // Get owner's notification preferences
      const prefsResult = await this.getNotificationPreferences(document.created_by);
      if (!prefsResult.success || !prefsResult.preferences) {
        return;
      }

      const prefs = prefsResult.preferences;

      // Check if we should send notification for this action
      const shouldNotify = (
        (event.action === 'view' && prefs.documentAccess) ||
        (event.action === 'download' && prefs.documentDownload) ||
        (event.action === 'share' && prefs.documentShare)
      );

      if (!shouldNotify) {
        return;
      }

      // Create notification
      const notification = {
        id: `document_access_${event.documentId}_${Date.now()}`,
        type: `document_${event.action}`,
        title: this.getNotificationTitle(event.action),
        message: this.getNotificationMessage(event.action, document.title, event.userEmail),
        userId: document.created_by,
        priority: this.getNotificationPriority(event.action),
        timestamp: new Date(),
        read: false,
        data: {
          documentId: event.documentId,
          documentTitle: document.title,
          action: event.action,
          userEmail: event.userEmail,
          ipAddress: event.ipAddress,
          timestamp: new Date().toISOString()
        },
      };

      // Send notification
      if (prefs.inAppNotifications) {
        await emailNotificationService.queueNotification(notification);
      }

    } catch (error) {
      Logger.error('Failed to process access notifications:', error);
    }
  }

  /**
   * Update document's access log
   */
  private async updateDocumentAccessLog(event: Omit<AccessEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Get current document access log
      const { data: document, error } = await supabase
        .from('scanned_documents')
        .select('access_log')
        .eq('id', event.documentId)
        .single();

      if (error) {
        Logger.error('Failed to get document for access log update:', error);
        return;
      }

      const accessEntry: AccessLogEntry = {
        userId: event.userId || 'anonymous',
        action: event.action,
        timestamp: new Date(),
        ipAddress: event.ipAddress
      };

      const updatedAccessLog = [...(document.access_log || []), accessEntry];

      // Keep only last 100 entries to prevent bloat
      if (updatedAccessLog.length > 100) {
        updatedAccessLog.splice(0, updatedAccessLog.length - 100);
      }

      await supabase
        .from('scanned_documents')
        .update({
          access_log: updatedAccessLog,
          updated_at: new Date().toISOString()
        })
        .eq('id', event.documentId);

    } catch (error) {
      Logger.error('Failed to update document access log:', error);
    }
  }

  /**
   * Generate daily digest for user
   */
  async generateDailyDigest(userId: string): Promise<{
    success: boolean;
    digest?: {
      totalAccesses: number;
      documentsAccessed: number;
      newShares: number;
      topDocuments: { title: string; accessCount: number }[];
    };
    error?: string;
  }> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get user's documents
      const { data: documents, error: docsError } = await supabase
        .from('scanned_documents')
        .select('id, title')
        .eq('created_by', userId);

      if (docsError) {
        return { success: false, error: 'Failed to retrieve documents' };
      }

      const documentIds = documents?.map(d => d.id) || [];
      if (documentIds.length === 0) {
        return { success: true, digest: {
          totalAccesses: 0,
          documentsAccessed: 0,
          newShares: 0,
          topDocuments: []
        }};
      }

      // Get access logs for yesterday
      const { data: accessLogs, error: logsError } = await supabase
        .from(this.ACCESS_LOG_TABLE)
        .select('*')
        .in('document_id', documentIds)
        .gte('timestamp', yesterday.toISOString())
        .lt('timestamp', today.toISOString());

      if (logsError) {
        return { success: false, error: 'Failed to retrieve access logs' };
      }

      // Calculate digest statistics
      const documentAccessCounts = new Map<string, number>();
      let shareCount = 0;

      (accessLogs || []).forEach(log => {
        const current = documentAccessCounts.get(log.document_id) || 0;
        documentAccessCounts.set(log.document_id, current + 1);

        if (log.action === 'share') {
          shareCount++;
        }
      });

      const topDocuments = Array.from(documentAccessCounts.entries())
        .map(([docId, count]) => ({
          title: documents?.find(d => d.id === docId)?.title || 'Unknown',
          accessCount: count
        }))
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 5);

      const digest = {
        totalAccesses: accessLogs?.length || 0,
        documentsAccessed: documentAccessCounts.size,
        newShares: shareCount,
        topDocuments
      };

      return { success: true, digest };
    } catch (error) {
      Logger.error('Failed to generate daily digest:', error);
      return { success: false, error: 'Failed to generate digest' };
    }
  }

  /**
   * Helper methods for notifications
   */
  private getNotificationTitle(action: string): string {
    switch (action) {
      case 'view':
        return 'Document Viewed';
      case 'download':
        return 'Document Downloaded';
      case 'edit':
        return 'Document Edited';
      case 'share':
        return 'Document Shared';
      default:
        return 'Document Activity';
    }
  }

  private getNotificationMessage(action: string, documentTitle: string, userEmail?: string): string {
    const user = userEmail || 'Someone';
    switch (action) {
      case 'view':
        return `${user} viewed "${documentTitle}"`;
      case 'download':
        return `${user} downloaded "${documentTitle}"`;
      case 'edit':
        return `${user} edited "${documentTitle}"`;
      case 'share':
        return `${user} shared "${documentTitle}"`;
      default:
        return `${user} accessed "${documentTitle}"`;
    }
  }

  private getNotificationPriority(action: string): 'low' | 'medium' | 'high' {
    switch (action) {
      case 'view':
        return 'low';
      case 'download':
        return 'medium';
      case 'edit':
      case 'share':
        return 'high';
      default:
        return 'low';
    }
  }

  private generateAccessId(): string {
    return `access_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Clean up old access logs (older than 1 year)
   */
  async cleanupOldAccessLogs(): Promise<void> {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { error } = await supabase
        .from(this.ACCESS_LOG_TABLE)
        .delete()
        .lt('timestamp', oneYearAgo.toISOString());

      if (error) {
        Logger.error('Failed to cleanup old access logs:', error);
      } else {
        Logger.info('Successfully cleaned up old access logs');
      }
    } catch (error) {
      Logger.error('Failed to cleanup old access logs:', error);
    }
  }
}

// Export singleton instance
export const documentAccessTrackingService = new DocumentAccessTrackingService();
