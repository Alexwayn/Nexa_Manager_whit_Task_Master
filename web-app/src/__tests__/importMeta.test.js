// Test file to check import.meta transformation
const testEnv = import.meta.env;
const testUrl = import.meta.url;

describe('Import Meta Transformation Test', () => {
  test('should transform import.meta.env', () => {
    expect(testEnv).toBeDefined();
  });
  
  test('should transform import.meta.url', () => {
    expect(testUrl).toBeDefined();
  });
});