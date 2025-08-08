/**
 * Test to verify that import.meta transformation is working correctly
 */

describe('import.meta transformation', () => {
  test('should transform import.meta.env to polyfill', () => {
    // This test verifies that import.meta.env is properly transformed
    // and accessible in the test environment
    
    // The transformation should make import.meta.env available
    expect(typeof import.meta).toBe('object');
    expect(typeof import.meta.env).toBe('object');
    
    // Should have test environment variables
    expect(import.meta.env.NODE_ENV).toBe('test');
    expect(import.meta.env.MODE).toBe('test');
    
    // Should have Vite environment variables
    expect(import.meta.env.VITE_BASE_URL).toBeDefined();
    expect(import.meta.env.VITE_SUPABASE_URL).toBeDefined();
  });

  test('should handle import.meta.url', () => {
    // Verify that import.meta.url is also transformed
    expect(typeof import.meta.url).toBe('string');
    expect(import.meta.url).toContain('file:///');
  });

  test('should work in dynamic contexts', () => {
    // Test that the transformation works in dynamic contexts
    const getEnv = () => import.meta.env;
    const env = getEnv();
    
    expect(env).toBeDefined();
    expect(env.NODE_ENV).toBe('test');
  });
});