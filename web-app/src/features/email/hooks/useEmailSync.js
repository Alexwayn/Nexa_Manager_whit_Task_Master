import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useEmailContext } from '@shared/hooks/providers';
import { useWebSocketContext } from '../../../providers/WebSocketProvider';
import { emailSyncService } from '@features/email';
import Logger from '@shared/utils/logger';

/**
 * Custom hook for email synchronization
 * Handles real-time email sync with WebSocket integration
 */
export const useEmailSync = (options = {}) => {
  const {
    autoStart = true,
    intervalMinutes = 5,
    immediate = true,
  } = options;

  const { user } = useUser();
  const { loadEmails, addNotification } = useEmailContext();
  const { subscribe, isConnected } = useWebSocketContext();
  
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [nextSync, setNextSync] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [syncStats, setSyncStats] = useState({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    totalNewEmails: 0,
    lastSyncDuration: null,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize sync service
  useEffect(() => {
    if (user?.id && !isInitialized) {
      initializeSyncService();
    }
  }, [user?.id, isInitialized]);

  // Setup WebSocket subscriptions
  useEffect(() => {
    if (isConnected && user?.id) {
      setupWebSocketSubscriptions();
    }
  }, [isConnected, user?.id]);

  // Auto-start sync if enabled
  useEffect(() => {
    if (autoStart && user?.id && isInitialized && syncStatus === 'idle') {
      startSync();
    }
  }, [autoStart, user?.id, isInitialized, syncStatus]);

  /**
   * Initialize sync service
   */
  const initializeSyncService = async () => {
    try {
      await emailSyncService.initialize();
      setIsInitialized(true);
      
      // Load initial sync status
      const status = emailSyncService.getSyncStatus(user.id);
      updateSyncState(status);
      
      Logger.info('Email sync service initialized for user:', user.id);
    } catch (error) {
      setSyncError(error.message);
      Logger.error('Failed to initialize email sync service:', error);
    }
  };

  /**
   * Setup WebSocket subscriptions for sync events
   */
  const setupWebSocketSubscriptions = () => {
    const unsubscribeSync = subscribe('email:sync', handleSyncWebSocketMessage);
    const unsubscribeEmail = subscribe('email', handleEmailWebSocketMessage);

    return () => {
      unsubscribeSync();
      unsubscribeEmail();
    };
  };

  /**
   * Handle sync WebSocket messages
   */
  const handleSyncWebSocketMessage = useCallback((message) => {
    const { type, data } = message;

    switch (type) {
      case 'sync:started':
        if (data.userId === user.id) {
          setSyncStatus('syncing');
          setSyncError(null);
          
          addNotification({
            id: `sync_started_${Date.now()}`,
            type: 'sync_started',
            title: 'Email Sync Started',
            message: 'Checking for new emails...',
            timestamp: new Date(),
            read: false,
            autoHide: true,
            hideAfter: 3000,
          });
        }
        break;

      case 'sync:completed':
        if (data.userId === user.id) {
          const completedAt = new Date(data.timestamp);
          setLastSync(completedAt);
          setSyncStatus('active');
          setSyncError(null);
          
          // Update stats
          setSyncStats(prev => ({
            ...prev,
            totalSyncs: prev.totalSyncs + 1,
            successfulSyncs: prev.successfulSyncs + 1,
            totalNewEmails: prev.totalNewEmails + (data.newEmails || 0),
          }));

          // Calculate next sync time
          const nextSyncTime = new Date(completedAt.getTime() + intervalMinutes * 60 * 1000);
          setNextSync(nextSyncTime);

          // Refresh emails if new ones were synced
          if (data.newEmails > 0) {
            loadEmails();
            
            addNotification({
              id: `sync_completed_${Date.now()}`,
              type: 'sync_completed',
              title: 'Email Sync Complete',
              message: `${data.newEmails} new email${data.newEmails > 1 ? 's' : ''} received`,
              timestamp: new Date(),
              read: false,
              autoHide: true,
              hideAfter: 5000,
            });
          }
        }
        break;

      case 'sync:error':
        if (data.userId === user.id) {
          setSyncStatus('error');
          setSyncError(data.error);
          
          // Update stats
          setSyncStats(prev => ({
            ...prev,
            totalSyncs: prev.totalSyncs + 1,
            failedSyncs: prev.failedSyncs + 1,
          }));

          addNotification({
            id: `sync_error_${Date.now()}`,
            type: 'sync_error',
            title: 'Email Sync Failed',
            message: data.error || 'Failed to sync emails',
            timestamp: new Date(),
            read: false,
            priority: 'medium',
          });
        }
        break;

      case 'sync:stopped':
        if (data.userId === user.id) {
          setSyncStatus('stopped');
          setNextSync(null);
        }
        break;

      default:
        Logger.debug('Unknown sync WebSocket message type:', type);
    }
  }, [user?.id, intervalMinutes, loadEmails, addNotification]);

  /**
   * Handle email WebSocket messages for sync-related updates
   */
  const handleEmailWebSocketMessage = useCallback((message) => {
    const { type, data } = message;

    // Update sync stats when new emails arrive
    if (type === 'email:new' && data.userId === user.id) {
      setSyncStats(prev => ({
        ...prev,
        totalNewEmails: prev.totalNewEmails + 1,
      }));
    }
  }, [user?.id]);

  /**
   * Start email synchronization
   */
  const startSync = useCallback(async (syncOptions = {}) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      setSyncError(null);
      
      const options = {
        intervalMinutes,
        immediate,
        ...syncOptions,
      };

      const result = await emailSyncService.startSync(user.id, options);
      
      if (result.success) {
        setSyncStatus('active');
        
        // Calculate next sync time
        const nextSyncTime = new Date(Date.now() + options.intervalMinutes * 60 * 1000);
        setNextSync(nextSyncTime);
        
        Logger.info(`Email sync started for user ${user.id}:`, result);
      } else {
        setSyncStatus('error');
        setSyncError(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to start email sync';
      setSyncStatus('error');
      setSyncError(errorMessage);
      Logger.error('Error starting email sync:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id, intervalMinutes, immediate]);

  /**
   * Stop email synchronization
   */
  const stopSync = useCallback(async () => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = emailSyncService.stopSync(user.id);
      
      if (result.success) {
        setSyncStatus('stopped');
        setNextSync(null);
        setSyncError(null);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to stop email sync';
      Logger.error('Error stopping email sync:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id]);

  /**
   * Manually trigger sync
   */
  const triggerSync = useCallback(async () => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      setSyncError(null);
      
      const startTime = Date.now();
      const result = await emailSyncService.triggerSync(user.id);
      const duration = Date.now() - startTime;
      
      if (result.success) {
        // Update stats
        setSyncStats(prev => ({
          ...prev,
          totalSyncs: prev.totalSyncs + 1,
          successfulSyncs: prev.successfulSyncs + 1,
          totalNewEmails: prev.totalNewEmails + (result.newEmails || 0),
          lastSyncDuration: duration,
        }));

        setLastSync(new Date());
        
        // Refresh emails if new ones were synced
        if (result.newEmails > 0) {
          loadEmails();
        }
      } else {
        setSyncStats(prev => ({
          ...prev,
          totalSyncs: prev.totalSyncs + 1,
          failedSyncs: prev.failedSyncs + 1,
        }));
        
        setSyncError(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to trigger sync';
      setSyncError(errorMessage);
      Logger.error('Error triggering email sync:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id, loadEmails]);

  /**
   * Get sync status
   */
  const getSyncStatus = useCallback(() => {
    if (!user?.id) return null;
    
    return emailSyncService.getSyncStatus(user.id);
  }, [user?.id]);

  /**
   * Update sync state from service
   */
  const updateSyncState = useCallback((status) => {
    setSyncStatus(status.status || 'idle');
    setLastSync(status.lastSync ? new Date(status.lastSync) : null);
    setNextSync(status.nextSync ? new Date(status.nextSync) : null);
    setSyncError(status.error || null);
  }, []);

  /**
   * Get time until next sync
   */
  const getTimeUntilNextSync = useCallback(() => {
    if (!nextSync) return null;
    
    const now = new Date();
    const diff = nextSync.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { minutes, seconds, total: diff };
  }, [nextSync]);

  /**
   * Get sync health status
   */
  const getSyncHealth = useCallback(() => {
    const { totalSyncs, successfulSyncs, failedSyncs } = syncStats;
    
    if (totalSyncs === 0) {
      return { status: 'unknown', score: 0, message: 'No sync attempts yet' };
    }
    
    const successRate = (successfulSyncs / totalSyncs) * 100;
    
    if (successRate >= 95) {
      return { status: 'excellent', score: successRate, message: 'Sync is working perfectly' };
    } else if (successRate >= 80) {
      return { status: 'good', score: successRate, message: 'Sync is working well' };
    } else if (successRate >= 60) {
      return { status: 'fair', score: successRate, message: 'Sync has some issues' };
    } else {
      return { status: 'poor', score: successRate, message: 'Sync is having problems' };
    }
  }, [syncStats]);

  // Computed values
  const isActive = syncStatus === 'active';
  const isSyncing = syncStatus === 'syncing';
  const hasError = syncStatus === 'error';
  const isStopped = syncStatus === 'stopped';
  const timeUntilNextSync = getTimeUntilNextSync();
  const syncHealth = getSyncHealth();

  return {
    // State
    syncStatus,
    lastSync,
    nextSync,
    syncError,
    syncStats,
    isInitialized,
    
    // Computed values
    isActive,
    isSyncing,
    hasError,
    isStopped,
    timeUntilNextSync,
    syncHealth,
    
    // Actions
    startSync,
    stopSync,
    triggerSync,
    getSyncStatus,
    
    // Utility
    clearError: () => setSyncError(null),
    resetStats: () => setSyncStats({
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      totalNewEmails: 0,
      lastSyncDuration: null,
    }),
  };
};

export default useEmailSync;
