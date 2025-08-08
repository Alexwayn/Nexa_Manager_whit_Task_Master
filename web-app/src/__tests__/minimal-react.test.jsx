// Minimal test to debug React rendering
const React = require('react');
const { render } = require('@testing-library/react');

// Simple test component
const TestComponent = () => {
  return React.createElement('div', { 'data-testid': 'test-div' }, 'Hello World');
};

describe('Minimal React Test', () => {
  test('renders a simple component', () => {
    console.log('React version:', React.version);
    console.log('React.createElement:', typeof React.createElement);
    
    const { container } = render(React.createElement(TestComponent));
    
    console.log('Container innerHTML:', container.innerHTML);
    console.log('Container children length:', container.children.length);
    
    const testDiv = container.querySelector('[data-testid="test-div"]');
    console.log('Test div found:', !!testDiv);
    
    if (testDiv) {
      console.log('Test div content:', testDiv.textContent);
    }
    
    expect(container.children.length).toBeGreaterThan(0);
  });
});
