// Mock for WebSocketProvider.jsx
import React from 'react';

const mockWebSocketContext = {
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  lastMessage: null,
  sendMessage: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  reconnect: jest.fn(),
};

export const useWebSocketContext = jest.fn(() => mockWebSocketContext);

export const WebSocketProvider = ({ children }) => {
  return React.createElement('div', { 'data-testid': 'websocket-provider' }, children);
};

export default WebSocketProvider;