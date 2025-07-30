import { createClient } from '@supabase/supabase-js';
import Logger from '@utils/Logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Enhanced debugging for deployment environments
const debugEnvVars = () => {
  Logger.info('Environment Variables Check:');
  Logger.info('- VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  Logger.info('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  Logger.info('- VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'Set' : 'Missing');

  if (supabaseUrl) {
    Logger.info('Supabase URL:', supabaseUrl);
  }
  if (supabaseAnonKey) {
    Logger.info('Supabase Anon Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
  }
};

// Run debug check
debugEnvVars();

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `Missing Supabase environment variables:
    - VITE_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}
    - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Set' : 'Missing'}
    
  Please ensure these environment variables are configured in your deployment platform:
  1. AWS Amplify: Go to App Settings > Environment Variables
  2. Vercel: Go to Project Settings > Environment Variables
  3. Netlify: Go to Site Settings > Environment Variables
  
  For local development, ensure your .env file contains these variables.`;

  Logger.error(errorMessage);
  throw new Error('Missing Supabase environment variables - check deployment configuration');
}

// Regular client with anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're using Clerk for auth, not Supabase auth
  },
});

// Admin client with service role key (bypasses RLS)
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

// Log which client is available
if (supabaseAdmin) {
  Logger.info('🔑 Supabase Admin client created with service role key');
} else {
  Logger.warn('⚠️ No service role key - admin operations will not work');
}

// Utility function to set the current user ID for RLS policies
export const setCurrentUserId = async userId => {
  if (!userId) {
    Logger.warn('No user ID provided to setCurrentUserId');
    return;
  }

  try {
    Logger.info('Setting current user ID for RLS:', userId);
    const { error } = await supabase.rpc('set_current_user_id', { user_id: userId });
    if (error) {
      Logger.error('Error setting current user ID:', error);
      // Don't throw error, just log it - the function might not exist yet
      Logger.warn('RLS function might not be available, continuing without it');
      return;
    }
    Logger.info('Current user ID set for RLS successfully:', userId);
  } catch (error) {
    Logger.error('Failed to set current user ID:', error);
    Logger.warn('Continuing without RLS context setting');
    // Don't throw error to allow the app to continue working
  }
};

// Helper function to execute queries with user context
export const withUserContext = async (userId, queryFunction) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    Logger.info('Executing query with user context for:', userId);

    // Try to set the user context (but don't fail if it doesn't work)
    await setCurrentUserId(userId);

    // Execute the query
    const result = await queryFunction();

    // Log the result for debugging
    if (result.error) {
      Logger.error('Query failed with error:', result.error);
    } else {
      Logger.info('Query executed successfully');
    }

    return result;
  } catch (error) {
    Logger.error('Error executing query with user context:', error);
    throw error;
  }
};

// Debug: Make supabase available in the browser console for debugging
if (typeof window !== 'undefined') {
  window.supabase = supabase;
  Logger.info('Supabase client available at window.supabase for debugging');
}
