// Mock WebSocket configuration for tests

// WebSocket connection settings
export const WEBSOCKET_CONFIG = {
  // Connection URLs
  urls: {
    development: 'ws://localhost:8080/ws',
    staging: 'wss://staging-api.nexamanager.com/ws',
    production: 'wss://api.nexamanager.com/ws'
  },
  
  // Connection options
  options: {
    // Reconnection settings
    reconnect: {
      enabled: true,
      maxAttempts: 5,
      delay: 1000,
      backoffMultiplier: 1.5,
      maxDelay: 30000
    },
    
    // Heartbeat settings
    heartbeat: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      message: { type: 'ping' }
    },
    
    // Connection timeout
    connectionTimeout: 10000,
    
    // Message queue settings
    messageQueue: {
      enabled: true,
      maxSize: 100,
      persistOnReconnect: true
    }
  }
};

// Subscription channels
export const WEBSOCKET_CHANNELS = {
  // Report-related channels
  REPORTS: {
    STATUS_UPDATES: 'reports:status',
    GENERATION_PROGRESS: 'reports:progress',
    COMPLETION: 'reports:complete',
    ERRORS: 'reports:errors',
    REAL_TIME_DATA: 'reports:realtime'
  },
  
  // Schedule-related channels
  SCHEDULES: {
    EXECUTION: 'schedules:execution',
    STATUS_UPDATES: 'schedules:status',
    NOTIFICATIONS: 'schedules:notifications'
  },
  
  // Dashboard channels
  DASHBOARD: {
    METRICS_UPDATE: 'dashboard:metrics',
    WIDGET_DATA: 'dashboard:widgets',
    ALERTS: 'dashboard:alerts'
  },
  
  // Notification channels
  NOTIFICATIONS: {
    GENERAL: 'notifications',
    REPORTS: 'notifications:reports',
    SCHEDULES: 'notifications:schedules',
    SYSTEM: 'notifications:system'
  },
  
  // User-specific channels
  USER: {
    ACTIVITY: 'user:activity',
    PREFERENCES: 'user:preferences',
    SESSION: 'user:session'
  }
};

// Message types
export const MESSAGE_TYPES = {
  // Connection management
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  PING: 'ping',
  PONG: 'pong',
  
  // Subscription management
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  
  // Report messages
  REPORT_STATUS_UPDATE: 'report_status_update',
  REPORT_PROGRESS: 'report_progress',
  REPORT_COMPLETE: 'report_complete',
  REPORT_ERROR: 'report_error',
  REAL_TIME_DATA: 'real_time_data',
  
  // Schedule messages
  SCHEDULE_EXECUTED: 'schedule_executed',
  SCHEDULE_FAILED: 'schedule_failed',
  SCHEDULE_STATUS: 'schedule_status',
  
  // Dashboard messages
  DASHBOARD_UPDATE: 'dashboard_update',
  METRICS_UPDATE: 'metrics_update',
  WIDGET_UPDATE: 'widget_update',
  
  // Notification messages
  NOTIFICATION: 'notification',
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATION_CLEAR: 'notification_clear',
  
  // Error messages
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Event priorities
export const EVENT_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Mock WebSocket URL function for tests
export const getWebSocketUrl = () => {
  return 'ws://localhost:8080/ws'; // Always return development URL for tests
};

// Default subscription channels for different components
export const DEFAULT_SUBSCRIPTIONS = {
  reports: [
    WEBSOCKET_CHANNELS.REPORTS.STATUS_UPDATES,
    WEBSOCKET_CHANNELS.REPORTS.COMPLETION,
    WEBSOCKET_CHANNELS.NOTIFICATIONS.REPORTS
  ],
  
  dashboard: [
    WEBSOCKET_CHANNELS.DASHBOARD.METRICS_UPDATE,
    WEBSOCKET_CHANNELS.DASHBOARD.ALERTS,
    WEBSOCKET_CHANNELS.NOTIFICATIONS.GENERAL
  ],
  
  scheduler: [
    WEBSOCKET_CHANNELS.SCHEDULES.EXECUTION,
    WEBSOCKET_CHANNELS.SCHEDULES.STATUS_UPDATES,
    WEBSOCKET_CHANNELS.NOTIFICATIONS.SCHEDULES
  ]
};

// WebSocket connection states
export const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTING: 'disconnecting',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
  DISABLED: 'disabled'
};

// Error codes
export const ERROR_CODES = {
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  SUBSCRIPTION_FAILED: 'SUBSCRIPTION_FAILED',
  MESSAGE_SEND_FAILED: 'MESSAGE_SEND_FAILED',
  HEARTBEAT_TIMEOUT: 'HEARTBEAT_TIMEOUT',
  MAX_RECONNECT_ATTEMPTS: 'MAX_RECONNECT_ATTEMPTS'
};

export default {
  WEBSOCKET_CONFIG,
  WEBSOCKET_CHANNELS,
  MESSAGE_TYPES,
  EVENT_PRIORITIES,
  getWebSocketUrl,
  DEFAULT_SUBSCRIPTIONS,
  CONNECTION_STATES,
  ERROR_CODES
};
