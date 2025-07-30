import Logger from '@utils/Logger';
import { supabase } from '@lib/supabaseClient';


/**
 * Business Email Integration Service
 * Connects existing invoice/quote email functionality with the new email management system
 * 
 * This service provides:
 * - Integration with invoice and quote email functionality
 * - Client-specific email history and filtering
 * - Email logging for business document communications
 * - Business email analytics and reporting
 */
class BusinessEmailIntegration {
  async getBusinessEmailLogger() {
    const { getBusinessEmailLogger } = await import('./businessEmailLogger.js');
    return getBusinessEmailLogger();
  }

  async getClientEmailService() {
    const { getClientEmailService } = await import('../../clients/services/clientEmailService.js');
    return getClientEmailService();
  }
  constructor() {
    this.emailManagementService = null;
    this.invoiceService = null;
    this.quoteService = null;
  }

  async getEmailManagementService() {
    if (!this.emailManagementService) {
      const { default: EmailManagementService } = await import('./emailManagementService.js');
      this.emailManagementService = new EmailManagementService();
    }
    return this.emailManagementService;
  }
  
  async getInvoiceService() {
    if (!this.invoiceService) {
      const { InvoiceService } = await import('@features/financial/services/invoiceService.js');
      this.invoiceService = InvoiceService;
    }
    return this.invoiceService;
  }
  
  async getQuoteService() {
    if (!this.quoteService) {
      const { QuoteService } = await import('@features/financial/services/quoteService.js');
      this.quoteService = QuoteService;
    }
    return this.quoteService;
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
   * Connects the email management system with the invoice service
   * 
   * @param {string} userId - User ID
   * @param {string} invoiceId - Invoice ID
   * @param {string} recipientEmail - Recipient email address
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Email sending result
   */
  async sendInvoiceEmail(userId, invoiceId, recipientEmail, options = {}) {
    try {
      const {
        templateId = 'invoice',
        customMessage,
        attachPdf = true,
        useNewSystem = true,
        emailType = 'invoice_sent',
        ccEmails = [],
        bccEmails = [],
        attachments = [],
        priority = 'normal',
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

      // Validate email address
      if (!this.isValidEmail(recipientEmail)) {
        throw new Error('Invalid recipient email address');
      }

      let result;
      if (useNewSystem) {
        // Use new email management system
        const emailService = await this.getEmailManagementService();
        
        // Prepare additional email data
        const emailData = {
          clientId: invoice.client_id,
          ccEmails,
          bccEmails,
          attachments,
          priority,
          relatedDocuments: [{
            type: 'invoice',
            id: invoiceId,
          }],
        };
        
        result = await emailService.sendInvoiceEmail(
          userId, 
          invoiceId, 
          recipientEmail, 
          templateId, 
          customMessage,
          emailData
        );
      } else {
        // Use existing invoice service integration - fallback to legacy method
        const invoiceService = await this.getInvoiceService();
        result = await invoiceService.sendInvoiceEmail(invoiceId, userId, {
          to: recipientEmail,
          template: templateId,
          customMessage,
          attachPdf,
          cc: ccEmails.join(','),
          bcc: bccEmails.join(','),
        });
      }

      // Log email activity regardless of system used
      if (result.success) {
        await (await this.getBusinessEmailLogger()).logInvoiceEmail(userId, invoiceId, {
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
            cc_emails: ccEmails,
            bcc_emails: bccEmails,
            priority,
            attachments: attachments.map(a => a.name || a.filename),
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
        
        // Emit event for real-time updates
        this.emitEmailEvent('invoice_email_sent', {
          userId,
          invoiceId,
          recipientEmail,
          result,
        });
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
   * Connects the email management system with the quote service
   * 
   * @param {string} userId - User ID
   * @param {string} quoteId - Quote ID
   * @param {string} recipientEmail - Recipient email address
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Email sending result
   */
  async sendQuoteEmail(userId, quoteId, recipientEmail, options = {}) {
    try {
      const {
        templateId = 'quote',
        customMessage,
        emailType = 'quote_sent',
        useNewSystem = true,
        ccEmails = [],
        bccEmails = [],
        attachPdf = true,
        attachments = [],
        priority = 'normal',
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

      // Validate email address
      if (!this.isValidEmail(recipientEmail)) {
        throw new Error('Invalid recipient email address');
      }

      let result;
      if (useNewSystem) {
        // Use new email management system
        const emailService = await this.getEmailManagementService();
        
        // Prepare additional email data
        const emailData = {
          clientId: quote.client_id,
          ccEmails,
          bccEmails,
          attachments,
          priority,
          relatedDocuments: [{
            type: 'quote',
            id: quoteId,
          }],
        };
        
        result = await emailService.sendQuoteEmail(
          userId, 
          quoteId, 
          recipientEmail, 
          templateId, 
          customMessage,
          emailData
        );
      } else {
        // Use existing quote service integration - fallback to legacy method
        const quoteService = await this.getQuoteService();
        result = await quoteService.sendQuoteEmail(quoteId, userId, {
          to: recipientEmail,
          template: templateId,
          customMessage,
          emailType,
          cc: ccEmails.join(','),
          bcc: bccEmails.join(','),
          useNewSystem: false,
        });
      }

      // Log email activity regardless of system used
      if (result.success) {
        await (await this.getBusinessEmailLogger()).logQuoteEmail(userId, quoteId, {
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
            cc_emails: ccEmails,
            bcc_emails: bccEmails,
            priority,
            attachments: attachments.map(a => a.name || a.filename),
            attach_pdf: attachPdf,
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
        
        // Emit event for real-time updates
        this.emitEmailEvent('quote_email_sent', {
          userId,
          quoteId,
          recipientEmail,
          result,
        });
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
   * Combines email activity with business document context for a complete view
   * 
   * @param {string} userId - User ID
   * @param {string} clientId - Client ID
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Object>} Client email history with business context
   */
  async getClientEmailHistory(userId, clientId, options = {}) {
    try {
      // Use the dedicated client email service for comprehensive history
      const result = await (await this.getClientEmailService()).getClientEmailHistory(userId, clientId, options);
      
      if (!result.success) {
        return result;
      }

      // Get additional business document data if needed
      let businessDocuments = {};
      
      if (options.includeDocumentDetails) {
        // Get related invoices
        const invoiceIds = [...new Set(
          result.data
            .filter(activity => activity.invoice_id)
            .map(activity => activity.invoice_id)
        )];
        
        if (invoiceIds.length > 0) {
          const { data: invoices } = await supabase
            .from('invoices')
            .select('id, invoice_number, total_amount, status, issue_date, due_date')
            .in('id', invoiceIds)
            .eq('user_id', userId);
            
          if (invoices) {
            businessDocuments.invoices = invoices.reduce((acc, invoice) => {
              acc[invoice.id] = invoice;
              return acc;
            }, {});
          }
        }
        
        // Get related quotes
        const quoteIds = [...new Set(
          result.data
            .filter(activity => activity.quote_id)
            .map(activity => activity.quote_id)
        )];
        
        if (quoteIds.length > 0) {
          const { data: quotes } = await supabase
            .from('quotes')
            .select('id, quote_number, total_amount, status, issue_date, due_date')
            .in('id', quoteIds)
            .eq('user_id', userId);
            
          if (quotes) {
            businessDocuments.quotes = quotes.reduce((acc, quote) => {
              acc[quote.id] = quote;
              return acc;
            }, {});
          }
        }
      }

      // Enhance with business context
      const enhancedData = result.data.map(activity => {
        // Get document details from our fetched data or from the activity itself
        const invoiceDetails = activity.invoice_id && businessDocuments.invoices ? 
          businessDocuments.invoices[activity.invoice_id] : activity.invoices;
          
        const quoteDetails = activity.quote_id && businessDocuments.quotes ? 
          businessDocuments.quotes[activity.quote_id] : activity.quotes;
        
        return {
          ...activity,
          businessContext: this.getBusinessContext(activity, invoiceDetails, quoteDetails),
          documentLink: this.getDocumentLink(activity),
          documentStatus: this.getDocumentStatus(activity, invoiceDetails, quoteDetails),
          communicationSummary: this.getCommunicationSummary(activity),
          actionItems: this.getActionItems(activity, invoiceDetails, quoteDetails),
        };
      });

      return {
        ...result,
        data: enhancedData,
        businessDocuments: options.includeDocumentDetails ? businessDocuments : undefined,
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
   * Enhanced to provide more detailed business context
   */
  getBusinessContext(activity, invoiceDetails = null, quoteDetails = null) {
    const context = {
      type: 'general',
      description: 'General email communication',
      priority: 'normal',
      category: 'communication',
    };

    // Use provided details or fallback to activity data
    const invoice = invoiceDetails || activity.invoices;
    const quote = quoteDetails || activity.quotes;

    if (activity.invoice_id && invoice) {
      context.type = 'invoice';
      context.description = `Invoice ${invoice.invoice_number} - ${invoice.status}`;
      context.amount = invoice.total_amount;
      context.documentNumber = invoice.invoice_number;
      context.category = 'financial';
      context.priority = this.getInvoicePriority(invoice);
      context.dueDate = invoice.due_date;
      context.issueDate = invoice.issue_date;
      context.isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date();
    } else if (activity.quote_id && quote) {
      context.type = 'quote';
      context.description = `Quote ${quote.quote_number} - ${quote.status}`;
      context.amount = quote.total_amount;
      context.documentNumber = quote.quote_number;
      context.category = 'sales';
      context.priority = this.getQuotePriority(quote);
      context.issueDate = quote.issue_date;
      context.expiryDate = quote.due_date;
      context.isExpired = quote.due_date && new Date(quote.due_date) < new Date();
    }

    // Add email type specific context
    if (activity.type) {
      context.emailType = activity.type;
      context.isReminder = activity.type.includes('reminder');
      context.isFollowUp = activity.type.includes('follow_up');
      context.isConfirmation = activity.type.includes('confirmation');
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
   * Get document status information
   */
  getDocumentStatus(activity, invoiceDetails = null, quoteDetails = null) {
    const invoice = invoiceDetails || activity.invoices;
    const quote = quoteDetails || activity.quotes;

    if (activity.invoice_id && invoice) {
      return {
        type: 'invoice',
        status: invoice.status,
        isPaid: invoice.status === 'paid',
        isOverdue: invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid',
        needsFollowUp: ['sent', 'overdue'].includes(invoice.status),
      };
    } else if (activity.quote_id && quote) {
      return {
        type: 'quote',
        status: quote.status,
        isAccepted: quote.status === 'accepted',
        isExpired: quote.due_date && new Date(quote.due_date) < new Date(),
        needsFollowUp: ['sent'].includes(quote.status),
      };
    }

    return null;
  }

  /**
   * Get communication summary for activity
   */
  getCommunicationSummary(activity) {
    const summary = {
      emailType: activity.type,
      sentAt: activity.sent_at,
      status: activity.status,
      recipient: activity.recipient_email,
    };

    // Parse details if available
    if (activity.details) {
      try {
        const details = typeof activity.details === 'string' 
          ? JSON.parse(activity.details) 
          : activity.details;
        
        summary.hasCustomMessage = !!details.custom_message;
        summary.templateUsed = details.template_type || activity.template_type;
        summary.systemUsed = details.system_used || 'unknown';
        summary.attachments = details.attachments || [];
      } catch (error) {
        Logger.warn('Error parsing activity details:', error);
      }
    }

    return summary;
  }

  /**
   * Get action items based on activity and document status
   */
  getActionItems(activity, invoiceDetails = null, quoteDetails = null) {
    const actions = [];
    const invoice = invoiceDetails || activity.invoices;
    const quote = quoteDetails || activity.quotes;

    if (activity.invoice_id && invoice) {
      if (invoice.status === 'sent' || invoice.status === 'overdue') {
        actions.push({
          type: 'follow_up',
          label: 'Send Payment Reminder',
          priority: invoice.status === 'overdue' ? 'high' : 'medium',
          action: 'send_payment_reminder',
        });
      }
      
      if (invoice.status === 'overdue') {
        actions.push({
          type: 'escalation',
          label: 'Escalate Overdue Payment',
          priority: 'high',
          action: 'escalate_payment',
        });
      }
    } else if (activity.quote_id && quote) {
      if (quote.status === 'sent') {
        actions.push({
          type: 'follow_up',
          label: 'Follow Up on Quote',
          priority: 'medium',
          action: 'follow_up_quote',
        });
      }
      
      if (quote.due_date && new Date(quote.due_date) < new Date() && quote.status === 'sent') {
        actions.push({
          type: 'renewal',
          label: 'Renew Expired Quote',
          priority: 'medium',
          action: 'renew_quote',
        });
      }
    }

    return actions;
  }

  /**
   * Get invoice priority based on status and amount
   */
  getInvoicePriority(invoice) {
    if (invoice.status === 'overdue') return 'high';
    if (invoice.total_amount > 5000) return 'high';
    if (invoice.status === 'sent') return 'medium';
    return 'normal';
  }

  /**
   * Get quote priority based on status and amount
   */
  getQuotePriority(quote) {
    if (quote.total_amount > 10000) return 'high';
    if (quote.status === 'sent') return 'medium';
    return 'normal';
  }

  /**
   * Validate email address format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get client-specific business email filters
   * Provides filtering options for client email history
   * 
   * @param {string} userId - User ID
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} Client-specific email filters
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
   * Get comprehensive business document email analytics
   * Provides detailed analytics for business document emails
   * 
   * @param {string} userId - User ID
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Business document email analytics
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
   * Send automated follow-up sequence for business documents
   * Sends a sequence of follow-up emails for invoices or quotes
   * 
   * @param {string} userId - User ID
   * @param {string} documentType - Document type ('invoice' or 'quote')
   * @param {string} documentId - Document ID
   * @param {string} sequenceType - Sequence type ('standard', 'urgent', 'gentle')
   * @returns {Promise<Object>} Follow-up sequence results
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
   * Emit email event for real-time updates
   */
  emitEmailEvent(eventType, data) {
    try {
      // This would integrate with a real-time event system
      // For now, we'll log the event
      Logger.info(`Email event emitted: ${eventType}`, data);
      
      // In a real implementation, this might use WebSocket or Server-Sent Events
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        const event = new CustomEvent('businessEmailEvent', {
          detail: { type: eventType, data }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      Logger.warn('Error emitting email event:', error);
    }
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
   * Get top performing templates based on success rates
   */
  getTopPerformingTemplates(activity, limit = 5) {
    const templateStats = {};
    
    activity.forEach(item => {
      const template = item.template_type || 'unknown';
      if (!templateStats[template]) {
        templateStats[template] = { total: 0, successful: 0 };
      }
      templateStats[template].total++;
      if (item.status === 'sent' || item.status === 'delivered') {
        templateStats[template].successful++;
      }
    });

    return Object.entries(templateStats)
      .map(([template, stats]) => ({
        template,
        successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
        totalSent: stats.total,
        successfulSent: stats.successful,
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
          recentActivity: 0,
        };
      }
      
      clientStats[clientId].totalEmails++;
      clientStats[clientId].emailTypes.add(item.type);
      
      const emailDate = new Date(item.sent_at);
      if (!clientStats[clientId].lastEmailDate || emailDate > clientStats[clientId].lastEmailDate) {
        clientStats[clientId].lastEmailDate = emailDate;
      }
      
      // Count recent activity (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (emailDate > thirtyDaysAgo) {
        clientStats[clientId].recentActivity++;
      }
    });

    return Object.entries(clientStats)
      .map(([clientId, stats]) => ({
        clientId,
        engagementScore: this.calculateEngagementScore(stats),
        totalEmails: stats.totalEmails,
        emailTypeCount: stats.emailTypes.size,
        lastEmailDate: stats.lastEmailDate,
        recentActivity: stats.recentActivity,
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore);
  }

  /**
   * Calculate engagement score for a client
   */
  calculateEngagementScore(stats) {
    let score = 0;
    
    // Base score from total emails
    score += Math.min(stats.totalEmails * 2, 20);
    
    // Bonus for email type diversity
    score += stats.emailTypes.size * 5;
    
    // Bonus for recent activity
    score += stats.recentActivity * 3;
    
    // Penalty for inactivity
    if (stats.lastEmailDate) {
      const daysSinceLastEmail = (Date.now() - stats.lastEmailDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastEmail > 30) {
        score -= Math.min(daysSinceLastEmail - 30, 20);
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Create batches from array for bulk operations
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
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
              variables: recipient.variables || {},
            });

            // Log the activity
            if (result.success && recipient.clientId) {
              await (await this.getBusinessEmailLogger()).logActivity(userId, {
                clientId: recipient.clientId,
                type: emailType,
                status: 'sent',
                recipientEmail: recipient.email,
                subject: recipient.subject || 'Business Update',
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
              success: result.success,
              messageId: result.messageId,
              error: result.error,
            };
          } catch (error) {
            return {
              recipient: recipient.email,
              success: false,
              error: error.message,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to avoid overwhelming the email service
        if (i < batches.length - 1 && delayBetweenBatches > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }

      const summary = {
        totalSent: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        successRate: results.length > 0 ? (results.filter(r => r.success).length / results.length) * 100 : 0,
      };

      return {
        success: true,
        data: {
          results,
          summary,
          batchCount: batches.length,
        },
      };
    } catch (error) {
      Logger.error('Error in bulk send business emails:', error);
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

// Export singleton instance with lazy initialization
let businessEmailIntegrationInstance = null;

export const getBusinessEmailIntegration = () => {
  if (!businessEmailIntegrationInstance) {
    businessEmailIntegrationInstance = new BusinessEmailIntegration();
  }
  return businessEmailIntegrationInstance;
};

// Export the function for lazy initialization instead of calling it
export default getBusinessEmailIntegration;