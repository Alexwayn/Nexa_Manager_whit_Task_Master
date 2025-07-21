import emailManagementService from '@lib/emailManagementService';
import emailProviderService from '@lib/emailProviderService';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * Email Synchronization Service
 * Handles real-time email synchronization with WebSocket integration
 */
class EmailSyncService {
  constructor() {
    this.syncIntervals = new Map();
    this.syncStatus = new Map();
    this.eventListeners = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the sync service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set up Supabase real-time subscriptions
      this.setupRealtimeSubscriptions();
      
      this.isInitialized = true;
      Logger.info('Email sync service initialized');
    } catch (error) {
      Logger.error('Failed to initialize email sync service:', error);
      throw error;
    }
  }

  /**
   * Setup Supabase real-time subscriptions
   */
  setupRealtimeSubscriptions() {
    // Subscribe to email changes
    const emailSubscription = supabase
      .channel('email_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emails',
        },
        (payload) => this.handleEmailChange(payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders',
        },
        (payload) => this.handleFolderChange(payload)
      )
      .subscribe();

    // Store subscription for cleanup
    this.emailSubscription = emailSubscription;
  }

  /**
   * Handle email database changes
   */
  handleEmailChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    try {
      switch (eventType) {
        case 'INSERT':
          this.emitEvent('email:new', {
            email: newRecord,
            userId: newRecord.user_id,
          });
          break;

        case 'UPDATE':
          this.emitEvent('email:updated', {
            emailId: newRecord.id,
            updates: newRecord,
            userId: newRecord.user_id,
          });
          break;

        case 'DELETE':
          this.emitEvent('email:deleted', {
            emailId: oldRecord.id,
            userId: oldRecord.user_id,
          });
          break;

        default:
          Logger.debug('Unknown email change event:', eventType);
      }
    } catch (error) {
      Logger.error('Error handling email change:', error);
    }
  }

  /**
   * Handle folder database changes
   */
  handleFolderChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    try {
      switch (eventType) {
        case 'INSERT':
          this.emitEvent('folder:created', {
            folder: newRecord,
            userId: newRecord.user_id,
          });
          break;

        case 'UPDATE':
          this.emitEvent('folder:updated', {
            folderId: newRecord.id,
            updates: newRecord,
            userId: newRecord.user_id,
          });
          break;

        case 'DELETE':
          this.emitEvent('folder:deleted', {
            folderId: oldRecord.id,
            userId: oldRecord.user_id,
          });
          break;

        default:
          Logger.debug('Unknown folder change event:', eventType);
      }
    } catch (error) {
      Logger.error('Error handling folder change:', error);
    }
  }

  /**
   * Start email synchronization for a user
   */
  async startSync(userId, options = {}) {
    const {
      intervalMinutes = 5,
      immediate = true,
      accounts = null,
    } = options;

    try {
      // Stop existing sync if running
      this.stopSync(userId);

      // Set sync status
      this.syncStatus.set(userId, {
        status: 'starting',
        lastSync: null,
        nextSync: null,
        error: null,
      });

      // Get user's email accounts
      const emailAccounts = accounts || await this.getUserEmailAccounts(userId);
      
      if (!emailAccounts || emailAccounts.length === 0) {
        Logger.info('No email accounts configured for user:', userId);
        this.syncStatus.set(userId, {
          status: 'idle',
          lastSync: null,
          nextSync: null,
          error: 'No email accounts configured',
        });
        return { success: false, error: 'No email accounts configured' };
      }

      // Perform immediate sync if requested
      if (immediate) {
        await this.performSync(userId, emailAccounts);
      }

      // Set up periodic sync
      const interval = setInterval(async () => {
        try {
          await this.performSync(userId, emailAccounts);
        } catch (error) {
          Logger.error(`Periodic sync error for user ${userId}:`, error);
          this.updateSyncStatus(userId, 'error', error.message);
        }
      }, intervalMinutes * 60 * 1000);

      this.syncIntervals.set(userId, interval);

      // Update sync status
      this.updateSyncStatus(userId, 'active', null, new Date(Date.now() + intervalMinutes * 60 * 1000));

      Logger.info(`Email sync started for user ${userId} (every ${intervalMinutes} minutes)`);
      
      this.emitEvent('sync:started', {
        userId,
        intervalMinutes,
        accountCount: emailAccounts.length,
      });

      return { success: true, intervalMinutes, accountCount: emailAccounts.length };
    } catch (error) {
      Logger.error('Error starting email sync:', error);
      this.updateSyncStatus(userId, 'error', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop email synchronization for a user
   */
  stopSync(userId) {
    try {
      if (this.syncIntervals.has(userId)) {
        clearInterval(this.syncIntervals.get(userId));
        this.syncIntervals.delete(userId);
      }

      this.updateSyncStatus(userId, 'stopped');

      Logger.info(`Email sync stopped for user: ${userId}`);
      
      this.emitEvent('sync:stopped', { userId });
      
      return { success: true };
    } catch (error) {
      Logger.error('Error stopping email sync:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform email synchronization
   */
  async performSync(userId, emailAccounts) {
    try {
      this.updateSyncStatus(userId, 'syncing');
      
      this.emitEvent('sync:started', { userId });

      let totalNewEmails = 0;
      let totalUpdatedEmails = 0;
      const errors = [];

      // Sync each email account
      for (const account of emailAccounts) {
        try {
          const syncResult = await this.syncEmailAccount(userId, account);
          
          if (syncResult.success) {
            totalNewEmails += syncResult.newEmails || 0;
            totalUpdatedEmails += syncResult.updatedEmails || 0;
          } else {
            errors.push({
              accountId: account.id,
              error: syncResult.error,
            });
          }
        } catch (error) {
          Logger.error(`Error syncing account ${account.id}:`, error);
          errors.push({
            accountId: account.id,
            error: error.message,
          });
        }
      }

      // Update sync status
      const now = new Date();
      this.updateSyncStatus(userId, 'active', null, null, now);

      // Emit sync completed event
      this.emitEvent('sync:completed', {
        userId,
        timestamp: now.toISOString(),
        newEmails: totalNewEmails,
        updatedEmails: totalUpdatedEmails,
        errors: errors.length > 0 ? errors : null,
      });

      Logger.info(`Email sync completed for user ${userId}:`, {
        newEmails: totalNewEmails,
        updatedEmails: totalUpdatedEmails,
        errors: errors.length,
      });

      return {
        success: true,
        newEmails: totalNewEmails,
        updatedEmails: totalUpdatedEmails,
        errors,
      };
    } catch (error) {
      Logger.error('Error performing email sync:', error);
      this.updateSyncStatus(userId, 'error', error.message);
      
      this.emitEvent('sync:error', {
        userId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Sync a single email account
   */
  async syncEmailAccount(userId, account) {
    try {
      // Use email provider service to fetch new emails
      const fetchResult = await emailProviderService.fetchNewEmails(account);
      
      if (!fetchResult.success) {
        return fetchResult;
      }

      const { emails: newEmails = [] } = fetchResult;
      let newEmailCount = 0;
      let updatedEmailCount = 0;

      // Process each new email
      for (const emailData of newEmails) {
        try {
          // Check if email already exists
          const existingEmail = await this.findExistingEmail(userId, emailData.messageId);
          
          if (existingEmail) {
            // Update existing email if needed
            const updateResult = await this.updateExistingEmail(existingEmail.id, emailData);
            if (updateResult.success) {
              updatedEmailCount++;
            }
          } else {
            // Store new email
            const storeResult = await this.storeNewEmail(userId, emailData, account);
            if (storeResult.success) {
              newEmailCount++;
            }
          }
        } catch (error) {
          Logger.error('Error processing email:', error);
          // Continue with other emails
        }
      }

      return {
        success: true,
        newEmails: newEmailCount,
        updatedEmails: updatedEmailCount,
      };
    } catch (error) {
      Logger.error('Error syncing email account:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Find existing email by message ID
   */
  async findExistingEmail(userId, messageId) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('id, updated_at')
        .eq('user_id', userId)
        .eq('message_id', messageId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      Logger.error('Error finding existing email:', error);
      return null;
    }
  }

  /**
   * Update existing email
   */
  async updateExistingEmail(emailId, emailData) {
    try {
      // Only update if there are actual changes
      const updates = {
        is_read: emailData.isRead,
        is_starred: emailData.isStarred,
        is_important: emailData.isImportant,
        labels: emailData.labels || [],
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('emails')
        .update(updates)
        .eq('id', emailId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error updating existing email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store new email
   */
  async storeNewEmail(userId, emailData, account) {
    try {
      // Transform email data for storage
      const emailRecord = {
        user_id: userId,
        message_id: emailData.messageId,
        thread_id: emailData.threadId,
        folder_id: emailData.folderId || 'inbox',
        subject: emailData.subject,
        sender_name: emailData.sender?.name || '',
        sender_email: emailData.sender?.email || '',
        recipients: emailData.recipients || { to: [], cc: [], bcc: [] },
        content_text: emailData.content?.text || '',
        content_html: emailData.content?.html || '',
        attachments: emailData.attachments || [],
        labels: emailData.labels || [],
        is_read: emailData.isRead || false,
        is_starred: emailData.isStarred || false,
        is_important: emailData.isImportant || false,
        received_at: emailData.receivedAt || new Date().toISOString(),
        sent_at: emailData.sentAt,
        client_id: emailData.clientId,
        related_documents: emailData.relatedDocuments || [],
      };

      const { data, error } = await supabase
        .from('emails')
        .insert(emailRecord)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error storing new email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's email accounts
   */
  async getUserEmailAccounts(userId) {
    try {
      // This would fetch from a user email accounts table
      // For now, return mock data
      return [
        {
          id: `account_${userId}`,
          userId,
          provider: 'imap',
          isActive: true,
          settings: {
            host: 'imap.example.com',
            port: 993,
            secure: true,
          },
        },
      ];
    } catch (error) {
      Logger.error('Error getting user email accounts:', error);
      return [];
    }
  }

  /**
   * Update sync status
   */
  updateSyncStatus(userId, status, error = null, nextSync = null, lastSync = null) {
    const currentStatus = this.syncStatus.get(userId) || {};
    
    this.syncStatus.set(userId, {
      ...currentStatus,
      status,
      error,
      nextSync,
      lastSync: lastSync || currentStatus.lastSync,
      updatedAt: new Date(),
    });
  }

  /**
   * Get sync status for user
   */
  getSyncStatus(userId) {
    return this.syncStatus.get(userId) || {
      status: 'idle',
      lastSync: null,
      nextSync: null,
      error: null,
    };
  }

  /**
   * Get sync status for all users
   */
  getAllSyncStatuses() {
    const statuses = {};
    for (const [userId, status] of this.syncStatus) {
      statuses[userId] = status;
    }
    return statuses;
  }

  /**
   * Manually trigger sync for user
   */
  async triggerSync(userId) {
    try {
      const emailAccounts = await this.getUserEmailAccounts(userId);
      
      if (!emailAccounts || emailAccounts.length === 0) {
        return { success: false, error: 'No email accounts configured' };
      }

      const result = await this.performSync(userId, emailAccounts);
      return result;
    } catch (error) {
      Logger.error('Error triggering manual sync:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Event system
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emitEvent(event, data) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          Logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Stop all sync intervals
    for (const [userId, interval] of this.syncIntervals) {
      clearInterval(interval);
      Logger.info(`Stopped email sync for user: ${userId}`);
    }
    this.syncIntervals.clear();

    // Clear sync statuses
    this.syncStatus.clear();

    // Clear event listeners
    this.eventListeners.clear();

    // Unsubscribe from Supabase real-time
    if (this.emailSubscription) {
      this.emailSubscription.unsubscribe();
    }

    this.isInitialized = false;
    Logger.info('Email sync service cleaned up');
  }
}

export default new EmailSyncService();