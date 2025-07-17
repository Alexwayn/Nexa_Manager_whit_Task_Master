import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { toast } from 'react-hot-toast';

/**
 * Hook for managing real-time notifications
 * Handles WebSocket notifications and displays them to the user
 */
export const useRealtimeNotifications = (options = {}) => {
  const {
    enabled = true,
    showToasts = true,
    autoMarkAsRead = true,
    maxNotifications = 50
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    enabled,
    onMessage: handleWebSocketMessage
  });

  /**
   * Handle incoming WebSocket messages
   */
  function handleWebSocketMessage(message) {
    if (message.type === 'notification') {
      addNotification(message.data);
    }
  }

  /**
   * Add a new notification
   */
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: notification.id || Date.now().toString(),
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false,
      data: notification.data || {}
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    setUnreadCount(prev => prev + 1);

    // Show toast notification
    if (showToasts) {
      showToastNotification(newNotification);
    }
  }, [maxNotifications, showToasts]);

  /**
   * Show toast notification based on type
   */
  const showToastNotification = useCallback((notification) => {
    const toastOptions = {
      duration: 4000,
      position: 'top-right'
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.message, toastOptions);
        break;
      case 'error':
        toast.error(notification.message, toastOptions);
        break;
      case 'warning':
        toast.error(notification.message, toastOptions);
        break;
      case 'report_ready':
        toast.success(`📊 ${notification.title}`, {
          ...toastOptions,
          duration: 6000
        });
        break;
      case 'report_failed':
        toast.error(`❌ ${notification.title}`, toastOptions);
        break;
      case 'schedule_executed':
        toast.success(`⏰ ${notification.title}`, toastOptions);
        break;
      default:
        toast(notification.message, toastOptions);
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );

    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  /**
   * Remove specific notification
   */
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  /**
   * Subscribe to specific notification types
   */
  const subscribeToType = useCallback((type) => {
    if (isConnected) {
      subscribe(`notifications:${type}`);
    }
  }, [isConnected, subscribe]);

  /**
   * Unsubscribe from specific notification types
   */
  const unsubscribeFromType = useCallback((type) => {
    if (isConnected) {
      unsubscribe(`notifications:${type}`);
    }
  }, [isConnected, unsubscribe]);

  // Auto-mark as read after a delay
  useEffect(() => {
    if (autoMarkAsRead && notifications.length > 0) {
      const timer = setTimeout(() => {
        const oldNotifications = notifications.filter(
          n => !n.read && Date.now() - new Date(n.timestamp).getTime() > 30000
        );
        
        oldNotifications.forEach(notification => {
          markAsRead(notification.id);
        });
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [notifications, autoMarkAsRead, markAsRead]);

  // Subscribe to general notifications on mount
  useEffect(() => {
    if (enabled && isConnected) {
      subscribe('notifications');
      subscribe('report_notifications');
      subscribe('schedule_notifications');
    }

    return () => {
      if (isConnected) {
        unsubscribe('notifications');
        unsubscribe('report_notifications');
        unsubscribe('schedule_notifications');
      }
    };
  }, [enabled, isConnected, subscribe, unsubscribe]);

  return {
    notifications,
    unreadCount,
    isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    subscribeToType,
    unsubscribeFromType
  };
};

export default useRealtimeNotifications;