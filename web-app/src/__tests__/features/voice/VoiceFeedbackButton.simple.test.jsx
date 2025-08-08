import React from 'react';
import { render, screen } from '@testing-library/react';

// Create a simple test component that just renders a button
const SimpleTestComponent = () => {
  return (
    <button data-testid="voice-feedback-button">
      <svg data-testid="feedback-icon">feedback-icon</svg>
      <span>Feedback</span>
    </button>
  );
};

describe('Simple Test', () => {
  test('renders simple button', () => {
    render(<SimpleTestComponent />);
    
    const button = screen.getByTestId('voice-feedback-button');
    console.log('Button HTML:', button.outerHTML);
    console.log('Button text content:', button.textContent);
    
    const icon = screen.getByTestId('feedback-icon');
    console.log('Icon found:', !!icon);
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Feedback');
  });
});