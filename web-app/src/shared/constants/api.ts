import { getEnvVar } from '@/utils/env';

// API-related constants
export const API_ENDPOINTS = {
  BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3001'),
  AUTH: '/auth',
  USERS: '/users',
  CLIENTS: '/clients',
  FINANCIAL: '/financial',
  DOCUMENTS: '/documents',
  SCANNER: '/scanner',
  REPORTS: '/reports',
  EMAIL: '/email',
  CALENDAR: '/calendar'
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const REQUEST_TIMEOUT = 30000; // 30 seconds
