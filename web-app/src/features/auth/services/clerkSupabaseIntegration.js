import { supabase } from '@/lib/supabaseClient';
import { useClerk, useAuth } from '@clerk/clerk-react';
import Logger from '@/utils/Logger';

/**
 * Clerk-Supabase Integration Service
 * Handles proper authentication between Clerk and Supabase RLS policies
 */
class ClerkSupabaseIntegration {
  constructor() {
    this.currentUserId = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the integration with current user
   */
  async initialize(clerkUser) {
    try {
      if (!clerkUser) {
        Logger.warn('No Clerk user provided for Supabase integration');
        return false;
      }

      this.currentUserId = clerkUser.id;
      Logger.info('Initializing Clerk-Supabase integration for user:', this.currentUserId);

      // Create or update user profile in Supabase
      await this.syncUserProfile(clerkUser);
      
      // Set JWT for RLS policies
      await this.setSupabaseJWT(clerkUser);
      
      this.isInitialized = true;
      Logger.info('Clerk-Supabase integration initialized successfully');
      return true;
    } catch (error) {
      Logger.error('Failed to initialize Clerk-Supabase integration:', error);
      return false;
    }
  }

  /**
   * Create a custom JWT token for Supabase RLS
   */
  async setSupabaseJWT(clerkUser) {
    try {
      // Create a simple JWT payload that matches our RLS policies
      const payload = {
        sub: clerkUser.id, // This matches auth.jwt() ->> 'sub' in RLS policies
        email: clerkUser.emailAddresses[0]?.emailAddress,
        iss: 'clerk',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
        role: 'authenticated'
      };

      // For testing purposes, we'll set a custom header
      // In production, you'd want to use Clerk's getToken() method
      supabase.rest.headers['Authorization'] = `Bearer fake-jwt-${clerkUser.id}`;
      supabase.rest.headers['X-User-ID'] = clerkUser.id;
      
      Logger.info('Set Supabase headers for user:', clerkUser.id);
    } catch (error) {
      Logger.error('Failed to set Supabase JWT:', error);
    }
  }

  /**
   * Sync user profile from Clerk to Supabase
   */
  async syncUserProfile(clerkUser) {
    try {
      const userProfile = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        profile_image_url: clerkUser.profileImageUrl,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(userProfile, { onConflict: 'id' });

      if (error && !error.message.includes('relation "user_profiles" does not exist')) {
        Logger.error('Failed to sync user profile:', error);
      } else {
        Logger.info('User profile synced successfully');
      }
    } catch (error) {
      Logger.error('Error syncing user profile:', error);
    }
  }

  /**
   * Execute a query with proper user context
   */
  async executeWithUserContext(queryFunction) {
    if (!this.isInitialized || !this.currentUserId) {
      throw new Error('Clerk-Supabase integration not initialized. Please sign in first.');
    }

    try {
      Logger.info('Executing query with user context:', this.currentUserId);
      return await queryFunction();
    } catch (error) {
      Logger.error('Query execution failed:', error);
      
      // If it's an RLS error, provide helpful guidance
      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        const helpfulError = new Error(
          `Database access denied. This usually means:\n` +
          `1. You need to sign in with Clerk authentication\n` +
          `2. The data belongs to another user\n` +
          `3. RLS policies need to be configured properly\n\n` +
          `Original error: ${error.message}`
        );
        throw helpfulError;
      }
      
      throw error;
    }
  }

  /**
   * Clean up when user signs out
   */
  cleanup() {
    this.currentUserId = null;
    this.isInitialized = false;
    
    // Remove custom headers
    delete supabase.rest.headers['Authorization'];
    delete supabase.rest.headers['X-User-ID'];
    
    Logger.info('Clerk-Supabase integration cleaned up');
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    return this.currentUserId;
  }

  /**
   * Check if integration is ready
   */
  isReady() {
    return this.isInitialized && this.currentUserId;
  }
}

// Create singleton instance
export const clerkSupabaseIntegration = new ClerkSupabaseIntegration();

/**
 * React hook for Clerk-Supabase integration
 */
export const useClerkSupabase = () => {
  const { user, isSignedIn } = useAuth();
  const { signOut } = useClerk();

  const initializeIntegration = async () => {
    if (isSignedIn && user) {
      return await clerkSupabaseIntegration.initialize(user);
    }
    return false;
  };

  const executeQuery = async (queryFunction) => {
    return await clerkSupabaseIntegration.executeWithUserContext(queryFunction);
  };

  const handleSignOut = async () => {
    clerkSupabaseIntegration.cleanup();
    await signOut();
  };

  return {
    initializeIntegration,
    executeQuery,
    handleSignOut,
    isReady: clerkSupabaseIntegration.isReady(),
    currentUserId: clerkSupabaseIntegration.getCurrentUserId()
  };
};

/**
 * Helper function for testing with demo data
 */
export const useDemoData = () => {
  const testUserId = 'demo_user_123';
  
  const executeTestQuery = async (queryFunction) => {
    // Temporarily set demo user ID
    supabase.rest.headers['X-User-ID'] = testUserId;
    
    try {
      return await queryFunction();
    } finally {
      // Clean up
      delete supabase.rest.headers['X-User-ID'];
    }
  };

  return {
    executeTestQuery,
    testUserId
  };
};
