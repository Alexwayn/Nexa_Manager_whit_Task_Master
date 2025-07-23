import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useEmailContext } from '@context/EmailContext';
import { useWebSocketContext } from '@providers/WebSocketProvider';
import emailNotificationService from '@lib/emailNotificationService';
import Logger from '@utils/Logger';

/**
 * Custom hook for email notifications
 * Handles real-time email notifications and user preferences
 */
export const useEmailNotifications = () => {
  const { user } = useUser();
  const { notifications, addNotification, removeNotification, markNotificationRead } = useEmailContext();
  const { subscribe, isConnected } = useWebSocketContext();
  
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize notification service and load settings
  useEffect(() => {
    if (user?.id) {
      initializeNotifications();
      setupWebSocketSubscriptions();
    }
  }, [user?.id, isConnected]);

  /**
   * Initialize notification service
   */
  const initializeNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize notification service
      const initResult = await emailNotificationService.initialize(user.id);
      
      if (!initResult.success) {
        throw new Error(initResult.error);
      }

      // Load notification settings
      await loadNotificationSettings();
      
      Logger.info('Email notifications initialized for user:', user.id);
    } catch (err) {
      const errorMessage = err.message || 'Failed to initialize notifications';
      setError(errorMessage);
      Logger.error('Error initializing email notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Setup WebSocket subscriptions for real-time notifications
   */
  const setupWebSocketSubscriptions = () => {
    if (!isConnected) return;

    // Subscribe to email events for notifications
    const unsubscribeEmail = subscribe('email', handleEmailNotification);
    const unsubscribeSync = subscribe('email:sync', handleSyncNotification);
    const unsubscribeNotification = subscribe('notification', handleNotificationUpdate);

    return () => {
      unsubscribeEmail();
      unsubscribeSync();
      unsubscribeNotification();
    };
  };

  /**
   * Handle email-related notifications
   */
  const handleEmailNotification = useCallback(async (message) => {
    const { type, data } = message;

    try {
      switch (type) {
        case 'email:new':
          await emailNotificationService.createNewEmailNotification(data.email, user.id);
          
          // Add to context if important
          if (data.email.isImportant) {
            await emailNotificationService.createImportantEmailNotification(data.email, user.id);
          }
          break;

        case 'email:sent':
          await emailNotificationService.createEmailSentNotification(data.email, user.id);
          break;

        case 'email:send_failed':
          await emailNotificationService.createEmailFailedNotification(
            data.error,
            data.emailData,
            user.id
          );
          break;

        default:
          Logger.debug('Unknown email notification type:', type);
      }
    } catch (error) {
      Logger.error('Error handling email notification:', error);
    }
  }, [user?.id]);

  /**
   * Handle sync-related notifications
   */
  const handleSyncNotification = useCallback(async (message) => {
    const { type, data } = message;

    try {
      if (type === 'sync:completed' || type === 'sync:error') {
        await emailNotificationService.createSyncNotification(
          { status: type.split(':')[1], ...data },
          user.id
        );
      }
    } catch (error) {
      Logger.error('Error handling sync notification:', error);
    }
  }, [user?.id]);

  /**
   * Handle notification updates
   */
  const handleNotificationUpdate = useCallback((message) => {
    const { type, data } = message;

    switch (type) {
      case 'notification:created':
        addNotification(data);
        break;

      case 'notification:read':
        markNotificationRead(data.notificationId);
        break;

      case 'notification:deleted':
        removeNotification(data.notificationId);
        break;

      default:
        Logger.debug('Unknown notification update type:', type);
    }
  }, [addNotification, markNotificationRead, removeNotification]);

  /**
   * Load notification settings
   */
  const loadNotificationSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      const settings = await emailNotificationService.loadNotificationSettings(user.id);
      setNotificationSettings(settings);
      return { success: true, data: settings };
    } catch (error) {
      const errorMessage = error.message || 'Failed to load notification settings';
      setError(errorMessage);
      Logger.error('Error loading notification settings:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id]);

  /**
   * Update notification settings
   */
  const updateNotificationSettings = useCallback(async (newSettings) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      const result = await emailNotificationService.updateNotificationSettings(user.id, newSettings);
      
      if (result.success) {
        setNotificationSettings(result.data);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to update notification settings';
      setError(errorMessage);
      Logger.error('Error updating notification settings:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Get user notifications
   */
  const getUserNotifications = useCallback(async (options = {}) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await emailNotificationService.getUserNotifications(user.id, options);
      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to get notifications';
      Logger.error('Error getting user notifications:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await emailNotificationService.markNotificationRead(notificationId, user.id);
      
      if (result.success) {
        markNotificationRead(notificationId);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to mark notification as read';
      Logger.error('Error marking notification as read:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id, markNotificationRead]);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await emailNotificationService.deleteNotification(notificationId, user.id);
      
      if (result.success) {
        removeNotification(notificationId);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete notification';
      Logger.error('Error deleting notification:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id, removeNotification]);

  /**
   * Create custom notification
   */
  const createNotification = useCallback(async (notificationData) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const notification = {
        ...notificationData,
        userId: user.id,
        timestamp: new Date(),
        read: false,
      };

      const result = await emailNotificationService.queueNotification(notification);
      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to create notification';
      Logger.error('Error creating notification:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id]);

  /**
   * Test notification system
   */
  const testNotification = useCallback(async (type = 'test') => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const testNotification = {
        id: `test_${Date.now()}`,
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working.',
        userId: user.id,
        priority: 'normal',
        timestamp: new Date(),
        read: false,
        autoHide: true,
        hideAfter: 5000,
      };

      const result = await emailNotificationService.queueNotification(testNotification);
      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to send test notification';
      Logger.error('Error sending test notification:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id]);

  /**
   * Get notification statistics
   */
  const getNotificationStats = useCallback(() => {
    const unreadNotifications = notifications.filter(n => !n.read);
    const importantNotifications = notifications.filter(n => n.priority === 'high');
    const recentNotifications = notifications.filter(
      n => new Date() - new Date(n.timestamp) < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    return {
      total: notifications.length,
      unread: unreadNotifications.length,
      important: importantNotifications.length,
      recent: recentNotifications.length,
      byType: notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {}),
    };
  }, [notifications]);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(async () => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      // Delete all notifications for user
      const notificationIds = notifications.map(n => n.id);
      
      for (const id of notificationIds) {
        await emailNotificationService.deleteNotification(id, user.id);
      }

      return { success: true, cleared: notificationIds.length };
    } catch (error) {
      const errorMessage = error.message || 'Failed to clear notifications';
      Logger.error('Error clearing notifications:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id, notifications]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        await emailNotificationService.markNotificationRead(notification.id, user.id);
      }

      return { success: true, marked: unreadNotifications.length };
    } catch (error) {
      const errorMessage = error.message || 'Failed to mark all as read';
      Logger.error('Error marking all notifications as read:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id, notifications]);

  // Computed values
  const stats = getNotificationStats();
  const hasUnreadNotifications = stats.unread > 0;
  const hasImportantNotifications = stats.important > 0;

  return {
    // State
    notifications,
    notificationSettings,
    loading,
    error,
    
    // Computed values
    stats,
    hasUnreadNotifications,
    hasImportantNotifications,
    unreadCount: stats.unread,
    
    // Actions
    loadNotificationSettings,
    updateNotificationSettings,
    getUserNotifications,
    markAsRead,
    deleteNotification,
    createNotification,
    testNotification,
    clearAllNotifications,
    markAllAsRead,
    
    // Utility
    clearError: () => setError(null),
  };
};

export default useEmailNotifications;