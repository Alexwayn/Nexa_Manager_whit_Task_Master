// Import test
describe('Import Test', () => {
  it('should import FloatingMicrophone without errors', () => {
    let importError;
    let FloatingMicrophone;
    
    try {
      ({ FloatingMicrophone } = require('@/features/voice/components/FloatingMicrophone'));
      console.log('Import successful, component:', typeof FloatingMicrophone);
    } catch (error) {
      importError = error;
      console.log('Import error:', error.message);
    }

    expect(importError).toBeUndefined();
    expect(FloatingMicrophone).toBeDefined();
    expect(typeof FloatingMicrophone).toBe('function');
  });
});
