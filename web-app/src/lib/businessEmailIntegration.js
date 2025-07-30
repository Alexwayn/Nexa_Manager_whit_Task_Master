/**
 * Business Email Integration Service
 * Handles email integration for business documents like invoices and quotes
 */

import { supabase } from './supabaseClient';
import Logger from '@utils/Logger';

class BusinessEmailIntegration {
  /**
   * Send invoice email to client
   * @param {string} userId - User ID
   * @param {string} invoiceId - Invoice ID
   * @param {string} email - Recipient email
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result
   */
  async sendInvoiceEmail(userId, invoiceId, email, options = {}) {
    try {
      // Get invoice data
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            full_name,
            email
          )
        `)
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found');
      }

      // Prepare email data
      const emailData = {
        to: email,
        subject: `Invoice ${invoice.invoice_number} from ${invoice.business_name || 'Your Business'}`,
        templateId: options.templateId || 'invoice',
        templateData: {
          invoice,
          client: invoice.clients,
          customMessage: options.customMessage,
        },
      };

      // Send email (mock implementation)
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Log email activity
      await this.logEmailActivity(userId, {
        type: 'invoice_sent',
        documentId: invoiceId,
        documentType: 'invoice',
        recipientEmail: email,
        messageId,
        status: 'sent',
      });

      return {
        success: true,
        messageId,
        data: {
          invoiceId,
          recipientEmail: email,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      Logger.error('Error sending invoice email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send payment reminder email
   * @param {string} userId - User ID
   * @param {string} invoiceId - Invoice ID
   * @param {string} reminderType - Type of reminder (gentle, firm, final)
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result
   */
  async sendPaymentReminder(userId, invoiceId, reminderType = 'gentle', options = {}) {
    try {
      // Get invoice data
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            full_name,
            email
          )
        `)
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found');
      }

      // Prepare reminder email
      const messageId = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Log email activity
      await this.logEmailActivity(userId, {
        type: 'payment_reminder',
        documentId: invoiceId,
        documentType: 'invoice',
        recipientEmail: invoice.clients.email,
        messageId,
        status: 'sent',
        metadata: {
          reminderType,
          customMessage: options.customMessage,
        },
      });

      return {
        success: true,
        messageId,
        data: {
          invoiceId,
          reminderType,
          recipientEmail: invoice.clients.email,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      Logger.error('Error sending payment reminder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send quote email to client
   * @param {string} userId - User ID
   * @param {string} quoteId - Quote ID
   * @param {string} email - Recipient email
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result
   */
  async sendQuoteEmail(userId, quoteId, email, options = {}) {
    try {
      // Get quote data
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          clients (
            id,
            full_name,
            email
          )
        `)
        .eq('id', quoteId)
        .eq('user_id', userId)
        .single();

      if (quoteError || !quote) {
        throw new Error('Quote not found');
      }

      // Prepare email data
      const emailData = {
        to: email,
        subject: `Quote ${quote.quote_number} from ${quote.business_name || 'Your Business'}`,
        templateId: options.templateId || 'quote',
        templateData: {
          quote,
          client: quote.clients,
          customMessage: options.customMessage,
        },
      };

      // Send email (mock implementation)
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Log email activity
      await this.logEmailActivity(userId, {
        type: 'quote_sent',
        documentId: quoteId,
        documentType: 'quote',
        recipientEmail: email,
        messageId,
        status: 'sent',
      });

      return {
        success: true,
        messageId,
        data: {
          quoteId,
          recipientEmail: email,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      Logger.error('Error sending quote email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get client email history
   * @param {string} userId - User ID
   * @param {string} clientId - Client ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Email history
   */
  async getClientEmailHistory(userId, clientId, options = {}) {
    try {
      let query = supabase
        .from('business_email_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.type && Array.isArray(options.type)) {
        query = query.in('type', options.type);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      Logger.error('Error getting client email history:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get business email analytics
   * @param {string} userId - User ID
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Analytics data
   */
  async getBusinessEmailAnalytics(userId, options = {}) {
    try {
      const dateFrom = options.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = options.dateTo || new Date().toISOString();

      // Mock analytics data
      const analytics = {
        totalEmailsSent: 45,
        invoiceEmailsSent: 25,
        quoteEmailsSent: 15,
        paymentReminders: 5,
        openRate: 0.75,
        clickRate: 0.35,
        responseRate: 0.25,
        period: {
          from: dateFrom,
          to: dateTo,
        },
      };

      return {
        success: true,
        data: {
          analytics,
          period: {
            from: dateFrom,
            to: dateTo,
          },
        },
      };
    } catch (error) {
      Logger.error('Error getting business email analytics:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get business document email analytics
   * @param {string} userId - User ID
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Document analytics
   */
  async getBusinessDocumentEmailAnalytics(userId, options = {}) {
    try {
      const documentType = options.documentType || 'invoice';

      // Mock document analytics
      const analytics = {
        documentType,
        totalSent: documentType === 'invoice' ? 25 : 15,
        openRate: 0.8,
        clickRate: 0.4,
        responseRate: 0.3,
        averageResponseTime: '2.5 days',
      };

      return {
        success: true,
        data: {
          analytics,
          documentType,
        },
      };
    } catch (error) {
      Logger.error('Error getting document email analytics:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Log email activity
   * @param {string} userId - User ID
   * @param {Object} activityData - Activity data
   * @returns {Promise<Object>} Log result
   */
  async logEmailActivity(userId, activityData) {
    try {
      const { data, error } = await supabase
        .from('business_email_logs')
        .insert({
          user_id: userId,
          ...activityData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Logging error: ${error.message}`);
      }

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
}

const businessEmailIntegration = new BusinessEmailIntegration();
export default businessEmailIntegration;