/**
 * WebSocket Service for Real-time Data Updates
 * Handles real-time communication for reports and dashboard updates
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnected = false;
    this.heartbeatInterval = null;
  }

  /**
   * Initialize WebSocket connection
   * @param {string} url - WebSocket server URL
   * @param {Object} options - Connection options
   */
  connect(url, options = {}) {
    // Use default URL if not provided
    if (!url) {
      url = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    }
    
    // Skip WebSocket connection in development if no server is available
    if (import.meta.env.DEV && !import.meta.env.VITE_WS_URL) {
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
      if (!import.meta.env.DEV) {
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
      if (import.meta.env.DEV) {
        console.log('WebSocket disconnected (development mode)');
      } else {
        console.log('WebSocket disconnected:', event.code, event.reason);
      }
      this.isConnected = false;
      this.clearHeartbeat();
      this.emit('disconnected', event);
      
      // Only attempt reconnection in production or when explicitly configured
      if (!event.wasClean && !import.meta.env.DEV) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      if (import.meta.env.DEV) {
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
   * Subscribe to dashboard updates
   */
  subscribeToDashboard() {
    this.send({
      type: 'SUBSCRIBE_DASHBOARD',
      payload: {}
    });
  }

  /**
   * Request real-time data for specific metrics
   * @param {Array} metrics - Array of metric names
   */
  requestRealTimeData(metrics) {
    this.send({
      type: 'REQUEST_REAL_TIME_DATA',
      payload: { metrics }
    });
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Close WebSocket connection
   */
  disconnect() {
    this.clearHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
