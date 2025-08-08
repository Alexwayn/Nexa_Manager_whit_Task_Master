import { getEnvVar, isDevelopment, isProduction } from '../env.js';

describe('Environment Utility', () => {
  beforeEach(() => {
    // Clear any existing environment variables
    delete process.env.VITE_TEST_VAR;
    delete process.env.NODE_ENV;
  });

  describe('getEnvVar', () => {
    it('should return environment variable from process.env', () => {
      process.env.VITE_TEST_VAR = 'test-value';
      
      const result = getEnvVar('VITE_TEST_VAR');
      
      expect(result).toBe('test-value');
    });

    it('should return default value when variable is not set', () => {
      const result = getEnvVar('VITE_NONEXISTENT_VAR', 'default-value');
      
      expect(result).toBe('default-value');
    });

    it('should return undefined when variable is not set and no default provided', () => {
      const result = getEnvVar('VITE_NONEXISTENT_VAR');
      
      expect(result).toBeUndefined();
    });
  });

  describe('isDevelopment', () => {
    it('should return true when NODE_ENV is development', () => {
      delete process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const result = isDevelopment();
      
      expect(result).toBe(true);
    });

    it('should return false when NODE_ENV is production', () => {
      delete process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const result = isDevelopment();
      
      expect(result).toBe(false);
    });

    it('should return true when NODE_ENV is test (default for Jest)', () => {
      delete process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      const result = isDevelopment();
      
      expect(result).toBe(true);
    });
  });

  describe('isProduction', () => {
    it('should return true when NODE_ENV is production', () => {
      delete process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const result = isProduction();
      
      expect(result).toBe(true);
    });

    it('should return false when NODE_ENV is development', () => {
      delete process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const result = isProduction();
      
      expect(result).toBe(false);
    });

    it('should return false when NODE_ENV is test', () => {
      delete process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      const result = isProduction();
      
      expect(result).toBe(false);
    });
  });
});
