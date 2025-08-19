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
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const value = (import.meta as any).env[key];
    if (value !== undefined) {
      return (value as string) || defaultValue;
    }
  }

  // In Jest/Node environment, use process.env
  if (typeof process !== 'undefined' && (process as any).env) {
    const value = (process as any).env[key];
    if (value !== undefined) {
      return (value as string) || defaultValue;
    }
  }

  // In browser environment, try to access Vite's environment variables
  // This will be handled by Vite's build process in production
  if (typeof window !== 'undefined') {
    try {
      // Check if window has the environment variables (for some build systems)
      if ((window as any).__VITE_ENV__) {
        return ((window as any).__VITE_ENV__[key] as string) || defaultValue;
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
         typeof (globalThis as any).jest !== 'undefined';
}

/**
 * Check if we're in development environment
 */
export function isDevelopment(): boolean {
  const nodeEnv = getEnvVar('NODE_ENV');
  // If NODE_ENV is explicitly set, prioritize it
  if (nodeEnv) {
    return nodeEnv === 'development' || nodeEnv === 'test';
  }
  // Fall back to VITE_APP_ENV only when NODE_ENV is not set
  const viteEnv = getEnvVar('VITE_APP_ENV');
  return viteEnv === 'development' || viteEnv === 'test';
}

/**
 * Backward-compatible alias for isDevelopment
 */
export function isDev(): boolean {
  return isDevelopment();
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return getEnvVar('NODE_ENV') === 'production' || 
         getEnvVar('VITE_APP_ENV') === 'production';
}

/**
 * Get the current mode string: development, production, or test
 */
export function getMode(): string {
  return (
    getEnvVar('MODE', getEnvVar('NODE_ENV', 'development')) || 'development'
  );
}

/**
 * Base URL for API calls
 */
export function getBaseUrl(): string {
  return getEnvVar('VITE_BASE_URL', 'http://localhost:3000') || 'http://localhost:3000';
}

/**
 * Supabase configuration
 */
export function getSupabaseConfig(): { url?: string; anonKey?: string; serviceRoleKey?: string } {
  return {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
    serviceRoleKey: getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY'),
  };
}

/**
 * OpenAI API key
 */
export function getOpenAIKey(): string | undefined {
  return getEnvVar('VITE_OPENAI_API_KEY');
}

/**
 * Qwen API key
 */
export function getQwenKey(): string | undefined {
  return getEnvVar('VITE_QWEN_API_KEY');
}

/**
 * Clerk configuration
 */
export function getClerkConfig(): { publishableKey?: string } {
  return {
    publishableKey: getEnvVar('VITE_CLERK_PUBLISHABLE_KEY'),
  };
}

/**
 * Email service configuration
 */
export function getEmailConfig(): {
  provider?: string;
  sendgridApiKey?: string;
  fromEmail?: string;
  fromName?: string;
  mailgunApiKey?: string;
  mailgunDomain?: string;
  postmarkServerToken?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure: boolean;
  imapHost?: string;
  gmailClientId?: string;
  gmailClientSecret?: string;
  outlookClientId?: string;
  outlookClientSecret?: string;
} {
  return {
    provider: getEnvVar('VITE_EMAIL_PROVIDER', 'sendgrid') || 'sendgrid',
    sendgridApiKey: getEnvVar('VITE_SENDGRID_API_KEY'),
    fromEmail: getEnvVar('VITE_FROM_EMAIL'),
    fromName: getEnvVar('VITE_FROM_NAME'),
    mailgunApiKey: getEnvVar('VITE_MAILGUN_API_KEY'),
    mailgunDomain: getEnvVar('VITE_MAILGUN_DOMAIN'),
    postmarkServerToken: getEnvVar('VITE_POSTMARK_SERVER_TOKEN'),
    smtpHost: getEnvVar('VITE_SMTP_HOST'),
    smtpPort: getEnvVar('VITE_SMTP_PORT'),
    smtpUser: getEnvVar('VITE_SMTP_USER'),
    smtpPass: getEnvVar('VITE_SMTP_PASS'),
    smtpSecure: getEnvVar('VITE_SMTP_SECURE') === 'true',
    imapHost: getEnvVar('VITE_IMAP_HOST'),
    gmailClientId: getEnvVar('VITE_GMAIL_CLIENT_ID'),
    gmailClientSecret: getEnvVar('VITE_GMAIL_CLIENT_SECRET'),
    outlookClientId: getEnvVar('VITE_OUTLOOK_CLIENT_ID'),
    outlookClientSecret: getEnvVar('VITE_OUTLOOK_CLIENT_SECRET'),
  };
}

/**
 * AWS configuration
 */
export function getAWSConfig(): { accessKeyId?: string; secretAccessKey?: string; region: string } {
  return {
    accessKeyId: getEnvVar('VITE_AWS_ACCESS_KEY_ID'),
    secretAccessKey: getEnvVar('VITE_AWS_SECRET_ACCESS_KEY'),
    region: getEnvVar('VITE_AWS_REGION', 'us-east-1') || 'us-east-1',
  };
}

/**
 * Whether to bypass authentication (dev-only)
 */
export function shouldBypassAuth(): boolean {
  return isDev() && getEnvVar('VITE_BYPASS_AUTH') === 'true';
}

/**
 * Security configuration
 */
export function getSecurityConfig(): { encryptionSalt?: string; enableDemoMode: boolean; bypassAuth: boolean } {
  return {
    encryptionSalt: getEnvVar('VITE_ENCRYPTION_SALT'),
    enableDemoMode: getEnvVar('VITE_ENABLE_DEMO_MODE') === 'true',
    bypassAuth: shouldBypassAuth(),
  };
}
