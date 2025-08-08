// Real-time configuration for WebSocket integration
import { WEBSOCKET_CONFIG } from './websocket';

/**
 * Real-time configuration for different features
 */
export const REALTIME_CONFIG = {
  // Report real-time updates
  reports: {
    enabled: true,
    channels: ['reports', 'dashboard'],
    updateInterval: 5000, // 5 seconds
    batchUpdates: true,
    maxBatchSize: 50,
    debounceDelay: 1000,
    events: {
      REPORT_GENERATED: 'report:generated',
      REPORT_UPDATED: 'report:updated',
      REPORT_DELETED: 'report:deleted',
      REPORT_SCHEDULED: 'report:scheduled',
      REPORT_EXPORTED: 'report:exported',
      REPORT_SHARED: 'report:shared',
      TEMPLATE_CREATED: 'template:created',
      TEMPLATE_UPDATED: 'template:updated',
      TEMPLATE_DELETED: 'template:deleted'
    }
  },

  // Schedule real-time updates
  schedules: {
    enabled: true,
    channels: ['schedules', 'notifications'],
    updateInterval: 10000, // 10 seconds
    batchUpdates: true,
    maxBatchSize: 25,
    debounceDelay: 2000,
    events: {
      SCHEDULE_CREATED: 'schedule:created',
      SCHEDULE_UPDATED: 'schedule:updated',
      SCHEDULE_DELETED: 'schedule:deleted',
      SCHEDULE_EXECUTED: 'schedule:executed',
      SCHEDULE_FAILED: 'schedule:failed',
      SCHEDULE_PAUSED: 'schedule:paused',
      SCHEDULE_RESUMED: 'schedule:resumed'
    }
  },

  // Dashboard real-time updates
  dashboard: {
    enabled: true,
    channels: ['dashboard', 'analytics'],
    updateInterval: 3000, // 3 seconds
    batchUpdates: true,
    maxBatchSize: 100,
    debounceDelay: 500,
    events: {
      WIDGET_UPDATED: 'widget:updated',
      METRIC_UPDATED: 'metric:updated',
      CHART_UPDATED: 'chart:updated',
      KPI_UPDATED: 'kpi:updated',
      ALERT_TRIGGERED: 'alert:triggered',
      THRESHOLD_EXCEEDED: 'threshold:exceeded'
    }
  },

  // Notifications real-time updates
  notifications: {
    enabled: true,
    channels: ['notifications', 'user'],
    updateInterval: 1000, // 1 second
    batchUpdates: false,
    maxBatchSize: 10,
    debounceDelay: 0,
    events: {
      NOTIFICATION_CREATED: 'notification:created',
      NOTIFICATION_READ: 'notification:read',
      NOTIFICATION_DELETED: 'notification:deleted',
      NOTIFICATION_BATCH: 'notification:batch',
      USER_ONLINE: 'user:online',
      USER_OFFLINE: 'user:offline'
    }
  },

  // Task management real-time updates
  tasks: {
    enabled: true,
    channels: ['tasks', 'projects'],
    updateInterval: 5000, // 5 seconds
    batchUpdates: true,
    maxBatchSize: 30,
    debounceDelay: 1500,
    events: {
      TASK_CREATED: 'task:created',
      TASK_UPDATED: 'task:updated',
      TASK_DELETED: 'task:deleted',
      TASK_COMPLETED: 'task:completed',
      TASK_ASSIGNED: 'task:assigned',
      PROJECT_UPDATED: 'project:updated',
      MILESTONE_REACHED: 'milestone:reached'
    }
  },

  // System real-time updates
  system: {
    enabled: true,
    channels: ['system', 'health'],
    updateInterval: 30000, // 30 seconds
    batchUpdates: true,
    maxBatchSize: 20,
    debounceDelay: 5000,
    events: {
      SYSTEM_STATUS: 'system:status',
      HEALTH_CHECK: 'system:health',
      PERFORMANCE_METRIC: 'system:performance',
      ERROR_OCCURRED: 'system:error',
      WARNING_ISSUED: 'system:warning',
      MAINTENANCE_MODE: 'system:maintenance'
    }
  }
};

/**
 * Event priority levels
 */
export const REALTIME_EVENT_PRIORITIES = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
  INFO: 5
};

/**
 * Event priority mapping
 */
export const EVENT_PRIORITY_MAP = {
  // Critical events
  'system:error': REALTIME_EVENT_PRIORITIES.CRITICAL,
  'schedule:failed': REALTIME_EVENT_PRIORITIES.CRITICAL,
  'alert:triggered': REALTIME_EVENT_PRIORITIES.CRITICAL,
  
  // High priority events
  'notification:created': REALTIME_EVENT_PRIORITIES.HIGH,
  'report:generated': REALTIME_EVENT_PRIORITIES.HIGH,
  'schedule:executed': REALTIME_EVENT_PRIORITIES.HIGH,
  'task:completed': REALTIME_EVENT_PRIORITIES.HIGH,
  
  // Medium priority events
  'report:updated': REALTIME_EVENT_PRIORITIES.MEDIUM,
  'schedule:updated': REALTIME_EVENT_PRIORITIES.MEDIUM,
  'task:updated': REALTIME_EVENT_PRIORITIES.MEDIUM,
  'widget:updated': REALTIME_EVENT_PRIORITIES.MEDIUM,
  
  // Low priority events
  'metric:updated': REALTIME_EVENT_PRIORITIES.LOW,
  'chart:updated': REALTIME_EVENT_PRIORITIES.LOW,
  'user:online': REALTIME_EVENT_PRIORITIES.LOW,
  
  // Info events
  'system:health': REALTIME_EVENT_PRIORITIES.INFO,
  'system:performance': REALTIME_EVENT_PRIORITIES.INFO,
  'user:offline': REALTIME_EVENT_PRIORITIES.INFO
};

/**
 * Real-time feature toggles
 */
export const FEATURE_TOGGLES = {
  REAL_TIME_REPORTS: true,
  REAL_TIME_SCHEDULES: true,
  REAL_TIME_DASHBOARD: true,
  REAL_TIME_NOTIFICATIONS: true,
  REAL_TIME_TASKS: true,
  REAL_TIME_SYSTEM: true,
  BATCH_PROCESSING: true,
  EVENT_DEBOUNCING: true,
  PRIORITY_QUEUING: true,
  OFFLINE_SUPPORT: true,
  RECONNECTION: true,
  HEARTBEAT: true
};

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  MAX_CONCURRENT_CONNECTIONS: 1000,
  MAX_EVENTS_PER_SECOND: 100,
  MAX_QUEUE_SIZE: 500,
  MAX_RETRY_ATTEMPTS: 3,
  CONNECTION_TIMEOUT: 30000,
  HEARTBEAT_INTERVAL: 30000,
  RECONNECT_DELAY: 5000,
  MAX_RECONNECT_ATTEMPTS: 5
};

/**
 * Environment-specific configurations
 */
export const getRealtimeConfig = (environment = 'development') => {
  const baseConfig = {
    ...REALTIME_CONFIG,
    websocket: WEBSOCKET_CONFIG[environment] || WEBSOCKET_CONFIG.development
  };

  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        reports: {
          ...baseConfig.reports,
          updateInterval: 10000, // Slower updates in production
          debounceDelay: 2000
        },
        dashboard: {
          ...baseConfig.dashboard,
          updateInterval: 5000,
          debounceDelay: 1000
        }
      };
    
    case 'staging':
      return {
        ...baseConfig,
        reports: {
          ...baseConfig.reports,
          updateInterval: 7500,
          debounceDelay: 1500
        }
      };
    
    case 'development':
    default:
      return baseConfig;
  }
};

/**
 * Get event priority
 */
export const getEventPriority = (eventType) => {
  return EVENT_PRIORITY_MAP[eventType] || REALTIME_EVENT_PRIORITIES.MEDIUM;
};

/**
 * Check if feature is enabled
 */
export const isFeatureEnabled = (feature) => {
  return FEATURE_TOGGLES[feature] || false;
};

/**
 * Get channel configuration
 */
export const getChannelConfig = (feature) => {
  return REALTIME_CONFIG[feature] || null;
};

/**
 * Validate real-time configuration
 */
export const validateRealtimeConfig = (config) => {
  const errors = [];
  
  if (!config) {
    errors.push('Configuration is required');
    return errors;
  }
  
  // Validate update intervals
  Object.keys(config).forEach(feature => {
    const featureConfig = config[feature];
    if (featureConfig.updateInterval && featureConfig.updateInterval < 1000) {
      errors.push(`${feature}: Update interval too low (minimum 1000ms)`);
    }
    
    if (featureConfig.maxBatchSize && featureConfig.maxBatchSize > 100) {
      errors.push(`${feature}: Batch size too large (maximum 100)`);
    }
  });
  
  return errors;
};

export default REALTIME_CONFIG;
