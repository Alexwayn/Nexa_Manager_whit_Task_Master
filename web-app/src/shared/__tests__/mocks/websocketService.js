// Mock for websocketService.js
const mockWebSocketService = {
  connect: jest.fn(() => Promise.resolve()),
  disconnect: jest.fn(),
  send: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  isConnected: jest.fn(() => false),
  getConnectionStatus: jest.fn(() => 'disconnected'),
  reconnect: jest.fn(() => Promise.resolve()),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
};

export default mockWebSocketService;