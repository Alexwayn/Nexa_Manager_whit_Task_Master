// Application-wide constants
export const APP_NAME = 'Nexa Manager';
export const APP_VERSION = '1.0.0';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'nexa_auth_token',
  USER_PREFERENCES: 'nexa_user_preferences',
  THEME: 'nexa_theme',
  LANGUAGE: 'nexa_language'
} as const;

export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  LONG: 'MMMM dd, yyyy',
  ISO: 'yyyy-MM-dd',
  DATETIME: 'MM/dd/yyyy HH:mm'
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  }
} as const;
