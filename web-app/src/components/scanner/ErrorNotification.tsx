// User-friendly error notifications for scanner operations
import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  XMarkIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { ErrorType, RecoveryAction } from '@/services/scanner/errorRecoveryService';

export enum NotificationType {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success'
}

export interface ErrorNotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  errorType?: ErrorType;
  recoveryAction?: RecoveryAction;
  isRecoverable?: boolean;
  autoHide?: boolean;
  hideDelay?: number;
  onRetry?: () => void;
  onDismiss?: () => void;
  onAction?: (action: string) => void;
  actions?: Array<{
    label: string;
    action: string;
    primary?: boolean;
  }>;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  type,
  title,
  message,
  errorType,
  recoveryAction,
  isRecoverable = false,
  autoHide = false,
  hideDelay = 5000,
  onRetry,
  onDismiss,
  onAction,
  actions = []
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [countdown, setCountdown] = useState(hideDelay / 1000);

  useEffect(() => {
    if (autoHide && type !== NotificationType.ERROR) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, hideDelay);

      // Countdown for auto-hide
      const countdownInterval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [autoHide, hideDelay, type, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleAction = (actionKey: string) => {
    if (actionKey === 'retry' && onRetry) {
      onRetry();
    } else if (onAction) {
      onAction(actionKey);
    }
  };

  const getNotificationStyles = () => {
    switch (type) {
      case NotificationType.ERROR:
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-400',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500'
        };
      case NotificationType.WARNING:
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-400',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          button: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500'
        };
      case NotificationType.INFO:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-400',
          title: 'text-blue-800',
          message: 'text-blue-700',
          button: 'bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-500'
        };
      case NotificationType.SUCCESS:
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'text-green-400',
          title: 'text-green-800',
          message: 'text-green-700',
          button: 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200',
          icon: 'text-gray-400',
          title: 'text-gray-800',
          message: 'text-gray-700',
          button: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case NotificationType.ERROR:
        return ExclamationTriangleIcon;
      case NotificationType.WARNING:
        return ExclamationTriangleIcon;
      case NotificationType.INFO:
        return InformationCircleIcon;
      case NotificationType.SUCCESS:
        return CheckCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getRecoveryMessage = () => {
    if (!recoveryAction) return null;

    switch (recoveryAction) {
      case RecoveryAction.RETRY:
        return 'Retrying automatically...';
      case RecoveryAction.FALLBACK_PROVIDER:
        return 'Switching to alternative service...';
      case RecoveryAction.REDUCE_QUALITY:
        return 'Reducing image quality for better compatibility...';
      case RecoveryAction.SIMPLIFY_REQUEST:
        return 'Simplifying processing options...';
      case RecoveryAction.WAIT_AND_RETRY:
        return 'Waiting before retry...';
      case RecoveryAction.SWITCH_METHOD:
        return 'Consider switching to file upload...';
      case RecoveryAction.MANUAL_INPUT:
        return 'Manual text input is available...';
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  const styles = getNotificationStyles();
  const IconComponent = getIcon();
  const recoveryMessage = getRecoveryMessage();

  return (
    <div className={`rounded-md border p-4 ${styles.container} transition-all duration-300 ease-in-out`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${styles.title}`}>
            {title}
            {autoHide && type !== NotificationType.ERROR && countdown > 0 && (
              <span className="ml-2 text-xs opacity-75">
                (auto-hide in {countdown}s)
              </span>
            )}
          </h3>
          <div className={`mt-2 text-sm ${styles.message}`}>
            <p>{message}</p>
            {recoveryMessage && (
              <p className="mt-1 text-xs opacity-75 italic">
                {recoveryMessage}
              </p>
            )}
          </div>

          {/* Error-specific information */}
          {errorType && process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs opacity-60">
              Error Type: {errorType}
              {recoveryAction && ` | Recovery: ${recoveryAction}`}
            </div>
          )}

          {/* Actions */}
          {(isRecoverable || actions.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {isRecoverable && onRetry && (
                <button
                  type="button"
                  onClick={() => handleAction('retry')}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
                >
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  Try Again
                </button>
              )}

              {actions.map((action, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAction(action.action)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    action.primary 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
                      : styles.button
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={handleDismiss}
              className={`inline-flex rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorNotification;

// Hook for managing error notifications
export const useErrorNotifications = () => {
  const [notifications, setNotifications] = useState<Array<ErrorNotificationProps & { id: string }>>([]);

  const addNotification = (notification: Omit<ErrorNotificationProps, 'onDismiss'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = {
      ...notification,
      id,
      onDismiss: () => removeNotification(id)
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove error notifications after a longer delay
    if (notification.type === NotificationType.ERROR) {
      setTimeout(() => {
        removeNotification(id);
      }, 10000); // 10 seconds for errors
    }

    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const addErrorNotification = (
    title: string, 
    message: string, 
    options: Partial<ErrorNotificationProps> = {}
  ) => {
    return addNotification({
      type: NotificationType.ERROR,
      title,
      message,
      isRecoverable: true,
      ...options
    });
  };

  const addWarningNotification = (
    title: string, 
    message: string, 
    options: Partial<ErrorNotificationProps> = {}
  ) => {
    return addNotification({
      type: NotificationType.WARNING,
      title,
      message,
      autoHide: true,
      hideDelay: 7000,
      ...options
    });
  };

  const addInfoNotification = (
    title: string, 
    message: string, 
    options: Partial<ErrorNotificationProps> = {}
  ) => {
    return addNotification({
      type: NotificationType.INFO,
      title,
      message,
      autoHide: true,
      hideDelay: 5000,
      ...options
    });
  };

  const addSuccessNotification = (
    title: string, 
    message: string, 
    options: Partial<ErrorNotificationProps> = {}
  ) => {
    return addNotification({
      type: NotificationType.SUCCESS,
      title,
      message,
      autoHide: true,
      hideDelay: 4000,
      ...options
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    addErrorNotification,
    addWarningNotification,
    addInfoNotification,
    addSuccessNotification
  };
};

// Notification container component
export const NotificationContainer: React.FC<{
  notifications: Array<ErrorNotificationProps & { id: string }>;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}> = ({ 
  notifications, 
  position = 'top-right' 
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className={`fixed z-50 ${getPositionClasses()} max-w-sm w-full space-y-3`}>
      {notifications.map((notification) => (
        <ErrorNotification
          key={notification.id}
          {...notification}
        />
      ))}
    </div>
  );
};