import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component
const TestComponent = ({ title = "Test Component" }) => {
  return (
    <div data-testid="test-component">
      <h1>{title}</h1>
      <button data-testid="test-button">Click me</button>
    </div>
  );
};

describe('React Component Test with Fixed @testing-library/react', () => {
  test('should render React component without TypeError', () => {
    console.log('✓ Testing React component rendering with fixed @testing-library/react');
    
    // This should not throw TypeError: (0 , _dom.configure) is not a function
    const { container } = render(<TestComponent title="Hello World" />);
    
    expect(container).toBeTruthy();
    console.log('✓ Component rendered successfully');
  });

  test('should find elements using screen queries', () => {
    render(<TestComponent title="Test Title" />);
    
    // Test that our mock screen methods work
    const component = screen.getByTestId('test-component');
    const button = screen.getByTestId('test-button');
    
    expect(component).toBeTruthy();
    expect(button).toBeTruthy();
    console.log('✓ Screen queries working correctly');
  });

  test('should handle text content', () => {
    render(<TestComponent title="Custom Title" />);
    
    // Test text queries
    const heading = screen.getByText('Custom Title');
    const button = screen.getByText('Click me');
    
    expect(heading).toBeTruthy();
    expect(button).toBeTruthy();
    console.log('✓ Text queries working correctly');
  });
});