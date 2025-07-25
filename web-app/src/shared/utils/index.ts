// Shared utilities - cross-cutting utility functions

// Formatters - using specific exports to avoid conflicts
export { 
  formatEmailAddress,
  formatPhoneNumber,
  formatStatus,
  formatPriority,
  formatEmailSubject,
  formatEmailPreview,
  formatMetric,
  formatChartData,
  formatGrowth,
  formatDuration
} from './formatters/formatters.js';

// Helpers
export { default as cn } from './helpers/cn.js';
export * from './helpers/languageUtils.js';
export * from './helpers/userIdConverter.js';

// Locale utilities (these have the common formatters)
export * from './helpers/localeUtils.js';

// Existing utilities
export * from './uiUtils';
export { default as logger } from './logger.js';