/**
 * Mock for environment utilities in Jest tests
 * This mock ensures that environment variables are properly accessible in test environment
 */

// Mock environment variables for testing
const mockEnvVars = {
  NODE_ENV: 'test',
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test-key',
  VITE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  VITE_APP_ENV: 'test',
  VITE_BASE_URL: 'http://localhost:3000',
  VITE_OPENAI_API_KEY: 'test-openai-key',
  VITE_QWEN_API_KEY: 'test-qwen-key',
};

/**
 * Mock implementation of getEnvVar that works in Jest environment
 */
export function getEnvVar(key, defaultValue) {
  // First check our mock environment variables
  if (mockEnvVars[key] !== undefined) {
    return mockEnvVars[key];
  }
  
  // Then check process.env
  if (process.env[key] !== undefined) {
    return process.env[key];
  }
  
  // Return default value if provided
  return defaultValue;
}

/**
 * Mock implementation of getAllEnvVars
 */
export function getAllEnvVars() {
  return { ...mockEnvVars };
}

/**
 * Mock implementation of isTestEnvironment
 */
export function isTestEnvironment() {
  return true; // Always true in Jest environment
}

/**
 * Mock implementation of isDevelopment
 */
export function isDevelopment() {
  return true; // Consider test as development
}

/**
 * Mock implementation of isProduction
 */
export function isProduction() {
  return false; // Never true in test environment
}

// Export all functions as default for compatibility
export default {
  getEnvVar,
  getAllEnvVars,
  isTestEnvironment,
  isDevelopment,
  isProduction,
};
