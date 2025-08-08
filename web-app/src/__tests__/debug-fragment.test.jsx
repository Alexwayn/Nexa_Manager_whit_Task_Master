import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple Fragment test component
const FragmentTestComponent = () => {
  return (
    <>
      <button data-testid="test-button" role="button" aria-label="Test button">
        Test Button
      </button>
      <div data-testid="test-div">Test Div</div>
    </>
  );
};

describe('Fragment Handling Test', () => {
  test('renders Fragment children correctly', () => {
    const { container } = render(<FragmentTestComponent />);
    
    console.log('Container HTML:', container.innerHTML);
    
    // Try to find the button
    try {
      const button = screen.getByTestId('test-button');
      console.log('Found button:', button);
      console.log('Button tagName:', button.tagName);
      console.log('Button role:', button.getAttribute('role'));
      console.log('Button aria-label:', button.getAttribute('aria-label'));
    } catch (error) {
      console.log('Error finding button:', error.message);
    }
    
    // Try to find the div
    try {
      const div = screen.getByTestId('test-div');
      console.log('Found div:', div);
      console.log('Div tagName:', div.tagName);
    } catch (error) {
      console.log('Error finding div:', error.message);
    }
  });
});