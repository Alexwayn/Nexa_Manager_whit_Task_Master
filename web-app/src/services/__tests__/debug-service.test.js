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

describe('Debug Service Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should test raw Supabase query', async () => {
    const { supabase } = require('@/lib/supabaseClient');
    
    const result = await supabase.from('reports')
      .insert({
        name: 'Test Report',
        type: 'revenue',
        format: 'PDF',
        parameters: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        status: 'processing'
      })
      .select();
    
    console.log('Raw Supabase result:', JSON.stringify(result, null, 2));
    
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('error');
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data[0]).toHaveProperty('id', 123);
  });

  test('should debug generateReport', async () => {
    console.log('=== Starting generateReport test ===');
    
    try {
      // Import the real service after unmocking
      console.log('About to import reportingService...');
      const mod = require('../reportingService');
      
      // Support multiple module shapes:
      // - ESM default export of object with methods
      // - TS module exporting named `reportingService` instance
      // - CJS named exports
      const reportingService = mod.default || mod.reportingService || mod;
      console.log('Successfully imported reportingService');
      
      const reportParams = {
        name: 'Test Report',
        type: 'revenue',
        format: 'PDF',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };
      
      console.log('reportingService:', typeof reportingService);
      console.log('reportingService keys:', Object.keys(reportingService || {}));
      console.log('generateReport function:', typeof reportingService?.generateReport);
      console.log('reportParams:', JSON.stringify(reportParams, null, 2));
      
      console.log('About to call generateReport...');
      const result = await reportingService.generateReport(reportParams);
      console.log('generateReport call completed');
      
      console.log('Service result:', JSON.stringify(result, null, 2));
      console.log('result type:', typeof result);
      console.log('result.id:', result?.id);
      console.log('result.status:', result?.status);
      
      // Accept both TS and JS implementations
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
      console.error('=== Test error occurred ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  });
});