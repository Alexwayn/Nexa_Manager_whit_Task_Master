import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * Quote Approval Service
 * Handles quote approval workflow, status transitions, digital signatures, and tracking
 */
export class QuoteApprovalService {
  /**
   * Valid quote status transitions
   */
  static VALID_TRANSITIONS = {
    draft: ['sent', 'cancelled'],
    sent: ['viewed', 'accepted', 'rejected', 'expired', 'revision_requested'],
    viewed: ['accepted', 'rejected', 'expired', 'revision_requested'],
    accepted: ['converted', 'cancelled'],
    rejected: ['revision_requested', 'cancelled'],
    expired: ['sent', 'cancelled'],
    converted: [],
    cancelled: [],
    revision_requested: ['draft', 'sent'],
  };

  /**
   * Quote statuses that require client action
   */
  static CLIENT_ACTION_STATUSES = ['sent', 'viewed', 'revision_requested'];

  /**
   * Quote statuses that are final (no further transitions)
   */
  static FINAL_STATUSES = ['converted', 'cancelled'];

  /**
   * Update quote status with validation and history tracking
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @param {string} newStatus - New status to set
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Updated quote with status history
   */
  static async updateQuoteStatus(quoteId, userId, newStatus, options = {}) {
    try {
      const { notes, automated = false, clientData = null } = options;

      // Get current quote
      const { data: currentQuote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .eq('user_id', userId)
        .single();

      if (quoteError || !currentQuote) {
        throw new Error('Quote not found or access denied');
      }

      // Validate status transition
      const isValidTransition = this.validateStatusTransition(currentQuote.status, newStatus);
      if (!isValidTransition) {
        throw new Error(`Invalid status transition from ${currentQuote.status} to ${newStatus}`);
      }

      // Update quote status
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Add special handling for specific statuses
      if (newStatus === 'accepted' && clientData?.signature) {
        updateData.digital_signature = clientData.signature;
        updateData.signature_date = new Date().toISOString();
      }

      if (newStatus === 'sent' && !currentQuote.acceptance_deadline) {
        // Set default acceptance deadline (30 days from now)
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);
        updateData.acceptance_deadline = deadline.toISOString().split('T')[0];
      }

      const { data: updatedQuote, error: updateError } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quoteId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update quote status: ${updateError.message}`);
      }

      // Record status change in history
      await this.recordStatusChange(quoteId, currentQuote.status, newStatus, userId, {
        notes,
        automated,
      });

      // Track analytics event
      await this.trackQuoteEvent(quoteId, `status_changed_to_${newStatus}`, {
        previous_status: currentQuote.status,
        automated,
      });

      // Handle status-specific actions
      await this.handleStatusActions(updatedQuote, currentQuote.status, newStatus, userId);

      return updatedQuote;
    } catch (error) {
      Logger.error('QuoteApprovalService.updateQuoteStatus error:', error);
      throw error;
    }
  }

  /**
   * Validate if a status transition is allowed
   * @param {string} currentStatus - Current quote status
   * @param {string} newStatus - Desired new status
   * @returns {boolean} Whether transition is valid
   */
  static validateStatusTransition(currentStatus, newStatus) {
    if (!currentStatus || !newStatus) return false;
    if (currentStatus === newStatus) return true;

    const allowedTransitions = this.VALID_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Get available status transitions for a quote
   * @param {string} currentStatus - Current quote status
   * @returns {Array} Array of valid next statuses
   */
  static getAvailableTransitions(currentStatus) {
    return this.VALID_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Record status change in history table
   * @param {string} quoteId - Quote ID
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @param {string} userId - User ID making the change
   * @param {Object} options - Additional options
   */
  static async recordStatusChange(quoteId, oldStatus, newStatus, userId, options = {}) {
    try {
      const { notes, automated = false } = options;

      const { error } = await supabase.from('quote_status_history').insert([
        {
          quote_id: quoteId,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: userId,
          notes: notes || null,
          automated,
        },
      ]);

      if (error) {
        Logger.error('Failed to record status change:', error);
        // Don't throw error for history tracking failure
      }
    } catch (error) {
      Logger.error('QuoteApprovalService.recordStatusChange error:', error);
    }
  }

  /**
   * Handle actions specific to status changes
   * @param {Object} quote - Updated quote
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @param {string} userId - User ID
   */
  static async handleStatusActions(quote, oldStatus, newStatus, userId) {
    try {
      switch (newStatus) {
        case 'sent':
          await this.handleQuoteSent(quote, userId);
          break;
        case 'accepted':
          await this.handleQuoteAccepted(quote, userId);
          break;
        case 'rejected':
          await this.handleQuoteRejected(quote, userId);
          break;
        case 'expired':
          await this.handleQuoteExpired(quote, userId);
          break;
      }
    } catch (error) {
      Logger.error('QuoteApprovalService.handleStatusActions error:', error);
    }
  }

  /**
   * Handle quote sent actions
   */
  static async handleQuoteSent(quote, userId) {
    // Add system comment
    await this.addSystemComment(quote.id, 'Quote sent to client for review');

    // TODO: Send email notification to client
    // TODO: Schedule expiry reminder
  }

  /**
   * Handle quote accepted actions
   */
  static async handleQuoteAccepted(quote, userId) {
    // Add system comment
    await this.addSystemComment(quote.id, 'Quote accepted by client');

    // TODO: Send notification to user
    // TODO: Create approval record if needed
  }

  /**
   * Handle quote rejected actions
   */
  static async handleQuoteRejected(quote, userId) {
    // Add system comment
    await this.addSystemComment(quote.id, 'Quote rejected by client');

    // TODO: Send notification to user
  }

  /**
   * Handle quote expired actions
   */
  static async handleQuoteExpired(quote, userId) {
    // Add system comment
    await this.addSystemComment(quote.id, 'Quote expired automatically');

    // TODO: Send expiry notification
  }

  /**
   * Add a system-generated comment to a quote
   * @param {string} quoteId - Quote ID
   * @param {string} message - Comment message
   */
  static async addSystemComment(quoteId, message) {
    try {
      const { error } = await supabase.from('quote_comments').insert([
        {
          quote_id: quoteId,
          user_id: null, // System comment
          comment: message,
          is_internal: true,
          is_system_generated: true,
        },
      ]);

      if (error) {
        Logger.error('Failed to add system comment:', error);
      }
    } catch (error) {
      Logger.error('QuoteApprovalService.addSystemComment error:', error);
    }
  }

  /**
   * Track quote analytics event
   * @param {string} quoteId - Quote ID
   * @param {string} eventType - Type of event
   * @param {Object} metadata - Additional event data
   */
  static async trackQuoteEvent(quoteId, eventType, metadata = {}) {
    try {
      const { error } = await supabase.from('quote_analytics').insert([
        {
          quote_id: quoteId,
          event_type: eventType,
          tracked_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        Logger.error('Failed to track quote event:', error);
      }
    } catch (error) {
      Logger.error('QuoteApprovalService.trackQuoteEvent error:', error);
    }
  }

  /**
   * Get quote status history
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Status history records
   */
  static async getQuoteStatusHistory(quoteId, userId) {
    try {
      const { data, error } = await supabase
        .from('quote_status_history')
        .select(
          `
          *,
          changed_by_user:auth.users!changed_by(email)
        `,
        )
        .eq('quote_id', quoteId)
        .order('changed_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get status history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      Logger.error('QuoteApprovalService.getQuoteStatusHistory error:', error);
      throw error;
    }
  }

  /**
   * Capture and store digital signature
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @param {Object} signatureData - Signature data (base64, coordinates, etc.)
   * @param {Object} signerInfo - Information about the signer
   * @returns {Promise<Object>} Updated quote
   */
  static async captureDigitalSignature(quoteId, userId, signatureData, signerInfo = {}) {
    try {
      const signatureRecord = {
        signature: signatureData.signature, // base64 image
        signer_name: signerInfo.name || 'Client',
        signer_email: signerInfo.email,
        signer_ip: signerInfo.ip,
        signed_at: new Date().toISOString(),
        signature_method: signatureData.method || 'digital_pad',
      };

      const { data: updatedQuote, error } = await supabase
        .from('quotes')
        .update({
          digital_signature: signatureRecord,
          signature_date: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save signature: ${error.message}`);
      }

      // Track signature event
      await this.trackQuoteEvent(quoteId, 'signature_captured', {
        signer_name: signerInfo.name,
        signature_method: signatureData.method,
      });

      // Add system comment
      await this.addSystemComment(
        quoteId,
        `Digital signature captured from ${signerInfo.name || 'client'}`,
      );

      return updatedQuote;
    } catch (error) {
      Logger.error('QuoteApprovalService.captureDigitalSignature error:', error);
      throw error;
    }
  }

  /**
   * Generate public approval link for client
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @returns {Promise<string>} Public approval URL
   */
  static async generateApprovalLink(quoteId, userId) {
    try {
      // Generate a secure token for the quote
      const token = btoa(
        JSON.stringify({
          quoteId,
          userId,
          timestamp: Date.now(),
          // Add some randomness for security
          nonce: Math.random().toString(36).substring(7),
        }),
      );

      // Return the client approval URL
      const baseUrl = window.location.origin;
      return `${baseUrl}/quote-approval/${token}`;
    } catch (error) {
      Logger.error('QuoteApprovalService.generateApprovalLink error:', error);
      throw error;
    }
  }

  /**
   * Check and automatically expire quotes
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of expired quote IDs
   */
  static async checkAndExpireQuotes(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Find quotes that should be expired
      const { data: expiredQuotes, error } = await supabase
        .from('quotes')
        .select('id, status, acceptance_deadline')
        .eq('user_id', userId)
        .in('status', ['sent', 'viewed'])
        .lte('acceptance_deadline', today);

      if (error) {
        throw new Error(`Failed to check for expired quotes: ${error.message}`);
      }

      const expiredIds = [];

      // Update each expired quote
      for (const quote of expiredQuotes || []) {
        try {
          await this.updateQuoteStatus(quote.id, userId, 'expired', {
            automated: true,
            notes: 'Automatically expired due to acceptance deadline',
          });
          expiredIds.push(quote.id);
        } catch (error) {
          Logger.error(`Failed to expire quote ${quote.id}:`, error);
        }
      }

      return expiredIds;
    } catch (error) {
      Logger.error('QuoteApprovalService.checkAndExpireQuotes error:', error);
      throw error;
    }
  }

  /**
   * Get quote analytics and tracking data
   * @param {string} quoteId - Quote ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Analytics events
   */
  static async getQuoteAnalytics(quoteId, userId) {
    try {
      const { data, error } = await supabase
        .from('quote_analytics')
        .select('*')
        .eq('quote_id', quoteId)
        .order('tracked_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get quote analytics: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      Logger.error('QuoteApprovalService.getQuoteAnalytics error:', error);
      throw error;
    }
  }
}

// Default export for compatibility
export default QuoteApprovalService;
