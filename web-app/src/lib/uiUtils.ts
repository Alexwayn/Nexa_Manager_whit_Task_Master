import toast from 'react-hot-toast';
import React from 'react';
import Logger from '@utils/Logger';

// Translation function - to be integrated with i18n system
const t = (key: string, params?: Record<string, unknown>): string => {
  // This is a placeholder function that will be replaced with actual i18n implementation
  const translations: Record<string, string> = {
    // Toast Messages
    'ui.toast.loading': 'Loading...',
    'ui.toast.operationCompleted': 'Operation completed!',
    'ui.toast.operationFailed': 'Error: {{message}}',
    'ui.toast.unexpectedError': 'Operation failed',

    // Error Messages
    'ui.error.unexpected': 'An unexpected error occurred',
    'ui.error.api': 'API Error',
    'ui.error.database': 'Database error',
    'ui.error.duplicateKey': 'This item already exists',
    'ui.error.foreignKey': 'Cannot delete: item is in use',
    'ui.error.notFound': 'Item not found',
    'ui.error.permissionDenied': 'Insufficient permissions',

    // Validation Messages
    'ui.validation.defaultField': 'This field',
    'ui.validation.required': '{{fieldName}} is required',
    'ui.validation.invalidEmail': 'Invalid email',
    'ui.validation.minLength': '{{fieldName}} must be at least {{min}} characters long',
    'ui.validation.maxLength': '{{fieldName}} can be at most {{max}} characters long',
    'ui.validation.mustBeNumber': '{{fieldName}} must be a number',
    'ui.validation.mustBePositive': '{{fieldName}} must be positive',

    // Time Formatting
    'ui.time.now': 'Now',
    'ui.time.minutesAgo': '{{count}} min ago',
    'ui.time.hoursAgo': '{{count}} hours ago',
    'ui.time.daysAgo': '{{count}} days ago',
    'ui.time.monthsAgo': '{{count}} months ago',
    'ui.time.yearsAgo': '{{count}} years ago',

    // File Size Units
    'ui.fileSize.bytes': 'B',
    'ui.fileSize.kilobytes': 'KB',
    'ui.fileSize.megabytes': 'MB',
    'ui.fileSize.gigabytes': 'GB',

    // UI Actions
    'ui.action.copiedToClipboard': 'Copied to clipboard',
    'ui.action.cannotCopyToClipboard': 'Cannot copy to clipboard',
  };

  let translation = translations[key] || key;

  if (params) {
    Object.keys(params).forEach((param) => {
      translation = translation.replace(`{{${param}}}`, String(params[param]));
    });
  }

  return translation;
};

// Type definitions
interface ToastOptions {
  duration?: number;
  style?: React.CSSProperties;
  iconTheme?: {
    primary: string;
    secondary: string;
  };
}

interface PromiseMessages {
  loading?: string;
  success?: string;
  error?: string | ((err: unknown) => string);
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

type ValidationRule = (value: unknown) => string | null;
type ValidationRules = Record<string, ValidationRule[]>;

interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
}

interface SupabaseError {
  message?: string;
  error_description?: string;
  details?: string;
}

// Toast notification utilities
export const notify = {
  success: (message: string, options: ToastOptions = {}): string => {
    return toast.success(message, {
      duration: 3000,
      style: {
        background: 'var(--toast-bg)',
        color: 'var(--toast-color)',
        border: '1px solid var(--toast-border)',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
      ...options,
    });
  },

  error: (message: string, options: ToastOptions = {}): string => {
    return toast.error(message, {
      duration: 5000,
      style: {
        background: 'var(--toast-bg)',
        color: 'var(--toast-color)',
        border: '1px solid var(--toast-border)',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
      ...options,
    });
  },

  loading: (message: string, options: ToastOptions = {}): string => {
    return toast.loading(message, {
      style: {
        background: 'var(--toast-bg)',
        color: 'var(--toast-color)',
        border: '1px solid var(--toast-border)',
      },
      ...options,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: PromiseMessages,
    options: ToastOptions = {},
  ): Promise<T> => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || t('ui.toast.loading'),
        success: messages.success || t('ui.toast.operationCompleted'),
        error: (err: unknown) =>
          typeof messages.error === 'function'
            ? messages.error(err)
            : messages.error ||
              t('ui.toast.operationFailed', {
                message: (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') ? (err as any).message : t('ui.toast.unexpectedError'),
              }),
      },
      {
        style: {
          background: 'var(--toast-bg)',
          color: 'var(--toast-color)',
          border: '1px solid var(--toast-border)',
        },
        success: { duration: 3000 },
        error: { duration: 5000 },
        ...options,
      },
    );
  },

  custom: (content: React.ReactNode, options: ToastOptions = {}): string => {
    return toast.custom(content as any, { duration: 4000, ...options });
  },

  dismiss: (toastId?: string): void => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
};

// Loading state management
export const loadingManager = {
  show: (message: string = t('ui.toast.loading')): string => notify.loading(message),
  hide: (toastId?: string): void => {
    if (toastId) toast.dismiss(toastId);
  },
  update: (
    toastId: string,
    message: string,
    type: 'loading' | 'success' | 'error' = 'loading',
  ): string => {
    toast.dismiss(toastId);
    if (type === 'success') return notify.success(message);
    if (type === 'error') return notify.error(message);
    return notify.loading(message);
  },
};

// Error handling utilities
export const errorHandler = {
  handle: (error: unknown, context: string = ''): string => {
    Logger.error(`Error in ${context}:`, error);
    let message = t('ui.error.unexpected');

    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      if (typeof errorObj.message === 'string') message = errorObj.message;
      else if (typeof errorObj.error_description === 'string') message = errorObj.error_description;
      else if (typeof errorObj.details === 'string') message = errorObj.details;
    } else if (typeof error === 'string') {
      message = error;
    }

    notify.error(message);
    return message;
  },

  handleApiError: (error: ApiError, defaultMessage: string = t('ui.error.api')): void => {
    Logger.error('API Error:', error);
    if (error?.response?.data?.message) notify.error(error.response.data.message);
    else if (error?.response?.data?.error) notify.error(error.response.data.error);
    else if (error?.message) notify.error(error.message);
    else notify.error(defaultMessage);
  },

  handleSupabaseError: (error: SupabaseError, context: string = ''): string => {
    Logger.error(`Supabase error in ${context}:`, error);
    let message = t('ui.error.database');

    if (error?.message) {
      if (error.message.includes('duplicate key')) message = t('ui.error.duplicateKey');
      else if (error.message.includes('foreign key')) message = t('ui.error.foreignKey');
      else if (error.message.includes('not found')) message = t('ui.error.notFound');
      else if (error.message.includes('permission denied'))
        message = t('ui.error.permissionDenied');
      else message = error.message;
    }

    notify.error(message);
    return message;
  },
};

// Form validation utilities
export const validation = {
  required: (
    value: unknown,
    fieldName: string = t('ui.validation.defaultField'),
  ): string | null => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return t('ui.validation.required', { fieldName });
    }
    return null;
  },

  email: (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return value && !emailRegex.test(value) ? t('ui.validation.invalidEmail') : null;
  },

  minLength: (
    value: string,
    min: number,
    fieldName: string = t('ui.validation.defaultField'),
  ): string | null =>
    value && value.length < min ? t('ui.validation.minLength', { fieldName, min }) : null,

  maxLength: (
    value: string,
    max: number,
    fieldName: string = t('ui.validation.defaultField'),
  ): string | null =>
    value && value.length > max ? t('ui.validation.maxLength', { fieldName, max }) : null,

  numeric: (value: unknown, fieldName: string = t('ui.validation.defaultField')): string | null =>
    value && isNaN(Number(value)) ? t('ui.validation.mustBeNumber', { fieldName }) : null,

  positive: (value: unknown, fieldName: string = t('ui.validation.defaultField')): string | null =>
    value && Number(value) <= 0 ? t('ui.validation.mustBePositive', { fieldName }) : null,

  validateForm: (formData: Record<string, unknown>, rules: ValidationRules): ValidationResult => {
    const errors: Record<string, string> = {};

    Object.keys(rules).forEach((field) => {
      const value = formData[field];
      const fieldRules = rules[field];

      for (const rule of fieldRules) {
        const error = rule(value);
        if (error) {
          errors[field] = error;
          break;
        }
      }
    });

    return { isValid: Object.keys(errors).length === 0, errors };
  },
};

// Format utilities
export const formatters = {
  currency: (amount: number, currency: string = 'EUR'): string =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(amount || 0),

  number: (num: number, decimals: number = 2): string =>
    new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num || 0),

  percentage: (num: number, decimals: number = 1): string =>
    new Intl.NumberFormat('it-IT', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format((num || 0) / 100),

  date: (date: Date | string, options: Intl.DateTimeFormatOptions = {}): string => {
    const defaultOptions = {
      year: 'numeric' as const,
      month: 'long' as const,
      day: 'numeric' as const,
    };
    return new Intl.DateTimeFormat('it-IT', { ...defaultOptions, ...options }).format(
      date instanceof Date ? date : new Date(date),
    );
  },

  dateTime: (date: Date | string, options: Intl.DateTimeFormatOptions = {}): string => {
    const defaultOptions = {
      year: 'numeric' as const,
      month: 'short' as const,
      day: 'numeric' as const,
      hour: '2-digit' as const,
      minute: '2-digit' as const,
    };
    return new Intl.DateTimeFormat('it-IT', { ...defaultOptions, ...options }).format(
      date instanceof Date ? date : new Date(date),
    );
  },

  timeAgo: (date: Date | string): string => {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - (date instanceof Date ? date : new Date(date)).getTime()) / 1000,
    );

    if (diffInSeconds < 60) return t('ui.time.now');
    if (diffInSeconds < 3600)
      return t('ui.time.minutesAgo', { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400)
      return t('ui.time.hoursAgo', { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 2592000)
      return t('ui.time.daysAgo', { count: Math.floor(diffInSeconds / 86400) });
    if (diffInSeconds < 31536000)
      return t('ui.time.monthsAgo', { count: Math.floor(diffInSeconds / 2592000) });
    return t('ui.time.yearsAgo', { count: Math.floor(diffInSeconds / 31536000) });
  },

  truncate: (text: string, length: number = 50): string =>
    !text ? '' : text.length > length ? `${text.substring(0, length)}...` : text,

  fileSize: (bytes: number): string => {
    if (!bytes) return `0 ${t('ui.fileSize.bytes')}`;
    const sizes = [
      t('ui.fileSize.bytes'),
      t('ui.fileSize.kilobytes'),
      t('ui.fileSize.megabytes'),
      t('ui.fileSize.gigabytes'),
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },
};

// UI state utilities
export const uiState = {
  scrollToTop: (smooth: boolean = true): void => {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  },

  scrollToElement: (elementId: string, smooth: boolean = true): void => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    }
  },

  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      notify.success(t('ui.action.copiedToClipboard'));
      return true;
    } catch {
      notify.error(t('ui.action.cannotCopyToClipboard'));
      return false;
    }
  },

  downloadFile: (url: string, filename: string): void => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  openInNewTab: (url: string): void => {
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  isSmallScreen: (): boolean => window.innerWidth < 768,
  isMobile: (): boolean =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  prefersReducedMotion: (): boolean =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

// Debounce utility
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export default {
  notify,
  loadingManager,
  errorHandler,
  validation,
  formatters,
  uiState,
  debounce,
  throttle,
};
