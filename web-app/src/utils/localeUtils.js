import i18n from '../i18n';

/**
 * Locale-aware formatting utilities for internationalization
 */

// Get current locale from document or i18n
const getCurrentLocale = () => {
  const docLocale = document.documentElement.getAttribute('data-locale');
  if (docLocale) return docLocale;
  
  // Fallback to mapping from i18n language
  const langToLocaleMap = {
    'it': 'it-IT',
    'en': 'en-US',
    'ar': 'ar-SA'
  };
  
  return langToLocaleMap[i18n.language] || 'en-US';
};

/**
 * Format date according to current locale
 */
export const formatDate = (date, options = {}) => {
  const locale = getCurrentLocale();
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
  } catch (error) {
    console.warn('Date formatting failed, using fallback:', error);
    return new Date(date).toLocaleDateString();
  }
};

/**
 * Format date in short format
 */
export const formatDateShort = (date) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format time according to current locale
 */
export const formatTime = (date, options = {}) => {
  const locale = getCurrentLocale();
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
  } catch (error) {
    console.warn('Time formatting failed, using fallback:', error);
    return new Date(date).toLocaleTimeString();
  }
};

/**
 * Format datetime according to current locale
 */
export const formatDateTime = (date, options = {}) => {
  const locale = getCurrentLocale();
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
  } catch (error) {
    console.warn('DateTime formatting failed, using fallback:', error);
    return new Date(date).toLocaleString();
  }
};

/**
 * Format number according to current locale
 */
export const formatNumber = (number, options = {}) => {
  const locale = getCurrentLocale();
  
  try {
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (error) {
    console.warn('Number formatting failed, using fallback:', error);
    return number.toString();
  }
};

/**
 * Format currency according to current locale
 */
export const formatCurrency = (amount, currency = 'EUR', options = {}) => {
  const locale = getCurrentLocale();
  const defaultOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  };
  
  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(amount);
  } catch (error) {
    console.warn('Currency formatting failed, using fallback:', error);
    return `${currency} ${amount.toFixed(2)}`;
  }
};

/**
 * Format percentage according to current locale
 */
export const formatPercentage = (value, options = {}) => {
  const locale = getCurrentLocale();
  const defaultOptions = {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    ...options
  };
  
  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(value / 100);
  } catch (error) {
    console.warn('Percentage formatting failed, using fallback:', error);
    return `${value.toFixed(1)}%`;
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  const locale = getCurrentLocale();
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);
  
  // Define time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    }
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const diff = Math.floor(diffInSeconds / secondsInUnit);
      if (diff >= 1) {
        return rtf.format(-diff, unit);
      }
    }
    
    return rtf.format(-diffInSeconds, 'second');
  } catch (error) {
    console.warn('Relative time formatting failed, using fallback:', error);
    
    // Fallback implementation
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDateShort(date);
  }
};

/**
 * Get localized weekday names
 */
export const getWeekdayNames = (format = 'long') => {
  const locale = getCurrentLocale();
  
  try {
    const baseDate = new Date(2023, 0, 1); // January 1, 2023 (a Sunday)
    const weekdays = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      weekdays.push(
        new Intl.DateTimeFormat(locale, { weekday: format }).format(date)
      );
    }
    
    return weekdays;
  } catch (error) {
    console.warn('Weekday names formatting failed, using fallback:', error);
    return format === 'short' 
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }
};

/**
 * Get localized month names
 */
export const getMonthNames = (format = 'long') => {
  const locale = getCurrentLocale();
  
  try {
    const months = [];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(2023, i, 1);
      months.push(
        new Intl.DateTimeFormat(locale, { month: format }).format(date)
      );
    }
    
    return months;
  } catch (error) {
    console.warn('Month names formatting failed, using fallback:', error);
    return format === 'short'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  }
};

/**
 * Check if current locale uses RTL direction
 */
export const isRTL = () => {
  const locale = getCurrentLocale();
  const rtlLocales = ['ar-SA', 'he-IL', 'fa-IR'];
  return rtlLocales.includes(locale);
};

/**
 * Get text direction for current locale
 */
export const getTextDirection = () => {
  return isRTL() ? 'rtl' : 'ltr';
};

/**
 * Format file size with locale-appropriate units
 */
export const formatFileSize = (bytes, decimals = 2) => {
  const locale = getCurrentLocale();
  
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  
  try {
    const formattedSize = new Intl.NumberFormat(locale).format(size);
    return `${formattedSize} ${sizes[i]}`;
  } catch (error) {
    console.warn('File size formatting failed, using fallback:', error);
    return `${size} ${sizes[i]}`;
  }
};

/**
 * Sort array of strings according to current locale
 */
export const localeSort = (array, options = {}) => {
  const locale = getCurrentLocale();
  
  try {
    const collator = new Intl.Collator(locale, {
      numeric: true,
      caseFirst: 'upper',
      ...options
    });
    
    return [...array].sort(collator.compare);
  } catch (error) {
    console.warn('Locale sorting failed, using fallback:', error);
    return [...array].sort();
  }
};

/**
 * Get default currency for current locale
 */
export const getDefaultCurrency = () => {
  const locale = getCurrentLocale();
  
  const currencyMap = {
    'it-IT': 'EUR',
    'en-US': 'USD',
    'en-GB': 'GBP',
    'ar-SA': 'SAR'
  };
  
  return currencyMap[locale] || 'EUR';
};

/**
 * React hook for getting current locale
 */
export const useCurrentLocale = () => {
  const [locale, setLocale] = React.useState(getCurrentLocale());
  
  React.useEffect(() => {
    const handleLanguageChange = () => {
      setLocale(getCurrentLocale());
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);
  
  return locale;
};

export default {
  formatDate,
  formatDateShort,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatRelativeTime,
  formatFileSize,
  getWeekdayNames,
  getMonthNames,
  getCurrentLocale,
  isRTL,
  getTextDirection,
  localeSort,
  getDefaultCurrency,
  useCurrentLocale
}; 