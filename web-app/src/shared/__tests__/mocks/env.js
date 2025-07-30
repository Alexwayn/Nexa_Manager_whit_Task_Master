/**
 * Mock for environment utilities in Jest tests
 */

export const getEnvVar = (key, defaultValue = '') => {
  // Check Jest globals first
  if (global.import && global.import.meta && global.import.meta.env) {
    return global.import.meta.env[key] || defaultValue;
  }
  
  // Fallback to process.env
  return process.env[key] || defaultValue;
};

export const getAllEnvVars = () => {
  if (global.import && global.import.meta && global.import.meta.env) {
    return global.import.meta.env;
  }
  return process.env;
};

export const isTestEnvironment = () => true;
export const isDevelopment = () => false;
export const isProduction = () => false;

export default {
  getEnvVar,
  getAllEnvVars,
  isTestEnvironment,
  isDevelopment,
  isProduction,
};