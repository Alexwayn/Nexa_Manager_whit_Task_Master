import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';

/**
 * Webhook Service
 *
 * Handles interaction with webhook-synced data from Clerk
 * Provides functions to query users, organizations, and memberships
 * that have been synchronized via webhooks
 */

class WebhookService {
  // ==================== USER METHODS ====================

  /**
   * Get user by Clerk user ID
   * @param {string} clerkUserId - Clerk user ID
   * @returns {Promise<Object>} User data
   */
  static async getUserByClerkId(clerkUserId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching user by Clerk ID:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User data
   */
  static async getUserByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching user by email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile (non-Clerk fields only)
   * Note: Clerk-synced fields should be updated through Clerk, not directly
   * @param {string} clerkUserId - Clerk user ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user data
   */
  static async updateUserProfile(clerkUserId, updates) {
    try {
      // Filter out Clerk-managed fields to prevent conflicts
      const allowedFields = ['metadata'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      if (Object.keys(filteredUpdates).length === 0) {
        return { success: true, message: 'No fields to update' };
      }

      const { data, error } = await supabase
        .from('users')
        .update(filteredUpdates)
        .eq('clerk_user_id', clerkUserId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== ORGANIZATION METHODS ====================

  /**
   * Get organization by Clerk organization ID
   * @param {string} clerkOrgId - Clerk organization ID
   * @returns {Promise<Object>} Organization data
   */
  static async getOrganizationByClerkId(clerkOrgId) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('clerk_organization_id', clerkOrgId)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching organization by Clerk ID:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get organization by slug
   * @param {string} slug - Organization slug
   * @returns {Promise<Object>} Organization data
   */
  static async getOrganizationBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching organization by slug:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all organizations for a user
   * @param {string} clerkUserId - Clerk user ID
   * @returns {Promise<Object>} Array of organizations with user's role
   */
  static async getUserOrganizations(clerkUserId) {
    try {
      const { data, error } = await supabase.rpc('get_user_organizations', {
        user_clerk_id: clerkUserId,
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching user organizations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get organization members
   * @param {string} clerkOrgId - Clerk organization ID
   * @returns {Promise<Object>} Array of organization members
   */
  static async getOrganizationMembers(clerkOrgId) {
    try {
      const { data, error } = await supabase
        .from('user_organization_roles')
        .select('*')
        .eq('clerk_organization_id', clerkOrgId)
        .order('membership_created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching organization members:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== MEMBERSHIP METHODS ====================

  /**
   * Get user's membership in a specific organization
   * @param {string} clerkUserId - Clerk user ID
   * @param {string} clerkOrgId - Clerk organization ID
   * @returns {Promise<Object>} Membership data
   */
  static async getUserMembership(clerkUserId, clerkOrgId) {
    try {
      const { data, error } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .eq('clerk_organization_id', clerkOrgId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching user membership:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is organization admin
   * @param {string} clerkUserId - Clerk user ID
   * @param {string} clerkOrgId - Clerk organization ID
   * @returns {Promise<Object>} Boolean result
   */
  static async isOrganizationAdmin(clerkUserId, clerkOrgId) {
    try {
      const { data, error } = await supabase.rpc('is_organization_admin', {
        user_clerk_id: clerkUserId,
        org_clerk_id: clerkOrgId,
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error checking admin status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all memberships for a user
   * @param {string} clerkUserId - Clerk user ID
   * @returns {Promise<Object>} Array of memberships
   */
  static async getUserMemberships(clerkUserId) {
    try {
      const { data, error } = await supabase
        .from('organization_memberships')
        .select(
          `
          *,
          organizations:clerk_organization_id (
            id,
            name,
            slug,
            logo_url,
            members_count
          )
        `,
        )
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching user memberships:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== WEBHOOK LOGS ====================

  /**
   * Get webhook processing logs
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Array of webhook logs
   */
  static async getWebhookLogs(filters = {}) {
    try {
      let query = supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.webhook_type) {
        query = query.eq('webhook_type', filters.webhook_type);
      }
      if (filters.clerk_id) {
        query = query.eq('clerk_id', filters.clerk_id);
      }
      if (filters.processed_successfully !== undefined) {
        query = query.eq('processed_successfully', filters.processed_successfully);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching webhook logs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get webhook processing statistics
   * @returns {Promise<Object>} Statistics object
   */
  static async getWebhookStats() {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('webhook_type, processed_successfully, created_at');

      if (error) {
        throw error;
      }

      // Process statistics
      const stats = {
        total: data.length,
        successful: data.filter(log => log.processed_successfully).length,
        failed: data.filter(log => !log.processed_successfully).length,
        byType: {},
        recent24h: data.filter(log => {
          const logTime = new Date(log.created_at);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return logTime > dayAgo;
        }).length,
      };

      // Group by webhook type
      data.forEach(log => {
        if (!stats.byType[log.webhook_type]) {
          stats.byType[log.webhook_type] = { total: 0, successful: 0, failed: 0 };
        }
        stats.byType[log.webhook_type].total++;
        if (log.processed_successfully) {
          stats.byType[log.webhook_type].successful++;
        } else {
          stats.byType[log.webhook_type].failed++;
        }
      });

      return { success: true, data: stats };
    } catch (error) {
      Logger.error('Error fetching webhook stats:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== DATA SYNC UTILITIES ====================

  /**
   * Force sync user data with Clerk (for manual sync when webhook fails)
   * This would typically call Clerk's API to fetch fresh data
   * @param {string} clerkUserId - Clerk user ID
   * @returns {Promise<Object>} Sync result
   */
  static async syncUserData(clerkUserId) {
    try {
      // Note: This is a placeholder for manual sync functionality
      // In a full implementation, this would:
      // 1. Call Clerk's API to get fresh user data
      // 2. Update the local database with the fresh data
      // 3. Return the sync result

      Logger.info(`Manual sync requested for user: ${clerkUserId}`);
      return {
        success: true,
        message: 'Manual sync feature requires Clerk API integration',
        clerkUserId,
      };
    } catch (error) {
      Logger.error('Error syncing user data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Force sync organization data with Clerk
   * @param {string} clerkOrgId - Clerk organization ID
   * @returns {Promise<Object>} Sync result
   */
  static async syncOrganizationData(clerkOrgId) {
    try {
      Logger.info(`Manual sync requested for organization: ${clerkOrgId}`);
      return {
        success: true,
        message: 'Manual sync feature requires Clerk API integration',
        clerkOrgId,
      };
    } catch (error) {
      Logger.error('Error syncing organization data:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to user changes
   * @param {string} clerkUserId - Clerk user ID
   * @param {Function} callback - Callback function for changes
   * @returns {Object} Subscription object
   */
  static subscribeToUserChanges(clerkUserId, callback) {
    const subscription = supabase
      .channel(`user-${clerkUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `clerk_user_id=eq.${clerkUserId}`,
        },
        callback,
      )
      .subscribe();

    return subscription;
  }

  /**
   * Subscribe to organization changes
   * @param {string} clerkOrgId - Clerk organization ID
   * @param {Function} callback - Callback function for changes
   * @returns {Object} Subscription object
   */
  static subscribeToOrganizationChanges(clerkOrgId, callback) {
    const subscription = supabase
      .channel(`org-${clerkOrgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organizations',
          filter: `clerk_organization_id=eq.${clerkOrgId}`,
        },
        callback,
      )
      .subscribe();

    return subscription;
  }

  /**
   * Subscribe to membership changes for a user
   * @param {string} clerkUserId - Clerk user ID
   * @param {Function} callback - Callback function for changes
   * @returns {Object} Subscription object
   */
  static subscribeToMembershipChanges(clerkUserId, callback) {
    const subscription = supabase
      .channel(`membership-${clerkUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_memberships',
          filter: `clerk_user_id=eq.${clerkUserId}`,
        },
        callback,
      )
      .subscribe();

    return subscription;
  }
}

export default WebhookService;
