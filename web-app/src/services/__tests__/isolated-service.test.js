// Isolated test to verify the real reportingService behavior
// This test runs in complete isolation from other Jest mocks

// Clear all Jest mocks before starting
jest.clearAllMocks();
jest.resetAllMocks();
jest.restoreAllMocks();

// Explicitly unmock everything related to reportingService
jest.unmock('../reportingService');
jest.unmock('../../services/reportingService');
jest.unmock('@/services/reportingService');
jest.unmock('@services/reportingService');

// Mock only the Supabase client
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

describe('Isolated Service Test', () => {
  test('should use real reportingService with mocked Supabase', async () => {
    console.log('=== Starting isolated test ===');
    
    // Import the service directly
    const reportingService = await import('../reportingService');
    
    console.log('Imported service:', typeof reportingService);
    console.log('Service keys:', Object.keys(reportingService));
    console.log('generateReport:', typeof reportingService.generateReport);
    
    const params = {
      name: 'Test Report',
      type: 'revenue',
      format: 'PDF',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    };
    
    console.log('Calling generateReport with params:', params);
    
    try {
      const result = await reportingService.generateReport(params);
      
      console.log('Result:', JSON.stringify(result, null, 2));
      console.log('Result type:', typeof result);
      console.log('Result.id:', result?.id);
      
      // Based on the real service code, it should return data[0] directly
      // So result should be { id: 123, status: 'processing' }
      expect(result).toHaveProperty('id', 123);
      expect(result).toHaveProperty('status', 'processing');
      
    } catch (error) {
      console.error('Error in generateReport:', error);
      throw error;
    }
  });
});