import { emailProviderService } from '@features/email';
import { emailStorageService } from '@features/email';
import { emailTemplateService } from '@features/email';
import { emailSecurityService } from '@features/email';
import { emailErrorHandler } from '@features/email';
import { emailOfflineService } from '@features/email';
import { emailRecoveryService } from '@features/email';
import { emailAnalyticsService } from '@features/email';
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
    return await emailErrorHandler.withErrorHandling(
      async () => {
        // Initialize storage tables
        await emailStorageService.initializeTables();
        
        // Initialize email security service
        await emailSecurityService.initializeEncryption(userId);
        
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
      },
      {
        operation: 'initialize_email_service',
        userId,
        showUserMessage: true,
        userMessage: 'Initializing email service...'
      }
    );
  }

  /**
   * EMAIL CRUD OPERATIONS
   */

  /**
   * Fetch emails with filtering and pagination
   */
  async fetchEmails(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
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
      },
      {
        operation: 'fetch_emails',
        userId,
        fallbackValue: {
          success: false,
          data: [],
          total: 0,
          hasMore: false,
        }
      }
    );
  }

  /**
   * Get single email by ID
   */
  async getEmail(emailId, userId) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        const result = await emailStorageService.getEmailById(emailId, userId);
        
        if (result.success) {
          // Mark as read if not already read
          if (!result.data.isRead) {
            await this.markAsRead(emailId, userId, true);
            result.data.isRead = true;
          }

          // Perform security analysis on the email
          try {
            const securityAnalysis = await emailSecurityService.analyzeEmailSecurity(result.data, userId);
            result.data.securityAnalysis = securityAnalysis;
            
            // Log email access for audit trail
            await emailSecurityService.logEmailSecurityEvent({
              action: 'EMAIL_ACCESSED',
              userId,
              emailId,
              details: { 
                riskScore: securityAnalysis.riskScore,
                hasSecurityWarnings: securityAnalysis.riskScore > 40
              },
              severity: securityAnalysis.riskScore > 70 ? 'HIGH' : 'LOW'
            });
          } catch (securityError) {
            Logger.warn('Security analysis failed for email:', emailId, securityError);
            // Don't fail the entire request if security analysis fails
          }
        }

        return result;
      },
      {
        operation: 'get_email',
        userId,
        emailId,
        fallbackValue: {
          success: false,
          error: 'Failed to retrieve email',
        }
      }
    );
  }

  /**
   * Send email
   */
  async sendEmail(userId, emailData) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        // Check if we're offline and queue the email
        if (!emailOfflineService.isOnline) {
          return await emailOfflineService.queueOfflineOperation({
            type: 'send_email',
            data: { emailData },
            userId
          });
        }

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

        // Encrypt sensitive content if marked as confidential
        let encryptedContent = null;
        if (emailData.isConfidential || emailData.encryptContent) {
          try {
            const contentToEncrypt = processedEmailData.html || processedEmailData.text;
            encryptedContent = await emailSecurityService.encryptEmailContent(contentToEncrypt, userId);
            
            // Log encryption event
            await emailSecurityService.logEmailSecurityEvent({
              action: 'EMAIL_CONTENT_ENCRYPTED',
              userId,
              details: { 
                recipient: processedEmailData.to,
                subject: processedEmailData.subject,
                hasAttachments: (processedEmailData.attachments || []).length > 0
              },
              severity: 'MEDIUM'
            });
          } catch (encryptionError) {
            Logger.error('Failed to encrypt email content:', encryptionError);
            // Continue without encryption but log the failure
            await emailSecurityService.logEmailSecurityEvent({
              action: 'EMAIL_ENCRYPTION_FAILED',
              userId,
              details: { 
                recipient: processedEmailData.to,
                error: encryptionError.message
              },
              severity: 'HIGH'
            });
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
              encrypted: encryptedContent, // Store encrypted version if available
            },
            attachments: processedEmailData.attachments || [],
            labels: emailData.labels || [],
            isRead: true,
            isStarred: false,
            isImportant: emailData.isImportant || false,
            isConfidential: emailData.isConfidential || false,
            receivedAt: new Date().toISOString(),
            sentAt: new Date().toISOString(),
            clientId: emailData.clientId || null,
            relatedDocuments: emailData.relatedDocuments || [],
            userId,
          };

          const storeResult = await emailStorageService.storeEmail(sentEmail);
          
          // Log email sending for security audit
          await emailSecurityService.logEmailSecurityEvent({
            action: 'EMAIL_SENT',
            userId,
            emailId: storeResult.data?.id,
            details: {
              recipient: processedEmailData.to,
              subject: processedEmailData.subject,
              hasAttachments: (processedEmailData.attachments || []).length > 0,
              isConfidential: emailData.isConfidential || false,
              templateUsed: emailData.templateId || null
            },
            severity: 'LOW'
          });
          
          // Log business email activity if related documents are present
          if (emailData.relatedDocuments && emailData.relatedDocuments.length > 0) {
            for (const doc of emailData.relatedDocuments) {
              const activityData = {
                emailId: storeResult.data?.id,
                clientId: emailData.clientId,
                type: `${doc.type}_sent`,
                status: 'sent',
                recipientEmail: processedEmailData.to,
                subject: processedEmailData.subject,
                templateType: emailData.templateId,
                details: {
                  documentId: doc.id,
                  documentType: doc.type,
                  customContent: emailData.customContent || null,
                },
              };

              if (doc.type === 'invoice') {
                activityData.invoiceId = doc.id;
              } else if (doc.type === 'quote') {
                activityData.quoteId = doc.id;
              }

              await this.logEmailActivity(userId, activityData);
            }
          }
          
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
      },
      {
        operation: 'send_email',
        userId,
        showUserMessage: true,
        userMessage: 'Sending email...',
        retryable: true
      }
    );
  }
  /**
   * Delete email
   */
  async deleteEmail(emailId, userId, permanent = false) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        // Check if we're offline and queue the operation
        if (!emailOfflineService.isOnline) {
          return await emailOfflineService.queueOfflineOperation({
            type: 'delete_email',
            data: { emailId, permanent },
            userId
          });
        }

        // Get email details before deletion for security logging
        const emailResult = await emailStorageService.getEmail(emailId, userId);
        const emailData = emailResult.success ? emailResult.data : null;

        if (permanent) {
          // For permanent deletion, ensure secure cleanup of encrypted content
          if (emailData && emailData.content && emailData.content.encrypted) {
            try {
              // Securely delete encrypted content
              await emailSecurityService.secureDeleteEncryptedContent(emailData.content.encrypted);
            } catch (cleanupError) {
              Logger.warn('Failed to securely delete encrypted content:', cleanupError);
            }
          }

          // Permanently delete from database
          const result = await emailStorageService.deleteEmail(emailId, userId);
          
          if (result.success) {
            // Log permanent deletion for security audit
            await emailSecurityService.logEmailSecurityEvent({
              action: 'EMAIL_PERMANENTLY_DELETED',
              userId,
              emailId,
              details: {
                subject: emailData?.subject || 'Unknown',
                sender: emailData?.sender?.email || 'Unknown',
                hadEncryptedContent: !!(emailData?.content?.encrypted),
                deletionTimestamp: new Date().toISOString()
              },
              severity: 'MEDIUM'
            });

            this.emitEvent('email:deleted', { userId, emailId, permanent: true });
          }
          
          return result;
        } else {
          // Move to trash
          const result = await this.moveToFolder(emailId, userId, 'trash');
          
          if (result.success) {
            // Log soft deletion for security audit
            await emailSecurityService.logEmailSecurityEvent({
              action: 'EMAIL_MOVED_TO_TRASH',
              userId,
              emailId,
              details: {
                subject: emailData?.subject || 'Unknown',
                sender: emailData?.sender?.email || 'Unknown',
                hasEncryptedContent: !!(emailData?.content?.encrypted)
              },
              severity: 'LOW'
            });

            this.emitEvent('email:deleted', { userId, emailId, permanent: false });
          }
          
          return result;
        }
      },
      {
        operation: 'delete_email',
        userId,
        emailId,
        showUserMessage: true,
        userMessage: permanent ? 'Permanently deleting email...' : 'Moving email to trash...',
        retryable: true,
        fallbackValue: { success: false, error: 'Failed to delete email' }
      }
    );
  }

  /**
   * Mark email as read/unread
   */
  async markAsRead(emailId, userId, isRead = true) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        // Check if we're offline and queue the operation
        if (!emailOfflineService.isOnline) {
          return await emailOfflineService.queueOfflineOperation({
            type: 'mark_read',
            data: { emailId, isRead },
            userId
          });
        }

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
      },
      {
        operation: 'mark_as_read',
        userId,
        emailId,
        showUserMessage: false, // This is a quick operation, no need for user message
        retryable: true,
        fallbackValue: { success: false, error: 'Failed to update read status' }
      }
    );
  }

  /**
   * Star/unstar email
   */
  async starEmail(emailId, userId, isStarred = true) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        // Check if we're offline and queue the operation
        if (!emailOfflineService.isOnline) {
          return await emailOfflineService.queueOfflineOperation({
            type: 'star_email',
            data: { emailId, isStarred },
            userId
          });
        }

        const result = await emailStorageService.updateEmail(emailId, userId, { isStarred });
        
        if (result.success) {
          this.emitEvent('email:starred', {
            userId,
            emailId,
            isStarred,
            email: result.data,
          });
        }
        
        return result;
      },
      {
        operation: 'star_email',
        userId,
        emailId,
        showUserMessage: false, // This is a quick operation, no need for user message
        retryable: true,
        fallbackValue: { success: false, error: 'Failed to update star status' }
      }
    );
  }
  /**
   * Bulk operations on emails
   */
  async bulkUpdateEmails(emailIds, userId, updates) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        // Check if we're offline and queue the operation
        if (!emailOfflineService.isOnline) {
          return await emailOfflineService.queueOfflineOperation({
            type: 'bulk_update',
            data: { emailIds, updates },
            userId
          });
        }

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
      },
      {
        operation: 'bulk_update_emails',
        userId,
        showUserMessage: true,
        userMessage: `Updating ${emailIds.length} emails...`,
        retryable: true,
        fallbackValue: { success: false, error: 'Failed to update emails', count: 0 }
      }
    );
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
    return await emailErrorHandler.withErrorHandling(
      async () => {
        // Check if we're offline and queue the operation
        if (!emailOfflineService.isOnline) {
          return await emailOfflineService.queueOfflineOperation({
            type: 'move_email',
            data: { emailId, folderId },
            userId
          });
        }

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
      },
      {
        operation: 'move_to_folder',
        userId,
        emailId,
        showUserMessage: false, // This is a quick operation, no need for user message
        retryable: true,
        fallbackValue: { success: false, error: 'Failed to move email' }
      }
    );
  }

  /**
   * Apply label to email
   */
  async applyLabel(emailId, userId, labelId) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        // Check if we're offline and queue the operation
        if (!emailOfflineService.isOnline) {
          return await emailOfflineService.queueOfflineOperation({
            type: 'add_label',
            data: { emailId, labelId },
            userId
          });
        }

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
      },
      {
        operation: 'apply_label',
        userId,
        emailId,
        showUserMessage: false,
        retryable: true,
        fallbackValue: { success: false, error: 'Failed to apply label' }
      }
    );
  }

  /**
   * Remove label from email
   */
  async removeLabel(emailId, userId, labelId) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        // Check if we're offline and queue the operation
        if (!emailOfflineService.isOnline) {
          return await emailOfflineService.queueOfflineOperation({
            type: 'remove_label',
            data: { emailId, labelId },
            userId
          });
        }

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
      },
      {
        operation: 'remove_label',
        userId,
        emailId,
        showUserMessage: false,
        retryable: true,
        fallbackValue: { success: false, error: 'Failed to remove label' }
      }
    );
  }

  /**
   * SEARCH AND FILTERING
   */

  /**
   * Search emails
   */
  async searchEmails(userId, query, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
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
      },
      {
        operation: 'search_emails',
        userId,
        showUserMessage: false,
        retryable: true,
        fallbackValue: {
          success: false,
          error: 'Failed to search emails',
          data: [],
          total: 0,
          hasMore: false,
        }
      }
    );
  }

  /**
   * Get emails by client
   */
  async getEmailsByClient(userId, clientId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        const searchOptions = {
          ...options,
          clientId,
        };
        
        return await emailStorageService.fetchEmails(userId, searchOptions);
      },
      {
        operation: 'get_emails_by_client',
        userId,
        showUserMessage: false,
        retryable: true,
        fallbackValue: {
          success: false,
          error: 'Failed to get emails by client',
          data: [],
          total: 0,
          hasMore: false,
        }
      }
    );
  }

  /**
   * TEMPLATE OPERATIONS
   */

  /**
   * Get templates
   */
  async getTemplates(organizationId = null) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        return await emailTemplateService.getTemplates(organizationId);
      },
      {
        operation: 'get_templates',
        showUserMessage: false,
        retryable: true,
        fallbackValue: {
          success: false,
          error: 'Failed to get templates',
          data: [],
          predefined: {},
        }
      }
    );
  }

  /**
   * Save template
   */
  async saveTemplate(templateData) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        return await emailTemplateService.saveTemplate(templateData);
      },
      {
        operation: 'save_template',
        showUserMessage: true,
        userMessage: 'Saving email template...',
        retryable: true,
        fallbackValue: {
          success: false,
          error: 'Failed to save template',
        }
      }
    );
  }

  /**
   * Apply template with variables
   */
  async applyTemplate(templateId, variables = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
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
      },
      {
        operation: 'apply_template',
        showUserMessage: false,
        retryable: true,
        fallbackValue: {
          success: false,
          error: 'Failed to apply template',
        }
      }
    );
  }

  /**
   * BUSINESS INTEGRATION METHODS
   */

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(userId, invoiceId, recipientEmail, templateId = null, customMessage = null) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
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
      },
      {
        operation: 'send_invoice_email',
        userId,
        showUserMessage: true,
        userMessage: 'Sending invoice email...',
        retryable: true,
        fallbackValue: {
          success: false,
          error: 'Failed to send invoice email',
        }
      }
    );
  }

  /**
   * Send quote email
   */
  async sendQuoteEmail(userId, quoteId, recipientEmail, templateId = null, customMessage = null) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
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
      },
      {
        operation: 'send_quote_email',
        userId,
        showUserMessage: true,
        userMessage: 'Sending quote email...',
        retryable: true,
        fallbackValue: {
          success: false,
          error: 'Failed to send quote email',
        }
      }
    );
  }

  /**
   * Get client-specific email history with filtering
   */
  async getClientEmailHistory(userId, clientId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        const {
          limit = 50,
          offset = 0,
          dateFrom,
          dateTo,
          documentType, // 'invoice', 'quote', or null for all
          includeActivity = true,
        } = options;

        // Build base query for emails
        let emailQuery = supabase
          .from('emails')
          .select(`
            *,
            folders(name, type)
          `)
          .eq('user_id', userId)
          .eq('client_id', clientId)
          .order('received_at', { ascending: false })
          .range(offset, offset + limit - 1);

        // Apply date filters
        if (dateFrom) {
          emailQuery = emailQuery.gte('received_at', dateFrom);
        }
        if (dateTo) {
          emailQuery = emailQuery.lte('received_at', dateTo);
        }

        // Apply document type filter
        if (documentType) {
          emailQuery = emailQuery.contains('related_documents', [{ type: documentType }]);
        }

        const { data: emails, error: emailError } = await emailQuery;

        if (emailError) {
          throw emailError;
        }

        let activityData = [];
        if (includeActivity) {
          // Get email activity for this client
          let activityQuery = supabase
            .from('email_activity')
            .select('*')
            .eq('user_id', userId)
            .eq('client_id', clientId)
            .order('sent_at', { ascending: false })
            .range(offset, offset + limit - 1);

          // Apply same filters to activity
          if (dateFrom) {
            activityQuery = activityQuery.gte('sent_at', dateFrom);
          }
          if (dateTo) {
            activityQuery = activityQuery.lte('sent_at', dateTo);
          }
          if (documentType) {
            if (documentType === 'invoice') {
              activityQuery = activityQuery.not('invoice_id', 'is', null);
            } else if (documentType === 'quote') {
              activityQuery = activityQuery.not('quote_id', 'is', null);
            }
          }

          const { data: activity, error: activityError } = await activityQuery;
          if (!activityError) {
            activityData = activity || [];
          }
        }

        // Get total count for pagination
        const { count: totalEmails } = await supabase
          .from('emails')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('client_id', clientId);

        return {
          success: true,
          data: {
            emails: emails || [],
            activity: activityData,
            pagination: {
              total: totalEmails || 0,
              limit,
              offset,
              hasMore: (totalEmails || 0) > offset + limit,
            },
          },
        };
      },
      {
        operation: 'get_client_email_history',
        userId,
        fallbackValue: {
          success: false,
          error: 'Failed to get client email history',
          data: {
            emails: [],
            activity: [],
            pagination: {
              total: 0,
              limit: 50,
              offset: 0,
              hasMore: false,
            },
          },
        }
      }
    );
  }

  /**
   * Log email activity for business document communications
   */
  async logEmailActivity(userId, activityData) {
    try {
      const {
        emailId,
        invoiceId,
        quoteId,
        clientId,
        type,
        status = 'sent',
        recipientEmail,
        subject,
        templateType,
        details = {},
      } = activityData;

      const logEntry = {
        user_id: userId,
        email_id: emailId || null,
        invoice_id: invoiceId || null,
        quote_id: quoteId || null,
        client_id: clientId || null,
        type,
        status,
        recipient_email: recipientEmail,
        subject: subject || null,
        template_type: templateType || null,
        details: JSON.stringify(details),
        sent_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('email_activity')
        .insert([logEntry])
        .select()
        .single();

      if (error) {
        throw error;
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

  /**
   * Connect with existing invoice email functionality
   */
  async integrateInvoiceEmail(userId, invoiceId, recipientEmail, options = {}) {
    try {
      const {
        templateId,
        customMessage,
        attachPdf = true,
        sendReminder = false,
        reminderType = 'gentle',
      } = options;

      // Use existing invoice service to generate and send email
      const invoiceService = await import('@features/financial/services/invoiceService');
      
      let result;
      if (sendReminder) {
        // Send reminder using existing service
        result = await invoiceService.default.sendPaymentReminder(invoiceId, reminderType);
      } else {
        // Send invoice email using existing service
        result = await invoiceService.default.generateAndEmailInvoicePDF(invoiceId, userId, {
          to: recipientEmail,
          template: templateId,
          customMessage,
          attachPdf,
        });
      }

      if (result.success) {
        // Log the activity in our email management system
        const { data: invoice } = await supabase
          .from('invoices')
          .select('*, clients(*)')
          .eq('id', invoiceId)
          .single();

        if (invoice) {
          await this.logEmailActivity(userId, {
            invoiceId,
            clientId: invoice.client_id,
            type: sendReminder ? `reminder_${reminderType}` : 'invoice_sent',
            status: 'sent',
            recipientEmail,
            subject: `Invoice ${invoice.invoice_number}`,
            templateType: templateId || 'invoice',
            details: {
              attachPdf,
              customMessage: customMessage || null,
            },
          });
        }
      }

      return result;
    } catch (error) {
      Logger.error('Error integrating invoice email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Connect with existing quote email functionality
   */
  async integrateQuoteEmail(userId, quoteId, recipientEmail, options = {}) {
    try {
      const {
        templateId,
        customMessage,
        emailType = 'quote_sent', // 'quote_sent', 'quote_reminder', 'quote_accepted'
      } = options;

      // Use existing email service for quotes
      const emailService = await import('@features/email/services/emailService');
      
      // Get quote data
      const { data: quote, error } = await supabase
        .from('quotes')
        .select('*, clients(*)')
        .eq('id', quoteId)
        .single();

      if (error || !quote) {
        throw new Error('Quote not found');
      }

      let result;
      switch (emailType) {
        case 'quote_reminder':
          result = await emailService.default.sendReminderEmail(quote, recipientEmail, 7);
          break;
        case 'quote_accepted':
          result = await emailService.default.sendAcceptanceConfirmation(quote, recipientEmail);
          break;
        default:
          result = await emailService.default.sendQuoteEmail(quote, recipientEmail, emailType, customMessage);
      }

      if (result.success) {
        // Log the activity in our email management system
        await this.logEmailActivity(userId, {
          quoteId,
          clientId: quote.client_id,
          type: emailType,
          status: 'sent',
          recipientEmail,
          subject: `Quote ${quote.quote_number}`,
          templateType: templateId || 'quote',
          details: {
            customMessage: customMessage || null,
            emailType,
          },
        });
      }

      return result;
    } catch (error) {
      Logger.error('Error integrating quote email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get email activity summary for business documents
   */
  async getBusinessEmailSummary(userId, options = {}) {
    try {
      const {
        dateFrom,
        dateTo,
        clientId,
        documentType,
      } = options;

      let query = supabase
        .from('email_activity')
        .select(`
          *,
          clients(full_name, company_name),
          invoices(invoice_number, total_amount),
          quotes(quote_number, total_amount)
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

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Calculate summary statistics
      const summary = {
        totalEmails: data.length,
        invoiceEmails: data.filter(item => item.invoice_id).length,
        quoteEmails: data.filter(item => item.quote_id).length,
        reminderEmails: data.filter(item => item.type.includes('reminder')).length,
        successfulSends: data.filter(item => item.status === 'sent').length,
        failedSends: data.filter(item => item.status === 'failed').length,
        uniqueClients: new Set(data.map(item => item.client_id).filter(Boolean)).size,
      };

      return {
        success: true,
        data: {
          activity: data || [],
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
   * EMAIL SYNCHRONIZATION
   */

  /**
   * Start email synchronization for user accounts
   */
  async startEmailSync(accountId, intervalMinutes = 5) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
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
      },
      {
        operation: 'start_email_sync',
        fallbackValue: { success: false, error: 'Failed to start email sync' }
      }
    );
  }

  /**
   * Stop email synchronization
   */
  stopEmailSync(accountId) {
    return emailErrorHandler.withErrorHandling(
      () => {
        if (this.syncIntervals.has(accountId)) {
          clearInterval(this.syncIntervals.get(accountId));
          this.syncIntervals.delete(accountId);
          Logger.info(`Email sync stopped for account: ${accountId}`);
          return { success: true };
        }
        return { success: false, error: 'No sync interval found' };
      },
      {
        operation: 'stop_email_sync',
        fallbackValue: { success: false, error: 'Failed to stop email sync' }
      }
    );
  }

  /**
   * Perform email synchronization
   */
  async syncEmails(accountId) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
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
      },
      {
        operation: 'sync_emails',
        fallbackValue: { success: false, error: 'Failed to sync emails' }
      }
    );
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
    return await emailErrorHandler.withErrorHandling(
      async () => {
        // This would fetch from a user email accounts table
        // For now, return empty array
        return {
          success: true,
          data: [],
        };
      },
      {
        operation: 'get_email_accounts',
        userId,
        fallbackValue: {
          success: false,
          error: 'Failed to get email accounts',
          data: [],
        }
      }
    );
  }

  /**
   * Get email statistics
   */
  async getEmailStats(userId) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        return await emailStorageService.getEmailStats(userId);
      },
      {
        operation: 'get_email_stats',
        userId,
        fallbackValue: {
          success: false,
          error: 'Failed to get email stats',
          data: {
            total: 0,
            unread: 0,
            starred: 0,
            byFolder: {},
          },
        }
      }
    );
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
   * EMAIL ANALYTICS AND REPORTING
   */

  /**
   * Get comprehensive email analytics dashboard
   */
  async getEmailAnalytics(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        return await emailAnalyticsService.getDashboardAnalytics(userId, options);
      },
      {
        operation: 'get_email_analytics',
        userId,
        fallbackValue: {
          success: false,
          error: 'Failed to get email analytics',
          data: emailAnalyticsService.getEmptyDashboardData(),
        }
      }
    );
  }

  /**
   * Get email performance metrics
   */
  async getEmailPerformanceMetrics(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        return await emailAnalyticsService.getPerformanceMetrics(userId, options);
      },
      {
        operation: 'get_email_performance_metrics',
        userId,
        fallbackValue: {
          success: false,
          error: 'Failed to get performance metrics',
        }
      }
    );
  }

  /**
   * Get client communication analytics
   */
  async getClientCommunicationAnalytics(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        return await emailAnalyticsService.getClientCommunicationMetrics(userId, options);
      },
      {
        operation: 'get_client_communication_analytics',
        userId,
        fallbackValue: {
          success: false,
          error: 'Failed to get client communication analytics',
        }
      }
    );
  }

  /**
   * Get email activity metrics
   */
  async getEmailActivityMetrics(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        return await emailAnalyticsService.getActivityMetrics(userId, options);
      },
      {
        operation: 'get_email_activity_metrics',
        userId,
        fallbackValue: {
          success: false,
          error: 'Failed to get activity metrics',
        }
      }
    );
  }

  /**
   * Generate comprehensive email report
   */
  async generateEmailReport(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        return await emailAnalyticsService.generateEmailReport(userId, options);
      },
      {
        operation: 'generate_email_report',
        userId,
        fallbackValue: {
          success: false,
          error: 'Failed to generate email report',
        }
      }
    );
  }

  /**
   * Get email usage reports
   */
  async getEmailUsageReports(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        return await emailAnalyticsService.getUsageReports(userId, options);
      },
      {
        operation: 'get_email_usage_reports',
        userId,
        fallbackValue: {
          success: false,
          error: 'Failed to get usage reports',
        }
      }
    );
  }

  /**
   * Get real-time email metrics
   */
  async getRealTimeEmailMetrics(userId) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        return await emailAnalyticsService.getRealTimeMetrics(userId);
      },
      {
        operation: 'get_real_time_email_metrics',
        userId,
        fallbackValue: {
          success: false,
          error: 'Failed to get real-time metrics',
        }
      }
    );
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

// Export an instance of the service
const emailManagementService = new EmailManagementService();
export default emailManagementService;