import { useCallback, useEffect, useState } from 'react';
import { useEmailContext } from '@context/EmailContext';
import emailManagementService from '@lib/emailManagementService';
import { useAuth } from '@context/AuthContext';
import Logger from '@utils/Logger';

/**
 * Enhanced useEmails hook
 * Provides email management functionality with context integration
 */
export const useEmails = (options = {}) => {
  const {
    autoLoad = true,
    folderId = null,
    searchQuery = null,
    filters = null,
  } = options;

  const { user } = useAuth();
  const {
    emails,
    selectedEmail,
    emailsLoading,
    emailsError,
    hasMoreEmails,
    totalEmails,
    selectedFolder,
    searchQuery: contextSearchQuery,
    filters: contextFilters,
    loadEmails,
    selectEmail,
    setSearchQuery,
    setFilters,
    selectFolder,
    dispatch,
    EMAIL_ACTIONS,
  } = useEmailContext();

  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Use provided options or context values
  const currentFolderId = folderId || selectedFolder;
  const currentSearchQuery = searchQuery !== null ? searchQuery : contextSearchQuery;
  const currentFilters = filters || contextFilters;

  // Auto-load emails when dependencies change
  useEffect(() => {
    if (autoLoad && user?.id) {
      loadEmails();
    }
  }, [autoLoad, user?.id, currentFolderId, currentSearchQuery, currentFilters, loadEmails]);

  /**
   * Refresh emails
   */
  const refresh = useCallback(async () => {
    await loadEmails();
  }, [loadEmails]);

  /**
   * Load more emails (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMoreEmails || emailsLoading) return;
    
    await loadEmails({ append: true });
  }, [hasMoreEmails, emailsLoading, loadEmails]);

  /**
   * Get email by ID
   */
  const getEmail = useCallback(async (emailId) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      setLocalLoading(true);
      setLocalError(null);

      const result = await emailManagementService.getEmail(emailId, user.id);
      
      if (result.success) {
        // Update email in context if it exists in current list
        const emailIndex = emails.findIndex(e => e.id === emailId);
        if (emailIndex !== -1) {
          dispatch({
            type: 'UPDATE_EMAIL',
            payload: {
              emailId,
              updates: result.data,
            },
          });
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to get email';
      setLocalError(errorMessage);
      Logger.error('Error getting email:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLocalLoading(false);
    }
  }, [user?.id, emails, dispatch]);

  /**
   * Send email
   */
  const sendEmail = useCallback(async (emailData) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      setLocalLoading(true);
      setLocalError(null);

      const result = await emailManagementService.sendEmail(user.id, emailData);
      
      if (result.success) {
        // Add sent email to context if we're viewing sent folder
        if (currentFolderId === 'sent') {
          dispatch({
            type: 'ADD_EMAIL',
            payload: { email: result.email },
          });
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to send email';
      setLocalError(errorMessage);
      Logger.error('Error sending email:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLocalLoading(false);
    }
  }, [user?.id, currentFolderId, dispatch]);

  /**
   * Delete email
   */
  const deleteEmail = useCallback(async (emailId, permanent = false) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      setLocalLoading(true);
      setLocalError(null);

      const result = await emailManagementService.deleteEmail(emailId, user.id, permanent);
      
      if (result.success) {
        if (permanent) {
          // Remove from context
          dispatch({
            type: 'REMOVE_EMAIL',
            payload: { emailId },
          });
        } else {
          // Update folder to trash
          dispatch({
            type: 'UPDATE_EMAIL',
            payload: {
              emailId,
              updates: { folderId: 'trash' },
            },
          });
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete email';
      setLocalError(errorMessage);
      Logger.error('Error deleting email:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLocalLoading(false);
    }
  }, [user?.id, dispatch]);

  /**
   * Mark email as read/unread
   */
  const markAsRead = useCallback(async (emailId, isRead = true) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await emailManagementService.markAsRead(emailId, user.id, isRead);
      
      if (result.success) {
        dispatch({
          type: 'UPDATE_EMAIL',
          payload: {
            emailId,
            updates: { isRead },
          },
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to mark email as read';
      setLocalError(errorMessage);
      Logger.error('Error marking email as read:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id, dispatch]);

  /**
   * Star/unstar email
   */
  const starEmail = useCallback(async (emailId, isStarred = true) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await emailManagementService.starEmail(emailId, user.id, isStarred);
      
      if (result.success) {
        dispatch({
          type: 'UPDATE_EMAIL',
          payload: {
            emailId,
            updates: { isStarred },
          },
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to star email';
      setLocalError(errorMessage);
      Logger.error('Error starring email:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id, dispatch]);

  /**
   * Move email to folder
   */
  const moveToFolder = useCallback(async (emailId, targetFolderId) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await emailManagementService.moveToFolder(emailId, user.id, targetFolderId);
      
      if (result.success) {
        dispatch({
          type: 'UPDATE_EMAIL',
          payload: {
            emailId,
            updates: { folderId: targetFolderId },
          },
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to move email';
      setLocalError(errorMessage);
      Logger.error('Error moving email:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id, dispatch]);

  /**
   * Apply label to email
   */
  const applyLabel = useCallback(async (emailId, labelId) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await emailManagementService.applyLabel(emailId, user.id, labelId);
      
      if (result.success) {
        const email = emails.find(e => e.id === emailId);
        if (email) {
          const updatedLabels = [...(email.labels || []), labelId];
          dispatch({
            type: 'UPDATE_EMAIL',
            payload: {
              emailId,
              updates: { labels: updatedLabels },
            },
          });
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to apply label';
      setLocalError(errorMessage);
      Logger.error('Error applying label:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id, emails, dispatch]);

  /**
   * Remove label from email
   */
  const removeLabel = useCallback(async (emailId, labelId) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await emailManagementService.removeLabel(emailId, user.id, labelId);
      
      if (result.success) {
        const email = emails.find(e => e.id === emailId);
        if (email) {
          const updatedLabels = (email.labels || []).filter(l => l !== labelId);
          dispatch({
            type: 'UPDATE_EMAIL',
            payload: {
              emailId,
              updates: { labels: updatedLabels },
            },
          });
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to remove label';
      setLocalError(errorMessage);
      Logger.error('Error removing label:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id, emails, dispatch]);

  /**
   * Bulk update emails
   */
  const bulkUpdate = useCallback(async (emailIds, updates) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      setLocalLoading(true);
      setLocalError(null);

      const result = await emailManagementService.bulkUpdateEmails(emailIds, user.id, updates);
      
      if (result.success) {
        // Update all affected emails in context
        emailIds.forEach(emailId => {
          dispatch({
            type: 'UPDATE_EMAIL',
            payload: {
              emailId,
              updates,
            },
          });
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to bulk update emails';
      setLocalError(errorMessage);
      Logger.error('Error bulk updating emails:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLocalLoading(false);
    }
  }, [user?.id, dispatch]);

  /**
   * Search emails
   */
  const searchEmails = useCallback(async (query, searchOptions = {}) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      setLocalLoading(true);
      setLocalError(null);

      const result = await emailManagementService.searchEmails(user.id, query, searchOptions);
      
      if (result.success) {
        // Update search query in context
        setSearchQuery(query);
        
        // Update emails in context
        dispatch({
          type: 'SET_EMAILS',
          payload: {
            emails: result.data,
            total: result.total,
            hasMore: result.hasMore,
          },
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to search emails';
      setLocalError(errorMessage);
      Logger.error('Error searching emails:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLocalLoading(false);
    }
  }, [user?.id, setSearchQuery, dispatch]);

  /**
   * Get emails by client
   */
  const getEmailsByClient = useCallback(async (clientId, clientOptions = {}) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      setLocalLoading(true);
      setLocalError(null);

      const result = await emailManagementService.getEmailsByClient(user.id, clientId, clientOptions);
      
      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to get client emails';
      setLocalError(errorMessage);
      Logger.error('Error getting client emails:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLocalLoading(false);
    }
  }, [user?.id]);

  /**
   * Get email statistics
   */
  const getEmailStats = useCallback(async () => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await emailManagementService.getEmailStats(user.id);
      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to get email stats';
      Logger.error('Error getting email stats:', error);
      return { success: false, error: errorMessage };
    }
  }, [user?.id]);

  // Computed values
  const unreadEmails = emails.filter(email => !email.isRead);
  const starredEmails = emails.filter(email => email.isStarred);
  const importantEmails = emails.filter(email => email.isImportant);

  return {
    // State
    emails,
    selectedEmail,
    loading: emailsLoading || localLoading,
    error: emailsError || localError,
    hasMoreEmails,
    totalEmails,
    
    // Computed values
    unreadEmails,
    starredEmails,
    importantEmails,
    unreadCount: unreadEmails.length,
    starredCount: starredEmails.length,
    importantCount: importantEmails.length,
    
    // Actions
    refresh,
    loadMore,
    getEmail,
    sendEmail,
    deleteEmail,
    markAsRead,
    starEmail,
    moveToFolder,
    applyLabel,
    removeLabel,
    bulkUpdate,
    searchEmails,
    getEmailsByClient,
    getEmailStats,
    selectEmail,
    
    // Context actions
    setSearchQuery,
    setFilters,
    selectFolder,
    
    // Utility
    clearError: () => setLocalError(null),
  };
};

export default useEmails;