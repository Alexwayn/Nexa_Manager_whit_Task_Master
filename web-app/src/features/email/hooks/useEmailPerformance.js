import { useState, useEffect, useCallback, useRef } from 'react';
import { emailCacheService } from '@features/email';
import Logger from '@utils/Logger';

/**
 * useEmailPerformance - Hook for optimized email loading and caching
 * 
 * Features:
 * - Lazy loading of email content
 * - Background synchronization
 * - Intelligent prefetching
 * - Performance monitoring
 */
export const useEmailPerformance = (options = {}) => {
  const {
    pageSize = 50,
    prefetchCount = 10,
    syncInterval = 5 * 60 * 1000, // 5 minutes
    enableBackgroundSync = true,
    onEmailLoad,
    onError,
  } = options;

  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error
  
  const loadedEmailsRef = useRef(new Set());
  const syncIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Load email content with caching
   */
  const loadEmailContent = useCallback(async (emailId) => {
    try {
      const content = await emailCacheService.getEmailContent(emailId, async (id) => {
        // This would be replaced with actual email loading logic
        const response = await fetch(`/api/emails/${id}/content`);
        if (!response.ok) throw new Error('Failed to load email content');
        return response.json();
      });
      
      if (onEmailLoad) {
        onEmailLoad(emailId, content);
      }
      
      return content;
    } catch (error) {
      Logger.error(`Failed to load email content for ${emailId}:`, error);
      if (onError) {
        onError(error, emailId);
      }
      throw error;
    }
  }, [onEmailLoad, onError]);

  /**
   * Load emails with pagination
   */
  const loadEmails = useCallback(async (page = 0, append = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(`/api/emails?page=${page}&limit=${pageSize}`, {
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error('Failed to load emails');
      }
      
      const data = await response.json();
      const newEmails = data.emails || [];
      
      setEmails(prev => append ? [...prev, ...newEmails] : newEmails);
      setHasMore(newEmails.length === pageSize);
      
      // Track loaded emails
      newEmails.forEach(email => {
        loadedEmailsRef.current.add(email.id);
      });
      
      // Prefetch visible email content
      if (newEmails.length > 0) {
        prefetchEmailContent(newEmails.slice(0, prefetchCount));
      }
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        Logger.error('Error loading emails:', error);
        setError(error.message);
        if (onError) {
          onError(error);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [loading, pageSize, prefetchCount, onError]);

  /**
   * Load more emails (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const safeEmails = Array.isArray(emails) ? emails : [];
      const currentPage = Math.floor(safeEmails.length / pageSize);
      loadEmails(currentPage, true);
    }
  }, [loading, hasMore, emails, pageSize, loadEmails]);

  /**
   * Refresh emails
   */
  const refresh = useCallback(async () => {
    loadedEmailsRef.current.clear();
    emailCacheService.clear();
    await loadEmails(0, false);
  }, [loadEmails]);

  /**
   * Prefetch email content for visible items
   */
  const prefetchEmailContent = useCallback(async (emailList) => {
    const emailIds = emailList
      .slice(0, prefetchCount)
      .map(email => email.id);
    
    try {
      await emailCacheService.preloadEmails(emailIds, async (emailId) => {
        const response = await fetch(`/api/emails/${emailId}/content`);
        if (!response.ok) throw new Error('Failed to load email content');
        return response.json();
      });
    } catch (error) {
      Logger.warn('Error prefetching email content:', error);
    }
  }, [prefetchCount]);

  /**
   * Background synchronization
   */
  const backgroundSync = useCallback(async () => {
    if (!enableBackgroundSync) return;
    
    setSyncStatus('syncing');
    
    try {
      // Check for new emails
      const response = await fetch('/api/emails/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastSyncTime: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      
      const syncData = await response.json();
      
      if (syncData.hasNewEmails) {
        // Refresh email list if there are new emails
        await refresh();
      }
      
      setSyncStatus('idle');
      Logger.debug('Background sync completed successfully');
      
    } catch (error) {
      Logger.error('Background sync failed:', error);
      setSyncStatus('error');
    }
  }, [enableBackgroundSync, refresh]);

  /**
   * Get email content with lazy loading
   */
  const getEmailContent = useCallback(async (emailId) => {
    return loadEmailContent(emailId);
  }, [loadEmailContent]);

  /**
   * Mark emails as read optimistically
   */
  const markAsRead = useCallback(async (emailIds) => {
    // Optimistic update
    setEmails(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map(email => 
        emailIds.includes(email.id) 
          ? { ...email, read: true }
          : email
      );
    });
    
    try {
      const response = await fetch('/api/emails/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark emails as read');
      }
    } catch (error) {
      Logger.error('Error marking emails as read:', error);
      // Revert optimistic update
      setEmails(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.map(email => 
          emailIds.includes(email.id) 
            ? { ...email, read: false }
            : email
        );
      });
      throw error;
    }
  }, []);

  /**
   * Get performance statistics
   */
  const getPerformanceStats = useCallback(() => {
    const safeEmails = Array.isArray(emails) ? emails : [];
    return {
      ...emailCacheService.getStats(),
      loadedEmails: loadedEmailsRef.current.size,
      totalEmails: safeEmails.length,
      syncStatus,
    };
  }, [emails, syncStatus]);

  // Initialize
  useEffect(() => {
    loadEmails(0, false);
  }, []);

  // Setup background sync
  useEffect(() => {
    if (enableBackgroundSync && syncInterval > 0) {
      syncIntervalRef.current = setInterval(backgroundSync, syncInterval);
      
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [enableBackgroundSync, syncInterval, backgroundSync]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  return {
    emails,
    loading,
    error,
    hasMore,
    syncStatus,
    loadMore,
    refresh,
    getEmailContent,
    markAsRead,
    prefetchEmailContent,
    getPerformanceStats,
  };
};

/**
 * useEmailVirtualization - Hook for virtual scrolling optimization
 */
export const useEmailVirtualization = (emails, containerHeight = 600, itemHeight = 80) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  
  const safeEmails = Array.isArray(emails) ? emails : [];
  const totalHeight = safeEmails.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const bufferSize = Math.max(5, Math.floor(visibleCount * 0.5));
  
  useEffect(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      safeEmails.length - 1,
      startIndex + visibleCount + bufferSize
    );
    
    setVisibleRange({
      start: Math.max(0, startIndex - bufferSize),
      end: endIndex,
    });
  }, [scrollTop, safeEmails.length, itemHeight, visibleCount, bufferSize]);
  
  const handleScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop);
  }, []);
  
  const visibleEmails = safeEmails.slice(visibleRange.start, visibleRange.end + 1);
  const offsetY = visibleRange.start * itemHeight;
  
  return {
    visibleEmails,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
  };
};

export default useEmailPerformance;