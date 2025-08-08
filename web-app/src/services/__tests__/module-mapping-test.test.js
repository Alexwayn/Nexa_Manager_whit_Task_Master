import { supabase } from '@/lib/supabaseClient';

describe('Module Mapping Test', () => {
  test('should import mocked supabase client', () => {
    console.log('Imported supabase:', supabase);
    expect(supabase).toBeDefined();
    expect(supabase.from).toBeDefined();
    expect(typeof supabase.from).toBe('function');
    
    const query = supabase.from('test');
    console.log('Query object:', query);
    expect(query).toBeDefined();
    expect(query.__setMockResponse).toBeDefined();
  });
  
  test('should use the mock response', async () => {
    const query = supabase.from('test');
    query.__setMockResponse({ data: [{ id: 999, name: 'test' }], error: null });
    
    const result = await query.select('*');
    console.log('Result:', result);
    expect(result.data).toEqual([{ id: 999, name: 'test' }]);
  });
});