// Bypass the mock by requiring the actual testing library directly
const actualTestingLibrary = jest.requireActual('@testing-library/react');
const { render, fireEvent, screen, waitFor } = actualTestingLibrary;

import React from 'react';
import VoiceFeedbackModal from '../VoiceFeedbackModal';
import * as voiceFeedbackService from '../../../services/voiceFeedbackService';
import fs from 'fs';

// Mock the voice feedback service
jest.mock('../../../services/voiceFeedbackService', () => ({
  submitFeedback: jest.fn(() => Promise.resolve({ success: true }))
}));

describe('VoiceFeedbackModal - Real Component Test', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should enable submit button after selecting feedback and rating', async () => {
    const { container } = render(
      <VoiceFeedbackModal 
        isOpen={true} 
        onClose={mockOnClose}
        sessionId="test-session"
        command="test command"
        response="test response"
      />
    );

    // Debug: log what's being rendered
    fs.writeFileSync('debug-real-component-output.txt', 
      'Container HTML:\n' + container.innerHTML + '\n\n' +
      'All buttons:\n' + Array.from(container.querySelectorAll('button')).map(btn => btn.outerHTML).join('\n')
    );

    // Find the submit button
    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toBeTruthy();
    expect(submitButton.disabled).toBe(true);

    // Find and click the positive feedback button
    const positiveButton = Array.from(container.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('Positive'));
    expect(positiveButton).toBeTruthy();
    
    fireEvent.click(positiveButton);

    // Find and click a star rating
    const starButtons = container.querySelectorAll('button[type="button"]');
    const starButton = Array.from(starButtons).find(btn => 
      btn.innerHTML.includes('★') || btn.innerHTML.includes('star') || 
      btn.className.includes('star') || btn.className.includes('yellow')
    );
    
    if (starButton) {
      fireEvent.click(starButton);
    } else {
      // Fallback: click the 3rd button that might be a star
      const allButtons = Array.from(starButtons);
      if (allButtons.length >= 3) {
        fireEvent.click(allButtons[2]);
      }
    }

    // Wait for state updates
    await waitFor(() => {
      expect(submitButton.disabled).toBe(false);
    }, { timeout: 3000 });
  });

  test('should call onClose when close button is clicked', async () => {
    const { container } = render(
      <VoiceFeedbackModal 
        isOpen={true} 
        onClose={mockOnClose}
        sessionId="test-session"
        command="test command"
        response="test response"
      />
    );

    // Find the close button (X button)
    const closeButton = Array.from(container.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('×') || btn.textContent.includes('Close'));
    
    expect(closeButton).toBeTruthy();
    
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});