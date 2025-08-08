import { emailErrorHandler } from '@features/email';
import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';
import { notify } from '@shared/utils';

/**
 * Enhanced Email Offline Service
 * Provides comprehensive offline support for email operations with conflict resolution
 */
class EmailOfflineService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.offlineOperations = new Map(); // Pending offline operations
    this.conflictResolution = new Map(); // Conflict resolution strategies
    this.syncQueue = new Map(); // Operations to sync when online
    this.localStorageKey = 'email_offline_operations';
    this.maxOfflineOperations = 1000;
    this.conflictStrategies = {
      'server_wins': 'server',
      'client_wins': 'client', 
      'merge': 'merge',
      'prompt_user': 'prompt'
    };

    this.setupNetworkListeners();
    this.loadOfflineOperations();
    this.setupConflictResolutionStrategies();
  }

  /**
   * Setup network event listeners
   */
  setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineEvent());
      window.addEventListener('offline', () => this.handleOfflineEvent());
      
      // Listen for visibility change to sync when app becomes active
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.isOnline) {
          this.syncPendingOperations();
        }
      });
    }
  }

  /**
   * Handle online event
   */
  async handleOnlineEvent() {
    this.isOnline = true;
    Logger.info('Network connection restored, syncing offline operations');
    
    notify.success('Connection restored. Syncing offline changes...', {
      duration: 3000
    });

    await this.syncPendingOperations();
  }

  /**
   * Handle offline event
   */
  handleOfflineEvent() {
    this.isOnline = false;
    Logger.info('Network connection lost, entering offline mode');
    
    notify.warning('You are now offline. Changes will be saved locally and synced when connection is restored.', {
      duration: 5000
    });
  }

  /**
   * Setup conflict resolution strategies
   */
  setupConflictResolutionStrategies() {
    this.conflictResolution.set('email_read_status', 'server_wins');
    this.conflictResolution.set('email_starred', 'client_wins');
    this.conflictResolution.set('email_labels', 'merge');
    this.conflictResolution.set('email_folder', 'client_wins');
    this.conflictResolution.set('email_delete', 'client_wins');
    this.conflictResolution.set('email_content', 'prompt_user');
  }

  /**
   * Queue operation for offline execution
   */
  async queueOfflineOperation(operation) {
    try {
      const operationId = this.generateOperationId();
      const offlineOperation = {
        id: operationId,
        type: operation.type,
        data: operation.data,
        timestamp: Date.now(),
        userId: operation.userId,
        status: 'pending',
        retryCount: 0,
        conflicts: []
      };

      // Check if we're at capacity
      if (this.offlineOperations.size >= this.maxOfflineOperations) {
        await this.cleanupOldOperations();
      }

      this.offlineOperations.set(operationId, offlineOperation);
      await this.saveOfflineOperations();

      Logger.debug('Queued offline operation:', operationId, operation.type);

      // Try to execute immediately if online
      if (this.isOnline) {
        await this.executeOfflineOperation(offlineOperation);
      } else {
        // Show user feedback for offline operation
        this.showOfflineOperationFeedback(operation.type);
      }

      return { success: true, operationId };
    } catch (error) {
      Logger.error('Failed to queue offline operation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute offline operation
   */
  async executeOfflineOperation(operation) {
    try {
      const result = await emailErrorHandler.withErrorHandling(
        () => this.performOperation(operation),
        {
          operation: `offline_${operation.type}`,
          userId: operation.userId,
          operationId: operation.id
        }
      );

      if (result.success) {
        // Mark operation as completed
        operation.status = 'completed';
        operation.completedAt = Date.now();
        await this.saveOfflineOperations();
        
        Logger.debug('Offline operation completed:', operation.id);
        return { success: true };
      } else {
        // Handle failure
        operation.retryCount++;
        operation.lastError = result.error;
        operation.status = 'failed';
        
        if (operation.retryCount < 3) {
          operation.status = 'retry_pending';
          operation.nextRetry = Date.now() + (operation.retryCount * 5000); // Exponential backoff
        }
        
        await this.saveOfflineOperations();
        return { success: false, error: result.error };
      }
    } catch (error) {
      Logger.error('Error executing offline operation:', error);
      operation.status = 'failed';
      operation.lastError = error.message;
      await this.saveOfflineOperations();
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform the actual operation based on type
   */
  async performOperation(operation) {
    switch (operation.type) {
      case 'mark_read':
        return await this.markEmailsAsRead(operation.data.emailIds, operation.data.isRead, operation.userId);
      
      case 'mark_starred':
        return await this.markEmailsAsStarred(operation.data.emailIds, operation.data.isStarred, operation.userId);
      
      case 'move_email':
        return await this.moveEmails(operation.data.emailIds, operation.data.folderId, operation.userId);
      
      case 'delete_email':
        return await this.deleteEmails(operation.data.emailIds, operation.userId);
      
      case 'add_label':
        return await this.addLabelsToEmails(operation.data.emailIds, operation.data.labels, operation.userId);
      
      case 'remove_label':
        return await this.removeLabelsFromEmails(operation.data.emailIds, operation.data.labels, operation.userId);
      
      case 'send_email':
        return await this.sendEmailOffline(operation.data.emailData, operation.userId);
      
      case 'create_draft':
        return await this.createDraft(operation.data.draftData, operation.userId);
      
      case 'update_draft':
        return await this.updateDraft(operation.data.draftId, operation.data.draftData, operation.userId);
      
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Sync all pending operations when coming online
   */
  async syncPendingOperations() {
    if (!this.isOnline) {
      return { success: false, error: 'Not online' };
    }

    const pendingOperations = Array.from(this.offlineOperations.values())
      .filter(op => op.status === 'pending' || op.status === 'retry_pending')
      .sort((a, b) => a.timestamp - b.timestamp);

    if (pendingOperations.length === 0) {
      return { success: true, synced: 0 };
    }

    Logger.info(`Syncing ${pendingOperations.length} pending offline operations`);
    
    let syncedCount = 0;
    let failedCount = 0;
    const conflicts = [];

    for (const operation of pendingOperations) {
      try {
        // Check for conflicts before executing
        const conflictCheck = await this.checkForConflicts(operation);
        
        if (conflictCheck.hasConflict) {
          const resolution = await this.resolveConflict(operation, conflictCheck.conflict);
          if (!resolution.proceed) {
            conflicts.push({ operation, conflict: conflictCheck.conflict, resolution });
            continue;
          }
        }

        const result = await this.executeOfflineOperation(operation);
        
        if (result.success) {
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        Logger.error('Error syncing offline operation:', error);
        failedCount++;
      }
    }

    // Clean up completed operations
    await this.cleanupCompletedOperations();

    // Show sync results to user
    if (syncedCount > 0) {
      notify.success(`Synced ${syncedCount} offline changes successfully`);
    }
    
    if (failedCount > 0) {
      notify.warning(`${failedCount} offline changes failed to sync`);
    }

    if (conflicts.length > 0) {
      notify.warning(`${conflicts.length} conflicts detected and resolved`);
    }

    return {
      success: true,
      synced: syncedCount,
      failed: failedCount,
      conflicts: conflicts.length
    };
  }

  /**
   * Check for conflicts with server state
   */
  async checkForConflicts(operation) {
    try {
      // Get current server state for the affected emails
      const emailIds = this.extractEmailIds(operation);
      if (!emailIds || emailIds.length === 0) {
        return { hasConflict: false };
      }

      const { data: serverEmails, error } = await supabase
        .from('emails')
        .select('id, is_read, is_starred, folder_id, labels, updated_at')
        .in('id', emailIds)
        .eq('user_id', operation.userId);

      if (error) {
        Logger.warn('Could not check for conflicts:', error);
        return { hasConflict: false };
      }

      // Check if any emails have been modified since the operation was queued
      for (const serverEmail of serverEmails) {
        const serverModified = new Date(serverEmail.updated_at).getTime();
        if (serverModified > operation.timestamp) {
          return {
            hasConflict: true,
            conflict: {
              type: operation.type,
              emailId: serverEmail.id,
              serverState: serverEmail,
              clientOperation: operation,
              conflictTime: serverModified
            }
          };
        }
      }

      return { hasConflict: false };
    } catch (error) {
      Logger.error('Error checking for conflicts:', error);
      return { hasConflict: false };
    }
  }

  /**
   * Resolve conflict based on strategy
   */
  async resolveConflict(operation, conflict) {
    const strategy = this.conflictResolution.get(operation.type) || 'server_wins';
    
    switch (strategy) {
      case 'server_wins':
        Logger.info('Conflict resolved: server wins, skipping operation');
        operation.status = 'skipped';
        operation.conflictResolution = 'server_wins';
        return { proceed: false, resolution: 'server_wins' };
      
      case 'client_wins':
        Logger.info('Conflict resolved: client wins, proceeding with operation');
        return { proceed: true, resolution: 'client_wins' };
      
      case 'merge':
        const mergedOperation = await this.mergeConflictedOperation(operation, conflict);
        if (mergedOperation) {
          Object.assign(operation, mergedOperation);
          return { proceed: true, resolution: 'merged' };
        }
        return { proceed: false, resolution: 'merge_failed' };
      
      case 'prompt_user':
        // For now, default to server wins - in a real app, show UI prompt
        Logger.info('Conflict requires user input, defaulting to server wins');
        operation.status = 'conflict_pending';
        return { proceed: false, resolution: 'user_prompt_needed' };
      
      default:
        return { proceed: false, resolution: 'unknown_strategy' };
    }
  }

  /**
   * Merge conflicted operation (for label operations mainly)
   */
  async mergeConflictedOperation(operation, conflict) {
    if (operation.type === 'add_label' || operation.type === 'remove_label') {
      // Merge label operations
      const serverLabels = conflict.serverState.labels || [];
      const operationLabels = operation.data.labels || [];
      
      if (operation.type === 'add_label') {
        // Add only labels that aren't already present
        const newLabels = operationLabels.filter(label => !serverLabels.includes(label));
        if (newLabels.length > 0) {
          return {
            ...operation,
            data: { ...operation.data, labels: newLabels }
          };
        }
      } else if (operation.type === 'remove_label') {
        // Remove only labels that are still present
        const labelsToRemove = operationLabels.filter(label => serverLabels.includes(label));
        if (labelsToRemove.length > 0) {
          return {
            ...operation,
            data: { ...operation.data, labels: labelsToRemove }
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Extract email IDs from operation data
   */
  extractEmailIds(operation) {
    if (operation.data.emailIds) {
      return operation.data.emailIds;
    }
    if (operation.data.emailId) {
      return [operation.data.emailId];
    }
    return [];
  }

  /**
   * Show user feedback for offline operations
   */
  showOfflineOperationFeedback(operationType) {
    const messages = {
      'mark_read': 'Email marked as read (offline)',
      'mark_starred': 'Email starred (offline)',
      'move_email': 'Email moved (offline)',
      'delete_email': 'Email deleted (offline)',
      'add_label': 'Label added (offline)',
      'remove_label': 'Label removed (offline)',
      'send_email': 'Email queued for sending',
      'create_draft': 'Draft saved (offline)',
      'update_draft': 'Draft updated (offline)'
    };

    const message = messages[operationType] || 'Action completed (offline)';
    notify.info(message, { duration: 2000 });
  }

  /**
   * Load offline operations from localStorage
   */
  loadOfflineOperations() {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        const operations = JSON.parse(stored);
        this.offlineOperations = new Map(operations);
        Logger.info(`Loaded ${this.offlineOperations.size} offline operations from storage`);
      }
    } catch (error) {
      Logger.error('Failed to load offline operations:', error);
      this.offlineOperations = new Map();
    }
  }

  /**
   * Save offline operations to localStorage
   */
  async saveOfflineOperations() {
    try {
      const operations = Array.from(this.offlineOperations.entries());
      localStorage.setItem(this.localStorageKey, JSON.stringify(operations));
    } catch (error) {
      Logger.error('Failed to save offline operations:', error);
    }
  }

  /**
   * Clean up old operations
   */
  async cleanupOldOperations() {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    let removedCount = 0;

    for (const [id, operation] of this.offlineOperations) {
      if (operation.timestamp < cutoffTime && operation.status === 'completed') {
        this.offlineOperations.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await this.saveOfflineOperations();
      Logger.info(`Cleaned up ${removedCount} old offline operations`);
    }
  }

  /**
   * Clean up completed operations
   */
  async cleanupCompletedOperations() {
    let removedCount = 0;

    for (const [id, operation] of this.offlineOperations) {
      if (operation.status === 'completed') {
        this.offlineOperations.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await this.saveOfflineOperations();
      Logger.info(`Cleaned up ${removedCount} completed offline operations`);
    }
  }

  /**
   * Get offline operations status
   */
  getOfflineStatus() {
    const operations = Array.from(this.offlineOperations.values());
    
    return {
      isOnline: this.isOnline,
      totalOperations: operations.length,
      pendingOperations: operations.filter(op => op.status === 'pending').length,
      failedOperations: operations.filter(op => op.status === 'failed').length,
      completedOperations: operations.filter(op => op.status === 'completed').length,
      conflictOperations: operations.filter(op => op.status === 'conflict_pending').length
    };
  }

  /**
   * Generate unique operation ID
   */
  generateOperationId() {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Email operation implementations (these would call the actual email services)

  async markEmailsAsRead(emailIds, isRead, userId) {
    const emailManagementService = await import('@features/email/services/emailManagementService');
    return await emailManagementService.default.markAsRead(emailIds, userId, isRead);
  }

  async markEmailsAsStarred(emailIds, isStarred, userId) {
    const emailManagementService = await import('@features/email/services/emailManagementService');
    return await emailManagementService.default.markAsStarred(emailIds, userId, isStarred);
  }

  async moveEmails(emailIds, folderId, userId) {
    const emailManagementService = await import('@features/email/services/emailManagementService');
    return await emailManagementService.default.moveEmails(emailIds, folderId, userId);
  }

  async deleteEmails(emailIds, userId) {
    const emailManagementService = await import('@features/email/services/emailManagementService');
    return await emailManagementService.default.deleteEmails(emailIds, userId);
  }

  async addLabelsToEmails(emailIds, labels, userId) {
    const emailManagementService = await import('@features/email/services/emailManagementService');
    return await emailManagementService.default.addLabels(emailIds, labels, userId);
  }

  async removeLabelsFromEmails(emailIds, labels, userId) {
    const emailManagementService = await import('@features/email/services/emailManagementService');
    return await emailManagementService.default.removeLabels(emailIds, labels, userId);
  }

  async sendEmailOffline(emailData, userId) {
    const emailManagementService = await import('@features/email/services/emailManagementService');
    return await emailManagementService.default.sendEmail(userId, emailData);
  }

  async createDraft(draftData, userId) {
    const emailManagementService = await import('@features/email/services/emailManagementService');
    return await emailManagementService.default.createDraft(draftData, userId);
  }

  async updateDraft(draftId, draftData, userId) {
    const emailManagementService = await import('@features/email/services/emailManagementService');
    return await emailManagementService.default.updateDraft(draftId, draftData, userId);
  }
}

// Export singleton instance with lazy initialization
let emailOfflineServiceInstance = null;

export const getEmailOfflineService = () => {
  if (!emailOfflineServiceInstance) {
    emailOfflineServiceInstance = new EmailOfflineService();
  }
  return emailOfflineServiceInstance;
};

// Export default instance for backward compatibility
export default getEmailOfflineService;
