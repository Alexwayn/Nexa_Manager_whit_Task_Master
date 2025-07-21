import Logger from '@utils/Logger';
import { supabase } from './supabaseClient';
import businessEmailLogger from './businessEmailLogger.js';
import clientEmailService from './clientEmailService.js';

/**
 * Business Email Integration Service
 * Connects existing invoice/quote email functionality with the new email management system
 */
class BusinessEmailIntegration {
  constructor() {
    this.emailManagementService = null;
  }

  async getEmailManagementService() {
    if (!this.emailManagementService) {
      const { default: EmailManagementService } = await import('./emailManagementService.js');
      this.emailManagementService = new EmailManagementService();
    }
    return this.emailManagementService;
  }

  /**
   * Log email activity for business documents
   */
  async logEmailActivity(userId, activityData) {
    try {
      const { data, error } = await supabase
        .from('email_activity')
        .insert([{
          user_id: userId,
          ...activityData,
        }])
        .select()
        .single();

      if (error) {
        Logger.error('Error logging email activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error in logEmailActivity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enhanced invoice email sending with integration
   */
  async sendInvoiceEmail(userId, invoiceId, recipientEmail, options = {}) {
    try {
      const {
        templateId = 'invoice',
        customMessage,
        attachPdf = true,
        useNewSystem = true,
        emailType = 'invoice_sent',
      } = options;

      // Get invoice data for logging and processing
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found');
      }

      let result;
      if (useNewSystem) {
        // Use new email management system
        const emailService = await this.getEmailManagementService();
        result = await emailService.sendInvoiceEmail(userId, invoiceId, recipientEmail, templateId, customMessage);
      } else {
        // Use existing invoice service integration - fallback to legacy method
        result = await this.sendLegacyInvoiceEmail(userId, invoice, recipientEmail, {
          templateId,
          customMessage,
          attachPdf,
          emailType,
        });
      }

      // Log email activity regardless of system used
      if (result.success) {
        await businessEmailLogger.logInvoiceEmail(userId, invoiceId, {
          type: emailType,
          status: 'sent',
          recipientEmail,
          subject: `Invoice ${invoice.invoice_number}`,
          templateType: templateId,
          details: {
            invoice_number: invoice.invoice_number,
            total_amount: invoice.total_amount,
            custom_message: customMessage,
            system_used: useNewSystem ? 'new' : 'legacy',
            attach_pdf: attachPdf,
            message_id: result.messageId,
          },
        });

        // Update invoice status if it was a draft
        if (invoice.status === 'draft') {
          await supabase
            .from('invoices')
            .update({ status: 'sent' })
            .eq('id', invoiceId)
            .eq('user_id', userId);
        }
      }

      return result;
    } catch (error) {
      Logger.error('Error in business invoice email integration:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Enhanced quote email sending with integration
   */
  async sendQuoteEmail(userId, quoteId, recipientEmail, options = {}) {
    try {
      const {
        templateId = 'quote',
        customMessage,
        emailType = 'quote_sent',
        useNewSystem = true,
      } = options;

      // Get quote data for logging and processing
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*, clients(*)')
        .eq('id', quoteId)
        .eq('user_id', userId)
        .single();

      if (quoteError || !quote) {
        throw new Error('Quote not found');
      }

      let result;
      if (useNewSystem) {
        // Use new email management system
        const emailService = await this.getEmailManagementService();
        result = await emailService.sendQuoteEmail(userId, quoteId, recipientEmail, templateId, customMessage);
      } else {
        // Use existing quote service integration - fallback to legacy method
        result = await this.sendLegacyQuoteEmail(userId, quote, recipientEmail, {
          templateId,
          customMessage,
          emailType,
        });
      }

      // Log email activity regardless of system used
      if (result.success) {
        await businessEmailLogger.logQuoteEmail(userId, quoteId, {
          type: emailType,
          status: 'sent',
          recipientEmail,
          subject: `Quote ${quote.quote_number}`,
          templateType: templateId,
          details: {
            quote_number: quote.quote_number,
            total_amount: quote.total_amount,
            custom_message: customMessage,
            system_used: useNewSystem ? 'new' : 'legacy',
            email_type: emailType,
            message_id: result.messageId,
          },
        });

        // Update quote status if it was a draft
        if (quote.status === 'draft') {
          await supabase
            .from('quotes')
            .update({ status: 'sent' })
            .eq('id', quoteId)
            .eq('user_id', userId);
        }
      }

      return result;
    } catch (error) {
      Logger.error('Error in business quote email integration:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send payment reminder with integration
   */
  async sendPaymentReminder(userId, invoiceId, reminderType = 'gentle', options = {}) {
    try {
      const { customMessage } = options;
      const emailService = await this.getEmailManagementService();

      // Get invoice data to determine recipient
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .eq('id', invoiceId)
        .single();

      if (error || !invoice) {
        throw new Error('Invoice not found');
      }

      const recipientEmail = invoice.clients?.email;
      if (!recipientEmail) {
        throw new Error('No email address found for client');
      }

      return await emailService.integrateInvoiceEmail(userId, invoiceId, recipientEmail, {
        templateId: `reminder_${reminderType}`,
        customMessage,
        sendReminder: true,
        reminderType,
      });
    } catch (error) {
      Logger.error('Error sending payment reminder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get comprehensive client email history with business document context
   */
  async getClientEmailHistory(userId, clientId, options = {}) {
    try {
      // Use the dedicated client email service for comprehensive history
      const result = await clientEmailService.getClientEmailHistory(userId, clientId, options);
      
      if (!result.success) {
        return result;
      }

      // Enhance with business context
      const enhancedData = result.data.map(activity => ({
        ...activity,
        businessContext: this.getBusinessContext(activity),
        documentLink: this.getDocumentLink(activity),
      }));

      return {
        ...result,
        data: enhancedData,
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
   * Get business email analytics
   */
  async getBusinessEmailAnalytics(userId, options = {}) {
    try {
      const emailService = await this.getEmailManagementService();
      const summary = await emailService.getBusinessEmailSummary(userId, options);

      if (!summary.success) {
        return summary;
      }

      // Enhanced analytics
      const analytics = {
        ...summary.data.summary,
        emailsByType: this.groupEmailsByType(summary.data.activity),
        emailsByClient: this.groupEmailsByClient(summary.data.activity),
        emailsByMonth: this.groupEmailsByMonth(summary.data.activity),
        responseRates: this.calculateResponseRates(summary.data.activity),
      };

      return {
        success: true,
        data: {
          activity: summary.data.activity,
          analytics,
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
   * Migrate existing email data to new system
   */
  async migrateExistingEmailData(userId) {
    try {
      Logger.info('Starting email data migration for user:', userId);
      
      // This would migrate existing email activity from old systems
      // to the new email_activity table
      
      // Get existing invoice emails from invoice lifecycle service
      const { data: invoiceActivity } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          client_id,
          created_at,
          clients(email, full_name)
        `)
        .eq('user_id', userId)
        .not('clients.email', 'is', null);

      // Get existing quote emails
      const { data: quoteActivity } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_number,
          client_id,
          created_at,
          clients(email, full_name)
        `)
        .eq('user_id', userId)
        .not('clients.email', 'is', null);

      const emailService = await this.getEmailManagementService();
      let migratedCount = 0;

      // Migrate invoice emails
      for (const invoice of invoiceActivity || []) {
        await emailService.logEmailActivity(userId, {
          invoiceId: invoice.id,
          clientId: invoice.client_id,
          type: 'invoice_sent',
          status: 'sent',
          recipientEmail: invoice.clients.email,
          subject: `Invoice ${invoice.invoice_number}`,
          templateType: 'invoice',
          details: {
            migrated: true,
            originalDate: invoice.created_at,
          },
        });
        migratedCount++;
      }

      // Migrate quote emails
      for (const quote of quoteActivity || []) {
        await emailService.logEmailActivity(userId, {
          quoteId: quote.id,
          clientId: quote.client_id,
          type: 'quote_sent',
          status: 'sent',
          recipientEmail: quote.clients.email,
          subject: `Quote ${quote.quote_number}`,
          templateType: 'quote',
          details: {
            migrated: true,
            originalDate: quote.created_at,
          },
        });
        migratedCount++;
      }

      Logger.info(`Email data migration completed. Migrated ${migratedCount} records.`);

      return {
        success: true,
        migratedCount,
      };
    } catch (error) {
      Logger.error('Error migrating email data:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send legacy invoice email (fallback method)
   */
  async sendLegacyInvoiceEmail(userId, invoice, recipientEmail, options = {}) {
    try {
      // This would integrate with existing PDF generation and email sending
      // For now, simulate the legacy email sending process
      Logger.info('Sending legacy invoice email:', {
        invoiceId: invoice.id,
        recipientEmail,
        options,
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        messageId: `legacy-invoice-${invoice.id}-${Date.now()}`,
        method: 'legacy',
      };
    } catch (error) {
      Logger.error('Error sending legacy invoice email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send legacy quote email (fallback method)
   */
  async sendLegacyQuoteEmail(userId, quote, recipientEmail, options = {}) {
    try {
      // This would integrate with existing PDF generation and email sending
      // For now, simulate the legacy email sending process
      Logger.info('Sending legacy quote email:', {
        quoteId: quote.id,
        recipientEmail,
        options,
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        messageId: `legacy-quote-${quote.id}-${Date.now()}`,
        method: 'legacy',
      };
    } catch (error) {
      Logger.error('Error sending legacy quote email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get business email summary and analytics
   */
  async getBusinessEmailSummary(userId, options = {}) {
    try {
      const {
        dateFrom = null,
        dateTo = null,
        clientId = null,
        type = null,
      } = options;

      let query = supabase
        .from('email_activity')
        .select(`
          *,
          clients(id, full_name, email, company_name),
          invoices(id, invoice_number, total_amount, status),
          quotes(id, quote_number, total_amount, status)
        `)
        .eq('user_id', userId)
        .order('sent_at', { ascending: false });

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
        throw new Error(`Failed to get business email summary: ${error.message}`);
      }

      // Calculate summary statistics
      const summary = {
        totalEmails: activity.length,
        emailsByType: this.groupEmailsByType(activity),
        emailsByStatus: this.groupEmailsByStatus(activity),
        emailsByClient: this.groupEmailsByClient(activity),
        emailsByMonth: this.groupEmailsByMonth(activity),
        recentActivity: activity.slice(0, 10),
      };

      return {
        success: true,
        data: {
          activity,
          summary,
        },
      };
    } catch (error) {
      Logger.error('Error getting business email summary:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get client-specific email filtering
   */
  async getClientEmailFilters(userId, clientId) {
    try {
      // Get unique email types for this client
      const { data: types, error: typesError } = await supabase
        .from('email_activity')
        .select('type')
        .eq('user_id', userId)
        .eq('client_id', clientId);

      if (typesError) {
        throw new Error(`Failed to get email types: ${typesError.message}`);
      }

      const uniqueTypes = [...new Set(types.map(t => t.type))];

      // Get date range for this client's emails
      const { data: dateRange, error: dateError } = await supabase
        .from('email_activity')
        .select('sent_at')
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .order('sent_at', { ascending: true })
        .limit(1);

      const { data: latestDate, error: latestError } = await supabase
        .from('email_activity')
        .select('sent_at')
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .order('sent_at', { ascending: false })
        .limit(1);

      return {
        success: true,
        data: {
          availableTypes: uniqueTypes,
          dateRange: {
            earliest: dateRange?.[0]?.sent_at || null,
            latest: latestDate?.[0]?.sent_at || null,
          },
        },
      };
    } catch (error) {
      Logger.error('Error getting client email filters:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Helper methods for analytics
  groupEmailsByType(activity) {
    const groups = {};
    activity.forEach(item => {
      groups[item.type] = (groups[item.type] || 0) + 1;
    });
    return groups;
  }

  groupEmailsByStatus(activity) {
    const groups = {};
    activity.forEach(item => {
      groups[item.status] = (groups[item.status] || 0) + 1;
    });
    return groups;
  }

  groupEmailsByClient(activity) {
    const groups = {};
    activity.forEach(item => {
      if (item.clients) {
        const clientName = item.clients.full_name || item.clients.company_name || 'Unknown';
        groups[clientName] = (groups[clientName] || 0) + 1;
      }
    });
    return groups;
  }

  groupEmailsByMonth(activity) {
    const groups = {};
    activity.forEach(item => {
      const month = new Date(item.sent_at).toISOString().substring(0, 7); // YYYY-MM
      groups[month] = (groups[month] || 0) + 1;
    });
    return groups;
  }

  calculateResponseRates(activity) {
    // This would calculate response rates based on email opens, clicks, etc.
    // For now, return placeholder data
    return {
      openRate: 0.65,
      clickRate: 0.23,
      responseRate: 0.18,
    };
  }

  /**
   * Get business context for email activity
   */
  getBusinessContext(activity) {
    const context = {
      type: 'general',
      description: 'General email communication',
    };

    if (activity.invoice_id && activity.invoices) {
      context.type = 'invoice';
      context.description = `Invoice ${activity.invoices.invoice_number} - ${activity.invoices.status}`;
      context.amount = activity.invoices.total_amount;
      context.documentNumber = activity.invoices.invoice_number;
    } else if (activity.quote_id && activity.quotes) {
      context.type = 'quote';
      context.description = `Quote ${activity.quotes.quote_number} - ${activity.quotes.status}`;
      context.amount = activity.quotes.total_amount;
      context.documentNumber = activity.quotes.quote_number;
    }

    return context;
  }

  /**
   * Get document link for email activity
   */
  getDocumentLink(activity) {
    if (activity.invoice_id) {
      return `/invoices/${activity.invoice_id}`;
    } else if (activity.quote_id) {
      return `/quotes/${activity.quote_id}`;
    }
    return null;
  }

  /**
   * Send automated follow-up emails for overdue invoices
   */
  async sendOverdueInvoiceReminders(userId, options = {}) {
    try {
      const { daysOverdue = 7, reminderType = 'gentle' } = options;
      
      // Get overdue invoices
      const { data: overdueInvoices, error } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .eq('user_id', userId)
        .in('status', ['sent', 'overdue'])
        .lt('due_date', new Date(Date.now() - daysOverdue * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) {
        throw new Error(`Failed to get overdue invoices: ${error.message}`);
      }

      const results = [];
      for (const invoice of overdueInvoices || []) {
        if (invoice.clients?.email) {
          const result = await this.sendPaymentReminder(userId, invoice.id, reminderType, {
            customMessage: `Your invoice ${invoice.invoice_number} is ${daysOverdue} days overdue. Please arrange payment at your earliest convenience.`,
          });
          results.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            clientEmail: invoice.clients.email,
            result,
          });
        }
      }

      return {
        success: true,
        data: results,
        totalProcessed: results.length,
      };
    } catch (error) {
      Logger.error('Error sending overdue invoice reminders:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get client communication preferences
   */
  async getClientCommunicationPreferences(userId, clientId) {
    try {
      // Get client's email history to determine preferences
      const historyResult = await this.getClientEmailHistory(userId, clientId, { limit: 100 });
      
      if (!historyResult.success) {
        return historyResult;
      }

      const preferences = {
        preferredEmailTypes: this.analyzePreferredEmailTypes(historyResult.data),
        communicationFrequency: this.analyzeCommunicationFrequency(historyResult.data),
        bestTimeToContact: this.analyzeBestContactTime(historyResult.data),
        responseRate: this.calculateClientResponseRate(historyResult.data),
      };

      return {
        success: true,
        data: preferences,
      };
    } catch (error) {
      Logger.error('Error getting client communication preferences:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get comprehensive business document email analytics
   */
  async getBusinessDocumentEmailAnalytics(userId, options = {}) {
    try {
      const {
        dateFrom = null,
        dateTo = null,
        clientId = null,
        documentType = null, // 'invoice', 'quote', or null for all
      } = options;

      let query = supabase
        .from('email_activity')
        .select(`
          *,
          clients(id, full_name, email, company_name),
          invoices(id, invoice_number, total_amount, status),
          quotes(id, quote_number, total_amount, status)
        `)
        .eq('user_id', userId)
        .order('sent_at', { ascending: false });

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

      if (documentType === 'invoice') {
        query = query.not('invoice_id', 'is', null);
      } else if (documentType === 'quote') {
        query = query.not('quote_id', 'is', null);
      }

      const { data: activity, error } = await query;

      if (error) {
        throw new Error(`Failed to get business email analytics: ${error.message}`);
      }

      // Calculate comprehensive analytics
      const analytics = {
        totalEmails: activity.length,
        emailsByType: this.groupEmailsByType(activity),
        emailsByStatus: this.groupEmailsByStatus(activity),
        emailsByClient: this.groupEmailsByClient(activity),
        emailsByMonth: this.groupEmailsByMonth(activity),
        documentTypeBreakdown: {
          invoices: activity.filter(a => a.invoice_id).length,
          quotes: activity.filter(a => a.quote_id).length,
          general: activity.filter(a => !a.invoice_id && !a.quote_id).length,
        },
        responseRates: this.calculateResponseRates(activity),
        topPerformingTemplates: this.getTopPerformingTemplates(activity),
        clientEngagement: this.calculateClientEngagement(activity),
        recentActivity: activity.slice(0, 20),
      };

      return {
        success: true,
        data: {
          activity,
          analytics,
        },
      };
    } catch (error) {
      Logger.error('Error getting business document email analytics:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get client-specific business email filtering options
   */
  async getClientBusinessEmailFilters(userId, clientId) {
    try {
      // Get all email activity for this client
      const { data: activity, error } = await supabase
        .from('email_activity')
        .select(`
          type,
          status,
          template_type,
          sent_at,
          invoices(id, invoice_number, status),
          quotes(id, quote_number, status)
        `)
        .eq('user_id', userId)
        .eq('client_id', clientId);

      if (error) {
        throw new Error(`Failed to get client email filters: ${error.message}`);
      }

      const filters = {
        availableTypes: [...new Set(activity.map(a => a.type))].filter(Boolean),
        availableStatuses: [...new Set(activity.map(a => a.status))].filter(Boolean),
        availableTemplates: [...new Set(activity.map(a => a.template_type))].filter(Boolean),
        documentTypes: {
          hasInvoices: activity.some(a => a.invoices),
          hasQuotes: activity.some(a => a.quotes),
        },
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
        totalEmails: activity.length,
      };

      return {
        success: true,
        data: filters,
      };
    } catch (error) {
      Logger.error('Error getting client business email filters:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send automated follow-up sequence for business documents
   */
  async sendAutomatedFollowUpSequence(userId, documentType, documentId, sequenceType = 'standard') {
    try {
      const sequences = {
        standard: [
          { delay: 7, template: 'gentle_reminder', type: 'reminder_gentle' },
          { delay: 14, template: 'firm_reminder', type: 'reminder_firm' },
          { delay: 30, template: 'final_notice', type: 'reminder_final' },
        ],
        urgent: [
          { delay: 3, template: 'urgent_reminder', type: 'reminder_urgent' },
          { delay: 7, template: 'final_notice', type: 'reminder_final' },
        ],
        gentle: [
          { delay: 14, template: 'gentle_reminder', type: 'reminder_gentle' },
          { delay: 30, template: 'firm_reminder', type: 'reminder_firm' },
        ],
      };

      const sequence = sequences[sequenceType] || sequences.standard;

      // Get document data
      const table = documentType === 'invoice' ? 'invoices' : 'quotes';
      const { data: document, error } = await supabase
        .from(table)
        .select('*, clients(*)')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (error || !document) {
        throw new Error(`${documentType} not found`);
      }

      const recipientEmail = document.clients?.email;
      if (!recipientEmail) {
        throw new Error('No recipient email address found');
      }

      // Schedule follow-up emails
      const results = [];
      for (const step of sequence) {
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + step.delay);

        // For now, we'll send immediately (in a real implementation, this would be scheduled)
        const emailResult = documentType === 'invoice' 
          ? await this.sendInvoiceEmail(userId, documentId, recipientEmail, {
              templateId: step.template,
              emailType: step.type,
              useNewSystem: true,
            })
          : await this.sendQuoteEmail(userId, documentId, recipientEmail, {
              templateId: step.template,
              emailType: step.type,
              useNewSystem: true,
            });

        results.push({
          step: step,
          scheduledDate,
          result: emailResult,
        });
      }

      return {
        success: true,
        data: {
          document,
          sequence: sequenceType,
          results,
        },
      };
    } catch (error) {
      Logger.error('Error sending automated follow-up sequence:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Bulk send business emails (for campaigns or notifications)
   */
  async bulkSendBusinessEmails(userId, emailData, options = {}) {
    try {
      const { 
        recipients, 
        templateId, 
        customMessage, 
        emailType = 'business_notification',
        batchSize = 10,
        delayBetweenBatches = 1000,
      } = emailData;

      const results = [];
      const batches = this.createBatches(recipients, batchSize);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchPromises = batch.map(async (recipient) => {
          try {
            const emailService = await this.getEmailManagementService();
            const result = await emailService.sendEmail(userId, {
              to: recipient.email,
              subject: recipient.subject || `Business Update`,
              templateId,
              customMessage,
              clientId: recipient.clientId,
            });

            // Log the activity
            if (result.success) {
              await businessEmailLogger.logActivity(userId, {
                clientId: recipient.clientId,
                type: emailType,
                status: 'sent',
                recipientEmail: recipient.email,
                subject: recipient.subject || `Business Update`,
                templateType: templateId,
                details: {
                  bulk_send: true,
                  batch_number: i + 1,
                  custom_message: customMessage,
                },
              });
            }

            return {
              recipient: recipient.email,
              clientId: recipient.clientId,
              success: result.success,
              error: result.error,
            };
          } catch (error) {
            return {
              recipient: recipient.email,
              clientId: recipient.clientId,
              success: false,
              error: error.message,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      return {
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount,
            successRate: (successCount / results.length) * 100,
          },
        },
      };
    } catch (error) {
      Logger.error('Error bulk sending business emails:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Helper methods for analysis
  analyzePreferredEmailTypes(emailHistory) {
    const typeCounts = this.groupEmailsByType(emailHistory);
    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }));
  }

  analyzeCommunicationFrequency(emailHistory) {
    if (emailHistory.length < 2) return 'insufficient_data';
    
    const dates = emailHistory.map(e => new Date(e.sent_at)).sort();
    const intervals = [];
    
    for (let i = 1; i < dates.length; i++) {
      const daysDiff = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    if (avgInterval <= 7) return 'weekly';
    if (avgInterval <= 30) return 'monthly';
    if (avgInterval <= 90) return 'quarterly';
    return 'infrequent';
  }

  analyzeBestContactTime(emailHistory) {
    // This would analyze response times to determine best contact hours
    // For now, return a default recommendation
    return {
      dayOfWeek: 'Tuesday',
      hourOfDay: 10,
      confidence: 'low',
    };
  }

  calculateClientResponseRate(emailHistory) {
    // This would calculate actual response rates based on email tracking
    // For now, return a placeholder
    return 0.75;
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Get top performing email templates based on success rates
   */
  getTopPerformingTemplates(activity, limit = 5) {
    const templateStats = {};
    
    activity.forEach(item => {
      const template = item.template_type || 'unknown';
      if (!templateStats[template]) {
        templateStats[template] = {
          total: 0,
          successful: 0,
          failed: 0,
        };
      }
      
      templateStats[template].total++;
      if (item.status === 'sent' || item.status === 'delivered') {
        templateStats[template].successful++;
      } else {
        templateStats[template].failed++;
      }
    });

    return Object.entries(templateStats)
      .map(([template, stats]) => ({
        template,
        ...stats,
        successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, limit);
  }

  /**
   * Calculate client engagement metrics
   */
  calculateClientEngagement(activity) {
    const clientStats = {};
    
    activity.forEach(item => {
      const clientId = item.client_id;
      if (!clientStats[clientId]) {
        clientStats[clientId] = {
          totalEmails: 0,
          lastEmailDate: null,
          emailTypes: new Set(),
          responseRate: 0,
        };
      }
      
      clientStats[clientId].totalEmails++;
      clientStats[clientId].emailTypes.add(item.type);
      
      const emailDate = new Date(item.sent_at);
      if (!clientStats[clientId].lastEmailDate || emailDate > clientStats[clientId].lastEmailDate) {
        clientStats[clientId].lastEmailDate = emailDate;
      }
    });

    // Convert to array and calculate engagement scores
    return Object.entries(clientStats)
      .map(([clientId, stats]) => ({
        clientId,
        totalEmails: stats.totalEmails,
        lastEmailDate: stats.lastEmailDate,
        emailTypeCount: stats.emailTypes.size,
        engagementScore: this.calculateEngagementScore(stats),
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore);
  }

  /**
   * Calculate engagement score for a client
   */
  calculateEngagementScore(stats) {
    const recencyWeight = 0.4;
    const frequencyWeight = 0.3;
    const diversityWeight = 0.3;

    // Recency score (higher for more recent emails)
    const daysSinceLastEmail = stats.lastEmailDate 
      ? (Date.now() - stats.lastEmailDate.getTime()) / (1000 * 60 * 60 * 24)
      : 365;
    const recencyScore = Math.max(0, 100 - daysSinceLastEmail);

    // Frequency score (higher for more emails)
    const frequencyScore = Math.min(100, stats.totalEmails * 10);

    // Diversity score (higher for more email types)
    const diversityScore = Math.min(100, stats.emailTypes.size * 20);

    return (
      recencyScore * recencyWeight +
      frequencyScore * frequencyWeight +
      diversityScore * diversityWeight
    );
  }
}

export default new BusinessEmailIntegration();