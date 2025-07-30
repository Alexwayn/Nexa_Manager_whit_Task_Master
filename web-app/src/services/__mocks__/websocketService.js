/**
 * Manual mock for websocketService.js
 * This will be automatically used by Jest when the module is imported
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

  connect(url, options = {}) {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    setTimeout(() => {
      this.emit('connected', { type: 'open' });
    }, 10);
  }

  disconnect() {
    this.isConnected = false;
    this.clearHeartbeat();
    this.emit('disconnected', { type: 'close', wasClean: true });
  }

  send(data) {
    if (this.isConnected) {
      return true;
    } else {
      console.warn('Mock WebSocket is not connected');
      return false;
    }
  }

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

  handleReconnect() {
    this.reconnectAttempts++;
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      setTimeout(() => {
        this.connect();
      }, 100);
    } else {
      this.emit('maxReconnectAttemptsReached');
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

const mockWebSocketService = new MockWebSocketService();

export default mockWebSocketService;