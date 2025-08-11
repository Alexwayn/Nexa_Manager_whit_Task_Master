// Shared configuration - application-wide configuration files

// Performance configuration
export * from './performance.js';

// Real-time configuration
export * from './realtime.js';

// WebSocket configuration
export * from './websocket.js';

// Scanner configuration
// Removed re-export of './scanner' to prevent importing Vite-specific config in Jest environment
