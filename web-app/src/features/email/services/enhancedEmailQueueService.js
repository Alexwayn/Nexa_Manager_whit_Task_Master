import { emailErrorHandler, emailProviderService } from '@features/email';
import { supabase } from '@/lib/supabaseClient';
import Logger from '@shared/utils/logger';
import { notify } from '@shared/utils';

/**
 * Enhanced Email Queue Service with comprehensive error handling and recovery
 * Manages email queue operations with retry logic, failure recovery, and offline support
 */
class EnhancedEmailQueueService {
  constructor() {
    this.isProcessing = false;
    this.processingInterval = null;
    this.retryQueue = new Map(); // Failed items with retry info
    this.deadLetterQueue = new Map(); // Permanently failed items
    this.offlineQueue = new Map(); // Items queued while offline
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds base delay
    this.processingDelay = 1000; // 1 second between queue items
    this.maxConcurrentProcessing = 3;
    this.currentlyProcessing = new Set();
    
    // Queue statistics
    this.stats = {
      processed: 0,
      failed: 0,
      retried: 0,
      deadLettered: 0,
      startTime: null
    };

    // Setup network listeners for offline/online handling
    this.setupNetworkListeners();
  }

  /**
   * Setup network event listeners
   */
  setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineEvent());
      window.addEventListener('offline', () => this.handleOfflineEvent());
    }
  }

  /**
   * Handle online event - process offline queue
   */
  async handleOnlineEvent() {
    Logger.info('Network connection restored, processing offline queue');
    notify.success('Connection restored. Processing queued emails...');
    
    // Move offline queue items back to main queue
    for (const [id, item] of this.offlineQueue) {
      await this.addToQueue(item.type, item.data, item.options);
      this.offlineQueue.delete(id);
    }
  }

  /**
   * Handle offline event
   */
  handleOfflineEvent() {
    Logger.info('Network connection lost, entering offline mode');
    notify.warning('Connection lost. Emails will be queued for sending when connection is restored.');
  }

  /**
   * Start the queue processing
   */
  async startQueue() {
    if (this.isProcessing) {
      Logger.warn('Email queue is already processing');
      return { success: false, error: 'Queue already running' };
    }

    try {
      this.isProcessing = true;
      this.stats.startTime = new Date();
      
      // Start processing interval
      this.processingInterval = setInterval(
        () => this.processQueue(),
        this.processingDelay
      );

      // Start retry processing interval
      this.retryInterval = setInterval(
        () => this.processRetryQueue(),
        this.retryDelay
      );

      Logger.info('Email queue processing started');
      return { success: true };
    } catch (error) {
      Logger.error('Failed to start email queue:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop the queue processing
   */
  async stopQueue() {
    this.isProcessing = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }

    // Wait for current processing to complete
    while (this.currentlyProcessing.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    Logger.info('Email queue processing stopped');
    return { success: true };
  }

  /**
   * Add item to queue with error handling
   */
  async addToQueue(type, data, options = {}) {
    try {
      // Check if we're offline
      if (!navigator.onLine) {
        return await this.addToOfflineQueue(type, data, options);
      }

      const queueItem = {
        id: this.generateQueueId(),
        type,
        data,
        options,
        status: 'pending',
        createdAt: new Date().toISOString(),
        attempts: 0,
        lastAttempt: null,
        errors: []
      };

      // Add to database queue
      const { error } = await supabase
        .from('email_queue')
        .insert([queueItem]);

      if (error) {
        throw error;
      }

      Logger.debug('Added item to email queue:', queueItem.id);
      return { success: true, queueId: queueItem.id };
    } catch (error) {
      Logger.error('Failed to add item to queue:', error);
      
      // Fallback to offline queue if database fails
      return await this.addToOfflineQueue(type, data, options);
    }
  }

  /**
   * Add item to offline queue
   */
  async addToOfflineQueue(type, data, options = {}) {
    const queueItem = {
      id: this.generateQueueId(),
      type,
      data,
      options,
      status: 'offline',
      createdAt: new Date().toISOString()
    };

    this.offlineQueue.set(queueItem.id, queueItem);
    Logger.info('Added item to offline queue:', queueItem.id);
    
    return { success: true, queueId: queueItem.id, offline: true };
  }

  /**
   * Process main queue
   */
  async processQueue() {
    if (!this.isProcessing || this.currentlyProcessing.size >= this.maxConcurrentProcessing) {
      return;
    }

    try {
      // Get pending items from queue
      const { data: queueItems, error } = await supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(this.maxConcurrentProcessing - this.currentlyProcessing.size);

      if (error) {
        Logger.error('Failed to fetch queue items:', error);
        return;
      }

      if (!queueItems || queueItems.length === 0) {
        return;
      }

      // Process each item
      for (const item of queueItems) {
        if (this.currentlyProcessing.size >= this.maxConcurrentProcessing) {
          break;
        }
        
        this.processQueueItem(item);
      }
    } catch (error) {
      Logger.error('Error processing queue:', error);
    }
  }

  /**
   * Process individual queue item with error handling
   */
  async processQueueItem(item) {
    if (this.currentlyProcessing.has(item.id)) {
      return;
    }

    this.currentlyProcessing.add(item.id);

    try {
      // Update item status to processing
      await this.updateQueueItemStatus(item.id, 'processing');

      // Process based on type
      const result = await emailErrorHandler.withErrorHandling(
        () => this.executeQueueItem(item),
        {
          operation: `queue_${item.type}`,
          queueId: item.id,
          attempt: item.attempts + 1
        }
      );

      if (result.success) {
        // Mark as completed
        await this.updateQueueItemStatus(item.id, 'completed');
        this.stats.processed++;
        Logger.debug('Queue item processed successfully:', item.id);
      } else {
        // Handle failure
        await this.handleQueueItemFailure(item, result.error, result.userMessage);
      }
    } catch (error) {
      Logger.error('Unexpected error processing queue item:', error);
      await this.handleQueueItemFailure(item, error);
    } finally {
      this.currentlyProcessing.delete(item.id);
    }
  }

  /**
   * Execute queue item based on type
   */
  async executeQueueItem(item) {
    switch (item.type) {
      case 'send_email':
        return await this.processSendEmail(item);
      case 'send_campaign':
        return await this.processSendCampaign(item);
      case 'send_automated':
        return await this.processSendAutomated(item);
      case 'sync_emails':
        return await this.processSyncEmails(item);
      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  }

  /**
   * Process send email queue item
   */
  async processSendEmail(item) {
    const { emailData, userId } = item.data;
    
    // Send email via provider service
    const result = await emailProviderService.sendEmail(emailData);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    // Store sent email record
    if (result.messageId) {
      await this.storeSentEmailRecord(emailData, result.messageId, userId);
    }

    return result;
  }

  /**
   * Process send campaign queue item
   */
  async processSendCampaign(item) {
    const { campaignId, recipientBatch } = item.data;
    
    // Process campaign batch
    const results = [];
    for (const recipient of recipientBatch) {
      try {
        const emailData = await this.prepareCampaignEmail(campaignId, recipient);
        const result = await emailProviderService.sendEmail(emailData);
        results.push({ recipient: recipient.email, success: result.success, messageId: result.messageId });
      } catch (error) {
        results.push({ recipient: recipient.email, success: false, error: error.message });
      }
    }

    return { results, batchSize: recipientBatch.length };
  }

  /**
   * Process automated email queue item
   */
  async processSendAutomated(item) {
    const { workflowId, triggerId, recipientData } = item.data;
    
    // Execute automated workflow
    const emailData = await this.prepareAutomatedEmail(workflowId, triggerId, recipientData);
    const result = await emailProviderService.sendEmail(emailData);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send automated email');
    }

    return result;
  }

  /**
   * Process email sync queue item
   */
  async processSyncEmails(item) {
    const { userId, accountId } = item.data;
    
    // Trigger email sync
    const { emailSyncService } = await import('@features/email');
    const result = await emailSyncService.performSync(userId, [{ id: accountId }]);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to sync emails');
    }

    return result;
  }

  /**
   * Handle queue item failure
   */
  async handleQueueItemFailure(item, error, userMessage) {
    const attempts = item.attempts + 1;
    const errorInfo = {
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      attempt: attempts
    };

    // Update item with error info
    const updatedErrors = [...(item.errors || []), errorInfo];

    if (attempts < this.maxRetries) {
      // Add to retry queue
      await this.addToRetryQueue(item, updatedErrors, attempts);
      this.stats.retried++;
    } else {
      // Move to dead letter queue
      await this.moveToDeadLetterQueue(item, updatedErrors);
      this.stats.deadLettered++;
      
      // Notify user of permanent failure
      if (userMessage) {
        notify.error(`Email operation failed permanently: ${userMessage}`);
      }
    }

    this.stats.failed++;
  }

  /**
   * Add item to retry queue
   */
  async addToRetryQueue(item, errors, attempts) {
    const retryItem = {
      ...item,
      attempts,
      errors,
      retryAt: new Date(Date.now() + this.calculateRetryDelay(attempts)).toISOString(),
      status: 'retry_pending'
    };

    this.retryQueue.set(item.id, retryItem);
    
    // Update in database
    await this.updateQueueItemStatus(item.id, 'retry_pending', {
      attempts,
      errors,
      retry_at: retryItem.retryAt
    });

    Logger.info(`Added item to retry queue (attempt ${attempts}):`, item.id);
  }

  /**
   * Process retry queue
   */
  async processRetryQueue() {
    const now = new Date();
    
    for (const [id, item] of this.retryQueue) {
      if (new Date(item.retryAt) <= now) {
        // Move back to main queue
        await this.updateQueueItemStatus(id, 'pending');
        this.retryQueue.delete(id);
        Logger.info('Moved item from retry queue back to main queue:', id);
      }
    }
  }

  /**
   * Move item to dead letter queue
   */
  async moveToDeadLetterQueue(item, errors) {
    const deadLetterItem = {
      ...item,
      errors,
      status: 'failed',
      failedAt: new Date().toISOString()
    };

    this.deadLetterQueue.set(item.id, deadLetterItem);
    
    // Update in database
    await this.updateQueueItemStatus(item.id, 'failed', {
      errors,
      failed_at: deadLetterItem.failedAt
    });

    Logger.error('Moved item to dead letter queue:', item.id);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt) {
    const baseDelay = this.retryDelay;
    const maxDelay = 300000; // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // Add jitter
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Update queue item status
   */
  async updateQueueItemStatus(id, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      const { error } = await supabase
        .from('email_queue')
        .update(updateData)
        .eq('id', id);

      if (error) {
        Logger.error('Failed to update queue item status:', error);
      }
    } catch (error) {
      Logger.error('Error updating queue item status:', error);
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const uptime = this.stats.startTime ? Date.now() - this.stats.startTime.getTime() : 0;
    
    return {
      ...this.stats,
      uptime,
      isProcessing: this.isProcessing,
      currentlyProcessing: this.currentlyProcessing.size,
      retryQueueSize: this.retryQueue.size,
      deadLetterQueueSize: this.deadLetterQueue.size,
      offlineQueueSize: this.offlineQueue.size
    };
  }

  /**
   * Retry failed items from dead letter queue
   */
  async retryFailedItems(itemIds = null) {
    try {
      const itemsToRetry = itemIds 
        ? Array.from(this.deadLetterQueue.entries()).filter(([id]) => itemIds.includes(id))
        : Array.from(this.deadLetterQueue.entries());

      let retriedCount = 0;
      
      for (const [id, item] of itemsToRetry) {
        // Reset attempts and move back to main queue
        const resetItem = {
          ...item,
          attempts: 0,
          errors: [],
          status: 'pending'
        };

        await this.updateQueueItemStatus(id, 'pending', {
          attempts: 0,
          errors: [],
          retry_at: null,
          failed_at: null
        });

        this.deadLetterQueue.delete(id);
        retriedCount++;
      }

      Logger.info(`Retried ${retriedCount} failed items from dead letter queue`);
      notify.success(`Retrying ${retriedCount} failed email operations`);
      
      return { success: true, retriedCount };
    } catch (error) {
      Logger.error('Failed to retry failed items:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear completed items from queue
   */
  async clearCompletedItems(olderThanHours = 24) {
    try {
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('email_queue')
        .delete()
        .eq('status', 'completed')
        .lt('updated_at', cutoffTime);

      if (error) {
        throw error;
      }

      Logger.info(`Cleared completed queue items older than ${olderThanHours} hours`);
      return { success: true };
    } catch (error) {
      Logger.error('Failed to clear completed items:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate unique queue ID
   */
  generateQueueId() {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper methods for queue item processing

  async storeSentEmailRecord(emailData, messageId, userId) {
    // Implementation for storing sent email record
    Logger.debug('Storing sent email record:', messageId);
  }

  async prepareCampaignEmail(campaignId, recipient) {
    // Implementation for preparing campaign email
    Logger.debug('Preparing campaign email for:', recipient.email);
    return {}; // Return prepared email data
  }

  async prepareAutomatedEmail(workflowId, triggerId, recipientData) {
    // Implementation for preparing automated email
    Logger.debug('Preparing automated email for workflow:', workflowId);
    return {}; // Return prepared email data
  }
}

// Export singleton instance with lazy initialization
let enhancedEmailQueueServiceInstance = null;

export const getEnhancedEmailQueueService = () => {
  if (!enhancedEmailQueueServiceInstance) {
    enhancedEmailQueueServiceInstance = new EnhancedEmailQueueService();
  }
  return enhancedEmailQueueServiceInstance;
};

// For backward compatibility
const enhancedEmailQueueService = getEnhancedEmailQueueService();
export default enhancedEmailQueueService;
