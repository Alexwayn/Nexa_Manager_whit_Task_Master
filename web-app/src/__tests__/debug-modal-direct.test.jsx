import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VoiceFeedbackModal from '../components/voice/VoiceFeedbackModal';
import voiceFeedbackService from '../services/voiceFeedbackService';

// Mock the service
jest.mock('../services/voiceFeedbackService');

// Mock the useVoiceAssistant hook
jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => ({
    isListening: false,
    startListening: jest.fn(),
    stopListening: jest.fn(),
    lastCommand: '',
    lastConfidence: 0.8
  })
}));

describe('VoiceFeedbackModal Direct Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    voiceFeedbackService.collectFeedback.mockResolvedValue({
      success: true,
      data: { id: 'test-feedback-id' }
    });
  });

  it('submits feedback correctly when form is filled', async () => {
    const mockOnClose = jest.fn();
    const mockOnFeedbackSubmitted = jest.fn();

    const { container } = render(
      <BrowserRouter>
        <VoiceFeedbackModal
          isOpen={true}
          onClose={mockOnClose}
          commandData={{
            id: 'test-command-123',
            command: 'test command',
            action: 'test action',
            sessionId: 'test-session'
          }}
          onFeedbackSubmitted={mockOnFeedbackSubmitted}
        />
      </BrowserRouter>
    );

    // Use direct DOM queries instead of screen
    const positiveButton = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent.includes('Positive'));
    expect(positiveButton).toBeTruthy();
    fireEvent.click(positiveButton);

    // Wait for the modal to fully render after clicking positive
    await waitFor(() => {
      const ratingSection = Array.from(container.querySelectorAll('label')).find(label => label.textContent.includes('Rating'));
      expect(ratingSection).toBeTruthy();
    });

    // Debug: Log all buttons to see what's available
    const allButtons = Array.from(container.querySelectorAll('button'));
    console.log('All buttons found:', allButtons.map(btn => ({
      text: btn.textContent.trim(),
      type: btn.type,
      hasSvg: !!btn.querySelector('svg'),
      className: btn.className,
      innerHTML: btn.innerHTML.substring(0, 100) // First 100 chars of innerHTML
    })));

    // Select 5-star rating - find star buttons (they have SVG children with star icons)
    const starButtons = Array.from(container.querySelectorAll('button')).filter(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.type === 'button' && !btn.textContent.trim(); // Star buttons have no text, just SVG
    });
    
    console.log('Star buttons found:', starButtons.length);
    
    // If no star buttons found, try a different approach
    if (starButtons.length === 0) {
      // Look for buttons with yellow color (star buttons have text-yellow-400 class)
      const yellowButtons = allButtons.filter(btn => 
        btn.className.includes('yellow') || btn.querySelector('svg')
      );
      console.log('Yellow/SVG buttons found:', yellowButtons.length);
      if (yellowButtons.length >= 5) {
        fireEvent.click(yellowButtons[4]); // 5th star
      } else {
        throw new Error('Could not find star rating buttons');
      }
    } else {
      expect(starButtons.length).toBe(5); // Should be exactly 5 star buttons
      // Click the 5th star (index 4)
      fireEvent.click(starButtons[4]);
    }

    // Add comment
    const commentInput = container.querySelector('textarea[placeholder*="thoughts"]');
    expect(commentInput).toBeTruthy();
    fireEvent.change(commentInput, { target: { value: 'Test feedback comment' } });

    // Find the form and submit it
    const form = container.querySelector('form');
    expect(form).toBeTruthy();
    
    // Wait for submit button to be enabled
    await waitFor(() => {
      const submitButton = Array.from(container.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Submit') && btn.type === 'submit'
      );
      expect(submitButton).toBeTruthy();
      expect(submitButton).not.toBeDisabled();
    });

    // Submit the form
    fireEvent.submit(form);

    // Wait for async operations
    await waitFor(() => {
      expect(voiceFeedbackService.collectFeedback).toHaveBeenCalledWith({
        commandId: 'test-command-123',
        command: 'test command',
        action: 'test action',
        rating: 5,
        feedbackType: 'positive',
        comment: 'Test feedback comment',
        expectedAction: '',
        sessionId: 'test-session',
        context: {
          currentPage: expect.any(String),
          commandSuccess: undefined,
          confidence: undefined
        }
      });
    });
  });
});