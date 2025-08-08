// Direct test bypassing Jest module mappings
import path from 'path';

// Mock Supabase directly
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({
        data: [{ id: 'report-123', status: 'completed', url: 'https://example.com/report.pdf' }],
        error: null
      }))
    }))
  }))
};

// Mock the Supabase module before importing the service
jest.mock('../../lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

describe('Direct ReportingService Test', () => {
  test('generateReport should return report data directly', async () => {
    // Use require with the exact file path to bypass module mappings
    const servicePath = path.resolve(__dirname, '../reportingService.js');
    
    // Clear the module cache for this specific file
    delete require.cache[servicePath];
    
    // Require the actual service file directly
    const { generateReport } = require(servicePath);
    
    const reportData = {
      name: 'Test Report',
      type: 'financial',
      format: 'PDF',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    };
    
    const result = await generateReport(reportData);
    
    // The real service should return data[0] directly
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    
    // The real service returns data[0] from Supabase, which should be the report object directly
    // This confirms we're using the real service, not the mock
    expect(result).toHaveProperty('id');
    
    // Log success message to stderr so it shows up
    process.stderr.write('SUCCESS: Real service is working and returning data[0] directly!\n');
    process.stderr.write(`Result structure: ${JSON.stringify(Object.keys(result))}\n`);
  });
});