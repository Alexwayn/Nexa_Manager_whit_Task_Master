import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import VoiceFeedbackModal from '../VoiceFeedbackModal';
import voiceFeedbackService from '../../../services/voiceFeedbackService';

// Mock the service
jest.mock('../../../services/voiceFeedbackService', () => ({
  collectFeedback: jest.fn().mockResolvedValue({}),
  exportFeedback: jest.fn().mockResolvedValue({})
}));

describe('VoiceFeedbackModal - Async State Testing', () => {
  const mockOnClose = jest.fn();
  const mockCommandData = {
    id: 'test-command-1',
    command: 'test command',
    action: 'test action',
    confidence: '95%'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should properly handle state changes and enable submit button', async () => {
    const { container } = render(
      <VoiceFeedbackModal
        isOpen={true}
        onClose={mockOnClose}
        commandData={mockCommandData}
      />
    );

    // Initial state check
    const initialSubmitButton = container.querySelector('button[type="submit"]');
    expect(initialSubmitButton).toBeDisabled();

    // Click positive feedback
    const positiveButton = Array.from(container.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Positive'));
    
    expect(positiveButton).toBeTruthy();
    fireEvent.click(positiveButton);

    // Wait for state update
    await waitFor(() => {
      const submitButton = container.querySelector('button[type="submit"]');
      // Should still be disabled because rating is not set
      expect(submitButton).toBeDisabled();
    });

    // Click 3rd star (rating = 3)
    const starButtons = container.querySelectorAll('button[class*="text-yellow-400"]');
    expect(starButtons.length).toBe(5);
    fireEvent.click(starButtons[2]); // 3rd star (index 2)

    // Wait for state update and check submit button is enabled
    await waitFor(() => {
      const submitButton = container.querySelector('button[type="submit"]');
      expect(submitButton).not.toBeDisabled();
    });

    // Test close button
    const closeButton = Array.from(container.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Close'));
    expect(closeButton).toBeTruthy();
    
    fireEvent.click(closeButton);
    
    // Wait for close to be called
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});