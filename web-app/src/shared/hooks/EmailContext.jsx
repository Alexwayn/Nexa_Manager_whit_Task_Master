import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import emailManagementService from '@/features/email/services/emailManagementService';
import { useUser } from '@clerk/clerk-react';
import { useWebSocketContext } from '@/providers/WebSocketProvider';
import Logger from '@/utils/Logger';

/**
 * Email Context - Global email state management
 * Provides centralized state management for email functionality
 */

// Action types
const EMAIL_ACTIONS = {
  // Loading states
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Email data
  SET_EMAILS: 'SET_EMAILS',
  ADD_EMAIL: 'ADD_EMAIL',
  UPDATE_EMAIL: 'UPDATE_EMAIL',
  REMOVE_EMAIL: 'REMOVE_EMAIL',
  SET_SELECTED_EMAIL: 'SET_SELECTED_EMAIL',
  
  // Folders and labels
  SET_FOLDERS: 'SET_FOLDERS',
  ADD_FOLDER: 'ADD_FOLDER',
  UPDATE_FOLDER: 'UPDATE_FOLDER',
  REMOVE_FOLDER: 'REMOVE_FOLDER',
  SET_SELECTED_FOLDER: 'SET_SELECTED_FOLDER',
  
  // Templates
  SET_TEMPLATES: 'SET_TEMPLATES',
  ADD_TEMPLATE: 'ADD_TEMPLATE',
  UPDATE_TEMPLATE: 'UPDATE_TEMPLATE',
  REMOVE_TEMPLATE: 'REMOVE_TEMPLATE',
  
  // UI state
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_FILTERS: 'SET_FILTERS',
  SET_COMPOSER_OPEN: 'SET_COMPOSER_OPEN',
  SET_COMPOSER_DATA: 'SET_COMPOSER_DATA',
  
  // Sync state
  SET_SYNC_STATUS: 'SET_SYNC_STATUS',
  SET_LAST_SYNC: 'SET_LAST_SYNC',
  
  // Notifications
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
};

// Initial state
const initialState = {
  // Email data
  emails: [],
  selectedEmail: null,
  emailsLoading: false,
  emailsError: null,
  hasMoreEmails: false,
  totalEmails: 0,
  
  // Folders and labels
  folders: [],
  selectedFolder: 'inbox',
  foldersLoading: false,
  foldersError: null,
  
  // Templates
  templates: [],
  templatesLoading: false,
  templatesError: null,
  
  // UI state
  searchQuery: '',
  filters: {
    isRead: null,
    isStarred: null,
    isImportant: null,
    hasAttachments: null,
    dateRange: null,
    labels: [],
  },
  composerOpen: false,
  composerData: null,
  
  // Sync state
  syncStatus: 'idle', // idle, syncing, error
  lastSync: null,
  syncError: null,
  
  // Notifications
  notifications: [],
  unreadCount: 0,
};

// Reducer function
const emailReducer = (state, action) => {
  switch (action.type) {
    case EMAIL_ACTIONS.SET_LOADING:
      return {
        ...state,
        [`${action.payload.type}Loading`]: action.payload.loading,
      };
      
    case EMAIL_ACTIONS.SET_ERROR:
      return {
        ...state,
        [`${action.payload.type}Error`]: action.payload.error,
      };
      
    case EMAIL_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        [`${action.payload.type}Error`]: null,
      };
      
    case EMAIL_ACTIONS.SET_EMAILS:
      return {
        ...state,
        emails: action.payload.emails,
        totalEmails: action.payload.total || state.totalEmails,
        hasMoreEmails: action.payload.hasMore || false,
        emailsLoading: false,
        emailsError: null,
      };
      
    case EMAIL_ACTIONS.ADD_EMAIL:
      return {
        ...state,
        emails: [action.payload.email, ...state.emails],
        totalEmails: state.totalEmails + 1,
      };
      
    case EMAIL_ACTIONS.UPDATE_EMAIL:
      return {
        ...state,
        emails: state.emails.map(email =>
          email.id === action.payload.emailId
            ? { ...email, ...action.payload.updates }
            : email
        ),
        selectedEmail: state.selectedEmail?.id === action.payload.emailId
          ? { ...state.selectedEmail, ...action.payload.updates }
          : state.selectedEmail,
      };
      
    case EMAIL_ACTIONS.REMOVE_EMAIL:
      return {
        ...state,
        emails: state.emails.filter(email => email.id !== action.payload.emailId),
        totalEmails: Math.max(0, state.totalEmails - 1),
        selectedEmail: state.selectedEmail?.id === action.payload.emailId
          ? null
          : state.selectedEmail,
      };
      
    case EMAIL_ACTIONS.SET_SELECTED_EMAIL:
      return {
        ...state,
        selectedEmail: action.payload.email,
      };
      
    case EMAIL_ACTIONS.SET_FOLDERS:
      return {
        ...state,
        folders: action.payload.folders,
        foldersLoading: false,
        foldersError: null,
      };
      
    case EMAIL_ACTIONS.ADD_FOLDER:
      return {
        ...state,
        folders: [...state.folders, action.payload.folder],
      };
      
    case EMAIL_ACTIONS.UPDATE_FOLDER:
      return {
        ...state,
        folders: state.folders.map(folder =>
          folder.id === action.payload.folderId
            ? { ...folder, ...action.payload.updates }
            : folder
        ),
      };
      
    case EMAIL_ACTIONS.REMOVE_FOLDER:
      return {
        ...state,
        folders: state.folders.filter(folder => folder.id !== action.payload.folderId),
        selectedFolder: state.selectedFolder === action.payload.folderId
          ? 'inbox'
          : state.selectedFolder,
      };
      
    case EMAIL_ACTIONS.SET_SELECTED_FOLDER:
      return {
        ...state,
        selectedFolder: action.payload.folderId,
        emails: [], // Clear emails when changing folders
        selectedEmail: null,
      };
      
    case EMAIL_ACTIONS.SET_TEMPLATES:
      return {
        ...state,
        templates: action.payload.templates,
        templatesLoading: false,
        templatesError: null,
      };
      
    case EMAIL_ACTIONS.ADD_TEMPLATE:
      return {
        ...state,
        templates: [...state.templates, action.payload.template],
      };
      
    case EMAIL_ACTIONS.UPDATE_TEMPLATE:
      return {
        ...state,
        templates: state.templates.map(template =>
          template.id === action.payload.templateId
            ? { ...template, ...action.payload.updates }
            : template
        ),
      };
      
    case EMAIL_ACTIONS.REMOVE_TEMPLATE:
      return {
        ...state,
        templates: state.templates.filter(template => template.id !== action.payload.templateId),
      };
      
    case EMAIL_ACTIONS.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload.query,
        emails: [], // Clear emails when searching
        selectedEmail: null,
      };
      
    case EMAIL_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload.filters },
        emails: [], // Clear emails when filtering
        selectedEmail: null,
      };
      
    case EMAIL_ACTIONS.SET_COMPOSER_OPEN:
      return {
        ...state,
        composerOpen: action.payload.open,
        composerData: action.payload.open ? action.payload.data || null : null,
      };
      
    case EMAIL_ACTIONS.SET_COMPOSER_DATA:
      return {
        ...state,
        composerData: action.payload.data,
      };
      
    case EMAIL_ACTIONS.SET_SYNC_STATUS:
      return {
        ...state,
        syncStatus: action.payload.status,
        syncError: action.payload.status === 'error' ? action.payload.error : null,
      };
      
    case EMAIL_ACTIONS.SET_LAST_SYNC:
      return {
        ...state,
        lastSync: action.payload.timestamp,
        syncStatus: 'idle',
      };
      
    case EMAIL_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload.notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
      
    case EMAIL_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload.notificationId),
      };
      
    case EMAIL_ACTIONS.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.notificationId
            ? { ...n, read: true }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
      
    default:
      return state;
  }
};

// Create context
const EmailContext = createContext(null);

/**
 * Email Provider Component
 */
export const EmailProvider = ({ children }) => {
  const [state, dispatch] = useReducer(emailReducer, initialState);
  const { user } = useUser();
  const { subscribe, isConnected } = useWebSocketContext();
  const syncTimeoutRef = useRef(null);
  const unsubscribeRefs = useRef([]);

  // Initialize email service and load initial data
  useEffect(() => {
    if (user?.id) {
      initializeEmailService();
      loadInitialData();
      setupWebSocketSubscriptions();
    }

    return () => {
      // Cleanup subscriptions
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
      
      // Clear sync timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user?.id, isConnected]);

  /**
   * Initialize email management service
   */
  const initializeEmailService = async () => {
    try {
      await emailManagementService.initialize(user.id);
      Logger.info('Email service initialized for user:', user.id);
    } catch (error) {
      Logger.error('Failed to initialize email service:', error);
      dispatch({
        type: EMAIL_ACTIONS.SET_ERROR,
        payload: { type: 'emails', error: error.message },
      });
    }
  };

  /**
   * Load initial data (folders, templates)
   */
  const loadInitialData = async () => {
    await Promise.all([
      loadFolders(),
      loadTemplates(),
    ]);
    
    // Load emails for default folder
    await loadEmails();
  };

  /**
   * Setup WebSocket subscriptions for real-time updates
   */
  const setupWebSocketSubscriptions = () => {
    if (!isConnected) return;

    // Subscribe to email events
    const emailUnsubscribe = subscribe('email', handleEmailWebSocketMessage);
    const syncUnsubscribe = subscribe('email:sync', handleSyncWebSocketMessage);
    const notificationUnsubscribe = subscribe('email:notification', handleNotificationWebSocketMessage);

    unsubscribeRefs.current.push(emailUnsubscribe, syncUnsubscribe, notificationUnsubscribe);
  };

  /**
   * Handle email WebSocket messages
   */
  const handleEmailWebSocketMessage = useCallback((message) => {
    const { type, data } = message;

    switch (type) {
      case 'email:new':
        dispatch({
          type: EMAIL_ACTIONS.ADD_EMAIL,
          payload: { email: data.email },
        });
        
        // Add notification for new email
        addNotification({
          id: `email_${data.email.id}`,
          type: 'email',
          title: 'New Email',
          message: `From: ${data.email.sender.name} - ${data.email.subject}`,
          timestamp: new Date(),
          read: false,
          data: { emailId: data.email.id },
        });
        break;
        
      case 'email:updated':
        dispatch({
          type: EMAIL_ACTIONS.UPDATE_EMAIL,
          payload: {
            emailId: data.emailId,
            updates: data.updates,
          },
        });
        break;
        
      case 'email:deleted':
        dispatch({
          type: EMAIL_ACTIONS.REMOVE_EMAIL,
          payload: { emailId: data.emailId },
        });
        break;
        
      case 'folder:updated':
        dispatch({
          type: EMAIL_ACTIONS.UPDATE_FOLDER,
          payload: {
            folderId: data.folderId,
            updates: data.updates,
          },
        });
        break;
        
      default:
        Logger.debug('Unknown email WebSocket message type:', type);
    }
  }, []);

  /**
   * Handle sync WebSocket messages
   */
  const handleSyncWebSocketMessage = useCallback((message) => {
    const { type, data } = message;

    switch (type) {
      case 'sync:started':
        dispatch({
          type: EMAIL_ACTIONS.SET_SYNC_STATUS,
          payload: { status: 'syncing' },
        });
        break;
        
      case 'sync:completed':
        dispatch({
          type: EMAIL_ACTIONS.SET_LAST_SYNC,
          payload: { timestamp: new Date(data.timestamp) },
        });
        
        // Refresh emails if sync brought new messages
        if (data.newEmails > 0) {
          loadEmails();
        }
        break;
        
      case 'sync:error':
        dispatch({
          type: EMAIL_ACTIONS.SET_SYNC_STATUS,
          payload: { status: 'error', error: data.error },
        });
        break;
        
      default:
        Logger.debug('Unknown sync WebSocket message type:', type);
    }
  }, []);

  /**
   * Handle notification WebSocket messages
   */
  const handleNotificationWebSocketMessage = useCallback((message) => {
    const { type, data } = message;

    if (type === 'notification:new') {
      addNotification(data.notification);
    }
  }, []);

  /**
   * Load emails with current filters
   */
  const loadEmails = useCallback(async (options = {}) => {
    if (!user?.id) return;

    try {
      dispatch({
        type: EMAIL_ACTIONS.SET_LOADING,
        payload: { type: 'emails', loading: true },
      });

      const fetchOptions = {
        folderId: state.selectedFolder,
        searchQuery: state.searchQuery,
        filters: state.filters,
        limit: 50,
        offset: options.append ? state.emails.length : 0,
        ...options,
      };

      const result = await emailManagementService.fetchEmails(user.id, fetchOptions);

      if (result.success) {
        const emails = options.append 
          ? [...state.emails, ...result.data]
          : result.data;

        dispatch({
          type: EMAIL_ACTIONS.SET_EMAILS,
          payload: {
            emails,
            total: result.total,
            hasMore: result.hasMore,
          },
        });
      } else {
        dispatch({
          type: EMAIL_ACTIONS.SET_ERROR,
          payload: { type: 'emails', error: result.error },
        });
      }
    } catch (error) {
      Logger.error('Error loading emails:', error);
      dispatch({
        type: EMAIL_ACTIONS.SET_ERROR,
        payload: { type: 'emails', error: error.message },
      });
    }
  }, [user?.id, state.selectedFolder, state.searchQuery, state.filters, state.emails.length]);

  /**
   * Load folders
   */
  const loadFolders = useCallback(async () => {
    if (!user?.id) return;

    try {
      dispatch({
        type: EMAIL_ACTIONS.SET_LOADING,
        payload: { type: 'folders', loading: true },
      });

      const result = await emailManagementService.getFolders(user.id);

      if (result.success) {
        dispatch({
          type: EMAIL_ACTIONS.SET_FOLDERS,
          payload: { folders: result.data },
        });
      } else {
        dispatch({
          type: EMAIL_ACTIONS.SET_ERROR,
          payload: { type: 'folders', error: result.error },
        });
      }
    } catch (error) {
      Logger.error('Error loading folders:', error);
      dispatch({
        type: EMAIL_ACTIONS.SET_ERROR,
        payload: { type: 'folders', error: error.message },
      });
    }
  }, [user?.id]);

  /**
   * Load templates
   */
  const loadTemplates = useCallback(async () => {
    if (!user?.id) return;

    try {
      dispatch({
        type: EMAIL_ACTIONS.SET_LOADING,
        payload: { type: 'templates', loading: true },
      });

      const result = await emailManagementService.getTemplates();

      if (result.success) {
        dispatch({
          type: EMAIL_ACTIONS.SET_TEMPLATES,
          payload: { templates: result.data },
        });
      } else {
        dispatch({
          type: EMAIL_ACTIONS.SET_ERROR,
          payload: { type: 'templates', error: result.error },
        });
      }
    } catch (error) {
      Logger.error('Error loading templates:', error);
      dispatch({
        type: EMAIL_ACTIONS.SET_ERROR,
        payload: { type: 'templates', error: error.message },
      });
    }
  }, [user?.id]);

  /**
   * Add notification
   */
  const addNotification = useCallback((notification) => {
    dispatch({
      type: EMAIL_ACTIONS.ADD_NOTIFICATION,
      payload: { notification },
    });
  }, []);

  /**
   * Remove notification
   */
  const removeNotification = useCallback((notificationId) => {
    dispatch({
      type: EMAIL_ACTIONS.REMOVE_NOTIFICATION,
      payload: { notificationId },
    });
  }, []);

  /**
   * Mark notification as read
   */
  const markNotificationRead = useCallback((notificationId) => {
    dispatch({
      type: EMAIL_ACTIONS.MARK_NOTIFICATION_READ,
      payload: { notificationId },
    });
  }, []);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    dispatch,
    loadEmails,
    loadFolders,
    loadTemplates,
    
    // Folder actions
    selectFolder: (folderId) => {
      dispatch({
        type: EMAIL_ACTIONS.SET_SELECTED_FOLDER,
        payload: { folderId },
      });
    },
    
    // Email actions
    selectEmail: (email) => {
      dispatch({
        type: EMAIL_ACTIONS.SET_SELECTED_EMAIL,
        payload: { email },
      });
    },
    
    // Search and filter actions
    setSearchQuery: (query) => {
      dispatch({
        type: EMAIL_ACTIONS.SET_SEARCH_QUERY,
        payload: { query },
      });
    },
    
    setFilters: (filters) => {
      dispatch({
        type: EMAIL_ACTIONS.SET_FILTERS,
        payload: { filters },
      });
    },
    
    // Composer actions
    openComposer: (data = null) => {
      dispatch({
        type: EMAIL_ACTIONS.SET_COMPOSER_OPEN,
        payload: { open: true, data },
      });
    },
    
    closeComposer: () => {
      dispatch({
        type: EMAIL_ACTIONS.SET_COMPOSER_OPEN,
        payload: { open: false },
      });
    },
    
    setComposerData: (data) => {
      dispatch({
        type: EMAIL_ACTIONS.SET_COMPOSER_DATA,
        payload: { data },
      });
    },
    
    // Notification actions
    addNotification,
    removeNotification,
    markNotificationRead,
    
    // Utility actions
    clearError: (type) => {
      dispatch({
        type: EMAIL_ACTIONS.CLEAR_ERROR,
        payload: { type },
      });
    },
    
    refresh: () => {
      loadEmails();
      loadFolders();
      loadTemplates();
    },
  };

  return (
    <EmailContext.Provider value={contextValue}>
      {children}
    </EmailContext.Provider>
  );
};

/**
 * Hook to use Email context
 */
export const useEmailContext = () => {
  const context = useContext(EmailContext);
  
  if (!context) {
    throw new Error('useEmailContext must be used within an EmailProvider');
  }
  
  return context;
};

export default EmailContext;