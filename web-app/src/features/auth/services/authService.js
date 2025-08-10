import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';

/**
 * @class AuthService
 * @description Centralized service for all authentication operations.
 */
export class AuthService {
  /**
   * Registers a new user with email verification.
   * @param {Object} userData - User registration data.
   * @param {string} userData.email - User's email address.
   * @param {string} userData.password - User's chosen password.
   * @param {string} userData.username - User's chosen username.
   * @param {string} userData.fullName - User's full name.
   * @param {string} [userData.phone] - User's phone number (optional).
   * @param {string} [userData.businessType] - User's business type (optional).
   * @param {string} [userData.vatNumber] - User's VAT number (optional).
   * @returns {Promise<Object>} An object containing the registration result.
   */
  static async register(userData) {
    try {
      const { email, password, username, fullName, phone, businessType, vatNumber } = userData;

      // Validate required fields
      if (!email || !password || !username || !fullName) {
        throw new Error('Email, password, username, and full name are required.');
      }

      // Validate password strength
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }

      // Register user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            full_name: fullName,
            phone: phone || null,
            business_type: businessType || null,
            vat_number: vatNumber || null,
          },
        },
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        message: 'Registration successful! Check your email to confirm your account.',
      };
    } catch (error) {
      Logger.error('Registration error:', error);

      // Handle specific errors
      if (
        error.message &&
        error.message.includes(
          'duplicate key value violates unique constraint "profiles_username_key"',
        )
      ) {
        throw new Error('Username already exists. Please choose another one.');
      }

      throw new Error(error.message || 'An error occurred during registration.');
    }
  }

  /**
   * Logs in a user.
   * @param {string} email - User's email or username.
   * @param {string} password - User's password.
   * @returns {Promise<Object>} An object containing the login result.
   */
  static async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        session: data.session,
        message: 'Login successful.',
      };
    } catch (error) {
      Logger.error('Login error:', error);
      throw new Error('Invalid credentials.');
    }
  }

  /**
   * Logs out the current user.
   * @returns {Promise<Object>} An object containing the logout result.
   */
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return {
        success: true,
        message: 'Logout successful.',
      };
    } catch (error) {
      Logger.error('Logout error:', error);
      throw new Error('An error occurred during logout.');
    }
  }

  /**
   * Requests a password reset email.
   * @param {string} email - User's email address.
   * @returns {Promise<Object>} An object containing the reset request result.
   */
  static async requestPasswordReset(email) {
    try {
      if (!email) {
        throw new Error('Email is required.');
      }

      const origin = typeof window !== 'undefined' && window.location && window.location.origin
        ? window.location.origin
        : (process?.env?.VITE_BASE_URL || 'http://localhost:3000');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password reset email sent! Check your inbox.',
      };
    } catch (error) {
      Logger.error('Password reset request error:', error);
      throw new Error(error.message || 'An error occurred while sending the reset email.');
    }
  }

  /**
   * Updates the current user's password.
   * @param {string} newPassword - The new password.
   * @returns {Promise<Object>} An object containing the password update result.
   */
  static async updatePassword(newPassword) {
    try {
      if (!newPassword) {
        throw new Error('New password is required.');
      }

      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password updated successfully.',
      };
    } catch (error) {
      Logger.error('Password update error:', error);
      throw new Error(error.message || 'An error occurred while updating the password.');
    }
  }

  /**
   * Gets the current user session.
   * @returns {Promise<Object>} An object containing the current session information.
   */
  static async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      return {
        success: true,
        session: data.session,
        user: data.session?.user || null,
      };
    } catch (error) {
      Logger.error('Get session error:', error);
      throw new Error('An error occurred while retrieving the session.');
    }
  }

  /**
   * Refreshes the current user session.
   * @returns {Promise<Object>} An object containing the refreshed session information.
   */
  static async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      return {
        success: true,
        session: data.session,
        user: data.session?.user || null,
      };
    } catch (error) {
      Logger.error('Session refresh error:', error);
      throw new Error('An error occurred while refreshing the session.');
    }
  }

  // Note: Social login (OAuth) is now handled by Clerk
  // The socialLogin method has been removed as OAuth is managed by Clerk's SignIn component

  /**
   * Updates the current user's profile information.
   * @param {Object} profileData - The profile data to update.
   * @returns {Promise<Object>} An object containing the update result.
   */
  static async updateProfile(profileData) {
    try {
      const { error } = await supabase.auth.updateUser({
        data: profileData,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Profile updated successfully.',
      };
    } catch (error) {
      Logger.error('Profile update error:', error);
      throw new Error(error.message || 'An error occurred while updating the profile.');
    }
  }

  /**
   * Checks if a user is currently authenticated.
   * @returns {Promise<boolean>} True if a user is authenticated, false otherwise.
   */
  static async isAuthenticated() {
    try {
      const { data } = await supabase.auth.getSession();
      return !!data.session?.user;
    } catch (error) {
      Logger.error('Authentication check error:', error);
      return false;
    }
  }

  /**
   * Retrieves the role of a given user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<string>} The user's role.
   */
  static async getUserRole(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required.');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return data?.role || 'user';
    } catch (error) {
      Logger.error('Get user role error:', error);
      return 'user'; // Default role
    }
  }

  /**
   * Validates an email address format.
   * @param {string} email - The email address to validate.
   * @returns {boolean} True if the email format is valid, false otherwise.
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates password strength.
   * @param {string} password - The password to validate.
   * @returns {{isValid: boolean, errors: string[]}} An object indicating if the password is valid and a list of errors.
   */
  static validatePassword(password) {
    const result = {
      isValid: true,
      errors: [],
    };

    if (!password) {
      result.errors.push('Password is required.');
      result.isValid = false;
    }

    if (password.length < 8) {
      result.errors.push('Password must be at least 8 characters long.');
      result.isValid = false;
    }

    if (!/[A-Z]/.test(password)) {
      result.errors.push('Password must contain at least one uppercase letter.');
      result.isValid = false;
    }

    if (!/[a-z]/.test(password)) {
      result.errors.push('Password must contain at least one lowercase letter.');
      result.isValid = false;
    }

    if (!/\d/.test(password)) {
      result.errors.push('Password must contain at least one number.');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Sets up a listener for authentication state changes.
   * @param {function} callback - The function to call when the auth state changes.
   * @returns {Object} The subscription object from Supabase.
   */
  static setupAuthListener(callback) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (callback) {
        callback(event, session);
      }
    });

    return subscription;
  }

  /**
   * Removes an authentication state change listener.
   * @param {Object} subscription - The subscription object to remove.
   */
  static removeAuthListener(subscription) {
    if (subscription && subscription.unsubscribe) {
      subscription.unsubscribe();
    }
  }
}

export default AuthService;
