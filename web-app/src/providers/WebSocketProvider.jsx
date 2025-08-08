import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import websocketService from '../services/websocketService';
import { getWebSocketUrl, CONNECTION_STATES } from '../shared/utils/websocket';
import { toast } from 'react-hot-toast';

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

/**
 * WebSocket Context
 */
const WebSocketContext = createContext(null);

/**
 * WebSocket Provider Component
 * Manages global WebSocket connection and provides context to child components
 */
export const WebSocketProvider = ({ children, enabled = true }) => {
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastMessage, setLastMessage] = useState(null);
  
  const wsServiceRef = useRef(null);
  const subscribersRef = useRef(new Map());
  const messageQueueRef = useRef([]);

  /**
   * Initialize WebSocket service
   */
  const initializeWebSocket = useCallback(() => {
    if (!enabled || wsServiceRef.current) return;

    // Skip WebSocket in development if no server URL is configured
    if (isDev() && !getEnvVar('VITE_WS_URL')) {
      console.log('WebSocket disabled in development mode (no VITE_WS_URL configured)');
      setConnectionState(CONNECTION_STATES.DISABLED);
      return;
    }

    const wsUrl = getWebSocketUrl();
    wsServiceRef.current = websocketService;
    wsServiceRef.current.connect(wsUrl);

    // Set up event listeners
    wsServiceRef.current.on('connected', handleConnect);
    wsServiceRef.current.on('disconnected', handleDisconnect);
    wsServiceRef.current.on('error', handleError);
    wsServiceRef.current.on('message', handleMessage);
    wsServiceRef.current.on('reconnecting', handleReconnecting);
    wsServiceRef.current.on('reconnected', handleReconnected);
    wsServiceRef.current.on('maxReconnectAttemptsReached', handleMaxReconnectAttempts);
  }, [enabled]);

  /**
   * Handle connection established
   */
  const handleConnect = useCallback(() => {
    setConnectionState(CONNECTION_STATES.CONNECTED);
    setIsConnected(true);
    setError(null);
    setReconnectAttempts(0);
    
    // Process queued messages
    processMessageQueue();
    
    // Re-subscribe to all channels
    resubscribeAll();
    
    toast.success('Connected to real-time updates', {
      duration: 2000,
      position: 'bottom-right'
    });
  }, []);

  /**
   * Handle disconnection
   */
  const handleDisconnect = useCallback(() => {
    setConnectionState(CONNECTION_STATES.DISCONNECTED);
    setIsConnected(false);
  }, []);

  /**
   * Handle connection error
   */
  const handleError = useCallback((error) => {
    setConnectionState(CONNECTION_STATES.ERROR);
    setError(error);
    setIsConnected(false);
    
    console.error('WebSocket error:', error);
    
    // Only show error toast in production
    if (!isDev()) {
      toast.error('Connection error occurred', {
        duration: 3000,
        position: 'bottom-right'
      });
    }
  }, []);

  /**
   * Handle incoming messages
   */
  const handleMessage = useCallback((message) => {
    setLastMessage({
      ...message,
      timestamp: Date.now()
    });

    // Notify subscribers
    notifySubscribers(message);
  }, []);

  /**
   * Handle reconnection attempt
   */
  const handleReconnecting = useCallback((attempt) => {
    setConnectionState(CONNECTION_STATES.RECONNECTING);
    setReconnectAttempts(attempt);
    
    toast.loading(`Reconnecting... (${attempt})`, {
      id: 'reconnecting',
      duration: 2000,
      position: 'bottom-right'
    });
  }, []);

  /**
   * Handle successful reconnection
   */
  const handleReconnected = useCallback(() => {
    toast.dismiss('reconnecting');
    toast.success('Reconnected successfully', {
      duration: 2000,
      position: 'bottom-right'
    });
  }, []);

  /**
   * Handle max reconnection attempts reached
   */
  const handleMaxReconnectAttempts = useCallback(() => {
    toast.dismiss('reconnecting');
    toast.error('Unable to reconnect. Please refresh the page.', {
      duration: 5000,
      position: 'bottom-right'
    });
  }, []);

  /**
   * Process queued messages
   */
  const processMessageQueue = useCallback(() => {
    if (!wsServiceRef.current || !isConnected) return;

    while (messageQueueRef.current.length > 0) {
      const message = messageQueueRef.current.shift();
      wsServiceRef.current.send(message);
    }
  }, [isConnected]);

  /**
   * Re-subscribe to all channels after reconnection
   */
  const resubscribeAll = useCallback(() => {
    if (!wsServiceRef.current) return;

    subscribersRef.current.forEach((callbacks, channel) => {
      if (callbacks.size > 0) {
        wsServiceRef.current.subscribe(channel);
      }
    });
  }, []);

  /**
   * Notify subscribers of new messages
   */
  const notifySubscribers = useCallback((message) => {
    const { channel, type } = message;
    
    // Notify channel-specific subscribers
    if (channel && subscribersRef.current.has(channel)) {
      subscribersRef.current.get(channel).forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
    
    // Notify type-specific subscribers
    if (type && subscribersRef.current.has(type)) {
      subscribersRef.current.get(type).forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }, []);

  /**
   * Subscribe to a channel or message type
   */
  const subscribe = useCallback((channelOrType, callback) => {
    if (!callback || typeof callback !== 'function') {
      console.warn('Invalid callback provided to subscribe');
      return () => {};
    }

    // Add to subscribers
    if (!subscribersRef.current.has(channelOrType)) {
      subscribersRef.current.set(channelOrType, new Set());
    }
    subscribersRef.current.get(channelOrType).add(callback);

    // Subscribe via WebSocket if connected
    if (wsServiceRef.current && isConnected) {
      wsServiceRef.current.subscribe(channelOrType);
    }

    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(channelOrType);
      if (subscribers) {
        subscribers.delete(callback);
        
        // If no more subscribers, unsubscribe from WebSocket
        if (subscribers.size === 0) {
          subscribersRef.current.delete(channelOrType);
          if (wsServiceRef.current && isConnected) {
            wsServiceRef.current.unsubscribe(channelOrType);
          }
        }
      }
    };
  }, [isConnected]);

  /**
   * Send a message
   */
  const sendMessage = useCallback((message) => {
    if (!wsServiceRef.current) {
      console.warn('WebSocket not initialized');
      return false;
    }

    if (!isConnected) {
      // Queue message for later
      messageQueueRef.current.push(message);
      return false;
    }

    try {
      wsServiceRef.current.send(message);
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }, [isConnected]);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.reconnect();
    }
  }, []);

  /**
   * Disconnect
   */
  const disconnect = useCallback(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
    }
  }, []);

  /**
   * Get connection statistics
   */
  const getStats = useCallback(() => {
    if (!wsServiceRef.current) return null;
    
    return {
      connectionState,
      isConnected,
      reconnectAttempts,
      subscriberCount: subscribersRef.current.size,
      queuedMessages: messageQueueRef.current.length,
      lastMessage,
      error
    };
  }, [connectionState, isConnected, reconnectAttempts, lastMessage, error]);

  // Initialize WebSocket on mount
  useEffect(() => {
    if (enabled) {
      initializeWebSocket();
    }

    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
    };
  }, [enabled, initializeWebSocket]);

  // Context value
  const contextValue = {
    // Connection state
    connectionState,
    isConnected,
    error,
    reconnectAttempts,
    lastMessage,
    
    // Methods
    subscribe,
    sendMessage,
    reconnect,
    disconnect,
    getStats,
    
    // WebSocket service (for advanced usage)
    wsService: wsServiceRef.current
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to use WebSocket context
 */
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  
  return context;
};

export default WebSocketProvider;
