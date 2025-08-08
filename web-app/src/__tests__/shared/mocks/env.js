/**
 * Mock environment utility for Jest tests
 */

const mockEnvVars = {
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test-key',
  VITE_APP_ENV: 'test',
  VITE_BASE_URL: 'http://localhost:3000',
  VITE_OPENAI_API_KEY: 'test-openai-key',
  VITE_QWEN_API_KEY: 'test-qwen-key',
  NODE_ENV: 'test'
};

export function getEnvVar(key, defaultValue) {
  return mockEnvVars[key] || defaultValue;
}

export function getAllEnvVars() {
  return { ...mockEnvVars };
}

export function isTestEnvironment() {
  return true;
}

export function isDevelopment() {
  return true;
}

export function isProduction() {
  return false;
}
