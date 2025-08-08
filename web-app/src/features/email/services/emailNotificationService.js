import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';

/**
 * Email Notification Service
 * Handles email-related notifications and alerts
 */
class EmailNotificationService {
  constructor() {
    this.notificationQueue = [];
    this.isProcessing = false;
    this.eventListeners = new Map();
    this.notificationSettings = new Map();
  }

  /**
   * Initialize notification service
   */
  async initialize(userId) {
    try {
      // Load user notification preferences
      await this.loadNotificationSettings(userId);
      
      // Start processing queue
      this.startQueueProcessor();
      
      Logger.info('Email notification service initialized for user:', userId);
      return { success: true };
    } catch (error) {
      Logger.error('Failed to initialize email notification service:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load user notification settings
   */
  async loadNotificationSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Set default settings if none found
      const settings = data || {
        user_id: userId,
        email_notifications: true,
        push_notifications: true,
        in_app_notifications: true,
        new_email_alerts: true,
        important_email_alerts: true,
        digest_frequency: 'daily',
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        weekend_notifications: false,
      };

      this.notificationSettings.set(userId, settings);
      return settings;
    } catch (error) {
      Logger.error('Error loading notification settings:', error);
      throw error;
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(userId, settings) {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.notificationSettings.set(userId, data);
      return { success: true, data };
    } catch (error) {
      Logger.error('Error updating notification settings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create notification for new email
   */
  async createNewEmailNotification(email, userId) {
    try {
      const settings = this.notificationSettings.get(userId);
      
      if (!settings?.new_email_alerts) {
        return { success: true, message: 'New email alerts disabled' };
      }

      // Check if it's during quiet hours
      if (this.isQuietHours(settings)) {
        return { success: true, message: 'Quiet hours active' };
      }

      const notification = {
        id: `email_new_${email.id}_${Date.now()}`,
        type: 'email_new',
        title: 'New Email',
        message: `From: ${email.sender.name || email.sender.email}`,
        subtitle: email.subject,
        userId,
        emailId: email.id,
        priority: email.isImportant ? 'high' : 'normal',
        timestamp: new Date(),
        read: false,
        actions: [
          {
            id: 'mark_read',
            label: 'Mark as Read',
            type: 'primary',
          },
          {
            id: 'view_email',
            label: 'View',
            type: 'secondary',
          },
        ],
        data: {
          emailId: email.id,
          folderId: email.folderId,
          sender: email.sender,
          subject: email.subject,
        },
      };

      await this.queueNotification(notification);
      
      return { success: true, notification };
    } catch (error) {
      Logger.error('Error creating new email notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create notification for important email
   */
  async createImportantEmailNotification(email, userId) {
    try {
      const settings = this.notificationSettings.get(userId);
      
      if (!settings?.important_email_alerts) {
        return { success: true, message: 'Important email alerts disabled' };
      }

      const notification = {
        id: `email_important_${email.id}_${Date.now()}`,
        type: 'email_important',
        title: 'Important Email',
        message: `From: ${email.sender.name || email.sender.email}`,
        subtitle: email.subject,
        userId,
        emailId: email.id,
        priority: 'high',
        timestamp: new Date(),
        read: false,
        persistent: true, // Important notifications stay longer
        actions: [
          {
            id: 'view_email',
            label: 'View Now',
            type: 'primary',
          },
          {
            id: 'mark_read',
            label: 'Mark as Read',
            type: 'secondary',
          },
        ],
        data: {
          emailId: email.id,
          folderId: email.folderId,
          sender: email.sender,
          subject: email.subject,
        },
      };

      await this.queueNotification(notification);
      
      return { success: true, notification };
    } catch (error) {
      Logger.error('Error creating important email notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create notification for email send success
   */
  async createEmailSentNotification(email, userId) {
    try {
      const notification = {
        id: `email_sent_${Date.now()}`,
        type: 'email_sent',
        title: 'Email Sent',
        message: `To: ${email.to}`,
        subtitle: email.subject,
        userId,
        priority: 'low',
        timestamp: new Date(),
        read: false,
        autoHide: true,
        hideAfter: 5000, // Hide after 5 seconds
        data: {
          recipient: email.to,
          subject: email.subject,
        },
      };

      await this.queueNotification(notification);
      
      return { success: true, notification };
    } catch (error) {
      Logger.error('Error creating email sent notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create notification for email send failure
   */
  async createEmailFailedNotification(error, emailData, userId) {
    try {
      const notification = {
        id: `email_failed_${Date.now()}`,
        type: 'email_failed',
        title: 'Email Send Failed',
        message: error.message || 'Failed to send email',
        subtitle: emailData.subject,
        userId,
        priority: 'high',
        timestamp: new Date(),
        read: false,
        persistent: true,
        actions: [
          {
            id: 'retry_send',
            label: 'Retry',
            type: 'primary',
          },
          {
            id: 'save_draft',
            label: 'Save as Draft',
            type: 'secondary',
          },
        ],
        data: {
          emailData,
          error: error.message,
        },
      };

      await this.queueNotification(notification);
      
      return { success: true, notification };
    } catch (error) {
      Logger.error('Error creating email failed notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create notification for sync status
   */
  async createSyncNotification(syncData, userId) {
    try {
      const { status, newEmails, errors } = syncData;
      
      let notification;

      if (status === 'completed' && newEmails > 0) {
        notification = {
          id: `sync_completed_${Date.now()}`,
          type: 'sync_completed',
          title: 'Email Sync Complete',
          message: `${newEmails} new email${newEmails > 1 ? 's' : ''} received`,
          userId,
          priority: 'low',
          timestamp: new Date(),
          read: false,
          autoHide: true,
          hideAfter: 3000,
          data: {
            newEmails,
            timestamp: syncData.timestamp,
          },
        };
      } else if (status === 'error') {
        notification = {
          id: `sync_error_${Date.now()}`,
          type: 'sync_error',
          title: 'Email Sync Error',
          message: errors?.[0]?.error || 'Failed to sync emails',
          userId,
          priority: 'medium',
          timestamp: new Date(),
          read: false,
          actions: [
            {
              id: 'retry_sync',
              label: 'Retry',
              type: 'primary',
            },
          ],
          data: {
            errors,
            timestamp: syncData.timestamp,
          },
        };
      }

      if (notification) {
        await this.queueNotification(notification);
        return { success: true, notification };
      }

      return { success: true, message: 'No notification needed' };
    } catch (error) {
      Logger.error('Error creating sync notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create daily email digest notification
   */
  async createDigestNotification(digestData, userId) {
    try {
      const settings = this.notificationSettings.get(userId);
      
      if (settings?.digest_frequency === 'never') {
        return { success: true, message: 'Digest notifications disabled' };
      }

      const { totalEmails, unreadEmails, importantEmails, topSenders } = digestData;

      const notification = {
        id: `digest_${Date.now()}`,
        type: 'email_digest',
        title: 'Daily Email Summary',
        message: `${unreadEmails} unread, ${importantEmails} important`,
        subtitle: `${totalEmails} total emails today`,
        userId,
        priority: 'low',
        timestamp: new Date(),
        read: false,
        actions: [
          {
            id: 'view_inbox',
            label: 'View Inbox',
            type: 'primary',
          },
        ],
        data: {
          totalEmails,
          unreadEmails,
          importantEmails,
          topSenders,
          date: new Date().toDateString(),
        },
      };

      await this.queueNotification(notification);
      
      return { success: true, notification };
    } catch (error) {
      Logger.error('Error creating digest notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Queue notification for processing
   */
  async queueNotification(notification) {
    try {
      this.notificationQueue.push(notification);
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this.processNotificationQueue();
      }
      
      return { success: true };
    } catch (error) {
      Logger.error('Error queuing notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process notification queue
   */
  async processNotificationQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        await this.processNotification(notification);
      }
    } catch (error) {
      Logger.error('Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual notification
   */
  async processNotification(notification) {
    try {
      const settings = this.notificationSettings.get(notification.userId);
      
      if (!settings) {
        Logger.warn('No notification settings found for user:', notification.userId);
        return;
      }

      // Send in-app notification
      if (settings.in_app_notifications) {
        await this.sendInAppNotification(notification);
      }

      // Send push notification
      if (settings.push_notifications && this.shouldSendPushNotification(notification, settings)) {
        await this.sendPushNotification(notification);
      }

      // Send email notification
      if (settings.email_notifications && this.shouldSendEmailNotification(notification, settings)) {
        await this.sendEmailNotification(notification);
      }

      // Emit event for real-time updates
      this.emitEvent('notification:created', notification);
      
    } catch (error) {
      Logger.error('Error processing notification:', error);
    }
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(notification) {
    try {
      const { data, error } = await supabase
        .from('in_app_notifications')
        .insert({
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          subtitle: notification.subtitle,
          priority: notification.priority,
          read: false,
          persistent: notification.persistent || false,
          auto_hide: notification.autoHide || false,
          hide_after: notification.hideAfter || null,
          actions: notification.actions || [],
          data: notification.data || {},
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      Logger.debug('In-app notification sent:', notification.id);
      return { success: true, data };
    } catch (error) {
      Logger.error('Error sending in-app notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(notification) {
    try {
      // This would integrate with a push notification service
      // like Firebase Cloud Messaging, Apple Push Notification service, etc.
      
      Logger.info('Push notification would be sent:', {
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
      });

      // For now, just log the notification
      return { success: true };
    } catch (error) {
      Logger.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(notification) {
    try {
      // This would integrate with an email service
      // to send notification emails
      
      Logger.info('Email notification would be sent:', {
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
      });

      // For now, just log the notification
      return { success: true };
    } catch (error) {
      Logger.error('Error sending email notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if push notification should be sent
   */
  shouldSendPushNotification(notification, settings) {
    // Don't send push for low priority notifications
    if (notification.priority === 'low') {
      return false;
    }

    // Check quiet hours
    if (this.isQuietHours(settings)) {
      return notification.priority === 'high';
    }

    // Check weekend settings
    if (!settings.weekend_notifications && this.isWeekend()) {
      return notification.priority === 'high';
    }

    return true;
  }

  /**
   * Check if email notification should be sent
   */
  shouldSendEmailNotification(notification, settings) {
    // Only send email notifications for high priority items
    return notification.priority === 'high';
  }

  /**
   * Check if current time is within quiet hours
   */
  isQuietHours(settings) {
    if (!settings.quiet_hours_start || !settings.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = settings.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Same day quiet hours
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Check if current day is weekend
   */
  isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Start queue processor
   */
  startQueueProcessor() {
    // Process queue every 1 second
    setInterval(() => {
      if (!this.isProcessing && this.notificationQueue.length > 0) {
        this.processNotificationQueue();
      }
    }, 1000);
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = options;
      
      let query = supabase
        .from('in_app_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error getting user notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId, userId) {
    try {
      const { data, error } = await supabase
        .from('in_app_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.emitEvent('notification:read', { notificationId, userId });
      
      return { success: true, data };
    } catch (error) {
      Logger.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('in_app_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      this.emitEvent('notification:deleted', { notificationId, userId });
      
      return { success: true };
    } catch (error) {
      Logger.error('Error deleting notification:', error);
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
    this.notificationQueue = [];
    this.isProcessing = false;
    this.eventListeners.clear();
    this.notificationSettings.clear();
    
    Logger.info('Email notification service cleaned up');
  }
}

let emailNotificationServiceInstance = null;

export const getEmailNotificationService = () => {
  if (!emailNotificationServiceInstance) {
    emailNotificationServiceInstance = new EmailNotificationService();
  }
  return emailNotificationServiceInstance;
};

export default getEmailNotificationService;
