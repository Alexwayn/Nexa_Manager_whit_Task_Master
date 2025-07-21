import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * Quote Management Service
 * Handles all quote-related operations including CRUD operations,
 * status management, conversion to invoices, and analytics
 */
export class QuoteService {
  /**
   * Get all quotes for a user with optional filters
   * @param {string} userId - User ID
   * @param {Object} options - Filter options (status, clientId, dateFrom, dateTo, search, limit, offset)
   * @returns {Promise<Array>} Array of quotes with client and item details
   */
  static async getQuotes(userId, options = {}) {
    try {
      let query = supabase
        .from('quotes')
        .select(
          `
          id,
          quote_number,
          issue_date,
          due_date,
          status,
          subtotal,
          tax_amount,
          total_amount,
          notes,
          created_at,
          updated_at,
          client_id,
          clients (
            id,
            full_name,
            email,
            phone,
            city
          ),
          quote_items (
            id,
            description,
            quantity,
            unit_price,
            tax_rate,
            amount
          )
        `,
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }

      // Apply client filter
      if (options.clientId) {
        query = query.eq('client_id', options.clientId);
      }

      // Apply date range filters
      if (options.dateFrom) {
        query = query.gte('issue_date', options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte('issue_date', options.dateTo);
      }

      // Apply search filter
      if (options.search) {
        query = query.or(`quote_number.ilike.%${options.search}%,notes.ilike.%${options.search}%`);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        Logger.error('Error fetching quotes:', error);
        throw new Error(`Unable to retrieve quotes: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      Logger.error('QuoteService.getQuotes error:', error);
      throw error;
    }
  }

  /**
   * Get a single quote by ID with full details
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Quote with client and items details
   */
  static async getQuoteById(quoteId, userId) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(
          `
          *,
          clients (
            id,
            full_name,
            email,
            phone,
            address,
            city,
            province,
            postal_code,
            vat_number,
            fiscal_code
          ),
          quote_items (
            id,
            description,
            quantity,
            unit_price,
            tax_rate,
            amount
          )
        `,
        )
        .eq('id', quoteId)
        .eq('user_id', userId)
        .single();

      if (error) {
        Logger.error('Error fetching quote:', error);
        throw new Error(`Unable to retrieve quote: ${error.message}`);
      }

      return data;
    } catch (error) {
      Logger.error('QuoteService.getQuoteById error:', error);
      throw error;
    }
  }

  /**
   * Create a new quote with items
   * @param {string} userId - User ID
   * @param {Object} quoteData - Quote data including items
   * @returns {Promise<Object>} Created quote with full details
   */
  static async createQuote(userId, quoteData) {
    try {
      // Create the quote record first
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert([
          {
            user_id: userId,
            client_id: quoteData.clientId,
            quote_number: quoteData.quoteNumber,
            issue_date: quoteData.issueDate,
            due_date: quoteData.dueDate,
            status: quoteData.status || 'draft',
            subtotal: quoteData.subtotal || 0,
            tax_amount: quoteData.taxAmount || 0,
            total_amount: quoteData.totalAmount || 0,
            notes: quoteData.notes || '',
            appointment_id: quoteData.appointmentId || null,
          },
        ])
        .select()
        .single();

      if (quoteError) {
        Logger.error('Error creating quote:', quoteError);
        throw new Error(`Unable to create quote: ${quoteError.message}`);
      }

      // Create quote items if provided
      if (quoteData.items && quoteData.items.length > 0) {
        const quoteItems = quoteData.items.map(item => ({
          quote_id: quote.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate || 0,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase.from('quote_items').insert(quoteItems);

        if (itemsError) {
          // Rollback: delete the quote if items creation fails
          await supabase.from('quotes').delete().eq('id', quote.id);
          Logger.error('Error creating quote items:', itemsError);
          throw new Error(`Unable to create quote items: ${itemsError.message}`);
        }
      }

      // Return the complete quote with items
      return await this.getQuoteById(quote.id, userId);
    } catch (error) {
      Logger.error('QuoteService.createQuote error:', error);
      throw error;
    }
  }

  /**
   * Update an existing quote and its items
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @param {Object} quoteData - Updated quote data
   * @returns {Promise<Object>} Updated quote with full details
   */
  static async updateQuote(quoteId, userId, quoteData) {
    try {
      // Update the quote record
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .update({
          client_id: quoteData.clientId,
          quote_number: quoteData.quoteNumber,
          issue_date: quoteData.issueDate,
          due_date: quoteData.dueDate,
          status: quoteData.status,
          subtotal: quoteData.subtotal,
          tax_amount: quoteData.taxAmount,
          total_amount: quoteData.totalAmount,
          notes: quoteData.notes,
          appointment_id: quoteData.appointmentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .eq('user_id', userId)
        .select()
        .single();

      if (quoteError) {
        Logger.error('Error updating quote:', quoteError);
        throw new Error(`Unable to update quote: ${quoteError.message}`);
      }

      // Handle quote items update if provided
      if (quoteData.items) {
        // Delete existing items
        const { error: deleteError } = await supabase
          .from('quote_items')
          .delete()
          .eq('quote_id', quoteId);

        if (deleteError) {
          Logger.error('Error deleting quote items:', deleteError);
          throw new Error(`Unable to delete existing quote items: ${deleteError.message}`);
        }

        // Insert new items
        if (quoteData.items.length > 0) {
          const quoteItems = quoteData.items.map(item => ({
            quote_id: quoteId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            tax_rate: item.taxRate || 0,
            amount: item.amount,
          }));

          const { error: itemsError } = await supabase.from('quote_items').insert(quoteItems);

          if (itemsError) {
            Logger.error('Error creating updated quote items:', itemsError);
            throw new Error(`Unable to create updated quote items: ${itemsError.message}`);
          }
        }
      }

      // Return the updated quote with items
      return await this.getQuoteById(quoteId, userId);
    } catch (error) {
      Logger.error('QuoteService.updateQuote error:', error);
      throw error;
    }
  }

  /**
   * Delete a quote and its items
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Success confirmation
   */
  static async deleteQuote(quoteId, userId) {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId)
        .eq('user_id', userId);

      if (error) {
        Logger.error('Error deleting quote:', error);
        throw new Error(`Unable to delete quote: ${error.message}`);
      }

      return { success: true, message: 'Quote deleted successfully' };
    } catch (error) {
      Logger.error('QuoteService.deleteQuote error:', error);
      throw error;
    }
  }

  /**
   * Update quote status
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @param {string} newStatus - New status value
   * @returns {Promise<Object>} Updated quote
   */
  static async updateQuoteStatus(quoteId, userId, newStatus) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        Logger.error('Error updating quote status:', error);
        throw new Error(`Unable to update quote status: ${error.message}`);
      }

      return data;
    } catch (error) {
      Logger.error('QuoteService.updateQuoteStatus error:', error);
      throw error;
    }
  }

  /**
   * Duplicate an existing quote with new quote number
   * @param {string} quoteId - Quote ID to duplicate
   * @param {string} userId - User ID
   * @returns {Promise<Object>} New duplicated quote
   */
  static async duplicateQuote(quoteId, userId) {
    try {
      // Get original quote with items
      const originalQuote = await this.getQuoteById(quoteId, userId);

      if (!originalQuote) {
        throw new Error('Quote not found or access denied');
      }

      // Generate new quote number
      const newQuoteNumber = await this.generateQuoteNumber(userId);

      // Create new quote data based on original
      const newQuoteData = {
        clientId: originalQuote.client_id,
        quoteNumber: newQuoteNumber,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: originalQuote.due_date,
        status: 'draft',
        subtotal: originalQuote.subtotal,
        taxAmount: originalQuote.tax_amount,
        totalAmount: originalQuote.total_amount,
        notes: originalQuote.notes,
        items: originalQuote.quote_items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          taxRate: item.tax_rate,
          amount: item.amount,
        })),
      };

      return await this.createQuote(userId, newQuoteData);
    } catch (error) {
      Logger.error('QuoteService.duplicateQuote error:', error);
      throw error;
    }
  }

  /**
   * Convert an accepted quote to an invoice
   * @param {string} quoteId - Quote ID to convert
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created invoice
   */
  static async convertToInvoice(quoteId, userId) {
    try {
      const quote = await this.getQuoteById(quoteId, userId);

      if (!quote) {
        throw new Error('Quote not found or access denied');
      }

      if (quote.status !== 'accepted') {
        throw new Error('Only accepted quotes can be converted to invoices');
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(userId);

      // Create invoice data from quote
      const invoiceData = {
        user_id: userId,
        client_id: quote.client_id,
        invoice_number: invoiceNumber,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: quote.due_date,
        status: 'pending',
        subtotal: quote.subtotal,
        tax_amount: quote.tax_amount,
        total_amount: quote.total_amount,
        notes: quote.notes,
        quote_id: quote.id,
      };

      // Create invoice record
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) {
        Logger.error('Error creating invoice:', invoiceError);
        throw new Error(`Unable to create invoice: ${invoiceError.message}`);
      }

      // Create invoice items from quote items
      if (quote.quote_items && quote.quote_items.length > 0) {
        const invoiceItems = quote.quote_items.map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);

        if (itemsError) {
          // Rollback: delete the invoice if items creation fails
          await supabase.from('invoices').delete().eq('id', invoice.id);
          Logger.error('Error creating invoice items:', itemsError);
          throw new Error(`Unable to create invoice items: ${itemsError.message}`);
        }
      }

      // Update quote status to converted
      await this.updateQuoteStatus(quoteId, userId, 'converted');

      return invoice;
    } catch (error) {
      Logger.error('QuoteService.convertToInvoice error:', error);
      throw error;
    }
  }

  /**
   * Generate unique quote number for the current year
   * @param {string} userId - User ID
   * @returns {Promise<string>} Generated quote number
   */
  static async generateQuoteNumber(userId) {
    try {
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('quotes')
        .select('quote_number')
        .eq('user_id', userId)
        .like('quote_number', `QUO${currentYear}%`)
        .order('quote_number', { ascending: false })
        .limit(1);

      if (error) {
        Logger.error('Error generating quote number:', error);
        return `QUO${currentYear}001`;
      }

      if (data && data.length > 0) {
        const lastNumber = data[0].quote_number;
        const numberPart = parseInt(lastNumber.replace(`QUO${currentYear}`, ''));
        const nextNumber = (numberPart + 1).toString().padStart(3, '0');
        return `QUO${currentYear}${nextNumber}`;
      }

      return `QUO${currentYear}001`;
    } catch (error) {
      Logger.error('QuoteService.generateQuoteNumber error:', error);
      return `QUO${new Date().getFullYear()}001`;
    }
  }

  /**
   * Generate unique invoice number for the current year
   * @param {string} userId - User ID
   * @returns {Promise<string>} Generated invoice number
   */
  static async generateInvoiceNumber(userId) {
    try {
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('user_id', userId)
        .like('invoice_number', `INV${currentYear}%`)
        .order('invoice_number', { ascending: false })
        .limit(1);

      if (error) {
        Logger.error('Error generating invoice number:', error);
        return `INV${currentYear}001`;
      }

      if (data && data.length > 0) {
        const lastNumber = data[0].invoice_number;
        const numberPart = parseInt(lastNumber.replace(`INV${currentYear}`, ''));
        const nextNumber = (numberPart + 1).toString().padStart(3, '0');
        return `INV${currentYear}${nextNumber}`;
      }

      return `INV${currentYear}001`;
    } catch (error) {
      Logger.error('QuoteService.generateInvoiceNumber error:', error);
      return `INV${new Date().getFullYear()}001`;
    }
  }

  /**
   * Get comprehensive quote statistics for analytics
   * @param {string} userId - User ID
   * @param {Object} options - Date filter options
   * @returns {Promise<Object>} Quote statistics and metrics
   */
  static async getQuoteStatistics(userId, options = {}) {
    try {
      let query = supabase
        .from('quotes')
        .select('status, total_amount, issue_date')
        .eq('user_id', userId);

      // Apply date filters if provided
      if (options.dateFrom) {
        query = query.gte('issue_date', options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte('issue_date', options.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        Logger.error('Error fetching quote statistics:', error);
        throw new Error(`Unable to retrieve quote statistics: ${error.message}`);
      }

      // Calculate comprehensive statistics
      const stats = {
        total: data.length,
        draft: data.filter(q => q.status === 'draft').length,
        sent: data.filter(q => q.status === 'sent').length,
        accepted: data.filter(q => q.status === 'accepted').length,
        rejected: data.filter(q => q.status === 'rejected').length,
        converted: data.filter(q => q.status === 'converted').length,
        expired: data.filter(q => q.status === 'expired').length,
        totalValue: data.reduce((sum, q) => sum + (q.total_amount || 0), 0),
        acceptedValue: data
          .filter(q => q.status === 'accepted')
          .reduce((sum, q) => sum + (q.total_amount || 0), 0),
        conversionRate:
          data.length > 0
            ? (data.filter(q => ['accepted', 'converted'].includes(q.status)).length /
                data.length) *
              100
            : 0,
      };

      return stats;
    } catch (error) {
      Logger.error('QuoteService.getQuoteStatistics error:', error);
      throw error;
    }
  }

  /**
   * Search quotes by number or notes
   * @param {string} userId - User ID
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Matching quotes
   */
  static async searchQuotes(userId, searchTerm, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(
          `
          id,
          quote_number,
          issue_date,
          status,
          total_amount,
          clients (
            id,
            full_name,
            email
          )
        `,
        )
        .eq('user_id', userId)
        .or(`quote_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        Logger.error('Error searching quotes:', error);
        throw new Error(`Unable to search quotes: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      Logger.error('QuoteService.searchQuotes error:', error);
      throw error;
    }
  }

  /**
   * Validate quote data before creation or update
   * @param {Object} quoteData - Quote data to validate
   * @returns {Array} Array of validation error messages
   */
  static validateQuoteData(quoteData) {
    const errors = [];

    if (!quoteData.clientId) {
      errors.push('Client selection is required');
    }

    if (!quoteData.quoteNumber) {
      errors.push('Quote number is required');
    }

    if (!quoteData.issueDate) {
      errors.push('Issue date is required');
    }

    if (!quoteData.items || quoteData.items.length === 0) {
      errors.push('At least one item is required');
    }

    if (quoteData.items) {
      quoteData.items.forEach((item, index) => {
        if (!item.description) {
          errors.push(`Item ${index + 1}: Description is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }
        if (!item.unitPrice || item.unitPrice <= 0) {
          errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
        }
      });
    }

    return errors;
  }

  /**
   * Calculate quote totals from items
   * @param {Array} items - Array of quote items
   * @returns {Object} Calculated subtotal, tax amount, and total
   */
  static calculateQuoteTotals(items) {
    if (!items || items.length === 0) {
      return { subtotal: 0, taxAmount: 0, totalAmount: 0 };
    }

    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const itemAmount = item.quantity * item.unitPrice;
      const itemTax = itemAmount * (item.taxRate / 100);

      subtotal += itemAmount;
      taxAmount += itemTax;
    });

    const totalAmount = subtotal + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }
  /**
   * Send quote email using business email integration
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @param {Object} emailOptions - Email sending options
   * @returns {Promise<Object>} Email sending result
   */
  static async sendQuoteEmail(quoteId, userId, emailOptions = {}) {
    try {
      // Get quote data
      const quote = await this.getQuoteById(quoteId, userId);
      if (!quote) {
        throw new Error('Quote not found');
      }

      const recipientEmail = emailOptions.to || quote.clients?.email;
      if (!recipientEmail) {
        throw new Error('No recipient email address provided');
      }

      // Use business email integration
      const businessEmailIntegration = await import('./businessEmailIntegration.js');
      const emailResult = await businessEmailIntegration.default.sendQuoteEmail(
        userId,
        quoteId,
        recipientEmail,
        {
          templateId: emailOptions.template || 'quote',
          customMessage: emailOptions.customMessage,
          emailType: emailOptions.emailType || 'quote_sent',
          useNewSystem: emailOptions.useNewSystem !== false,
        }
      );

      if (emailResult.success) {
        // Update quote status to 'sent'
        await this.updateQuoteStatus(quoteId, 'sent', userId);
      }

      return {
        success: emailResult.success,
        quote: quote,
        emailResult: emailResult,
        message: emailResult.success 
          ? 'Quote sent successfully'
          : `Quote email failed: ${emailResult.error}`,
      };
    } catch (error) {
      Logger.error('QuoteService.sendQuoteEmail error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update quote status
   * @param {string} quoteId - Quote ID
   * @param {string} status - New status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated quote
   */
  static async updateQuoteStatus(quoteId, status, userId) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .update({ 
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update quote status: ${error.message}`);
      }

      return data;
    } catch (error) {
      Logger.error('QuoteService.updateQuoteStatus error:', error);
      throw error;
    }
  }

  /**
   * Send quote reminder email
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @param {Object} reminderOptions - Reminder options
   * @returns {Promise<Object>} Email sending result
   */
  static async sendQuoteReminder(quoteId, userId, reminderOptions = {}) {
    try {
      const quote = await this.getQuoteById(quoteId, userId);
      if (!quote) {
        throw new Error('Quote not found');
      }

      const recipientEmail = reminderOptions.to || quote.client?.email;
      if (!recipientEmail) {
        throw new Error('No recipient email address provided');
      }

      const businessEmailIntegration = await import('./businessEmailIntegration.js');
      const emailResult = await businessEmailIntegration.default.sendQuoteEmail(
        userId,
        quoteId,
        recipientEmail,
        {
          templateId: reminderOptions.template || 'quote_reminder',
          customMessage: reminderOptions.customMessage,
          emailType: 'quote_reminder',
          useNewSystem: true,
        }
      );

      return {
        success: emailResult.success,
        quote: quote,
        emailResult: emailResult,
        message: emailResult.success 
          ? 'Quote reminder sent successfully'
          : `Quote reminder failed: ${emailResult.error}`,
      };
    } catch (error) {
      Logger.error('QuoteService.sendQuoteReminder error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default QuoteService;

  /**
   * Get quote email history
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Email history for the quote
   */
  static async getQuoteEmailHistory(quoteId, userId) {
    try {
      // Verify quote exists and user has access
      const quote = await this.getQuoteById(quoteId, userId);
      if (!quote) {
        throw new Error('Quote not found');
      }

      // Get email history from business email logger
      const businessEmailLogger = await import('./businessEmailLogger.js');
      const historyResult = await businessEmailLogger.default.getDocumentEmailHistory(
        userId, 
        'quote', 
        quoteId
      );

      return {
        success: historyResult.success,
        quote: quote,
        emailHistory: historyResult.data || [],
        message: historyResult.success 
          ? 'Email history retrieved successfully'
          : `Failed to get email history: ${historyResult.error}`,
      };
    } catch (error) {
      Logger.error('QuoteService.getQuoteEmailHistory error:', error);
      return {
        success: false,
        error: error.message,
        emailHistory: [],
      };
    }
  }

  /**
   * Get client quote communication summary
   * @param {string} clientId - Client ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Quote communication summary for client
   */
  static async getClientQuoteCommunicationSummary(clientId, userId) {
    try {
      // Get client's quotes
      const quotes = await this.getQuotes(userId, { clientId });

      // Get email activity for this client's quotes
      const clientEmailService = await import('./clientEmailService.js');
      const emailHistory = await clientEmailService.default.getClientEmailHistory(
        userId, 
        clientId, 
        { type: ['quote_sent', 'quote_reminder', 'quote_accepted', 'quote_rejected'] }
      );

      return {
        success: true,
        data: {
          quotes: quotes || [],
          emailHistory: emailHistory.success ? emailHistory.data : [],
          summary: {
            totalQuotes: quotes?.length || 0,
            totalEmails: emailHistory.success ? emailHistory.total : 0,
            recentActivity: emailHistory.success ? emailHistory.data.slice(0, 5) : [],
          },
        },
      };
    } catch (error) {
      Logger.error('QuoteService.getClientQuoteCommunicationSummary error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}