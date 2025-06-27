import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';
import Logger from '@utils/Logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create the base Supabase client (singleton)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're using Clerk for auth, not Supabase auth
  },
});

/**
 * Hook to get a Supabase client with Clerk authentication
 * Use this in React components instead of the regular supabase client
 */
export const useSupabaseWithClerk = () => {
  const { getToken } = useAuth();

  // Create a memoized client to avoid multiple instances
  const authenticatedClient = useMemo(() => {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: async () => {
          try {
            const token = await getToken({ template: 'supabase' });
            if (token) {
              console.log('Using Clerk token for Supabase auth');
              return { Authorization: `Bearer ${token}` };
            } else {
              console.warn('No Clerk token available');
              return {};
            }
          } catch (error) {
            Logger.error('Error getting Clerk token:', error);
            return {};
          }
        },
      },
    });
  }, [getToken]);

  return authenticatedClient;
};

/**
 * Execute a Supabase query with Clerk authentication
 * This is a helper function that can be used outside of React components
 */
export const executeWithClerkAuth = async (queryFunction) => {
  try {
    // Try to get the token from window.Clerk if available
    if (typeof window !== 'undefined' && window.Clerk?.session) {
      const token = await window.Clerk.session.getToken({ template: 'supabase' });
      
      if (token) {
        // Create a temporary client with the token
        const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
          },
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });
        
        return await queryFunction(authenticatedClient);
      }
    }
    
    // Fallback to regular client if no token available
    Logger.warn('No Clerk token available, using anonymous client');
    return await queryFunction(supabase);
  } catch (error) {
    Logger.error('Error executing query with Clerk auth:', error);
    throw error;
  }
};

// Debug: Make supabase available in the browser console for debugging
if (typeof window !== 'undefined') {
  window.supabase = supabase;
  Logger.info('Supabase client available at window.supabase for debugging');
}
