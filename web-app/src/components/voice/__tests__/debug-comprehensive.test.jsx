import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import VoiceFeedbackModal from '../VoiceFeedbackModal';
import fs from 'fs';

// Mock the voice feedback service
jest.mock('../../../services/voiceFeedbackService', () => ({
  __esModule: true,
  default: {
    collectFeedback: jest.fn().mockResolvedValue({ success: true }),
    getFeedbackHistory: jest.fn(),
    exportFeedbackData: jest.fn(),
    syncFeedback: jest.fn()
  }
}));

describe('VoiceFeedbackModal Debug', () => {
  it('should debug component behavior step by step', async () => {
    const debugOutput = [];
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

    debugOutput.push('=== INITIAL STATE ===');
    const allButtons = Array.from(container.querySelectorAll('button'));
    allButtons.forEach((button, index) => {
      debugOutput.push(`Button ${index}: text="${button.textContent}", type="${button.type}", disabled=${button.disabled}, className="${button.className}"`);
    });

    // Find submit button
    const submitButton = allButtons.find(button => 
      button.textContent.includes('Submit') && button.type === 'submit'
    );
    debugOutput.push(`Submit button found: ${!!submitButton}, disabled: ${submitButton?.disabled}`);

    // Find close button
    const closeButton = allButtons.find(button => 
      button.textContent.includes('Close') && button.type === 'button'
    );
    debugOutput.push(`Close button found: ${!!closeButton}`);

    // Test close button
    debugOutput.push('=== TESTING CLOSE BUTTON ===');
    if (closeButton) {
      debugOutput.push('Clicking close button...');
      fireEvent.click(closeButton);
      
      // Wait a bit and check if onClose was called
      await new Promise(resolve => setTimeout(resolve, 100));
      debugOutput.push(`mockOnClose called: ${mockOnClose.mock.calls.length} times`);
    }

    // Reset mock for next test
    mockOnClose.mockClear();

    debugOutput.push('=== TESTING FEEDBACK SELECTION ===');
    // Find positive button
    const positiveButton = allButtons.find(button => 
      button.textContent.includes('Positive')
    );
    debugOutput.push(`Positive button found: ${!!positiveButton}`);

    if (positiveButton) {
      debugOutput.push('Clicking positive button...');
      await act(async () => {
        fireEvent.click(positiveButton);
      });

      // Check if button state changed
      const updatedPositiveButton = container.querySelector('button[class*="border-blue"]') ||
                                   Array.from(container.querySelectorAll('button')).find(button => 
                                     button.textContent.includes('Positive')
                                   );
      debugOutput.push(`Positive button after click - className: "${updatedPositiveButton?.className}"`);
    }

    debugOutput.push('=== TESTING STAR RATING ===');
    // Find star buttons
    const starButtons = allButtons.filter(button => 
      button.className.includes('text-yellow-400') && button.type === 'button'
    );
    debugOutput.push(`Star buttons found: ${starButtons.length}`);

    if (starButtons.length > 0) {
      debugOutput.push('Clicking 3rd star...');
      await act(async () => {
        fireEvent.click(starButtons[2]);
      });

      // Check star state after click
      const updatedStarButtons = Array.from(container.querySelectorAll('button')).filter(button => 
        button.className.includes('text-yellow') && button.type === 'button'
      );
      updatedStarButtons.forEach((star, index) => {
        debugOutput.push(`Star ${index}: className="${star.className}"`);
      });
    }

    debugOutput.push('=== CHECKING SUBMIT BUTTON AFTER SELECTIONS ===');
    const updatedSubmitButton = Array.from(container.querySelectorAll('button')).find(button => 
      button.textContent.includes('Submit') && button.type === 'submit'
    );
    debugOutput.push(`Submit button after selections - disabled: ${updatedSubmitButton?.disabled}`);

    // Test close button again
    debugOutput.push('=== TESTING CLOSE BUTTON AGAIN ===');
    const updatedCloseButton = Array.from(container.querySelectorAll('button')).find(button => 
      button.textContent.includes('Close') && button.type === 'button'
    );
    
    if (updatedCloseButton) {
      debugOutput.push('Clicking close button again...');
      fireEvent.click(updatedCloseButton);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      debugOutput.push(`mockOnClose called: ${mockOnClose.mock.calls.length} times`);
    }

    // Write debug output to file
    fs.writeFileSync('e:/AlexVenturesStudio/Nexa_Manager_whit_Task_Master/web-app/debug-comprehensive-output.txt', debugOutput.join('\n'));

    // Just pass the test - we're debugging
    expect(true).toBe(true);
  });
});