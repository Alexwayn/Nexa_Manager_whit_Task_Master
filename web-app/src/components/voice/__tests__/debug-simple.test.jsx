import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import VoiceFeedbackModal from '../VoiceFeedbackModal';

describe('VoiceFeedbackModal Debug', () => {
  it('should debug button interactions', () => {
    const mockOnClose = jest.fn();
    const commandData = {
      id: 'test-command-123',
      command: 'test command',
      action: 'test action',
      success: true,
      confidence: 0.95,
      sessionId: 'test-session'
    };

    const { container } = render(
      <VoiceFeedbackModal 
        isOpen={true} 
        onClose={mockOnClose} 
        commandData={commandData}
      />
    );

    // Find all buttons and log their details
    const allButtons = Array.from(container.querySelectorAll('button'));
    
    // Test close button specifically
    const closeButton = allButtons.find(btn => btn.textContent.includes('Close'));
    expect(closeButton).toBeTruthy();
    
    // Test that close button click works
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
    
    // Test feedback type buttons
    const positiveButton = allButtons.find(btn => btn.textContent.includes('Positive'));
    expect(positiveButton).toBeTruthy();
    
    // Test star buttons
    const starButtons = allButtons.filter(button => {
      const hasYellowClass = button.className.includes('text-yellow');
      const hasSvg = button.querySelector('svg');
      return hasYellowClass && hasSvg;
    });
    expect(starButtons.length).toBe(5);
    
    // Test submit button initial state
    const submitButton = allButtons.find(btn => 
      btn.textContent.includes('Submit') && btn.type === 'submit'
    );
    expect(submitButton).toBeTruthy();
    expect(submitButton.disabled).toBe(true); // Should be disabled initially
  });
});