/**
 * Invoice Service
 * Handles invoice-related operations
 */

import { supabaseClient } from './supabaseClient';
import logger from '@/utils/Logger';

export class InvoiceService {
  /**
   * Get invoice by ID
   * @param {string} invoiceId - Invoice ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Invoice data
   */
  static async getInvoice(invoiceId, userId) {
    try {
      const { data, error } = await supabaseClient
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            full_name,
            email,
            company_name
          )
        `)
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('Failed to get invoice:', error);
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
      logger.error('Error getting invoice:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new invoice
   * @param {string} userId - User ID
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} Created invoice
   */
  static async createInvoice(userId, invoiceData) {
    try {
      const invoiceRecord = {
        user_id: userId,
        client_id: invoiceData.clientId,
        invoice_number: invoiceData.invoiceNumber,
        issue_date: invoiceData.issueDate,
        due_date: invoiceData.dueDate,
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.taxAmount,
        total_amount: invoiceData.totalAmount,
        status: invoiceData.status || 'draft',
        notes: invoiceData.notes,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('invoices')
        .insert([invoiceRecord])
        .select()
        .single();

      if (error) {
        logger.error('Failed to create invoice:', error);
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
      logger.error('Error creating invoice:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update invoice status
   * @param {string} invoiceId - Invoice ID
   * @param {string} userId - User ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated invoice
   */
  static async updateInvoiceStatus(invoiceId, userId, status) {
    try {
      const { data, error } = await supabaseClient
        .from('invoices')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update invoice status:', error);
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
      logger.error('Error updating invoice status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get invoices for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Invoices list
   */
  static async getInvoices(userId, options = {}) {
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
        .from('invoices')
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
        logger.error('Failed to get invoices:', error);
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
      logger.error('Error getting invoices:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Delete an invoice
   * @param {string} invoiceId - Invoice ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteInvoice(invoiceId, userId) {
    try {
      const { error } = await supabaseClient
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to delete invoice:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      logger.error('Error deleting invoice:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate invoice PDF
   * @param {string} invoiceId - Invoice ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} PDF generation result
   */
  static async generateInvoicePDF(invoiceId, userId) {
    try {
      // Mock PDF generation for testing
      if (process.env.NODE_ENV === 'test') {
        return {
          success: true,
          pdfUrl: `https://example.com/invoices/${invoiceId}.pdf`,
          pdfBuffer: Buffer.from('mock-pdf-content')
        };
      }

      // In a real implementation, you would use a PDF generation library
      const pdfUrl = `https://example.com/invoices/${invoiceId}.pdf`;
      
      return {
        success: true,
        pdfUrl,
        pdfBuffer: Buffer.from('mock-pdf-content')
      };
    } catch (error) {
      logger.error('Error generating invoice PDF:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
