/**
 * Environment variable utility that works in both Vite and Jest environments
 */

// Type for environment variables
export interface EnvVars {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_APP_ENV?: string;
  VITE_BASE_URL?: string;
  VITE_OPENAI_API_KEY?: string;
  VITE_QWEN_API_KEY?: string;
  [key: string]: string | undefined;
}

/**
 * Get an environment variable value
 * Works in both Vite (import.meta.env) and Jest (process.env) environments
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  // In Vite environment, use import.meta.env first
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = import.meta.env[key];
    if (value !== undefined) {
      return value || defaultValue;
    }
  }

  // In Jest/Node environment, use process.env
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    if (value !== undefined) {
      return value || defaultValue;
    }
  }

  // In browser environment, try to access Vite's environment variables
  // This will be handled by Vite's build process in production
  if (typeof window !== 'undefined') {
    try {
      // Check if window has the environment variables (for some build systems)
      if ((window as any).__VITE_ENV__) {
        return (window as any).__VITE_ENV__[key] || defaultValue;
      }
    } catch (error) {
      // Ignore errors
    }
  }

  return defaultValue;
}

/**
 * Get all environment variables
 */
export function getAllEnvVars(): EnvVars {
  const envVars: EnvVars = {};
  
  // Common environment variable keys
  const keys = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_APP_ENV',
    'VITE_BASE_URL',
    'VITE_OPENAI_API_KEY',
    'VITE_QWEN_API_KEY'
  ];

  keys.forEach(key => {
    const value = getEnvVar(key);
    if (value !== undefined) {
      envVars[key] = value;
    }
  });

  return envVars;
}

/**
 * Check if we're in a test environment
 */
export function isTestEnvironment(): boolean {
  return getEnvVar('NODE_ENV') === 'test' || 
         getEnvVar('VITE_APP_ENV') === 'test' ||
         typeof jest !== 'undefined';
}

/**
 * Check if we're in development environment
 */
export function isDevelopment(): boolean {
  const nodeEnv = getEnvVar('NODE_ENV');
  const viteEnv = getEnvVar('VITE_APP_ENV');
  
  return nodeEnv === 'development' || 
         nodeEnv === 'test' || // Consider test as development
         viteEnv === 'development' ||
         viteEnv === 'test';
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return getEnvVar('NODE_ENV') === 'production' || 
         getEnvVar('VITE_APP_ENV') === 'production';
}
