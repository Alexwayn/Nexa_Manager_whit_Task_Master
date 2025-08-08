import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import VoiceFeedbackModal from '../VoiceFeedbackModal';
import voiceFeedbackService from '../../../services/voiceFeedbackService';

// Mock the voice feedback service
jest.mock('../../../services/voiceFeedbackService', () => ({
  __esModule: true,
  default: {
    collectFeedback: jest.fn(),
    getFeedbackHistory: jest.fn(),
    exportFeedbackData: jest.fn(),
    syncFeedback: jest.fn()
  }
}));

describe('VoiceFeedbackModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when isOpen is true', () => {
    const { container } = render(<VoiceFeedbackModal isOpen={true} onClose={jest.fn()} />);
    
    // Check if modal content is rendered
    const modalContent = container.querySelector('[role="dialog"]') || 
                        container.querySelector('.modal') ||
                        container.querySelector('[data-testid*="modal"]');
    expect(modalContent).toBeTruthy();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(<VoiceFeedbackModal isOpen={false} onClose={jest.fn()} />);
    
    // Check if modal content is not rendered
    const modalContent = container.querySelector('[role="dialog"]') || 
                        container.querySelector('.modal') ||
                        container.querySelector('[data-testid*="modal"]');
    expect(modalContent).toBeFalsy();
  });

  it('should submit feedback when form is filled and submitted', async () => {
    const mockOnClose = jest.fn();
    const mockCollectFeedback = jest.fn().mockResolvedValue({ success: true });
    voiceFeedbackService.collectFeedback.mockImplementation(mockCollectFeedback);

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

    // Select feedback type first - find the actual Positive button in the rendered component
    const positiveButton = Array.from(container.querySelectorAll('button')).find(button => 
      button.textContent.includes('Positive')
    );
    expect(positiveButton).toBeTruthy();
    fireEvent.click(positiveButton);

    // Select rating - find the actual star buttons with text-yellow-400 class
    const starButtons = Array.from(container.querySelectorAll('button')).filter(button => {
      const hasYellowClass = button.className.includes('text-yellow-400');
      const isButtonType = button.getAttribute('type') === 'button';
      return hasYellowClass && isButtonType;
    });
    expect(starButtons).toHaveLength(5);
    fireEvent.click(starButtons[4]); // Click 5th star

    // Add comment - find the actual textarea
    const commentInput = container.querySelector('textarea[placeholder*="thoughts"]') || 
                        container.querySelector('textarea');
    expect(commentInput).toBeTruthy();
    fireEvent.change(commentInput, { target: { value: 'Great voice recognition!' } });

    // Submit form - find the actual Submit button in the rendered component
    // Should be enabled now that both feedbackType and rating are set
    const submitButton = Array.from(container.querySelectorAll('button')).find(button => 
      button.textContent.includes('Submit') && button.type === 'submit'
    );
    expect(submitButton).toBeTruthy();
    expect(submitButton).not.toBeDisabled();
    
    // Trigger form submission by finding the form and dispatching submit event
    const form = container.querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockCollectFeedback).toHaveBeenCalledWith({
        commandId: 'test-command-123',
        command: 'test command',
        action: 'test action',
        rating: 5,
        feedbackType: 'positive',
        comment: 'Great voice recognition!',
        expectedAction: '',
        sessionId: 'test-session',
        context: {
          currentPage: '/',
          commandSuccess: true,
          confidence: 0.95
        }
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable submit button when required fields are not filled', () => {
    const commandData = { id: 'test', command: 'test', action: 'test' };
    const { container } = render(<VoiceFeedbackModal isOpen={true} onClose={jest.fn()} commandData={commandData} />);

    // Submit button should be disabled initially
    const submitButton = Array.from(container.querySelectorAll('button')).find(button => 
      button.textContent.includes('Submit') && button.type === 'submit'
    );
    expect(submitButton).toBeTruthy();
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when feedback type and rating are selected', async () => {
    const commandData = { id: 'test', command: 'test', action: 'test' };
    const { container } = render(<VoiceFeedbackModal isOpen={true} onClose={jest.fn()} commandData={commandData} />);

    // Select feedback type
    const positiveButton = Array.from(container.querySelectorAll('button')).find(button => 
      button.textContent.includes('Positive')
    );
    fireEvent.click(positiveButton);

    // Select rating - star buttons have text-yellow-400 class and no text content
    const starButtons = Array.from(container.querySelectorAll('button')).filter(button => {
      const hasYellowClass = button.className.includes('text-yellow-400');
      const isButtonType = button.getAttribute('type') === 'button';
      return hasYellowClass && isButtonType;
    });
    expect(starButtons.length).toBe(5);
    fireEvent.click(starButtons[2]); // Click 3rd star

    // Wait for state updates and check submit button is enabled
    await waitFor(() => {
      const submitButton = Array.from(container.querySelectorAll('button')).find(button => 
        button.textContent.includes('Submit') && button.type === 'submit'
      );
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should close modal when close button is clicked', async () => {
    const mockOnClose = jest.fn();
    const commandData = { id: 'test', command: 'test', action: 'test' };
    const { container } = render(<VoiceFeedbackModal isOpen={true} onClose={mockOnClose} commandData={commandData} />);

    // Find and click the close button (the "Close" text button at the bottom)
    const closeButton = Array.from(container.querySelectorAll('button')).find(button => 
      button.textContent.includes('Close') && button.type === 'button'
    );
    expect(closeButton).toBeTruthy();
    
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});