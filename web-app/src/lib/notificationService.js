/**
 * Notification Service - Re-export from shared services with additional UI methods
 * This file provides a convenient import path for the notification service
 */

// Import all functions from the shared notification service
export { 
  NOTIFICATION_TYPES,
  DELIVERY_STATUS,
  QUEUE_STATUS,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  createEventReminders,
  scheduleEventNotifications,
  sendEventNotification,
  sendEventReminder,
  sendEventCancellation,
  getNotificationStatistics
} from '@/shared/services/notificationService';

/**
 * UI Notification Service for showing toast/popup notifications
 * This provides the show() method expected by voice commands
 */
export const notificationService = {
  /**
   * Show a notification to the user
   * @param {Object} options - Notification options
   * @param {string} options.type - Notification type (success, error, info, warning)
   * @param {string} options.message - Notification message
   * @param {number} options.duration - Duration in milliseconds
   */
  show: (options) => {
    const { type = 'info', message, duration = 3000 } = options;
    
    // In a real implementation, this would show a toast notification
    // For now, we'll just log it and potentially dispatch an event
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Dispatch a custom event that UI components can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notification', {
        detail: { type, message, duration }
      }));
    }
    
    return Promise.resolve({ success: true });
  },

  /**
   * Show success notification
   * @param {string} message - Success message
   * @param {number} duration - Duration in milliseconds
   */
  success: (message, duration = 3000) => {
    return notificationService.show({ type: 'success', message, duration });
  },

  /**
   * Show error notification
   * @param {string} message - Error message
   * @param {number} duration - Duration in milliseconds
   */
  error: (message, duration = 5000) => {
    return notificationService.show({ type: 'error', message, duration });
  },

  /**
   * Show info notification
   * @param {string} message - Info message
   * @param {number} duration - Duration in milliseconds
   */
  info: (message, duration = 3000) => {
    return notificationService.show({ type: 'info', message, duration });
  },

  /**
   * Show warning notification
   * @param {string} message - Warning message
   * @param {number} duration - Duration in milliseconds
   */
  warning: (message, duration = 4000) => {
    return notificationService.show({ type: 'warning', message, duration });
  }
};

// Default export
export default notificationService;
