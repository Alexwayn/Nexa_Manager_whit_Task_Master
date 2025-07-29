import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * Client Email Service
 * Handles client-specific email history, filtering, and analytics
 */
class ClientEmailService {
  /**
   * Get comprehensive email history for a specific client
   */
  async getClientEmailHistory(userId, clientId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        type = null,
        status = null,
        dateFrom = null,
        dateTo = null,
        includeDetails = true,
        sortBy = 'sent_at',
        sortOrder = 'desc',
      } = options;

      let query = supabase
        .from('email_activity')
        .select(`
          *,
          clients(id, full_name, email, company_name, phone),
          invoices(id, invoice_number, total_amount, status, issue_date, due_date),
          quotes(id, quote_number, total_amount, status, issue_date, due_date)
        `)
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply filters
      if (type) {
        if (Array.isArray(type)) {
          query = query.in('type', type);
        } else {
          query = query.eq('type', type);
        }
      }

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      if (dateFrom) {
        query = query.gte('sent_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('sent_at', dateTo);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get client email history: ${error.message}`);
      }

      // Get total count for pagination
      let countQuery = supabase
        .from('email_activity')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('client_id', clientId);

      // Apply same filters to count query
      if (type) {
        if (Array.isArray(type)) {
          countQuery = countQuery.in('type', type);
        } else {
          countQuery = countQuery.eq('type', type);
        }
      }

      if (status) {
        if (Array.isArray(status)) {
          countQuery = countQuery.in('status', status);
        } else {
          countQuery = countQuery.eq('status', status);
        }
      }

      if (dateFrom) {
        countQuery = countQuery.gte('sent_at', dateFrom);
      }

      if (dateTo) {
        countQuery = countQuery.lte('sent_at', dateTo);
      }

      const { count: totalCount } = await countQuery;

      return {
        success: true,
        data: data || [],
        total: totalCount || 0,
        hasMore: (offset + limit) < (totalCount || 0),
        pagination: {
          limit,
          offset,
          total: totalCount || 0,
          pages: Math.ceil((totalCount || 0) / limit),
          currentPage: Math.floor(offset / limit) + 1,
        },
      };
    } catch (error) {
      Logger.error('Error getting client email history:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Get client email analytics and statistics
   */
  async getClientEmailAnalytics(userId, clientId, options = {}) {
    try {
      const {
        dateFrom = null,
        dateTo = null,
      } = options;

      let query = supabase
        .from('email_activity')
        .select('*')
        .eq('user_id', userId)
        .eq('client_id', clientId);

      if (dateFrom) {
        query = query.gte('sent_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('sent_at', dateTo);
      }

      const { data: activity, error } = await query;

      if (error) {
        throw new Error(`Failed to get client email analytics: ${error.message}`);
      }

      // Calculate analytics
      const analytics = {
        totalEmails: activity.length,
        emailsByType: this.groupByField(activity, 'type'),
        emailsByStatus: this.groupByField(activity, 'status'),
        emailsByMonth: this.groupByMonth(activity),
        recentActivity: activity
          .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
          .slice(0, 10),
        firstEmail: activity.length > 0 ? 
          activity.reduce((earliest, current) => 
            new Date(current.sent_at) < new Date(earliest.sent_at) ? current : earliest
          ) : null,
        lastEmail: activity.length > 0 ? 
          activity.reduce((latest, current) => 
            new Date(current.sent_at) > new Date(latest.sent_at) ? current : latest
          ) : null,
      };

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      Logger.error('Error getting client email analytics:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get available filter options for client emails
   */
  async getClientEmailFilters(userId, clientId) {
    try {
      const { data: activity, error } = await supabase
        .from('email_activity')
        .select('type, status, sent_at, template_type')
        .eq('user_id', userId)
        .eq('client_id', clientId);

      if (error) {
        throw new Error(`Failed to get email filters: ${error.message}`);
      }

      const filters = {
        types: [...new Set(activity.map(a => a.type))].filter(Boolean),
        statuses: [...new Set(activity.map(a => a.status))].filter(Boolean),
        templateTypes: [...new Set(activity.map(a => a.template_type))].filter(Boolean),
        dateRange: {
          earliest: activity.length > 0 ? 
            activity.reduce((earliest, current) => 
              new Date(current.sent_at) < new Date(earliest.sent_at) ? current : earliest
            ).sent_at : null,
          latest: activity.length > 0 ? 
            activity.reduce((latest, current) => 
              new Date(current.sent_at) > new Date(latest.sent_at) ? current : latest
            ).sent_at : null,
        },
      };

      return {
        success: true,
        data: filters,
      };
    } catch (error) {
      Logger.error('Error getting client email filters:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get client communication summary
   */
  async getClientCommunicationSummary(userId, clientId) {
    try {
      // Get email activity
      const emailResult = await this.getClientEmailAnalytics(userId, clientId);
      
      // Get related invoices and quotes
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, total_amount, issue_date')
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .order('issue_date', { ascending: false })
        .limit(10);

      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id, quote_number, status, total_amount, issue_date')
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .order('issue_date', { ascending: false })
        .limit(10);

      if (invoicesError || quotesError) {
        Logger.warn('Error getting related documents:', { invoicesError, quotesError });
      }

      return {
        success: true,
        data: {
          emailAnalytics: emailResult.success ? emailResult.data : null,
          recentInvoices: invoices || [],
          recentQuotes: quotes || [],
          summary: {
            totalInvoices: invoices?.length || 0,
            totalQuotes: quotes?.length || 0,
            totalEmails: emailResult.success ? emailResult.data.totalEmails : 0,
          },
        },
      };
    } catch (error) {
      Logger.error('Error getting client communication summary:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Search client emails
   */
  async searchClientEmails(userId, clientId, searchQuery, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
      } = options;

      const { data, error } = await supabase
        .from('email_activity')
        .select(`
          *,
          clients(id, full_name, email, company_name),
          invoices(id, invoice_number, total_amount, status),
          quotes(id, quote_number, total_amount, status)
        `)
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .or(`subject.ilike.%${searchQuery}%,recipient_email.ilike.%${searchQuery}%,type.ilike.%${searchQuery}%`)
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to search client emails: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        query: searchQuery,
      };
    } catch (error) {
      Logger.error('Error searching client emails:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  // Helper methods
  groupByField(items, field) {
    const groups = {};
    items.forEach(item => {
      const value = item[field] || 'unknown';
      groups[value] = (groups[value] || 0) + 1;
    });
    return groups;
  }

  groupByMonth(items) {
    const groups = {};
    items.forEach(item => {
      const month = new Date(item.sent_at).toISOString().substring(0, 7); // YYYY-MM
      groups[month] = (groups[month] || 0) + 1;
    });
    return groups;
  }
}

let clientEmailService;

export const getClientEmailService = () => {
  if (!clientEmailService) {
    clientEmailService = new ClientEmailService();
  }
  return clientEmailService;
};