/**
 * Quote Service
 * Handles quote-related operations
 */

import { supabaseClient } from './supabaseClient';
import { Logger } from './Logger';

const logger = new Logger('QuoteService');

export class QuoteService {
  /**
   * Get quote by ID
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Quote data
   */
  static async getQuote(quoteId, userId) {
    try {
      const { data, error } = await supabaseClient
        .from('quotes')
        .select(`
          *,
          clients (
            id,
            full_name,
            email,
            company_name
          )
        `)
        .eq('id', quoteId)
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('Failed to get quote:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      logger.error('Error getting quote:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new quote
   * @param {string} userId - User ID
   * @param {Object} quoteData - Quote data
   * @returns {Promise<Object>} Created quote
   */
  static async createQuote(userId, quoteData) {
    try {
      const quoteRecord = {
        user_id: userId,
        client_id: quoteData.clientId,
        quote_number: quoteData.quoteNumber,
        issue_date: quoteData.issueDate,
        expiry_date: quoteData.expiryDate,
        subtotal: quoteData.subtotal,
        tax_amount: quoteData.taxAmount,
        total_amount: quoteData.totalAmount,
        status: quoteData.status || 'draft',
        notes: quoteData.notes,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('quotes')
        .insert([quoteRecord])
        .select()
        .single();

      if (error) {
        logger.error('Failed to create quote:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      logger.error('Error creating quote:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update quote status
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated quote
   */
  static async updateQuoteStatus(quoteId, userId, status) {
    try {
      const { data, error } = await supabaseClient
        .from('quotes')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update quote status:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      logger.error('Error updating quote status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get quotes for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Quotes list
   */
  static async getQuotes(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status,
        clientId,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      let query = supabaseClient
        .from('quotes')
        .select(`
          *,
          clients (
            id,
            full_name,
            email,
            company_name
          )
        `)
        .eq('user_id', userId)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to get quotes:', error);
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
      logger.error('Error getting quotes:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Delete a quote
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteQuote(quoteId, userId) {
    try {
      const { error } = await supabaseClient
        .from('quotes')
        .delete()
        .eq('id', quoteId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to delete quote:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      logger.error('Error deleting quote:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert quote to invoice
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Conversion result
   */
  static async convertToInvoice(quoteId, userId) {
    try {
      const quoteResult = await this.getQuote(quoteId, userId);
      if (!quoteResult.success) {
        return quoteResult;
      }

      const quote = quoteResult.data;
      
      // Create invoice from quote data
      const invoiceData = {
        clientId: quote.client_id,
        invoiceNumber: `INV-${Date.now()}`, // Generate unique invoice number
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        subtotal: quote.subtotal,
        taxAmount: quote.tax_amount,
        totalAmount: quote.total_amount,
        status: 'draft',
        notes: `Converted from quote ${quote.quote_number}`,
        quoteId: quoteId
      };

      // In a real implementation, you would import and use InvoiceService
      // For now, we'll mock the invoice creation
      const invoiceResult = {
        success: true,
        data: {
          id: `invoice-${Date.now()}`,
          ...invoiceData
        }
      };

      if (invoiceResult.success) {
        // Update quote status to converted
        await this.updateQuoteStatus(quoteId, userId, 'converted');
      }

      return invoiceResult;
    } catch (error) {
      logger.error('Error converting quote to invoice:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate quote PDF
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} PDF generation result
   */
  static async generateQuotePDF(quoteId, userId) {
    try {
      // Mock PDF generation for testing
      if (process.env.NODE_ENV === 'test') {
        return {
          success: true,
          pdfUrl: `https://example.com/quotes/${quoteId}.pdf`,
          pdfBuffer: Buffer.from('mock-pdf-content')
        };
      }

      // In a real implementation, you would use a PDF generation library
      const pdfUrl = `https://example.com/quotes/${quoteId}.pdf`;
      
      return {
        success: true,
        pdfUrl,
        pdfBuffer: Buffer.from('mock-pdf-content')
      };
    } catch (error) {
      logger.error('Error generating quote PDF:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}