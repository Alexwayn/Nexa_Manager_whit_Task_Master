// Isolated test to verify the real reportingService behavior
// This test runs in complete isolation from other Jest mocks

// Clear all Jest mocks before starting
jest.clearAllMocks();
jest.resetAllMocks();
jest.restoreAllMocks();

// Explicitly unmock everything related to reportingService
// Explicitly unmock reportingService to ensure we use the real implementation
jest.unmock('../reportingService');
jest.unmock('../../services/reportingService');
jest.unmock('@/services/reportingService');

// Mock Supabase client
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({
          data: [{ id: 123, status: 'processing' }],
          error: null
        }))
      }))
    }))
  }
}));

describe('Isolated Service (ESM import) Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should import reportingService and call generateReport via dynamic import', async () => {
    console.log('=== Starting isolated generateReport ESM import test ===');
    
    try {
      console.log('About to dynamically import reportingService...');
      const mod = await import('../reportingService');
      
      // Support multiple module shapes
      const reportingService = mod.default || mod.reportingService || mod;
      console.log('Imported reportingService type:', typeof reportingService);
      console.log('reportingService keys:', Object.keys(reportingService || {}));
      console.log('typeof reportingService.generateReport:', typeof reportingService?.generateReport);

      const params = {
        name: 'Test Report',
        type: 'revenue',
        format: 'PDF',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      console.log('Calling generateReport with params:', JSON.stringify(params, null, 2));
      const result = await reportingService.generateReport(params);
      console.log('generateReport resolved with:', JSON.stringify(result, null, 2));

      if (typeof result?.id === 'number') {
        expect(result.id).toBe(123);
        expect(result.status).toBe('processing');
      } else if (typeof result?.id === 'string') {
        expect(result.id).toMatch(/^report_\d+$/);
        expect(result.status).toBe('completed');
      } else {
        throw new Error(`Unexpected result shape: ${JSON.stringify(result, null, 2)}`);
      }
    } catch (error) {
      console.error('=== Isolated test error ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  });
});