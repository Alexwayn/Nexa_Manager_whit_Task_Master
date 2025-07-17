/**
 * React Hook for WebSocket Real-time Updates
 * Provides real-time data updates for reports and dashboard
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocketService';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Custom hook for WebSocket real-time updates
 * @param {Object} options - Configuration options
 * @returns {Object} WebSocket state and methods
 */
export const useWebSocket = (options = {}) => {
  const {
    autoConnect = true,
    subscribeToReports = [],
    subscribeToDashboard = false,
    onReportStatusUpdate,
    onRealTimeData,
    onNotification
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const queryClient = useQueryClient();
  const listenersRef = useRef(new Map());

  /**
   * Handle connection status changes
   */
  const handleConnectionChange = useCallback((connected) => {
    setIsConnected(connected);
    if (connected) {
      setConnectionError(null);
    }
  }, []);

  /**
   * Handle WebSocket errors
   */
  const handleError = useCallback((error) => {
    setConnectionError(error);
    console.error('WebSocket error:', error);
  }, []);

  /**
   * Handle report status updates
   */
  const handleReportStatusUpdate = useCallback((data) => {
    setLastMessage({ type: 'reportStatusUpdate', data, timestamp: Date.now() });
    
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['reports', 'history'] });
    queryClient.invalidateQueries({ queryKey: ['reports', 'status', data.reportId] });
    
    // Call custom handler if provided
    if (onReportStatusUpdate) {
      onReportStatusUpdate(data);
    }
  }, [queryClient, onReportStatusUpdate]);

  /**
   * Handle real-time data updates
   */
  const handleRealTimeData = useCallback((data) => {
    setLastMessage({ type: 'realTimeData', data, timestamp: Date.now() });
    
    // Update specific query cache based on data type
    if (data.type === 'metrics') {
      queryClient.setQueryData(['reports', 'metrics'], (oldData) => ({
        ...oldData,
        ...data.metrics,
        lastUpdated: Date.now()
      }));
    }
    
    if (data.type === 'chartData') {
      queryClient.setQueryData(['reports', 'chartData'], (oldData) => ({
        ...oldData,
        ...data.chartData,
        lastUpdated: Date.now()
      }));
    }
    
    // Call custom handler if provided
    if (onRealTimeData) {
      onRealTimeData(data);
    }
  }, [queryClient, onRealTimeData]);

  /**
   * Handle dashboard updates
   */
  const handleDashboardUpdate = useCallback((data) => {
    setLastMessage({ type: 'dashboardUpdate', data, timestamp: Date.now() });
    
    // Invalidate dashboard-related queries
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }, [queryClient]);

  /**
   * Handle notifications
   */
  const handleNotification = useCallback((data) => {
    setLastMessage({ type: 'notification', data, timestamp: Date.now() });
    
    // Call custom handler if provided
    if (onNotification) {
      onNotification(data);
    }
  }, [onNotification]);

  /**
   * Handle report generation completion
   */
  const handleReportGenerated = useCallback((data) => {
    setLastMessage({ type: 'reportGenerated', data, timestamp: Date.now() });
    
    // Invalidate reports queries
    queryClient.invalidateQueries({ queryKey: ['reports', 'history'] });
    queryClient.invalidateQueries({ queryKey: ['reports', 'templates'] });
  }, [queryClient]);

  /**
   * Setup event listeners
   */
  const setupListeners = useCallback(() => {
    const listeners = [
      ['connected', () => handleConnectionChange(true)],
      ['disconnected', () => handleConnectionChange(false)],
      ['error', handleError],
      ['reportStatusUpdate', handleReportStatusUpdate],
      ['realTimeData', handleRealTimeData],
      ['dashboardUpdate', handleDashboardUpdate],
      ['notification', handleNotification],
      ['reportGenerated', handleReportGenerated]
    ];

    listeners.forEach(([event, handler]) => {
      websocketService.on(event, handler);
      listenersRef.current.set(event, handler);
    });
  }, [
    handleConnectionChange,
    handleError,
    handleReportStatusUpdate,
    handleRealTimeData,
    handleDashboardUpdate,
    handleNotification,
    handleReportGenerated
  ]);

  /**
   * Cleanup event listeners
   */
  const cleanupListeners = useCallback(() => {
    listenersRef.current.forEach((handler, event) => {
      websocketService.off(event, handler);
    });
    listenersRef.current.clear();
  }, []);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (!websocketService.getConnectionStatus()) {
      websocketService.connect();
    }
  }, []);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  /**
   * Subscribe to specific report updates
   */
  const subscribeToReport = useCallback((reportId) => {
    websocketService.subscribeToReport(reportId);
  }, []);

  /**
   * Unsubscribe from report updates
   */
  const unsubscribeFromReport = useCallback((reportId) => {
    websocketService.unsubscribeFromReport(reportId);
  }, []);

  /**
   * Request real-time data for specific metrics
   */
  const requestRealTimeData = useCallback((metrics) => {
    websocketService.requestRealTimeData(metrics);
  }, []);

  /**
   * Send custom message
   */
  const sendMessage = useCallback((data) => {
    websocketService.send(data);
  }, []);

  // Setup and cleanup effects
  useEffect(() => {
    setupListeners();
    
    if (autoConnect) {
      connect();
    }

    return () => {
      cleanupListeners();
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect, setupListeners, cleanupListeners]);

  // Subscribe to reports on connection
  useEffect(() => {
    if (isConnected && subscribeToReports.length > 0) {
      subscribeToReports.forEach(reportId => {
        subscribeToReport(reportId);
      });
    }
  }, [isConnected, subscribeToReports, subscribeToReport]);

  // Subscribe to dashboard updates
  useEffect(() => {
    if (isConnected && subscribeToDashboard) {
      websocketService.subscribeToDashboard();
    }
  }, [isConnected, subscribeToDashboard]);

  return {
    isConnected,
    connectionError,
    lastMessage,
    connect,
    disconnect,
    subscribeToReport,
    unsubscribeFromReport,
    requestRealTimeData,
    sendMessage
  };
};

/**
 * Hook specifically for report real-time updates
 * @param {string|Array} reportIds - Report ID(s) to subscribe to
 * @returns {Object} Report-specific WebSocket state
 */
export const useReportRealTime = (reportIds) => {
  const reportIdsArray = Array.isArray(reportIds) ? reportIds : [reportIds].filter(Boolean);
  
  return useWebSocket({
    autoConnect: true,
    subscribeToReports: reportIdsArray,
    subscribeToDashboard: false
  });
};

/**
 * Hook specifically for dashboard real-time updates
 * @returns {Object} Dashboard-specific WebSocket state
 */
export const useDashboardRealTime = () => {
  return useWebSocket({
    autoConnect: true,
    subscribeToReports: [],
    subscribeToDashboard: true
  });
};

export default useWebSocket;