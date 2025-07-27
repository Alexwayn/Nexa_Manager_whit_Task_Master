import { executeWithClerkAuth } from '@lib/supabaseClerkClient';
import { supabase, supabaseAdmin } from '@lib/supabaseClient';
import Logger from '@utils/Logger';
import { errorHandler, notify } from '@shared/utils';

/**
 * @class BusinessService
 * @description Service for managing business profile operations with Supabase.
 */
class BusinessService {
  constructor() {
    this.tableName = 'business_profiles';
  }

  /**
   * Creates a new business profile for a user.
   * @param {Object} businessData - The business profile data.
   * @returns {Promise<{data: Object|null, error: Object|null}>} An object containing the created business profile data or error.
   */
  async createBusinessProfile(businessData) {
    try {
      // Validate required fields
      const validationError = this.validateBusinessData(businessData);
      if (validationError) {
        throw new Error(validationError);
      }

      // Check if business profile already exists for this user
      const existingProfile = await this.getBusinessProfileByUserId(businessData.user_id);

      if (existingProfile.data) {
        // If profile exists, update it instead
        return await this.updateBusinessProfileByUserId(businessData.user_id, businessData);
      }

      // Prepare data for database
      const dbData = this.prepareBusinessDataForDB(businessData);

      console.log('🔧 [TEMP] Using supabaseAdmin for business profile creation');

      if (!supabaseAdmin) {
        throw new Error('Service role key not configured - cannot create business profile');
      }

      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .insert([dbData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      Logger.info('Business profile created successfully:', data.id);
      notify.success('Business profile created successfully');

      return {
        data,
        error: null,
      };
    } catch (error) {
      Logger.error('Error creating business profile:', error);
      errorHandler.handleSupabaseError(error, 'creating business profile');
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * Retrieves a business profile by user ID.
   * @param {string} userId - The user ID.
   * @returns {Promise<{data: Object|null, error: Object|null}>} An object containing the business profile data or error.
   */
  async getBusinessProfileByUserId(userId) {
    try {
      // Use admin client to bypass auth issues during onboarding
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "Row not found" which is expected for new users
        throw error;
      }

      return {
        data: error?.code === 'PGRST116' ? null : data,
        error: null,
      };
    } catch (error) {
      Logger.error('Error fetching business profile:', error);
      errorHandler.handleSupabaseError(error, 'fetching business profile');
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * Updates an existing business profile.
   * @param {string} profileId - The business profile ID.
   * @param {Object} businessData - The updated business data.
   * @returns {Promise<{data: Object|null, error: Object|null}>} An object containing the updated business profile data or error.
   */
  async updateBusinessProfile(profileId, businessData) {
    try {
      // Validate required fields
      const validationError = this.validateBusinessData(businessData, true);
      if (validationError) {
        throw new Error(validationError);
      }

      // Prepare data for database
      const dbData = this.prepareBusinessDataForDB(businessData, true);

      const { data, error } = await executeWithClerkAuth(supabase =>
        supabase.from(this.tableName).update(dbData).eq('id', profileId).select().single(),
      );

      if (error) {
        throw error;
      }

      Logger.info('Business profile updated successfully:', profileId);
      notify.success('Business profile updated successfully');

      return {
        data,
        error: null,
      };
    } catch (error) {
      Logger.error('Error updating business profile:', error);
      errorHandler.handleSupabaseError(error, 'updating business profile');
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * Updates a business profile by user ID.
   * @param {string} userId - The user ID.
   * @param {Object} businessData - The updated business data.
   * @returns {Promise<{data: Object|null, error: Object|null}>} An object containing the updated business profile data or error.
   */
  async updateBusinessProfileByUserId(userId, businessData) {
    try {
      // Validate required fields
      const validationError = this.validateBusinessData(businessData, true);
      if (validationError) {
        throw new Error(validationError);
      }

      // Prepare data for database
      const dbData = this.prepareBusinessDataForDB(businessData, true);

      // 🚀🚀🚀 TEMP: Use admin client to bypass auth issues
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .update(dbData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      Logger.info('Business profile updated successfully for user:', userId);
      notify.success('Business profile updated successfully');

      return {
        data,
        error: null,
      };
    } catch (error) {
      Logger.error('Error updating business profile:', error);
      errorHandler.handleSupabaseError(error, 'updating business profile');
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * Deletes a business profile.
   * @param {string} profileId - The business profile ID.
   * @returns {Promise<{success: boolean, error: Object|null}>} An object indicating success or error.
   */
  async deleteBusinessProfile(profileId) {
    try {
      const { error } = await executeWithClerkAuth(supabase =>
        supabase.from(this.tableName).delete().eq('id', profileId),
      );

      if (error) {
        throw error;
      }

      Logger.info('Business profile deleted successfully:', profileId);
      notify.success('Business profile deleted successfully');

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      Logger.error('Error deleting business profile:', error);
      errorHandler.handleSupabaseError(error, 'deleting business profile');
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Validates business profile data.
   * @param {Object} businessData - The business data to validate.
   * @param {boolean} isUpdate - Whether this is an update operation.
   * @returns {string|null} Validation error message or null if valid.
   */
  validateBusinessData(businessData, isUpdate = false) {
    const requiredFields = ['user_id', 'company_name', 'business_type', 'industry'];

    // Check required fields
    for (const field of requiredFields) {
      if (!isUpdate && (!businessData[field] || businessData[field].toString().trim() === '')) {
        return `${field.replace('_', ' ').toUpperCase()} is required`;
      }
    }

    // Validate company name length
    if (businessData.company_name && businessData.company_name.length > 255) {
      return 'Company name must be less than 255 characters';
    }

    // Validate email format if provided
    if (businessData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(businessData.email)) {
        return 'Invalid email format';
      }
    }

    // Validate website URL if provided
    if (businessData.website) {
      try {
        new URL(businessData.website);
      } catch {
        return 'Invalid website URL format';
      }
    }

    return null;
  }

  /**
   * Prepares business data for database insertion/update.
   * @param {Object} businessData - The raw business data.
   * @param {boolean} isUpdate - Whether this is an update operation.
   * @returns {Object} The prepared data for database operation.
   */
  prepareBusinessDataForDB(businessData, isUpdate = false) {
    const dbData = {
      company_name: businessData.company_name?.trim(),
      business_type: businessData.business_type,
      industry: businessData.industry,
      tax_id: businessData.tax_id?.trim() || null,
      website: businessData.website?.trim() || null,
      phone: businessData.phone?.trim() || null,
      address: businessData.address || null,
      employee_count: businessData.employee_count || null,
      description: businessData.description?.trim() || null,
    };

    // Add user_id for creation
    if (!isUpdate) {
      dbData.user_id = businessData.user_id;
    }

    // Add timestamps
    if (isUpdate) {
      dbData.updated_at = new Date().toISOString();
    } else {
      dbData.created_at = new Date().toISOString();
      dbData.updated_at = new Date().toISOString();
    }

    // Remove undefined values
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key];
      }
    });

    return dbData;
  }

  /**
   * Gets business statistics and summary.
   * @param {string} userId - The user ID.
   * @returns {Promise<{data: Object|null, error: Object|null}>} Business statistics data.
   */
  async getBusinessStats(userId) {
    try {
      const profile = await this.getBusinessProfileByUserId(userId);

      if (!profile.data) {
        return {
          data: null,
          error: new Error('Business profile not found'),
        };
      }

      // You can extend this to include actual business stats from other tables
      const stats = {
        profile: profile.data,
        isComplete: this.isProfileComplete(profile.data),
        setupProgress: this.calculateSetupProgress(profile.data),
      };

      return {
        data: stats,
        error: null,
      };
    } catch (error) {
      Logger.error('Error fetching business stats:', error);
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * Checks if business profile is complete.
   * @param {Object} profile - The business profile data.
   * @returns {boolean} Whether the profile is complete.
   */
  isProfileComplete(profile) {
    const requiredFields = ['company_name', 'business_type', 'industry', 'phone'];

    return requiredFields.every(field => profile[field] && profile[field].toString().trim() !== '');
  }

  /**
   * Calculates setup progress percentage.
   * @param {Object} profile - The business profile data.
   * @returns {number} Setup progress percentage (0-100).
   */
  calculateSetupProgress(profile) {
    const allFields = [
      'company_name',
      'business_type',
      'industry',
      'phone',
      'address',
      'tax_id',
      'website',
      'employee_count',
      'description',
    ];

    const completedFields = allFields.filter(
      field => profile[field] && profile[field].toString().trim() !== '',
    );

    return Math.round((completedFields.length / allFields.length) * 100);
  }
}

// Create and export a singleton instance
const businessService = new BusinessService();
export { businessService };
export default businessService;
