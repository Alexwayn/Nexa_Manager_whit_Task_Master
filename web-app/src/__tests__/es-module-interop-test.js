/**
 * Test to verify ES module interop is working correctly
 */

describe('ES Module Interop Test', () => {
  it('should handle ES module imports correctly', () => {
    // Test that ES module interop is working
    expect(typeof global.__esModule).toBe('boolean');
    expect(global.__esModule).toBe(true);
  });

  it('should handle import.meta through global polyfill', () => {
    // Test that import.meta is available through global polyfill
    expect(typeof global.importMeta).toBe('object');
    expect(typeof global.importMeta.env).toBe('object');
    expect(global.importMeta.env.NODE_ENV).toBe('test');
  });

  it('should handle dynamic imports', () => {
    // Test that dynamic import function is available
    expect(typeof global.import).toBe('function');
  });

  it('should handle URL constructor', () => {
    // Test that URL constructor is available
    expect(typeof global.URL).toBe('function');
    const url = new URL('http://localhost:3000');
    expect(url.href).toBe('http://localhost:3000');
  });

  it('should handle URLSearchParams', () => {
    // Test that URLSearchParams is available
    expect(typeof global.URLSearchParams).toBe('function');
    const params = new URLSearchParams('key=value');
    expect(params.get('key')).toBe('value');
  });

  it('should handle fetch polyfill', () => {
    // Test that fetch is available
    expect(typeof global.fetch).toBe('function');
  });
});