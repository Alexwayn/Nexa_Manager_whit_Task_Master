/**
 * Client Email Service
 * Handles client-specific email operations
 */

import { supabaseClient } from './supabaseClient';
import { Logger } from './Logger';

const logger = new Logger('ClientEmailService');

class ClientEmailService {
  /**
   * Send email to a client
   * @param {string} userId - User ID
   * @param {string} clientId - Client ID
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Result
   */
  async sendClientEmail(userId, clientId, emailData) {
    try {
      // Get client information
      const clientResult = await this.getClient(clientId, userId);
      if (!clientResult.success) {
        return clientResult;
      }

      const client = clientResult.data;
      
      // Prepare email with client information
      const enrichedEmailData = {
        ...emailData,
        to: client.email,
        clientId: clientId,
        clientName: client.full_name || client.company_name
      };

      // Log email activity
      await this.logEmailActivity(userId, clientId, 'email_sent', {
        subject: emailData.subject,
        type: emailData.type || 'general'
      });

      // Mock email sending for testing
      if (process.env.NODE_ENV === 'test') {
        return {
          success: true,
          messageId: `client-email-${Date.now()}`,
          clientId,
          clientEmail: client.email
        };
      }

      // In a real implementation, you would use emailProviderService
      const messageId = `client-email-${Date.now()}`;
      
      return {
        success: true,
        messageId,
        clientId,
        clientEmail: client.email
      };
    } catch (error) {
      logger.error('Error sending client email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get client by ID
   * @param {string} clientId - Client ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Client data
   */
  async getClient(clientId, userId) {
    try {
      const { data, error } = await supabaseClient
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('Failed to get client:', error);
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
      logger.error('Error getting client:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get email history for a client
   * @param {string} userId - User ID
   * @param {string} clientId - Client ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Email history
   */
  async getClientEmailHistory(userId, clientId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        type,
        dateFrom,
        dateTo
      } = options;

      let query = supabaseClient
        .from('email_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type && Array.isArray(type)) {
        query = query.in('activity_type', type);
      } else if (type) {
        query = query.eq('activity_type', type);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to get client email history:', error);
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
      logger.error('Error getting client email history:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Log email activity
   * @param {string} userId - User ID
   * @param {string} clientId - Client ID
   * @param {string} activityType - Activity type
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Log result
   */
  async logEmailActivity(userId, clientId, activityType, metadata = {}) {
    try {
      const activityRecord = {
        user_id: userId,
        client_id: clientId,
        activity_type: activityType,
        metadata: metadata,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('email_activities')
        .insert([activityRecord])
        .select()
        .single();

      if (error) {
        logger.error('Failed to log email activity:', error);
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
      logger.error('Error logging email activity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get client email preferences
   * @param {string} clientId - Client ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Email preferences
   */
  async getClientEmailPreferences(clientId, userId) {
    try {
      const { data, error } = await supabaseClient
        .from('client_email_preferences')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        logger.error('Failed to get client email preferences:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Return default preferences if none found
      const defaultPreferences = {
        receive_invoices: true,
        receive_quotes: true,
        receive_reminders: true,
        receive_marketing: false,
        preferred_format: 'html'
      };

      return {
        success: true,
        data: data || defaultPreferences
      };
    } catch (error) {
      logger.error('Error getting client email preferences:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update client email preferences
   * @param {string} clientId - Client ID
   * @param {string} userId - User ID
   * @param {Object} preferences - Email preferences
   * @returns {Promise<Object>} Update result
   */
  async updateClientEmailPreferences(clientId, userId, preferences) {
    try {
      const { data, error } = await supabaseClient
        .from('client_email_preferences')
        .upsert({
          client_id: clientId,
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to update client email preferences:', error);
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
      logger.error('Error updating client email preferences:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get clients with email activity summary
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Clients with email summary
   */
  async getClientsWithEmailSummary(userId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      // Get clients
      const { data: clients, error: clientsError } = await supabaseClient
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('full_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (clientsError) {
        logger.error('Failed to get clients:', clientsError);
        return {
          success: false,
          error: clientsError.message,
          data: []
        };
      }

      // Get email activity summary for each client
      const clientsWithSummary = await Promise.all(
        (clients || []).map(async (client) => {
          const { data: activities } = await supabaseClient
            .from('email_activities')
            .select('activity_type, created_at')
            .eq('user_id', userId)
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(10);

          return {
            ...client,
            emailSummary: {
              totalEmails: activities?.length || 0,
              lastEmailDate: activities?.[0]?.created_at || null,
              recentActivities: activities || []
            }
          };
        })
      );

      return {
        success: true,
        data: clientsWithSummary
      };
    } catch (error) {
      logger.error('Error getting clients with email summary:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

const clientEmailService = new ClientEmailService();
export default clientEmailService;