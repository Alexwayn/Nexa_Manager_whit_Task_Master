// Export utility modules with explicit naming to avoid conflicts

// Formatters (basic formatting utilities)
export {
  formatNumber as formatNumberBasic,
  formatPercentage as formatPercentageBasic,
  formatCurrency,
  formatDate as formatDateBasic,
  formatDateTime as formatDateTimeBasic,
  formatRelativeTime as formatRelativeTimeBasic,
  formatFileSize,
  formatDuration,
  formatEmailAddress,
  truncateText,
} from './formatters';

// Locale-aware formatters (internationalized formatting)
export {
  formatDate,
  formatDateShort,
  formatTime,
  formatDateTime,
  formatNumber,
  formatPercentage,
  formatRelativeTime,
  getWeekdayNames,
  getMonthNames,
  formatCurrency as formatCurrencyLocale,
} from './localeUtils';

// Other utilities
export * from './uiUtils';
export * from './logger';
export * from './cn';
export * from './languageUtils';
export * from './userIdConverter';
export * from './performance';
export * from './realtime';
export * from './scanner';
export * from './websocket';
export * from './config';
export * from './middleware';
export * from './slices';
export * from './stores';