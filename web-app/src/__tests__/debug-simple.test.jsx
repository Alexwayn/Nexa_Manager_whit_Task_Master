import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import VoiceFeedbackModal from '../components/voice/VoiceFeedbackModal';

describe('VoiceFeedbackModal Debug', () => {
  it('should debug button interactions and state changes', () => {
    const mockOnClose = jest.fn();
    const commandData = { id: 'test', command: 'test command', action: 'test action' };
    
    const { container } = render(
      <VoiceFeedbackModal 
        isOpen={true} 
        onClose={mockOnClose} 
        commandData={commandData} 
      />
    );

    // Debug: Check if modal renders
    console.log('Modal rendered:', !!container.querySelector('[data-testid="voice-feedback-modal"]'));
    
    // Debug: Check close button
    const closeButton = Array.from(container.querySelectorAll('button')).find(button => 
      button.textContent.includes('Close') && button.type === 'button'
    );
    console.log('Close button found:', !!closeButton);
    console.log('Close button text:', closeButton?.textContent);
    
    // Debug: Check feedback type buttons
    const positiveButton = Array.from(container.querySelectorAll('button')).find(button => 
      button.textContent.includes('Positive')
    );
    console.log('Positive button found:', !!positiveButton);

    // Debug: Check star buttons
    const starButtons = Array.from(container.querySelectorAll('button')).filter(button => {
      const hasYellowClass = button.className.includes('text-yellow');
      const hasSvg = button.querySelector('svg');
      const isButtonType = button.getAttribute('type') === 'button';
      return hasYellowClass && hasSvg && isButtonType;
    });
    console.log('Star buttons found:', starButtons.length);

    // Debug: Check submit button initial state
    const submitButton = Array.from(container.querySelectorAll('button')).find(button => 
      button.textContent.includes('Submit') && button.type === 'submit'
    );
    console.log('Submit button found:', !!submitButton);
    console.log('Submit button disabled initially:', submitButton?.disabled);

    // Test interactions step by step
    if (positiveButton) {
      console.log('Clicking positive button...');
      act(() => {
        fireEvent.click(positiveButton);
      });
      console.log('Submit button disabled after feedback type:', submitButton?.disabled);
    }

    if (starButtons.length >= 3) {
      console.log('Clicking 3rd star...');
      act(() => {
        fireEvent.click(starButtons[2]);
      });
      console.log('Submit button disabled after rating:', submitButton?.disabled);
    }

    // Test close button click
    if (closeButton) {
      console.log('Clicking close button...');
      act(() => {
        fireEvent.click(closeButton);
      });
      console.log('Close button clicked, onClose called:', mockOnClose.mock.calls.length);
    }

    // Basic assertions
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('Voice Command Feedback');
    expect(container.textContent).toContain('Rating (1-5 stars)');
  });
});