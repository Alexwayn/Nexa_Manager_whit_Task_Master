/**
 * Utility functions for formatting data in the application
 */

/**
 * Format numbers with appropriate suffixes (K, M, B)
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  
  const number = Number(num);
  if (isNaN(number)) return '0';
  
  if (number >= 1000000000) {
    return (number / 1000000000).toFixed(1) + 'B';
  }
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  }
  if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'K';
  }
  return number.toString();
};

/**
 * Format percentage values
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0';
  
  const number = Number(value);
  if (isNaN(number)) return '0';
  
  return number.toFixed(decimals);
};

/**
 * Format currency values
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '$0.00';
  
  const number = Number(amount);
  if (isNaN(number)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(number);
};

/**
 * Format dates in a readable format
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
};

/**
 * Format date and time
 */
export const formatDateTime = (date) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
};

/**
 * Format file sizes
 */
export const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return '0 B';
  
  const number = Number(bytes);
  if (isNaN(number) || number === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(number) / Math.log(k));
  
  return parseFloat((number / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
};

/**
 * Format duration in milliseconds to human readable format
 */
export const formatDuration = (milliseconds) => {
  if (milliseconds === null || milliseconds === undefined) return '0ms';
  
  const ms = Number(milliseconds);
  if (isNaN(ms) || ms === 0) return '0ms';
  
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

/**
 * Format email address for display
 */
export const formatEmailAddress = (email, name = null) => {
  if (!email) return '';
  
  if (name) {
    return `${name} <${email}>`;
  }
  
  return email;
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Format phone numbers
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phoneNumber; // Return original if can't format
};

/**
 * Format status badges
 */
export const formatStatus = (status) => {
  if (!status) return '';
  
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format priority levels
 */
export const formatPriority = (priority) => {
  const priorityMap = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Urgent',
    5: 'Critical',
  };
  
  return priorityMap[priority] || priority;
};

/**
 * Format email subject for display
 */
export const formatEmailSubject = (subject, maxLength = 60) => {
  if (!subject) return '(No Subject)';
  
  return truncateText(subject, maxLength);
};

/**
 * Format email preview text
 */
export const formatEmailPreview = (content, maxLength = 100) => {
  if (!content) return '';
  
  // Strip HTML tags
  const textContent = content.replace(/<[^>]*>/g, '');
  
  // Remove extra whitespace
  const cleaned = textContent.replace(/\s+/g, ' ').trim();
  
  return truncateText(cleaned, maxLength);
};

/**
 * Format analytics metrics
 */
export const formatMetric = (value, type = 'number') => {
  switch (type) {
    case 'percentage':
      return formatPercentage(value) + '%';
    case 'currency':
      return formatCurrency(value);
    case 'duration':
      return formatDuration(value);
    case 'filesize':
      return formatFileSize(value);
    case 'number':
    default:
      return formatNumber(value);
  }
};

/**
 * Format chart data for display
 */
export const formatChartData = (data, xKey, yKey, formatType = 'number') => {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => ({
    ...item,
    [xKey]: item[xKey],
    [yKey]: formatMetric(item[yKey], formatType),
  }));
};

/**
 * Format color based on value and thresholds
 */
export const getColorByValue = (value, thresholds = { good: 80, warning: 60 }) => {
  if (value >= thresholds.good) return 'text-green-500';
  if (value >= thresholds.warning) return 'text-yellow-500';
  return 'text-red-500';
};

/**
 * Format growth indicators
 */
export const formatGrowth = (current, previous) => {
  if (!previous || previous === 0) {
    return { value: current > 0 ? 100 : 0, direction: 'up', color: 'text-green-500' };
  }
  
  const growth = ((current - previous) / previous) * 100;
  
  return {
    value: Math.abs(growth).toFixed(1),
    direction: growth >= 0 ? 'up' : 'down',
    color: growth >= 0 ? 'text-green-500' : 'text-red-500',
  };
};