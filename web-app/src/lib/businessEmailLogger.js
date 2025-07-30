/**
 * Business Email Logger
 * Handles logging for business email operations
 */

import { supabaseClient } from './supabaseClient';
import { Logger } from './Logger';

const logger = new Logger('BusinessEmailLogger');

class BusinessEmailLogger {
  /**
   * Log business email activity
   * @param {string} userId - User ID
   * @param {string} type - Email type (invoice, quote, reminder, etc.)
   * @param {Object} data - Email data
   * @returns {Promise<Object>} Log result
   */
  async logEmailActivity(userId, type, data) {
    try {
      const logEntry = {
        user_id: userId,
        email_type: type,
        recipient: data.recipient,
        subject: data.subject,
        status: data.status || 'sent',
        metadata: {
          messageId: data.messageId,
          clientId: data.clientId,
          invoiceId: data.invoiceId,
          quoteId: data.quoteId,
          templateUsed: data.templateUsed,
          attachments: data.attachments || [],
          provider: data.provider,
          ...data.additionalData
        },
        created_at: new Date().toISOString()
      };

      const { data: result, error } = await supabaseClient
        .from('business_email_logs')
        .insert([logEntry])
        .select()
        .single();

      if (error) {
        logger.error('Failed to log business email activity:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Error logging business email activity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get business email logs
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Email logs
   */
  async getEmailLogs(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        type,
        status,
        clientId,
        dateFrom,
        dateTo
      } = options;

      let query = supabaseClient
        .from('business_email_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        if (Array.isArray(type)) {
          query = query.in('email_type', type);
        } else {
          query = query.eq('email_type', type);
        }
      }

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      if (clientId) {
        query = query.eq('metadata->clientId', clientId);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to get business email logs:', error);
        return {
          success: false,
          error: error.message,
          data: []
        };
      }

      return {
        success: true,
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error getting business email logs:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get email analytics
   * @param {string} userId - User ID
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Email analytics
   */
  async getEmailAnalytics(userId, options = {}) {
    try {
      const {
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        dateTo = new Date().toISOString(),
        groupBy = 'day'
      } = options;

      // Get total counts by type
      const { data: typeCounts, error: typeError } = await supabaseClient
        .from('business_email_logs')
        .select('email_type')
        .eq('user_id', userId)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo);

      if (typeError) {
        logger.error('Failed to get email type counts:', typeError);
        return {
          success: false,
          error: typeError.message
        };
      }

      // Get status counts
      const { data: statusCounts, error: statusError } = await supabaseClient
        .from('business_email_logs')
        .select('status')
        .eq('user_id', userId)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo);

      if (statusError) {
        logger.error('Failed to get email status counts:', statusError);
        return {
          success: false,
          error: statusError.message
        };
      }

      // Process type counts
      const typeAnalytics = (typeCounts || []).reduce((acc, log) => {
        acc[log.email_type] = (acc[log.email_type] || 0) + 1;
        return acc;
      }, {});

      // Process status counts
      const statusAnalytics = (statusCounts || []).reduce((acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      }, {});

      // Get daily/weekly/monthly trends based on groupBy
      const { data: trendData, error: trendError } = await supabaseClient
        .from('business_email_logs')
        .select('created_at, email_type')
        .eq('user_id', userId)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)
        .order('created_at', { ascending: true });

      if (trendError) {
        logger.error('Failed to get email trend data:', trendError);
        return {
          success: false,
          error: trendError.message
        };
      }

      // Process trend data
      const trends = this.processTrendData(trendData || [], groupBy);

      return {
        success: true,
        data: {
          summary: {
            totalEmails: (typeCounts || []).length,
            byType: typeAnalytics,
            byStatus: statusAnalytics
          },
          trends,
          period: {
            from: dateFrom,
            to: dateTo,
            groupBy
          }
        }
      };
    } catch (error) {
      logger.error('Error getting email analytics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process trend data for analytics
   * @param {Array} data - Raw trend data
   * @param {string} groupBy - Grouping period
   * @returns {Object} Processed trend data
   */
  processTrendData(data, groupBy) {
    const trends = {};

    data.forEach(log => {
      const date = new Date(log.created_at);
      let key;

      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate()) / 7)).padStart(2, '0')}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }

      if (!trends[key]) {
        trends[key] = {
          total: 0,
          byType: {}
        };
      }

      trends[key].total++;
      trends[key].byType[log.email_type] = (trends[key].byType[log.email_type] || 0) + 1;
    });

    return trends;
  }

  /**
   * Log email error
   * @param {string} userId - User ID
   * @param {string} type - Email type
   * @param {Object} errorData - Error data
   * @returns {Promise<Object>} Log result
   */
  async logEmailError(userId, type, errorData) {
    try {
      const errorEntry = {
        user_id: userId,
        email_type: type,
        status: 'error',
        error_message: errorData.message,
        error_code: errorData.code,
        metadata: {
          recipient: errorData.recipient,
          subject: errorData.subject,
          provider: errorData.provider,
          stackTrace: errorData.stackTrace,
          ...errorData.additionalData
        },
        created_at: new Date().toISOString()
      };

      const { data: result, error } = await supabaseClient
        .from('business_email_errors')
        .insert([errorEntry])
        .select()
        .single();

      if (error) {
        logger.error('Failed to log business email error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Error logging business email error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get email error logs
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Error logs
   */
  async getEmailErrors(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        type,
        dateFrom,
        dateTo
      } = options;

      let query = supabaseClient
        .from('business_email_errors')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq('email_type', type);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to get business email errors:', error);
        return {
          success: false,
          error: error.message,
          data: []
        };
      }

      return {
        success: true,
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error getting business email errors:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

const businessEmailLogger = new BusinessEmailLogger();
export default businessEmailLogger;