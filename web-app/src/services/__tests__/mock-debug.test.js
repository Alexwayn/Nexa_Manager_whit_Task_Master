// Simple test to debug mock behavior
import { supabase } from '@/shared/__tests__/mocks/supabaseClerkClient';

describe('Mock Debug', () => {
  it('should work with basic mock setup', async () => {
    const mockQuery = supabase.from('reports');
    
    // Set mock response
    mockQuery.__setMockResponse({
      data: [{ id: 123, name: 'Test Report' }],
      error: null
    });
    
    // Test the query
    const result = await mockQuery.select('*');
    
    console.log('Mock result:', result);
    expect(result.data).toBeDefined();
    expect(result.data[0].id).toBe(123);
  });
});