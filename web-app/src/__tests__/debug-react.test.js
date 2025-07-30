import React from 'react';

describe('React Mock Debug', () => {
  test('React mock is loaded', () => {
    console.log('React:', React);
    console.log('typeof React:', typeof React);
    console.log('React.useState:', React.useState);
    
    expect(React).toBeDefined();
    expect(React.useState).toBeDefined();
  });
});