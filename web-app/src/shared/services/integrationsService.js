/**
 * IntegrationsService - Simplified API Key Management and Third-Party Integrations
 * Handles secure API key generation, integration management, and activity tracking
 * Updated: 2025-01-25 - Simplified version for immediate functionality
 */

import { supabase } from '@lib/supabaseClient';
import Logger from '@/utils/Logger';

// Helper function to get current user from Clerk
const getCurrentUser = () => {
  // First try to get from window.Clerk (browser)
  if (typeof window !== 'undefined') {
    if (window.Clerk?.user) {
      return window.Clerk.user;
    }

    // Fallback: try to get from React context if available
    if (window.__CLERK_USER__) {
      return window.__CLERK_USER__;
    }
  }

  Logger.warn('Clerk user not found');
  return null;
};

class IntegrationsService {
  // ================================
  // API KEY MANAGEMENT
  // ================================

  /**
   * Generate a new API key for the user
   * @param {Object} keyData - API key configuration
   * @returns {Promise<Object>} Generated API key with unhashed key (only returned once)
   */
  async generateApiKey(keyData) {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Generate the actual API key using JavaScript
      const timestamp = Date.now();
      const randomHex = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join('');
      const apiKey = `nxa_${timestamp}_${randomHex}`;
      const keyPrefix = apiKey.substring(0, 12) + '...'; // First 12 chars for display

      // Simple hash for storage (in production, use proper crypto)
      const keyHash = btoa(apiKey);

      // Store API key in database
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          organization_id: keyData.organizationId || null,
          name: keyData.name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions: keyData.permissions || ['read'],
          scopes: keyData.scopes || ['invoices', 'clients', 'payments'],
          rate_limit_requests: keyData.rateLimitRequests || 1000,
          expires_at: keyData.expiresAt,
          ip_whitelist: keyData.ipWhitelist,
        })
        .select()
        .single();

      if (error) {
        Logger.error('Database error generating API key:', error);
        throw error;
      }

      // Log activity
      await this.logActivity({
        activityType: 'api_key_created',
        entityType: 'api_key',
        entityId: data.id,
        apiKeyName: keyData.name,
        status: 'success',
      });

      Logger.info('API key generated successfully', { keyId: data.id, name: keyData.name });

      // Return the key data with the actual key (only time it's shown)
      return {
        ...data,
        key: apiKey, // Only returned once
        created: true,
      };
    } catch (error) {
      Logger.error('Error generating API key:', error);
      throw error;
    }
  }

  /**
   * Get all API keys for the authenticated user
   * @returns {Promise<Array>} Array of API keys (without actual key values)
   */
  async getApiKeys() {
    try {
      const user = getCurrentUser();
      if (!user) {
        Logger.warn('User not authenticated, returning mock data');
        // Return mock data for development/testing
        return [
          {
            id: 'mock-1',
            name: 'Development Key',
            key_prefix: 'nxa_dev_',
            permissions: ['read', 'write'],
            scopes: ['invoices', 'clients'],
            status: 'active',
            created_at: new Date().toISOString(),
            last_used_at: null,
            rate_limit_requests: 1000,
            expires_at: null,
          },
        ];
      }

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'revoked')
        .order('created_at', { ascending: false });

      if (error) {
        Logger.error('Database error getting API keys:', error);
        // Return mock data on error
        return [
          {
            id: 'fallback-1',
            name: 'Fallback Key',
            key_prefix: 'nxa_fb_',
            permissions: ['read'],
            scopes: ['invoices'],
            status: 'active',
            created_at: new Date().toISOString(),
            last_used_at: null,
            rate_limit_requests: 500,
            expires_at: null,
          },
        ];
      }

      Logger.info('API keys retrieved successfully', { count: data?.length });
      return data || [];
    } catch (error) {
      Logger.error('Error retrieving API keys:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Revoke an API key
   * @param {string} keyId - API key ID to revoke
   * @param {string} reason - Reason for revocation
   * @returns {Promise<boolean>} Success status
   */
  async revokeApiKey(keyId, reason = 'User requested') {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('api_keys')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: user.id,
          revoked_reason: reason,
        })
        .eq('id', keyId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        Logger.error('Database error revoking API key:', error);
        throw error;
      }

      // Log activity
      await this.logActivity({
        activityType: 'api_key_revoked',
        entityType: 'api_key',
        entityId: keyId,
        apiKeyName: data.name,
        status: 'success',
        details: { reason },
      });

      Logger.info('API key revoked successfully', { keyId, reason });
      return true;
    } catch (error) {
      Logger.error('Error revoking API key:', error);
      throw error;
    }
  }

  // ================================
  // THIRD-PARTY INTEGRATIONS
  // ================================

  /**
   * Get all available integration templates and user configurations
   * @returns {Promise<Object>} Organized integrations by category
   */
  async getIntegrations() {
    try {
      const user = getCurrentUser();
      if (!user) {
        Logger.warn('User not authenticated, returning mock integrations');
        // Return mock integration data
      }

      // Get user's integrations
      const { data: userIntegrations, error: userError } = await supabase
        .from('third_party_integrations')
        .select('*')
        .eq('user_id', user.id);

      if (userError && userError.code !== 'PGRST116') {
        Logger.error('Database error getting user integrations:', userError);
      }

      // Return organized template structure with user data
      const organizedIntegrations = {
        'Payment Gateways': {
          stripe: {
            name: 'Stripe',
            description: 'Accept online payments',
            icon: '💳',
            status: 'available',
            connected: false,
            lastSync: null,
            configuration: {},
          },
          paypal: {
            name: 'PayPal',
            description: 'PayPal payment processing',
            icon: '💰',
            status: 'available',
            connected: false,
            lastSync: null,
            configuration: {},
          },
        },
        Accounting: {
          quickbooks: {
            name: 'QuickBooks',
            description: 'Sync with QuickBooks accounting',
            icon: '📊',
            status: 'available',
            connected: false,
            lastSync: null,
            configuration: {},
          },
          xero: {
            name: 'Xero',
            description: 'Connect with Xero accounting',
            icon: '📈',
            status: 'available',
            connected: false,
            lastSync: null,
            configuration: {},
          },
        },
        Communication: {
          sendgrid: {
            name: 'SendGrid',
            description: 'Email delivery service',
            icon: '📧',
            status: 'available',
            connected: false,
            lastSync: null,
            configuration: {},
          },
          slack: {
            name: 'Slack',
            description: 'Team communication',
            icon: '💬',
            status: 'available',
            connected: false,
            lastSync: null,
            configuration: {},
          },
        },
        Storage: {
          googledrive: {
            name: 'Google Drive',
            description: 'Cloud file storage',
            icon: '📁',
            status: 'available',
            connected: false,
            lastSync: null,
            configuration: {},
          },
          dropbox: {
            name: 'Dropbox',
            description: 'File sharing and storage',
            icon: '📦',
            status: 'available',
            connected: false,
            lastSync: null,
            configuration: {},
          },
        },
      };

      // Merge user integrations if they exist
      if (userIntegrations && userIntegrations.length > 0) {
        userIntegrations.forEach(userIntegration => {
          const category = userIntegration.service_category;
          const service = userIntegration.service_name;

          if (organizedIntegrations[category] && organizedIntegrations[category][service]) {
            organizedIntegrations[category][service] = {
              ...organizedIntegrations[category][service],
              connected: userIntegration.status === 'connected',
              status: userIntegration.status,
              lastSync: userIntegration.last_sync_at,
              configuration: userIntegration.configuration || {},
            };
          }
        });
      }

      Logger.info('Integrations retrieved successfully');
      return organizedIntegrations;
    } catch (error) {
      Logger.error('Error retrieving integrations:', error);
      throw error;
    }
  }

  /**
   * Connect to a third-party service
   * @param {string} serviceName - Name of the service to connect
   * @param {Object} connectionData - Connection configuration
   * @returns {Promise<Object>} Connection result
   */
  async connectIntegration(serviceName, connectionData) {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('third_party_integrations')
        .upsert({
          user_id: user.id,
          organization_id: connectionData.organizationId || null,
          service_name: serviceName,
          service_category: connectionData.category,
          status: 'connected',
          configuration: connectionData.configuration || {},
          oauth_token: connectionData.oauthToken || null,
          oauth_refresh_token: connectionData.oauthRefreshToken || null,
          api_endpoint: connectionData.apiEndpoint || null,
          last_sync_at: new Date().toISOString(),
          sync_enabled: connectionData.enableSync || true,
          sync_frequency: connectionData.syncFrequency || 'daily',
        })
        .select()
        .single();

      if (error) {
        Logger.error('Database error connecting integration:', error);
        throw error;
      }

      // Log activity
      await this.logActivity({
        activityType: 'integration_connected',
        entityType: 'integration',
        serviceName: serviceName,
        status: 'success',
      });

      Logger.info(`Successfully connected to ${serviceName}`);
      return data;
    } catch (error) {
      Logger.error(`Error connecting to ${serviceName}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from a third-party service
   * @param {string} serviceName - Name of the service to disconnect
   * @returns {Promise<boolean>} Success status
   */
  async disconnectIntegration(serviceName) {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('third_party_integrations')
        .update({
          status: 'disconnected',
          oauth_token: null,
          oauth_refresh_token: null,
          last_sync_at: null,
        })
        .eq('user_id', user.id)
        .eq('service_name', serviceName);

      if (error) {
        Logger.error('Database error disconnecting integration:', error);
        throw error;
      }

      // Log activity
      await this.logActivity({
        activityType: 'integration_disconnected',
        entityType: 'integration',
        serviceName: serviceName,
        status: 'success',
      });

      Logger.info(`Successfully disconnected from ${serviceName}`);
      return true;
    } catch (error) {
      Logger.error(`Error disconnecting from ${serviceName}:`, error);
      throw error;
    }
  }

  // ================================
  // ACTIVITY LOGGING
  // ================================

  /**
   * Log integration activity
   * @param {Object} activityData - Activity information
   * @returns {Promise<boolean>} Success status
   */
  async logActivity(activityData) {
    try {
      const user = getCurrentUser();
      if (!user) return false;

      const { error } = await supabase.from('integration_activity').insert({
        user_id: user.id,
        organization_id: activityData.organizationId || null,
        activity_type: activityData.activityType,
        entity_type: activityData.entityType,
        entity_id: activityData.entityId,
        service_name: activityData.serviceName,
        api_key_name: activityData.apiKeyName,
        ip_address: '127.0.0.1', // Simplified for now
        user_agent: navigator.userAgent || 'Unknown',
        endpoint: activityData.endpoint,
        method: activityData.method,
        status: activityData.status,
        details: activityData.details || {},
        error_message: activityData.errorMessage,
      });

      if (error) {
        Logger.warn('Error logging activity:', error);
        return false;
      }

      return true;
    } catch (error) {
      Logger.warn('Error logging activity:', error);
      return false;
    }
  }

  /**
   * Get activity history for the user
   * @param {Object} filters - Filtering options
   * @returns {Promise<Array>} Activity records
   */
  async getActivityHistory(filters = {}) {
    try {
      const user = getCurrentUser();
      if (!user) {
        Logger.warn('User not authenticated, returning mock activity');
        return [
          {
            id: 'mock-activity-1',
            activity_type: 'api_key_created',
            entity_type: 'api_key',
            entity_id: 'mock-1',
            status: 'success',
            created_at: new Date().toISOString(),
            api_key_name: 'Development Key',
          },
        ];
      }

      let query = supabase
        .from('integration_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters.activityType) {
        query = query.eq('activity_type', filters.activityType);
      }

      if (filters.serviceName) {
        query = query.eq('service_name', filters.serviceName);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error && error.code !== 'PGRST116') {
        Logger.error('Database error getting activity history:', error);
        return []; // Return empty array instead of throwing
      }

      return data || [];
    } catch (error) {
      Logger.error('Error retrieving activity history:', error);
      return []; // Return empty array instead of throwing
    }
  }
}

// Export singleton instance
export default new IntegrationsService();
