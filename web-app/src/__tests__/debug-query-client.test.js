// Debug test for QueryClient
import { QueryClient } from '@tanstack/react-query';

describe('QueryClient Debug', () => {
  test('QueryClient can be instantiated', () => {
    console.log('QueryClient:', QueryClient);
    console.log('typeof QueryClient:', typeof QueryClient);
    console.log('QueryClient.prototype:', QueryClient.prototype);
    console.log('QueryClient.constructor:', QueryClient.constructor);
    
    // Try to see what methods are available
    console.log('QueryClient methods:', Object.getOwnPropertyNames(QueryClient));
    console.log('QueryClient prototype methods:', Object.getOwnPropertyNames(QueryClient.prototype || {}));
    
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    expect(queryClient).toBeDefined();
    expect(queryClient.invalidateQueries).toBeDefined();
  });
});