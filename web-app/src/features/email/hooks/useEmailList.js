import { useState, useEffect, useCallback, useMemo } from 'react';
import { emailManagementService } from '@features/email';
import { useAuth } from '@clerk/clerk-react';
import Logger from '@utils/Logger';

/**
 * useEmailList Hook - Manages email list state and operations
 * 
 * Features:
 * - Email fetching with pagination and filtering
 * - Email selection and bulk operations
 * - Real-time updates and synchronization
 * - Search and filtering capabilities
 */
export const useEmailList = (options = {}) => {
  const { userId } = useAuth();
  const {
    folderId = 'inbox',
    pageSize = 50,
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
  } = options;

  // State
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [lastRefresh, setLastRefresh] = useState(null);

  // Fetch emails
  const fetchEmails = useCallback(async (options = {}) => {
    if (!userId) return;

    const {
      reset = false,
      loadMore = false,
      query = searchQuery,
      currentFilters = filters,
    } = options;

    try {
      setLoading(true);
      setError(null);

      const fetchOptions = {
        folderId,
        page: loadMore ? page + 1 : (reset ? 1 : page),
        limit: pageSize,
        search: query,
        ...currentFilters,
      };

      const result = await emailManagementService.fetchEmails(userId, fetchOptions);

      if (result.success) {
        if (reset || !loadMore) {
          setEmails(result.data);
          setPage(1);
        } else {
          setEmails(prev => [...prev, ...result.data]);
          setPage(prev => prev + 1);
        }

        setTotal(result.total);
        setHasMore(result.hasMore);
        setLastRefresh(new Date());

        // Auto-select first email if none selected and emails exist
        if (result.data.length > 0 && !selectedEmail && (reset || emails.length === 0)) {
          setSelectedEmail(result.data[0]);
        }
      } else {
        setError(result.error);
        Logger.error('Error fetching emails:', result.error);
      }
    } catch (err) {
      setError(err.message);
      Logger.error('Error in fetchEmails:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, folderId, pageSize, page, searchQuery, filters, selectedEmail, emails.length]);

  // Load more emails
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchEmails({ loadMore: true });
    }
  }, [loading, hasMore, fetchEmails]);

  // Refresh emails
  const refresh = useCallback(() => {
    fetchEmails({ reset: true });
  }, [fetchEmails]);

  // Search emails
  const search = useCallback((query) => {
    setSearchQuery(query);
    fetchEmails({ reset: true, query });
  }, [fetchEmails]);

  // Apply filters
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    fetchEmails({ reset: true, currentFilters: newFilters });
  }, [fetchEmails]);

  // Select email
  const selectEmail = useCallback(async (email) => {
    setSelectedEmail(email);
    
    // Mark as read if not already read
    if (!email.isRead) {
      try {
        await emailManagementService.markAsRead(email.id, userId, true);
        // Update local state
        setEmails(prev => prev.map(e => 
          e.id === email.id ? { ...e, isRead: true } : e
        ));
      } catch (err) {
        Logger.error('Error marking email as read:', err);
      }
    }
  }, [userId]);

  // Toggle email selection
  const toggleEmailSelection = useCallback((emailId, checked) => {
    setSelectedEmails(prev => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(emailId);
      } else {
        newSelected.delete(emailId);
      }
      return newSelected;
    });
  }, []);

  // Select all emails
  const selectAllEmails = useCallback((checked) => {
    const safeEmails = Array.isArray(emails) ? emails : [];
    if (checked) {
      setSelectedEmails(new Set(safeEmails.map(email => email.id)));
    } else {
      setSelectedEmails(new Set());
    }
  }, [emails]);

  // Star/unstar email
  const toggleStar = useCallback(async (emailId) => {
    try {
      const safeEmails = Array.isArray(emails) ? emails : [];
      const email = safeEmails.find(e => e.id === emailId);
      if (!email) return;

      const result = await emailManagementService.starEmail(emailId, userId, !email.isStarred);
      
      if (result.success) {
        // Update local state
        setEmails(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          return safePrev.map(e => 
            e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
          );
        });
        
        // Update selected email if it's the same
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(prev => ({ ...prev, isStarred: !prev.isStarred }));
        }
      }
    } catch (err) {
      Logger.error('Error toggling star:', err);
    }
  }, [emails, userId, selectedEmail]);

  // Bulk operations
  const performBulkAction = useCallback(async (action, emailIds = Array.from(selectedEmails)) => {
    if (emailIds.length === 0) return;

    try {
      setLoading(true);
      let result;

      switch (action) {
        case 'delete':
          result = await Promise.all(
            emailIds.map(id => emailManagementService.deleteEmail(id, userId))
          );
          // Remove deleted emails from local state
          setEmails(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.filter(email => !emailIds.includes(email.id));
          });
          break;

        case 'archive':
          result = await emailManagementService.bulkUpdateEmails(emailIds, userId, { 
            folderId: 'archived' 
          });
          if (folderId !== 'archived') {
            setEmails(prev => {
              const safePrev = Array.isArray(prev) ? prev : [];
              return safePrev.filter(email => !emailIds.includes(email.id));
            });
          }
          break;

        case 'markRead':
          result = await emailManagementService.bulkUpdateEmails(emailIds, userId, { 
            isRead: true 
          });
          setEmails(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.map(email => 
              emailIds.includes(email.id) ? { ...email, isRead: true } : email
            );
          });
          break;

        case 'markUnread':
          result = await emailManagementService.bulkUpdateEmails(emailIds, userId, { 
            isRead: false 
          });
          setEmails(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.map(email => 
              emailIds.includes(email.id) ? { ...email, isRead: false } : email
            );
          });
          break;

        case 'star':
          result = await emailManagementService.bulkUpdateEmails(emailIds, userId, { 
            isStarred: true 
          });
          setEmails(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.map(email => 
              emailIds.includes(email.id) ? { ...email, isStarred: true } : email
            );
          });
          break;

        case 'unstar':
          result = await emailManagementService.bulkUpdateEmails(emailIds, userId, { 
            isStarred: false 
          });
          setEmails(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.map(email => 
              emailIds.includes(email.id) ? { ...email, isStarred: false } : email
            );
          });
          break;

        default:
          Logger.warn('Unknown bulk action:', action);
          return;
      }

      // Clear selection after bulk action
      setSelectedEmails(new Set());
      
      Logger.info(`Bulk action ${action} completed for ${emailIds.length} emails`);
    } catch (err) {
      setError(err.message);
      Logger.error('Error performing bulk action:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedEmails, userId, folderId]);

  // Move email to folder
  const moveToFolder = useCallback(async (emailId, targetFolderId) => {
    try {
      const result = await emailManagementService.moveToFolder(emailId, userId, targetFolderId);
      
      if (result.success) {
        // Remove from current list if moving to different folder
        if (targetFolderId !== folderId) {
          setEmails(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.filter(email => email.id !== emailId);
          });
          
          // Clear selection if moved email was selected
          if (selectedEmail?.id === emailId) {
            setSelectedEmail(null);
          }
        } else {
          // Update folder in local state
          setEmails(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.map(email => 
              email.id === emailId ? { ...email, folderId: targetFolderId } : email
            );
          });
        }
      }
    } catch (err) {
      Logger.error('Error moving email to folder:', err);
    }
  }, [userId, folderId, selectedEmail]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(() => {
      fetchEmails({ reset: true });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchEmails, userId]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchEmails({ reset: true });
    }
  }, [userId, folderId]); // Re-fetch when folder changes

  // Computed values
  const stats = useMemo(() => {
    const safeEmails = Array.isArray(emails) ? emails : [];
    return {
      total,
      unread: safeEmails.filter(email => !email.isRead).length,
      starred: safeEmails.filter(email => email.isStarred).length,
      selected: selectedEmails.size,
    };
  }, [emails, total, selectedEmails.size]);

  return {
    // Data
    emails,
    selectedEmail,
    selectedEmails,
    loading,
    error,
    hasMore,
    stats,
    lastRefresh,

    // Actions
    fetchEmails,
    loadMore,
    refresh,
    search,
    applyFilters,
    selectEmail,
    toggleEmailSelection,
    selectAllEmails,
    toggleStar,
    performBulkAction,
    moveToFolder,

    // State setters (for external control)
    setSearchQuery,
    setFilters,
    setSelectedEmail,
    setSelectedEmails,
  };
};

export default useEmailList;