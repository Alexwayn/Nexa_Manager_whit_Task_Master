import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * Real-time Service for Supabase Subscriptions
 * Manages real-time database subscriptions for live data updates
 * across the application including invoices, quotes, clients, and financial data
 */
export class RealtimeService {
  /**
   * Initialize the real-time service with subscription management
   */
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Map();
  }

  /**
   * Subscribe to database table changes with real-time updates
   * @param {string} table - Database table name to subscribe to
   * @param {Function} callback - Callback function to handle changes
   * @param {Object} options - Subscription options (event, schema, filter)
   * @returns {Object|null} Subscription channel or null if failed
   */
  subscribe(table, callback, options = {}) {
    const {
      event = '*', // INSERT, UPDATE, DELETE, or * for all events
      schema = 'public',
      filter = null,
    } = options;

    const subscriptionKey = `${schema}.${table}.${event}.${filter || 'all'}`;

    // Check if subscription already exists to avoid duplicates
    if (this.subscriptions.has(subscriptionKey)) {
      Logger.info(`Subscription already exists for ${subscriptionKey}`);
      return this.subscriptions.get(subscriptionKey);
    }

    try {
      let channel = supabase.channel(`${table}-changes`).on(
        'postgres_changes',
        {
          event,
          schema,
          table,
          ...(filter && { filter }),
        },
        payload => {
          try {
            callback(payload);
          } catch (callbackError) {
            Logger.error(`Error in subscription callback for ${table}:`, callbackError);
          }
        },
      );

      // Subscribe to the channel with status monitoring
      channel.subscribe(status => {
        Logger.info(`Subscription status for ${table}: ${status}`);
        if (status === 'SUBSCRIBED') {
          Logger.info(`Successfully subscribed to ${table} changes`);
        } else if (status === 'CHANNEL_ERROR') {
          Logger.error(`Channel error for ${table} subscription`);
        }
      });

      this.subscriptions.set(subscriptionKey, channel);
      Logger.info(`Created new subscription for ${subscriptionKey}`);

      return channel;
    } catch (error) {
      Logger.error(`Unable to subscribe to ${table} changes:`, error);
      return null;
    }
  }

  /**
   * Unsubscribe from specific table changes
   * @param {string} table - Database table name
   * @param {string} event - Event type to unsubscribe from
   * @param {string} schema - Database schema
   * @param {string|null} filter - Filter criteria
   * @returns {boolean} True if successfully unsubscribed, false otherwise
   */
  unsubscribe(table, event = '*', schema = 'public', filter = null) {
    const subscriptionKey = `${schema}.${table}.${event}.${filter || 'all'}`;
    const subscription = this.subscriptions.get(subscriptionKey);

    if (subscription) {
      try {
        supabase.removeChannel(subscription);
        this.subscriptions.delete(subscriptionKey);
        Logger.info(`Successfully unsubscribed from ${subscriptionKey}`);
        return true;
      } catch (error) {
        Logger.error(`Error unsubscribing from ${subscriptionKey}:`, error);
        return false;
      }
    }

    Logger.warn(`No subscription found for ${subscriptionKey}`);
    return false;
  }

  /**
   * Unsubscribe from all active subscriptions
   * Useful for cleanup when user logs out or component unmounts
   * @returns {number} Number of subscriptions removed
   */
  unsubscribeAll() {
    const count = this.subscriptions.size;

    try {
      for (const [key, subscription] of this.subscriptions) {
        supabase.removeChannel(subscription);
        Logger.info(`Removed subscription: ${key}`);
      }
      this.subscriptions.clear();
      Logger.info(`Successfully removed ${count} subscriptions`);
      return count;
    } catch (error) {
      Logger.error('Error removing all subscriptions:', error);
      return 0;
    }
  }

  /**
   * Subscribe to user-specific data changes across multiple tables
   * @param {string} userId - User ID to filter data for
   * @param {Function} callback - Callback function to handle changes
   * @param {Array} tables - Array of table names to subscribe to
   * @returns {Array} Array of subscription channels
   */
  subscribeToUserData(
    userId,
    callback,
    tables = ['clients', 'invoices', 'quotes', 'appointments', 'incomes', 'expenses'],
  ) {
    const userSubscriptions = [];

    if (!userId) {
      Logger.error('User ID is required for user data subscription');
      return userSubscriptions;
    }

    tables.forEach(table => {
      try {
        const subscription = this.subscribe(
          table,
          payload => {
            // Only process changes for the current user
            if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
              callback({
                table,
                event: payload.eventType,
                data: payload.new || payload.old,
                payload,
              });
            }
          },
          {
            filter: `user_id=eq.${userId}`,
          },
        );

        if (subscription) {
          userSubscriptions.push(subscription);
          Logger.info(`Subscribed to ${table} changes for user ${userId}`);
        }
      } catch (error) {
        Logger.error(`Failed to subscribe to ${table} for user ${userId}:`, error);
      }
    });

    Logger.info(`Created ${userSubscriptions.length} user data subscriptions for user ${userId}`);
    return userSubscriptions;
  }

  /**
   * Subscribe to changes for a specific record by ID
   * @param {string} table - Database table name
   * @param {string} recordId - Record ID to monitor
   * @param {Function} callback - Callback function to handle changes
   * @returns {Object|null} Subscription channel or null if failed
   */
  subscribeToRecord(table, recordId, callback) {
    if (!table || !recordId) {
      Logger.error('Table name and record ID are required for record subscription');
      return null;
    }

    return this.subscribe(
      table,
      payload => {
        if (payload.new?.id === recordId || payload.old?.id === recordId) {
          callback({
            event: payload.eventType,
            data: payload.new || payload.old,
            payload,
          });
        }
      },
      {
        filter: `id=eq.${recordId}`,
      },
    );
  }

  /**
   * Subscribe to invoice changes for a specific user
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function to handle invoice changes
   * @returns {Object|null} Subscription channel or null if failed
   */
  subscribeToInvoices(userId, callback) {
    if (!userId) {
      Logger.error('User ID is required for invoice subscription');
      return null;
    }

    return this.subscribe('invoices', callback, {
      filter: `user_id=eq.${userId}`,
    });
  }

  /**
   * Subscribe to quote changes for a specific user
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function to handle quote changes
   * @returns {Object|null} Subscription channel or null if failed
   */
  subscribeToQuotes(userId, callback) {
    if (!userId) {
      Logger.error('User ID is required for quote subscription');
      return null;
    }

    return this.subscribe('quotes', callback, {
      filter: `user_id=eq.${userId}`,
    });
  }

  /**
   * Subscribe to client changes for a specific user
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function to handle client changes
   * @returns {Object|null} Subscription channel or null if failed
   */
  subscribeToClients(userId, callback) {
    if (!userId) {
      Logger.error('User ID is required for client subscription');
      return null;
    }

    return this.subscribe('clients', callback, {
      filter: `user_id=eq.${userId}`,
    });
  }

  /**
   * Subscribe to appointment changes for a specific user
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function to handle appointment changes
   * @returns {Object|null} Subscription channel or null if failed
   */
  subscribeToAppointments(userId, callback) {
    if (!userId) {
      Logger.error('User ID is required for appointment subscription');
      return null;
    }

    return this.subscribe('appointments', callback, {
      filter: `user_id=eq.${userId}`,
    });
  }

  /**
   * Subscribe to financial data changes (incomes and expenses) for a specific user
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function to handle financial data changes
   * @returns {Array} Array containing income and expense subscription channels
   */
  subscribeToFinancialData(userId, callback) {
    if (!userId) {
      Logger.error('User ID is required for financial data subscription');
      return [];
    }

    const subscriptions = [];

    try {
      const incomeSubscription = this.subscribe(
        'incomes',
        payload => callback({ ...payload, table: 'incomes' }),
        {
          filter: `user_id=eq.${userId}`,
        },
      );

      const expenseSubscription = this.subscribe(
        'expenses',
        payload => callback({ ...payload, table: 'expenses' }),
        {
          filter: `user_id=eq.${userId}`,
        },
      );

      if (incomeSubscription) subscriptions.push(incomeSubscription);
      if (expenseSubscription) subscriptions.push(expenseSubscription);

      Logger.info(
        `Created ${subscriptions.length} financial data subscriptions for user ${userId}`,
      );
    } catch (error) {
      Logger.error(`Error creating financial data subscriptions for user ${userId}:`, error);
    }

    return subscriptions;
  }

  /**
   * Get the status of all active subscriptions
   * @returns {Object} Object containing subscription statuses
   */
  getSubscriptionStatus() {
    const status = {};
    for (const [key, subscription] of this.subscriptions) {
      status[key] = {
        state: subscription.state,
        topic: subscription.topic,
        joinedAt: subscription.joinedAt,
      };
    }
    return status;
  }

  /**
   * Check if real-time connection is active
   * @returns {boolean} True if connected, false otherwise
   */
  isConnected() {
    try {
      return supabase.realtime.isConnected();
    } catch (error) {
      Logger.error('Error checking real-time connection status:', error);
      return false;
    }
  }

  /**
   * Get comprehensive connection state information
   * @returns {Object} Connection state details including subscription count
   */
  getConnectionState() {
    return {
      connected: this.isConnected(),
      subscriptions: this.subscriptions.size,
      details: this.getSubscriptionStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get count of active subscriptions
   * @returns {number} Number of active subscriptions
   */
  getSubscriptionCount() {
    return this.subscriptions.size;
  }

  /**
   * Check if a specific subscription exists
   * @param {string} table - Table name
   * @param {string} event - Event type
   * @param {string} schema - Schema name
   * @param {string|null} filter - Filter criteria
   * @returns {boolean} True if subscription exists
   */
  hasSubscription(table, event = '*', schema = 'public', filter = null) {
    const subscriptionKey = `${schema}.${table}.${event}.${filter || 'all'}`;
    return this.subscriptions.has(subscriptionKey);
  }
}

// Create and export a singleton instance for application-wide use
export const realtimeService = new RealtimeService();

/**
 * Helper function to subscribe to user-specific data across multiple tables
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @param {Array} tables - Array of table names
 * @returns {Array} Array of subscription channels
 */
export const subscribeToUserData = (userId, callback, tables) =>
  realtimeService.subscribeToUserData(userId, callback, tables);

/**
 * Helper function to subscribe to invoice changes
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Object|null} Subscription channel
 */
export const subscribeToInvoices = (userId, callback) =>
  realtimeService.subscribeToInvoices(userId, callback);

/**
 * Helper function to subscribe to quote changes
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Object|null} Subscription channel
 */
export const subscribeToQuotes = (userId, callback) =>
  realtimeService.subscribeToQuotes(userId, callback);

/**
 * Helper function to subscribe to client changes
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Object|null} Subscription channel
 */
export const subscribeToClients = (userId, callback) =>
  realtimeService.subscribeToClients(userId, callback);

/**
 * Helper function to subscribe to appointment changes
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Object|null} Subscription channel
 */
export const subscribeToAppointments = (userId, callback) =>
  realtimeService.subscribeToAppointments(userId, callback);

/**
 * Helper function to subscribe to financial data changes
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Array} Array of subscription channels
 */
export const subscribeToFinancialData = (userId, callback) =>
  realtimeService.subscribeToFinancialData(userId, callback);

export default realtimeService;
