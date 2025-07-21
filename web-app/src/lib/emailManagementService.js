import emailProviderService from '@lib/emailProviderService';
import emailStorageService from '@lib/emailStorageService';
import emailTemplateService from '@lib/emailTemplateService';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * EmailManagementService - Core email management service integrating storage and provider services
 * Handles email CRUD operations, folder/label management, search, and business integrations
 */
class EmailManagementService {
  constructor() {
    this.syncIntervals = new Map();
    this.eventListeners = new Map();
  }

  /**
   * Initialize email management service
   */
  async initialize(userId) {
    try {
      // Initialize storage tables
      await emailStorageService.initializeTables();
      
      // Load user's email accounts and start sync if configured
      const accounts = await this.getEmailAccounts(userId);
      if (accounts.success && accounts.data.length > 0) {
        // Start sync for active accounts
        for (const account of accounts.data) {
          if (account.isActive && account.autoSync) {
            await this.startEmailSync(account.id, account.syncInterval || 5);
          }
        }
      }

      Logger.info('Email management service initialized for user:', userId);
      return { success: true };
    } catch (error) {
      Logger.error('Error initializing email management service:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * EMAIL CRUD OPERATIONS
   */

  /**
   * Fetch emails with filtering and pagination
   */
  async fetchEmails(userId, options = {}) {
    try {
      const result = await emailStorageService.fetchEmails(userId, options);
      
      if (result.success) {
        // Emit event for UI updates
        this.emitEvent('emails:fetched', {
          userId,
          emails: result.data,
          total: result.total,
          options,
        });
      }

      return result;
    } catch (error) {
      Logger.error('Error fetching emails:', error);
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
   * Get single email by ID
   */
  async getEmail(emailId, userId) {
    try {
      const result = await emailStorageService.getEmailById(emailId, userId);
      
      if (result.success) {
        // Mark as read if not already read
        if (!result.data.isRead) {
          await this.markAsRead(emailId, userId, true);
          result.data.isRead = true;
        }
      }

      return result;
    } catch (error) {
      Logger.error('Error getting email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send email
   */
  async sendEmail(userId, emailData) {
    try {
      // Validate email data
      const validation = this.validateEmailData(emailData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid email data',
          details: validation.errors,
        };
      }

      // Apply template if specified
      let processedEmailData = { ...emailData };
      if (emailData.templateId) {
        const templateResult = await this.applyTemplate(emailData.templateId, emailData.variables || {});
        if (templateResult.success) {
          processedEmailData = {
            ...processedEmailData,
            subject: templateResult.data.subject,
            html: templateResult.data.htmlContent,
            text: templateResult.data.textContent,
          };
        }
      }

      // Send via email provider
      const sendResult = await emailProviderService.sendEmail(processedEmailData);
      
      if (sendResult.success) {
        // Store sent email in database
        const sentEmail = {
          messageId: sendResult.messageId,
          folderId: 'sent',
          subject: processedEmailData.subject,
          sender: {
            name: processedEmailData.fromName || 'You',
            email: processedEmailData.from || processedEmailData.to, // Will be replaced with actual from
          },
          recipients: {
            to: [{ email: processedEmailData.to, name: processedEmailData.toName || '' }],
            cc: processedEmailData.cc ? [{ email: processedEmailData.cc }] : [],
            bcc: processedEmailData.bcc ? [{ email: processedEmailData.bcc }] : [],
          },
          content: {
            text: processedEmailData.text,
            html: processedEmailData.html,
          },
          attachments: processedEmailData.attachments || [],
          labels: emailData.labels || [],
          isRead: true,
          isStarred: false,
          isImportant: emailData.isImportant || false,
          receivedAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          clientId: emailData.clientId || null,
          relatedDocuments: emailData.relatedDocuments || [],
          userId,
        };

        const storeResult = await emailStorageService.storeEmail(sentEmail);
        
        // Emit event
        this.emitEvent('email:sent', {
          userId,
          email: storeResult.data,
          sendResult,
        });

        return {
          success: true,
          messageId: sendResult.messageId,
          email: storeResult.data,
        };
      }

      return sendResult;
    } catch (error) {
      Logger.error('Error sending email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete email
   */
  async deleteEmail(emailId, userId, permanent = false) {
    try {
      if (permanent) {
        // Permanently delete from database
        const result = await emailStorageService.deleteEmail(emailId, userId);
        
        if (result.success) {
          this.emitEvent('email:deleted', { userId, emailId, permanent: true });
        }
        
        return result;
      } else {
        // Move to trash
        const result = await this.moveToFolder(emailId, userId, 'trash');
        
        if (result.success) {
          this.emitEvent('email:deleted', { userId, emailId, permanent: false });
        }
        
        return result;
      }
    } catch (error) {
      Logger.error('Error deleting email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mark email as read/unread
   */
  async markAsRead(emailId, userId, isRead = true) {
    try {
      const result = await emailStorageService.updateEmail(emailId, userId, { isRead });
      
      if (result.success) {
        this.emitEvent('email:read_status_changed', {
          userId,
          emailId,
          isRead,
          email: result.data,
        });
      }
      
      return result;
    } catch (error) {
      Logger.error('Error marking email as read:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Star/unstar email
   */
  async starEmail(emailId, userId, isStarred = true) {
    try {
      const result = await emailStorageService.updateEmail(emailId, userId, { isStarred });
      
      if (result.success) {
        this.emitEvent('email:starred_status_changed', {
          userId,
          emailId,
          isStarred,
          email: result.data,
        });
      }
      
      return result;
    } catch (error) {
      Logger.error('Error starring email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Bulk operations on emails
   */
  async bulkUpdateEmails(emailIds, userId, updates) {
    try {
      const result = await emailStorageService.bulkUpdateEmails(emailIds, userId, updates);
      
      if (result.success) {
        this.emitEvent('emails:bulk_updated', {
          userId,
          emailIds,
          updates,
          count: result.count,
        });
      }
      
      return result;
    } catch (error) {
      Logger.error('Error bulk updating emails:', error);
      return {
        success: false,
        error: error.message,
        count: 0,
      };
    }
  }

  /**
   * FOLDER AND LABEL MANAGEMENT
   */

  /**
   * Get all folders
   */
  async getFolders(userId) {
    try {
      return await emailStorageService.getFolders(userId);
    } catch (error) {
      Logger.error('Error getting folders:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Create new folder
   */
  async createFolder(userId, folderData) {
    try {
      const result = await emailStorageService.createFolder(userId, folderData);
      
      if (result.success) {
        this.emitEvent('folder:created', {
          userId,
          folder: result.data,
        });
      }
      
      return result;
    } catch (error) {
      Logger.error('Error creating folder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update folder
   */
  async updateFolder(folderId, userId, updates) {
    try {
      const result = await emailStorageService.updateFolder(folderId, userId, updates);
      
      if (result.success) {
        this.emitEvent('folder:updated', {
          userId,
          folderId,
          folder: result.data,
        });
      }
      
      return result;
    } catch (error) {
      Logger.error('Error updating folder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete folder
   */
  async deleteFolder(folderId, userId) {
    try {
      const result = await emailStorageService.deleteFolder(folderId, userId);
      
      if (result.success) {
        this.emitEvent('folder:deleted', {
          userId,
          folderId,
        });
      }
      
      return result;
    } catch (error) {
      Logger.error('Error deleting folder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Move email to folder
   */
  async moveToFolder(emailId, userId, folderId) {
    try {
      const result = await emailStorageService.updateEmail(emailId, userId, { folderId });
      
      if (result.success) {
        this.emitEvent('email:moved', {
          userId,
          emailId,
          folderId,
          email: result.data,
        });
      }
      
      return result;
    } catch (error) {
      Logger.error('Error moving email to folder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Apply label to email
   */
  async applyLabel(emailId, userId, labelId) {
    try {
      // Get current email to update labels
      const emailResult = await emailStorageService.getEmailById(emailId, userId);
      if (!emailResult.success) {
        return emailResult;
      }

      const currentLabels = emailResult.data.labels || [];
      if (!currentLabels.includes(labelId)) {
        const updatedLabels = [...currentLabels, labelId];
        const result = await emailStorageService.updateEmail(emailId, userId, { labels: updatedLabels });
        
        if (result.success) {
          this.emitEvent('email:label_applied', {
            userId,
            emailId,
            labelId,
            email: result.data,
          });
        }
        
        return result;
      }

      return { success: true, data: emailResult.data };
    } catch (error) {
      Logger.error('Error applying label:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Remove label from email
   */
  async removeLabel(emailId, userId, labelId) {
    try {
      // Get current email to update labels
      const emailResult = await emailStorageService.getEmailById(emailId, userId);
      if (!emailResult.success) {
        return emailResult;
      }

      const currentLabels = emailResult.data.labels || [];
      const updatedLabels = currentLabels.filter(label => label !== labelId);
      
      const result = await emailStorageService.updateEmail(emailId, userId, { labels: updatedLabels });
      
      if (result.success) {
        this.emitEvent('email:label_removed', {
          userId,
          emailId,
          labelId,
          email: result.data,
        });
      }
      
      return result;
    } catch (error) {
      Logger.error('Error removing label:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * SEARCH AND FILTERING
   */

  /**
   * Search emails
   */
  async searchEmails(userId, query, options = {}) {
    try {
      const result = await emailStorageService.searchEmails(userId, query, options);
      
      if (result.success) {
        this.emitEvent('emails:searched', {
          userId,
          query,
          results: result.data,
          total: result.total,
        });
      }
      
      return result;
    } catch (error) {
      Logger.error('Error searching emails:', error);
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
   * Get emails by client
   */
  async getEmailsByClient(userId, clientId, options = {}) {
    try {
      const searchOptions = {
        ...options,
        clientId,
      };
      
      return await emailStorageService.fetchEmails(userId, searchOptions);
    } catch (error) {
      Logger.error('Error getting emails by client:', error);
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
   * TEMPLATE OPERATIONS
   */

  /**
   * Get templates
   */
  async getTemplates(organizationId = null) {
    try {
      return await emailTemplateService.getTemplates(organizationId);
    } catch (error) {
      Logger.error('Error getting templates:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        predefined: {},
      };
    }
  }

  /**
   * Save template
   */
  async saveTemplate(templateData) {
    try {
      return await emailTemplateService.saveTemplate(templateData);
    } catch (error) {
      Logger.error('Error saving template:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Apply template with variables
   */
  async applyTemplate(templateId, variables = {}) {
    try {
      // Get template (could be from database or predefined)
      const templatesResult = await emailTemplateService.getTemplates();
      if (!templatesResult.success) {
        return templatesResult;
      }

      let template = null;
      
      // Check custom templates
      if (templatesResult.data) {
        template = templatesResult.data.find(t => t.id === templateId);
      }
      
      // Check predefined templates
      if (!template && templatesResult.predefined) {
        template = templatesResult.predefined[templateId];
      }

      if (!template) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      return emailTemplateService.renderTemplate(template, variables);
    } catch (error) {
      Logger.error('Error applying template:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * BUSINESS INTEGRATION METHODS
   */

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(userId, invoiceId, recipientEmail, templateId = null, customMessage = null) {
    try {
      // Get invoice data
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .eq('id', invoiceId)
        .single();

      if (error || !invoice) {
        return {
          success: false,
          error: 'Invoice not found',
        };
      }

      // Prepare template variables
      const variables = {
        client_name: invoice.clients?.full_name || 'Valued Customer',
        company_name: 'Nexa Manager', // Should come from user settings
        invoice_number: invoice.invoice_number,
        total_amount: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'EUR' 
        }).format(invoice.total_amount),
        due_date: new Date(invoice.due_date).toLocaleDateString(),
        issue_date: new Date(invoice.issue_date).toLocaleDateString(),
      };

      // Prepare email data
      const emailData = {
        to: recipientEmail,
        subject: `Invoice ${invoice.invoice_number} - Nexa Manager`,
        templateId: templateId || 'invoice',
        variables,
        clientId: invoice.client_id,
        relatedDocuments: [{
          type: 'invoice',
          id: invoiceId,
        }],
        isImportant: true,
      };

      if (customMessage) {
        emailData.customContent = customMessage;
      }

      return await this.sendEmail(userId, emailData);
    } catch (error) {
      Logger.error('Error sending invoice email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send quote email
   */
  async sendQuoteEmail(userId, quoteId, recipientEmail, templateId = null, customMessage = null) {
    try {
      // Get quote data
      const { data: quote, error } = await supabase
        .from('quotes')
        .select('*, clients(*)')
        .eq('id', quoteId)
        .single();

      if (error || !quote) {
        return {
          success: false,
          error: 'Quote not found',
        };
      }

      // Prepare template variables
      const variables = {
        client_name: quote.clients?.full_name || 'Valued Customer',
        company_name: 'Nexa Manager', // Should come from user settings
        quote_number: quote.quote_number,
        total_amount: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'EUR' 
        }).format(quote.total_amount),
        issue_date: new Date(quote.issue_date).toLocaleDateString(),
        expiry_date: quote.due_date ? new Date(quote.due_date).toLocaleDateString() : 'N/A',
      };

      // Prepare email data
      const emailData = {
        to: recipientEmail,
        subject: `Quote ${quote.quote_number} - Nexa Manager`,
        templateId: templateId || 'quote',
        variables,
        clientId: quote.client_id,
        relatedDocuments: [{
          type: 'quote',
          id: quoteId,
        }],
        isImportant: true,
      };

      if (customMessage) {
        emailData.customContent = customMessage;
      }

      return await this.sendEmail(userId, emailData);
    } catch (error) {
      Logger.error('Error sending quote email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * EMAIL SYNCHRONIZATION
   */

  /**
   * Start email synchronization for user accounts
   */
  async startEmailSync(accountId, intervalMinutes = 5) {
    try {
      // Stop existing sync if running
      if (this.syncIntervals.has(accountId)) {
        clearInterval(this.syncIntervals.get(accountId));
      }

      // Start new sync interval
      const interval = setInterval(async () => {
        try {
          await this.syncEmails(accountId);
        } catch (error) {
          Logger.error(`Email sync error for account ${accountId}:`, error);
        }
      }, intervalMinutes * 60 * 1000);

      this.syncIntervals.set(accountId, interval);
      
      // Perform initial sync
      await this.syncEmails(accountId);

      Logger.info(`Email sync started for account: ${accountId} (every ${intervalMinutes} minutes)`);
      return { success: true, intervalMinutes };
    } catch (error) {
      Logger.error('Error starting email sync:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop email synchronization
   */
  stopEmailSync(accountId) {
    try {
      if (this.syncIntervals.has(accountId)) {
        clearInterval(this.syncIntervals.get(accountId));
        this.syncIntervals.delete(accountId);
        Logger.info(`Email sync stopped for account: ${accountId}`);
        return { success: true };
      }
      return { success: false, error: 'No sync interval found' };
    } catch (error) {
      Logger.error('Error stopping email sync:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform email synchronization
   */
  async syncEmails(accountId) {
    try {
      // This would integrate with the email provider service
      // For now, we'll simulate the sync process
      const result = await emailProviderService.syncEmails(accountId);
      
      if (result.success && result.emails && result.emails.length > 0) {
        // Store new emails in database
        for (const email of result.emails) {
          await emailStorageService.storeEmail({
            ...email,
            userId: accountId, // This should be mapped properly
          });
        }

        this.emitEvent('emails:synced', {
          accountId,
          newEmails: result.emails.length,
          lastSync: new Date(),
        });
      }

      return result;
    } catch (error) {
      Logger.error('Error syncing emails:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Validate email data
   */
  validateEmailData(emailData) {
    const errors = [];

    if (!emailData.to) {
      errors.push('Recipient email is required');
    } else if (!this.isValidEmail(emailData.to)) {
      errors.push('Invalid recipient email format');
    }

    if (!emailData.subject) {
      errors.push('Subject is required');
    }

    if (!emailData.html && !emailData.text) {
      errors.push('Email content is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email address
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get email accounts for user
   */
  async getEmailAccounts(userId) {
    try {
      // This would fetch from a user email accounts table
      // For now, return empty array
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      Logger.error('Error getting email accounts:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(userId) {
    try {
      return await emailStorageService.getEmailStats(userId);
    } catch (error) {
      Logger.error('Error getting email stats:', error);
      return {
        success: false,
        error: error.message,
        data: {
          total: 0,
          unread: 0,
          starred: 0,
          byFolder: {},
        },
      };
    }
  }

  /**
   * EVENT SYSTEM
   */

  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emitEvent(event, data) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          Logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Stop all sync intervals
    for (const [accountId, interval] of this.syncIntervals) {
      clearInterval(interval);
      Logger.info(`Stopped email sync for account: ${accountId}`);
    }
    this.syncIntervals.clear();

    // Clear event listeners
    this.eventListeners.clear();

    Logger.info('Email management service cleaned up');
  }
}

export default new EmailManagementService();