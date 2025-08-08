/**
 * Mock WebSocket Service for Jest tests
 * This mock prevents import.meta issues and provides a working WebSocket service for tests
 */

class MockWebSocketService {
  constructor() {
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    this.ws = null;
    this.eventListeners = new Map();
  }

  /**
   * Mock connect method
   */
  connect(url, options = {}) {
    // Mock successful connection
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Simulate connection event
    setTimeout(() => {
      this.emit('connected', { type: 'open' });
    }, 10);
  }

  /**
   * Mock disconnect method
   */
  disconnect() {
    this.isConnected = false;
    this.clearHeartbeat();
    this.emit('disconnected', { type: 'close', wasClean: true });
  }

  /**
   * Mock send method
   */
  send(data) {
    if (this.isConnected) {
      // Mock successful send
      return true;
    } else {
      console.warn('Mock WebSocket is not connected');
      return false;
    }
  }

  /**
   * Mock event listener methods
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in mock WebSocket event callback:', error);
        }
      });
    }
  }

  /**
   * Mock subscription methods
   */
  subscribeToReport(reportId) {
    this.send({
      type: 'SUBSCRIBE_REPORT',
      payload: { reportId }
    });
  }

  unsubscribeFromReport(reportId) {
    this.send({
      type: 'UNSUBSCRIBE_REPORT',
      payload: { reportId }
    });
  }

  subscribe(channel) {
    this.send({
      type: 'SUBSCRIBE',
      payload: { channel }
    });
  }

  unsubscribe(channel) {
    this.send({
      type: 'UNSUBSCRIBE',
      payload: { channel }
    });
  }

  /**
   * Mock heartbeat methods
   */
  setupHeartbeat() {
    // Mock heartbeat setup
  }

  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  handleHeartbeat() {
    // Mock heartbeat handling
  }

  /**
   * Mock reconnection methods
   */
  handleReconnect() {
    // Mock reconnection logic
    this.reconnectAttempts++;
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      setTimeout(() => {
        this.connect();
      }, 100); // Short delay for tests
    } else {
      this.emit('maxReconnectAttemptsReached');
    }
  }
}

// Create and export mock instance
const mockWebSocketService = new MockWebSocketService();

export default mockWebSocketService;
