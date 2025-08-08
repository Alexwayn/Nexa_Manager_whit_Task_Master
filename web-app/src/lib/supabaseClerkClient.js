import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';
import Logger from '@/utils/Logger';
import { supabase } from './supabaseClient.js'; // Reuse the main client
import { getEnvVar } from '@/utils/env';

// Get environment variables for creating authenticated clients
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Re-export the main client for compatibility
export { supabase };

/**
 * Hook to get a Supabase client with Clerk authentication
 * Use this in React components instead of the regular supabase client
 */
export const useSupabaseWithClerk = () => {
  const { getToken } = useAuth();

  // Return a wrapper that adds auth headers to the main client
  const authenticatedClient = useMemo(() => {
    // Create a proxy that intercepts requests and adds auth headers
    return new Proxy(supabase, {
      get(target, prop) {
        if (typeof target[prop] === 'function') {
          return async (...args) => {
            try {
              console.log('🔍 [useSupabaseWithClerk] Attempting to get Clerk token...');

              // Try with template name first
              let token = await getToken({ template: 'supabase' });
              console.log('🎯 [useSupabaseWithClerk] Token with name:', token ? 'YES' : 'NO');

              // If no token, try with template ID
              if (!token) {
                token = await getToken({ template: 'jtmp_2z5wvuHN0RtLnrZCMsUp0l5x0qc' });
                console.log('🎯 [useSupabaseWithClerk] Token with ID:', token ? 'YES' : 'NO');
              }

              if (token) {
                console.log('✅ [useSupabaseWithClerk] Using Clerk token for Supabase auth');
                console.log(
                  '🔑 [useSupabaseWithClerk] Token preview:',
                  token.substring(0, 50) + '...',
                );

                // Set the auth header on the main client temporarily
                const originalHeaders = target.rest.headers;
                target.rest.headers = {
                  ...originalHeaders,
                  Authorization: `Bearer ${token}`,
                };

                try {
                  const result = await target[prop](...args);
                  return result;
                } finally {
                  // Restore original headers
                  target.rest.headers = originalHeaders;
                }
              } else {
                console.warn('⚠️ [useSupabaseWithClerk] No token available with either name or ID');
                return await target[prop](...args);
              }
            } catch (error) {
              Logger.error('💥 Error getting Clerk token:', error);
              return await target[prop](...args);
            }
          };
        }
        return target[prop];
      },
    });
  }, [getToken]);

  return authenticatedClient;
};

/**
 * Execute a Supabase query with Clerk authentication
 * This is a helper function that can be used outside of React components
 */
export const executeWithClerkAuth = async queryFunction => {
  try {
    console.log('🔍 [executeWithClerkAuth] Attempting to get Clerk token...');

    // Try to get the token from window.Clerk if available
    if (typeof window !== 'undefined' && window.Clerk?.session) {
      // Try with template name first
      console.log('🎯 [executeWithClerkAuth] Trying with template name: supabase');
      let token = await window.Clerk.session.getToken({ template: 'supabase' });
      console.log('🎯 [executeWithClerkAuth] Token with name:', token ? 'YES' : 'NO');

      // If no token, try with template ID
      if (!token) {
        console.log(
          '🎯 [executeWithClerkAuth] Trying with template ID: jtmp_2z5wvuHN0RtLnrZCMsUp0l5x0qc',
        );
        token = await window.Clerk.session.getToken({
          template: 'jtmp_2z5wvuHN0RtLnrZCMsUp0l5x0qc',
        });
        console.log('🎯 [executeWithClerkAuth] Token with ID:', token ? 'YES' : 'NO');
      }

      if (token) {
        console.log('✅ [executeWithClerkAuth] Using Clerk token for Supabase auth');
        console.log('🔑 [executeWithClerkAuth] Token preview:', token.substring(0, 50) + '...');

        // Set the auth header on the main client temporarily
        const originalHeaders = supabase.rest.headers;
        supabase.rest.headers = {
          ...originalHeaders,
          Authorization: `Bearer ${token}`,
        };

        try {
          const result = await queryFunction(supabase);
          return result;
        } finally {
          // Restore original headers
          supabase.rest.headers = originalHeaders;
        }
      } else {
        console.warn('⚠️ [executeWithClerkAuth] No token received with either name or ID');
      }
    } else {
      console.warn('⚠️ [executeWithClerkAuth] No Clerk session available');
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
