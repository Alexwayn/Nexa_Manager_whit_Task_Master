import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * Business Email Logger Service
 * Centralized logging for all business document email communications
 */
class BusinessEmailLogger {
  /**
   * Log email activity for business documents
   */
  async logActivity(userId, activityData) {
    try {
      const {
        emailId = null,
        invoiceId = null,
        quoteId = null,
        clientId,
        type,
        status = 'sent',
        recipientEmail,
        subject,
        templateType = null,
        details = {},
        sentAt = new Date().toISOString(),
      } = activityData;

      // Validate required fields
      if (!clientId || !type || !recipientEmail) {
        throw new Error('Missing required fields: clientId, type, and recipientEmail are required');
      }

      const logEntry = {
        user_id: userId,
        email_id: emailId,
        invoice_id: invoiceId,
        quote_id: quoteId,
        client_id: clientId,
        type,
        status,
        recipient_email: recipientEmail,
        subject,
        template_type: templateType,
        details: JSON.stringify(details),
        sent_at: sentAt,
      };

      const { data, error } = await supabase
        .from('email_activity')
        .insert([logEntry])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to log email activity: ${error.message}`);
      }

      Logger.info('Email activity logged:', {
        id: data.id,
        type,
        clientId,
        recipientEmail,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      Logger.error('Error logging email activity:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Log invoice email activity
   */
  async logInvoiceEmail(userId, invoiceId, emailData) {
    try {
      // Get invoice data
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('client_id, invoice_number, total_amount')
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (error || !invoice) {
        throw new Error('Invoice not found');
      }

      return await this.logActivity(userId, {
        invoiceId,
        clientId: invoice.client_id,
        type: emailData.type || 'invoice_sent',
        status: emailData.status || 'sent',
        recipientEmail: emailData.recipientEmail,
        subject: emailData.subject || `Invoice ${invoice.invoice_number}`,
        templateType: emailData.templateType || 'invoice',
        details: {
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          ...emailData.details,
        },
        sentAt: emailData.sentAt,
      });
    } catch (error) {
      Logger.error('Error logging invoice email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Log quote email activity
   */
  async logQuoteEmail(userId, quoteId, emailData) {
    try {
      // Get quote data
      const { data: quote, error } = await supabase
        .from('quotes')
        .select('client_id, quote_number, total_amount')
        .eq('id', quoteId)
        .eq('user_id', userId)
        .single();

      if (error || !quote) {
        throw new Error('Quote not found');
      }

      return await this.logActivity(userId, {
        quoteId,
        clientId: quote.client_id,
        type: emailData.type || 'quote_sent',
        status: emailData.status || 'sent',
        recipientEmail: emailData.recipientEmail,
        subject: emailData.subject || `Quote ${quote.quote_number}`,
        templateType: emailData.templateType || 'quote',
        details: {
          quote_number: quote.quote_number,
          total_amount: quote.total_amount,
          ...emailData.details,
        },
        sentAt: emailData.sentAt,
      });
    } catch (error) {
      Logger.error('Error logging quote email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update email activity status (e.g., delivered, opened, clicked)
   */
  async updateActivityStatus(activityId, status, details = {}) {
    try {
      const { data, error } = await supabase
        .from('email_activity')
        .update({
          status,
          details: JSON.stringify(details),
          updated_at: new Date().toISOString(),
        })
        .eq('id', activityId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update activity status: ${error.message}`);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      Logger.error('Error updating activity status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get business email statistics
   */
  async getEmailStatistics(userId, options = {}) {
    try {
      const {
        dateFrom = null,
        dateTo = null,
        clientId = null,
        type = null,
      } = options;

      let query = supabase
        .from('email_activity')
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (dateFrom) {
        query = query.gte('sent_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('sent_at', dateTo);
      }

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (type) {
        query = query.eq('type', type);
      }

      const { data: activity, error } = await query;

      if (error) {
        throw new Error(`Failed to get email statistics: ${error.message}`);
      }

      // Calculate statistics
      const stats = {
        totalEmails: activity.length,
        emailsByType: this.groupBy(activity, 'type'),
        emailsByStatus: this.groupBy(activity, 'status'),
        emailsByMonth: this.groupByMonth(activity),
        successRate: this.calculateSuccessRate(activity),
        averageEmailsPerClient: this.calculateAverageEmailsPerClient(activity),
        topClients: this.getTopClientsByEmailCount(activity),
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      Logger.error('Error getting email statistics:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get email activity for a specific document
   */
  async getDocumentEmailHistory(userId, documentType, documentId) {
    try {
      const column = documentType === 'invoice' ? 'invoice_id' : 'quote_id';
      
      const { data, error } = await supabase
        .from('email_activity')
        .select(`
          *,
          clients(id, full_name, email, company_name)
        `)
        .eq('user_id', userId)
        .eq(column, documentId)
        .order('sent_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get document email history: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      Logger.error('Error getting document email history:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Bulk log email activities (for migration or batch operations)
   */
  async bulkLogActivities(userId, activities) {
    try {
      const logEntries = activities.map(activity => ({
        user_id: userId,
        email_id: activity.emailId || null,
        invoice_id: activity.invoiceId || null,
        quote_id: activity.quoteId || null,
        client_id: activity.clientId,
        type: activity.type,
        status: activity.status || 'sent',
        recipient_email: activity.recipientEmail,
        subject: activity.subject,
        template_type: activity.templateType || null,
        details: JSON.stringify(activity.details || {}),
        sent_at: activity.sentAt || new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('email_activity')
        .insert(logEntries)
        .select();

      if (error) {
        throw new Error(`Failed to bulk log activities: ${error.message}`);
      }

      Logger.info(`Bulk logged ${data.length} email activities`);

      return {
        success: true,
        data,
        count: data.length,
      };
    } catch (error) {
      Logger.error('Error bulk logging activities:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Helper methods
  groupBy(items, field) {
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
      const month = new Date(item.sent_at).toISOString().substring(0, 7);
      groups[month] = (groups[month] || 0) + 1;
    });
    return groups;
  }

  calculateSuccessRate(activities) {
    if (activities.length === 0) return 0;
    const successful = activities.filter(a => a.status === 'sent' || a.status === 'delivered').length;
    return (successful / activities.length) * 100;
  }

  calculateAverageEmailsPerClient(activities) {
    if (activities.length === 0) return 0;
    const clientCounts = this.groupBy(activities, 'client_id');
    const totalClients = Object.keys(clientCounts).length;
    return totalClients > 0 ? activities.length / totalClients : 0;
  }

  getTopClientsByEmailCount(activities, limit = 5) {
    const clientCounts = this.groupBy(activities, 'client_id');
    return Object.entries(clientCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([clientId, count]) => ({ clientId, count }));
  }
}

export default new BusinessEmailLogger();