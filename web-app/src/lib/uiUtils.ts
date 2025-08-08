import toast, { ToastOptions } from 'react-hot-toast';
import Logger from '@/utils/Logger';

/**
 * UI Utilities
 * Common utility functions for UI interactions, notifications, and state management
 */

// Default toast styles
const defaultToastStyle = {
  background: 'var(--toast-bg)',
  color: 'var(--toast-color)',
  border: '1px solid var(--toast-border)',
};

/**
 * Notification utilities using react-hot-toast
 */
export const notify = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: 3000,
      style: defaultToastStyle,
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
      ...options,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: 5000,
      style: defaultToastStyle,
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
      ...options,
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      style: defaultToastStyle,
      ...options,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: (err) => messages.error,
      },
      {
        style: defaultToastStyle,
        success: { duration: 3000 },
        error: { duration: 5000 },
        ...options,
      }
    );
  },

  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  },
};

/**
 * Loading state manager
 */
export const loadingManager = {
  states: new Map<string, boolean>(),

  setLoading: (key: string, loading: boolean) => {
    loadingManager.states.set(key, loading);
  },

  isLoading: (key: string) => {
    return loadingManager.states.get(key) || false;
  },

  clearAll: () => {
    loadingManager.states.clear();
  },

  show: (message = 'Loading...') => {
    return notify.loading(message);
  },

  hide: (toastId: string) => {
    notify.dismiss(toastId);
  },

  update: (toastId: string, message: string, type: 'success' | 'error') => {
    notify.dismiss(toastId);
    if (type === 'success') {
      return notify.success(message);
    } else {
      return notify.error(message);
    }
  },
};

/**
 * Error handler utilities
 */
export const errorHandler = {
  handle: (error: Error | string, context?: string) => {
    const message = typeof error === 'string' ? error : error.message;
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    notify.error(message);
  },

  handleAsync: async (fn: () => Promise<any>, context?: string) => {
    try {
      return await fn();
    } catch (error) {
      errorHandler.handle(error as Error, context);
      throw error;
    }
  },

  handleApiError: (error: any, context?: string) => {
    let message = 'An API error occurred';
    
    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
    notify.error(message);

    return { error: message, details: error };
  },

  handleSupabaseError: (error: any, context?: string) => {
    let message = 'A database error occurred';
    
    if (error?.message) {
      message = error.message;
    } else if (error?.error_description) {
      message = error.error_description;
    } else if (typeof error === 'string') {
      message = error;
    }

    console.error(`Supabase Error${context ? ` in ${context}` : ''}:`, error);
    notify.error(message);

    return { error: message, details: error };
  },
};

/**
 * Validation utilities
 */
export const validation = {
  email: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email';
    }
    return true;
  },

  required: (value: any, fieldName = 'This field') => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName = 'Field') => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters long`;
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName = 'Field') => {
    if (value && value.length > max) {
      return `${fieldName} must be at most ${max} characters long`;
    }
    return null;
  },

  numeric: (value: string, fieldName = 'Field') => {
    if (isNaN(Number(value))) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  positive: (value: string, fieldName = 'Field') => {
    const num = Number(value);
    if (num <= 0) {
      return `${fieldName} must be positive`;
    }
    return null;
  },

  validateForm: (formData: Record<string, any>, rules: Record<string, Function[]>) => {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = formData[field];
      
      for (const rule of fieldRules) {
        const result = rule(value);
        if (result !== true && result !== null) {
          errors[field] = typeof result === 'string' ? result : 'Invalid value';
          isValid = false;
          break;
        }
      }
    }

    return { isValid, errors };
  },
};

/**
 * Formatter utilities
 */
export const formatters = {
  currency: (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  date: (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  },

  number: (num: number, decimals?: number) => {
    const options: Intl.NumberFormatOptions = {};
    if (decimals !== undefined) {
      options.minimumFractionDigits = decimals;
      options.maximumFractionDigits = decimals;
    }
    return new Intl.NumberFormat('en-US', options).format(num);
  },

  percentage: (num: number, decimals = 0) => {
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    };
    return new Intl.NumberFormat('en-US', options).format(num) + '%';
  },

  fileSize: (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
  },

  truncate: (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  timeAgo: (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  },
};

/**
 * UI state management utilities
 */
export const uiState = {
  states: new Map<string, any>(),

  set: (key: string, value: any) => {
    uiState.states.set(key, value);
  },

  get: (key: string) => {
    return uiState.states.get(key);
  },

  remove: (key: string) => {
    return uiState.states.delete(key);
  },

  clear: () => {
    uiState.states.clear();
  },

  scrollToTop: (smooth = true) => {
    window.scrollTo({ 
      top: 0, 
      behavior: smooth ? 'smooth' : 'auto' 
    });
  },

  copyToClipboard: async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify.success('Copied to clipboard');
      return true;
    } catch (error) {
      notify.error('Cannot copy to clipboard');
      return false;
    }
  },

  openInNewTab: (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  isSmallScreen: () => {
    return window.innerWidth < 768;
  },

  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
