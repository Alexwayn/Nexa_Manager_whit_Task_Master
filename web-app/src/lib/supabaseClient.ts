// Simplified Supabase client configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Logger from '@utils/Logger';

// Translation function - to be integrated with i18n system
const t = (key: string, params?: Record<string, unknown>): string => {
  // This is a placeholder function that will be replaced with actual i18n implementation
  const translations: Record<string, string> = {
    'supabase.error.missingUrl':
      'Missing required environment variable: VITE_SUPABASE_URL. Please check your .env file.',
    'supabase.error.missingAnonKey':
      'Missing required environment variable: VITE_SUPABASE_ANON_KEY. Please check your .env file.',
    'supabase.connection.successful': 'Supabase connection successful',
    'supabase.connection.successfulWithWarning':
      'Supabase connection successful (tables may need setup)',
    'supabase.connection.warning.tablesNotAccessible':
      'Some tables may not be accessible or may need to be created',
    'supabase.connection.failed': 'Failed to connect to Supabase',
    'supabase.connection.testFailed': 'Supabase connection test failed:',
    'supabase.debug.urlLog': 'SUPABASE_URL:',
    'supabase.debug.anonKeyLog': 'SUPABASE_ANON_KEY:',
    'supabase.debug.clientAvailable': 'Supabase client available at window.supabase for debugging',
  };

  let translation = translations[key] || key;

  if (params) {
    Object.keys(params).forEach((param) => {
      translation = translation.replace(`{{${param}}}`, String(params[param]));
    });
  }

  return translation;
};

// Get environment variables - NO HARDCODED FALLBACKS for security
const supabaseUrl: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  '';
const supabaseAnonKey: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

// Validate that required environment variables are set
if (!supabaseUrl) {
  throw new Error(t('supabase.error.missingUrl'));
}

if (!supabaseAnonKey) {
  throw new Error(t('supabase.error.missingAnonKey'));
}

// Only log in development
if ((typeof import.meta !== 'undefined' && import.meta.env?.DEV) || (typeof process !== 'undefined' && process.env.NODE_ENV === 'development')) {
  Logger.info(t('supabase.debug.urlLog'), supabaseUrl);
  Logger.info(
    t('supabase.debug.anonKeyLog'),
    supabaseAnonKey ? supabaseAnonKey.slice(0, 8) + '...' : undefined,
  );
}

// Create Supabase client with optimized settings
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: localStorage,
    autoRefreshToken: true,
    debug: (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || (typeof process !== 'undefined' && process.env.NODE_ENV === 'development'), // Only enable debug in development
  },
  realtime: {
    timeout: 60000,
  },
});

// Types for connection test result
interface ConnectionTestResult {
  success: boolean;
  message: string;
  warning?: string;
  error?: unknown;
}

// Simplified connection test function
export const testSupabaseConnection = async (): Promise<ConnectionTestResult> => {
  try {
    // Simple health check using Supabase client
    const { error } = await supabase.from('clients').select('count').limit(1);

    if (error) {
      // If clients table doesn't exist or isn't accessible, that's still a valid connection
      if (
        error.code === 'PGRST116' ||
        error.message.includes('relation') ||
        error.message.includes('permission')
      ) {
        return {
          success: true,
          message: t('supabase.connection.successfulWithWarning'),
          warning: t('supabase.connection.warning.tablesNotAccessible'),
        };
      }
      throw error;
    }

    return {
      success: true,
      message: t('supabase.connection.successful'),
    };
  } catch (err) {
    Logger.error(t('supabase.connection.testFailed'), err);
    return {
      success: false,
      message: (err as Error).message || t('supabase.connection.failed'),
      error: err,
    };
  }
};

// Development helpers
if ((typeof import.meta !== 'undefined' && import.meta.env?.DEV) || (typeof process !== 'undefined' && process.env.NODE_ENV === 'development')) {
  (window as any).supabase = supabase;
  (window as any).testSupabaseConnection = testSupabaseConnection;
  Logger.info(t('supabase.debug.clientAvailable'));
}

export default supabase;
