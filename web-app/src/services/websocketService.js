/**
 * WebSocket Service for Real-time Communication
 * Handles WebSocket connections, reconnection logic, and message handling
 */

// Environment variable access that works in both Vite and Jest
const getEnvVar = (key, defaultValue = '') => {
  // In test environment, use process.env
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    return process.env[key] || defaultValue;
  }
  
  // Try to access import.meta.env safely
  try {
    if (typeof window !== 'undefined' && window.importMeta && window.importMeta.env) {
      return window.importMeta.env[key] || defaultValue;
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }
  
  // Fallback to process.env if available
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  return defaultValue;
};

const isDev = () => {
  return getEnvVar('DEV', false) || getEnvVar('NODE_ENV') === 'development';
};

const getWebSocketUrl = () => {
  return getEnvVar('VITE_WS_URL', 'ws://localhost:8080');
};

class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = getWebSocketUrl();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    this.isConnecting = false;
    this.eventListeners = new Map();
    this.subscriptions = new Set();
    this.messageQueue = [];
    this.isReconnecting = false;
    
    // Bind methods to preserve context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
  }

  /**
   * Connect to WebSocket server
   * @param {string} url - WebSocket URL
   * @param {Object} options - Connection options
   */
  connect(url, options = {}) {
    // Use default URL if not provided
    if (!url) {
      url = getEnvVar('VITE_WS_URL') || 'ws://localhost:8080';
    }
    
    // Skip WebSocket connection in development if no server is available
    if (isDev() && !getEnvVar('VITE_WS_URL')) {
      console.log('WebSocket disabled in development mode (no VITE_WS_URL configured)');
      return;
    }
    
    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
      this.setupHeartbeat();
    } catch (error) {
      console.warn('WebSocket connection failed:', error.message);
      // Don't attempt reconnection in development if server is not available
      if (!isDev()) {
        this.handleReconnect();
      }
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.ws.onopen = (event) => {
      console.log('WebSocket connected');
      this.isConnected = true;
      const wasReconnecting = this.reconnectAttempts > 0;
      this.reconnectAttempts = 0;
      
      if (wasReconnecting) {
        this.emit('reconnected', event);
      } else {
        this.emit('connected', event);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      if (isDev()) {
        console.log('WebSocket disconnected (development mode)');
      } else {
        console.log('WebSocket disconnected:', event.code, event.reason);
      }
      this.isConnected = false;
      this.clearHeartbeat();
      this.emit('disconnected', event);
      
      // Only attempt reconnection in production or when explicitly configured
      if (!event.wasClean && !isDev()) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      if (isDev()) {
        console.warn('WebSocket connection error (development mode - this is expected if no WebSocket server is running)');
      } else {
        console.error('WebSocket error:', error);
      }
      this.emit('error', error);
    };
  }

  /**
   * Handle incoming WebSocket messages
   * @param {Object} data - Parsed message data
   */
  handleMessage(data) {
    const { type, payload, timestamp } = data;
    
    // Emit generic message event
    this.emit('message', data);

    switch (type) {
      case 'REPORT_STATUS_UPDATE':
        this.emit('reportStatusUpdate', payload);
        break;
      case 'REAL_TIME_DATA':
        this.emit('realTimeData', payload);
        break;
      case 'REPORT_GENERATED':
        this.emit('reportGenerated', payload);
        break;
      case 'DASHBOARD_UPDATE':
        this.emit('dashboardUpdate', payload);
        break;
      case 'NOTIFICATION':
        this.emit('notification', payload);
        break;
      case 'HEARTBEAT':
        this.handleHeartbeat();
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  }

  /**
   * Setup heartbeat mechanism
   */
  setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'HEARTBEAT',
          timestamp: Date.now()
        });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Handle heartbeat response
   */
  handleHeartbeat() {
    // Server responded to heartbeat, connection is alive
    console.log('Heartbeat received');
  }

  /**
   * Clear heartbeat interval
   */
  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle reconnection logic
   */
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  /**
   * Send message through WebSocket
   * @param {Object} data - Data to send
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  /**
   * Subscribe to real-time report updates
   * @param {string} reportId - Report ID to subscribe to
   */
  subscribeToReport(reportId) {
    this.send({
      type: 'SUBSCRIBE_REPORT',
      payload: { reportId }
    });
  }

  /**
   * Unsubscribe from report updates
   * @param {string} reportId - Report ID to unsubscribe from
   */
  unsubscribeFromReport(reportId) {
    this.send({
      type: 'UNSUBSCRIBE_REPORT',
      payload: { reportId }
    });
  }

  /**
   * Subscribe to specific channel
   * @param {string} channel - Channel name
   */
  subscribe(channel) {
    this.send({
      type: 'SUBSCRIBE',
      payload: { channel }
    });
  }

  /**
   * Unsubscribe from channel
   * @param {string} channel - Channel name
   */
  unsubscribe(channel) {
    this.send({
      type: 'UNSUBSCRIBE',
      payload: { channel }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.clearHeartbeat();
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }
}

// Create and export singleton instance
const websocketService = new WebSocketService();

export default websocketService;
