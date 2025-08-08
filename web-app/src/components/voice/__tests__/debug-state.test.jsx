import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import VoiceFeedbackModal from '../VoiceFeedbackModal';
import voiceFeedbackService from '../../../services/voiceFeedbackService';
import fs from 'fs';

// Mock the service
jest.mock('../../../services/voiceFeedbackService', () => ({
  collectFeedback: jest.fn().mockResolvedValue({}),
  exportFeedback: jest.fn().mockResolvedValue({})
}));

describe('VoiceFeedbackModal - State Debugging', () => {
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

  test('should debug state changes step by step', async () => {
    const debugOutput = [];
    
    const { container } = render(
      <VoiceFeedbackModal
        isOpen={true}
        onClose={mockOnClose}
        commandData={mockCommandData}
      />
    );

    // Helper function to log current state
    const logCurrentState = (step) => {
      const submitButton = container.querySelector('button[type="submit"]');
      const positiveButton = Array.from(container.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Positive'));
      const starButtons = container.querySelectorAll('button[class*="text-yellow-400"]');
      
      debugOutput.push(`=== ${step} ===`);
      debugOutput.push(`Submit button disabled: ${submitButton?.disabled}`);
      debugOutput.push(`Submit button HTML: ${submitButton?.outerHTML}`);
      debugOutput.push(`Positive button HTML: ${positiveButton?.outerHTML}`);
      debugOutput.push(`Star buttons count: ${starButtons.length}`);
      starButtons.forEach((star, index) => {
        debugOutput.push(`Star ${index}: ${star.outerHTML}`);
      });
      debugOutput.push('');
    };

    // Initial state
    logCurrentState('INITIAL STATE');

    // Click positive feedback
    const positiveButton = Array.from(container.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Positive'));
    
    expect(positiveButton).toBeTruthy();
    fireEvent.click(positiveButton);

    // Log after positive click
    logCurrentState('AFTER POSITIVE CLICK');

    // Click 3rd star
    const starButtons = container.querySelectorAll('button[class*="text-yellow-400"]');
    expect(starButtons.length).toBe(5);
    fireEvent.click(starButtons[2]); // 3rd star

    // Log after star click
    logCurrentState('AFTER STAR CLICK');

    // Wait a bit and log again
    await new Promise(resolve => setTimeout(resolve, 100));
    logCurrentState('AFTER TIMEOUT');

    // Force re-render by triggering another event
    fireEvent.click(starButtons[2]); // Click same star again
    logCurrentState('AFTER SECOND STAR CLICK');

    // Write debug output to file
    fs.writeFileSync('debug-state-output.txt', debugOutput.join('\n'));

    // The test itself - we expect this to fail so we can see the debug output
    const finalSubmitButton = container.querySelector('button[type="submit"]');
    expect(finalSubmitButton).not.toBeDisabled();
  });
});