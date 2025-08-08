import React from 'react';
import { render } from '@testing-library/react';

// Simple test to verify React and Testing Library work
describe('Basic React Test', () => {
  test('can render a simple div', () => {
    const TestComponent = () => React.createElement('div', { 'data-testid': 'test-div' }, 'Hello World');
    
    const { container } = render(React.createElement(TestComponent));
    
    console.log('Container HTML:', container.innerHTML);
    
    const testDiv = container.querySelector('[data-testid="test-div"]');
    expect(testDiv).toBeTruthy();
    expect(testDiv.textContent).toBe('Hello World');
  });
});
