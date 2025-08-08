import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  FileText,
  Calendar
} from 'lucide-react';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';

/**
 * Notification Center Component
 * Displays real-time notifications with filtering and management capabilities
 */
const NotificationCenter = ({ className = '' }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'reports', 'schedules'
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification
  } = useRealtimeNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Filter notifications based on current filter
   */
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'reports':
        return ['report_ready', 'report_failed', 'report_generated'].includes(notification.type);
      case 'schedules':
        return ['schedule_executed', 'schedule_failed', 'schedule_created'].includes(notification.type);
      default:
        return true;
    }
  });

  /**
   * Get notification icon based on type
   */
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
      case 'report_ready':
      case 'schedule_executed':
        return CheckCircle;
      case 'error':
      case 'report_failed':
      case 'schedule_failed':
        return AlertCircle;
      case 'warning':
        return AlertCircle;
      case 'report_generated':
      case 'report_scheduled':
        return FileText;
      case 'schedule_created':
      case 'schedule_updated':
        return Calendar;
      default:
        return Info;
    }
  };

  /**
   * Get notification color based on type
   */
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
      case 'report_ready':
      case 'schedule_executed':
        return 'text-green-500';
      case 'error':
      case 'report_failed':
      case 'schedule_failed':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };

  /**
   * Format relative time
   */
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return t('notifications.justNow');
    if (diffInMinutes < 60) return t('notifications.minutesAgo', { count: diffInMinutes });
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('notifications.hoursAgo', { count: diffInHours });
    
    const diffInDays = Math.floor(diffInHours / 24);
    return t('notifications.daysAgo', { count: diffInDays });
  };

  /**
   * Handle notification click
   */
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Handle notification-specific actions
    if (notification.data?.url) {
      window.open(notification.data.url, '_blank');
    } else if (notification.data?.action) {
      // Execute custom action
      notification.data.action();
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          isConnected 
            ? 'text-gray-600 hover:bg-gray-100' 
            : 'text-gray-400'
        }`}
        title={t('notifications.title')}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 bg-red-500 rounded-full w-3 h-3" />
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{t('notifications.title')}</h3>
              <span className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                  title={t('notifications.markAllRead')}
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                title={t('notifications.settings')}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">{t('notifications.settings')}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">{t('notifications.filterAll')}</option>
                  <option value="unread">{t('notifications.filterUnread')}</option>
                  <option value="reports">{t('notifications.filterReports')}</option>
                  <option value="schedules">{t('notifications.filterSchedules')}</option>
                </select>
              </div>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                {t('notifications.clearAll')}
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>{t('notifications.empty')}</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded-full ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium text-gray-900 ${
                              !notification.read ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title={t('notifications.markRead')}
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title={t('notifications.remove')}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(notification.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  // Navigate to full notifications page
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {t('notifications.viewAll')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
