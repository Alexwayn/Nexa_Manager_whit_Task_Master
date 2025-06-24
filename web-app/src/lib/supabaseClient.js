import { createClient } from '@supabase/supabase-js';
import Logger from '@utils/Logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

Logger.info('SUPABASE_URL:', supabaseUrl);
Logger.info('SUPABASE_ANON_KEY:', supabaseAnonKey.substring(0, 20) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're using Clerk for auth, not Supabase auth
  },
});

// Utility function to set the current user ID for RLS policies
export const setCurrentUserId = async (userId) => {
  if (!userId) {
    Logger.warn('No user ID provided to setCurrentUserId');
    return;
  }

  try {
    const { error } = await supabase.rpc('set_current_user_id', { user_id: userId });
    if (error) {
      Logger.error('Error setting current user ID:', error);
      throw error;
    }
    Logger.info('Current user ID set for RLS:', userId);
  } catch (error) {
    Logger.error('Failed to set current user ID:', error);
    throw error;
  }
};

// Helper function to execute queries with user context
export const withUserContext = async (userId, queryFunction) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    // Set the user context
    await setCurrentUserId(userId);
    
    // Execute the query
    const result = await queryFunction();
    
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