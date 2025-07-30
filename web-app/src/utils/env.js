/**
 * Environment variable utility for test compatibility
 * Handles both Vite (import.meta.env) and Jest (process.env) environments
 */

/**
 * Get environment variable value
 * @param {string} key - Environment variable key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Environment variable value
 */
export function getEnvVar(key, defaultValue = undefined) {
  // In test environment, use process.env or global.importMeta.env
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    // Check global.importMeta.env first (Jest mock)
    if (typeof global !== 'undefined' && global.importMeta && global.importMeta.env) {
      return global.importMeta.env[key] || process.env[key] || defaultValue;
    }
    return process.env[key] || defaultValue;
  }
  
  // In Vite environment, use import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  
  // Fallback to process.env if available (Node.js environment)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  return defaultValue;
}

/**
 * Check if we're in development mode
 * @returns {boolean} True if in development mode
 */
export function isDev() {
  return getEnvVar('DEV', false) || getEnvVar('NODE_ENV') === 'development';
}

/**
 * Check if we're in development mode (alias for isDev)
 * @returns {boolean} True if in development mode
 */
export function isDevelopment() {
  return isDev();
}

/**
 * Check if we're in production mode
 * @returns {boolean} True if in production mode
 */
export function isProd() {
  return getEnvVar('PROD', false) || getEnvVar('NODE_ENV') === 'production';
}

/**
 * Check if we're in production mode (alias for isProd)
 * @returns {boolean} True if in production mode
 */
export function isProduction() {
  return isProd();
}

/**
 * Check if we're in test mode
 * @returns {boolean} True if in test mode
 */
export function isTest() {
  return getEnvVar('NODE_ENV') === 'test';
}

/**
 * Get the current mode
 * @returns {string} Current mode (development, production, test)
 */
export function getMode() {
  return getEnvVar('MODE', getEnvVar('NODE_ENV', 'development'));
}

/**
 * Get base URL for API calls
 * @returns {string} Base URL
 */
export function getBaseUrl() {
  return getEnvVar('VITE_BASE_URL', 'http://localhost:3000');
}

/**
 * Get WebSocket URL
 * @returns {string} WebSocket URL
 */
export function getWebSocketUrl() {
  return getEnvVar('VITE_WS_URL', 'ws://localhost:8080');
}

/**
 * Get Supabase configuration
 * @returns {Object} Supabase config
 */
export function getSupabaseConfig() {
  return {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
    serviceRoleKey: getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY')
  };
}

/**
 * Get OpenAI API key
 * @returns {string} OpenAI API key
 */
export function getOpenAIKey() {
  return getEnvVar('VITE_OPENAI_API_KEY');
}

/**
 * Get Qwen API key
 * @returns {string} Qwen API key
 */
export function getQwenKey() {
  return getEnvVar('VITE_QWEN_API_KEY');
}

/**
 * Get Clerk configuration
 * @returns {Object} Clerk config
 */
export function getClerkConfig() {
  return {
    publishableKey: getEnvVar('VITE_CLERK_PUBLISHABLE_KEY')
  };
}

/**
 * Get email service configuration
 * @returns {Object} Email service config
 */
export function getEmailConfig() {
  return {
    provider: getEnvVar('VITE_EMAIL_PROVIDER', 'sendgrid'),
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
    outlookClientSecret: getEnvVar('VITE_OUTLOOK_CLIENT_SECRET')
  };
}

/**
 * Get AWS configuration
 * @returns {Object} AWS config
 */
export function getAWSConfig() {
  return {
    accessKeyId: getEnvVar('VITE_AWS_ACCESS_KEY_ID'),
    secretAccessKey: getEnvVar('VITE_AWS_SECRET_ACCESS_KEY'),
    region: getEnvVar('VITE_AWS_REGION', 'us-east-1')
  };
}

/**
 * Get security configuration
 * @returns {Object} Security config
 */
export function getSecurityConfig() {
  return {
    encryptionSalt: getEnvVar('VITE_ENCRYPTION_SALT'),
    enableDemoMode: getEnvVar('VITE_ENABLE_DEMO_MODE') === 'true'
  };
}