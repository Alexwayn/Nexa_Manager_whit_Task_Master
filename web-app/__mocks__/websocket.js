/**
 * Mock for websocket library
 * Prevents ES module import issues in Jest tests
 */

class MockWebSocket {
  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = 1; // OPEN
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
  }

  send(data) {
    // Mock send implementation
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal closure' });
    }
  }
}

module.exports = {
  w3cwebsocket: MockWebSocket,
  WebSocket: MockWebSocket,
};