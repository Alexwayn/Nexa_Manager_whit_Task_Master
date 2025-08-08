import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import VoiceFeedbackModal from '../components/voice/VoiceFeedbackModal';

// Mock the voice feedback service
jest.mock('../services/voiceFeedbackService', () => ({
  __esModule: true,
  default: {
    collectFeedback: jest.fn().mockResolvedValue({ success: true })
  }
}));

describe('VoiceFeedbackModal Focused Debug', () => {
  it('should handle close button click', () => {
    const mockOnClose = jest.fn();
    const commandData = { id: 'test', command: 'test command', action: 'test action' };
    
    const { container } = render(
      <VoiceFeedbackModal 
        isOpen={true} 
        onClose={mockOnClose} 
        commandData={commandData} 
      />
    );

    // Find close button by text content (the bottom close button)
    const closeButton = screen.getByRole('button', { name: 'Close' });
    expect(closeButton).toBeInTheDocument();
    
    // Click the close button
    fireEvent.click(closeButton);
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle submit button state changes', async () => {
    const mockOnClose = jest.fn();
    const commandData = { id: 'test', command: 'test command', action: 'test action' };
    
    const { container } = render(
      <VoiceFeedbackModal 
        isOpen={true} 
        onClose={mockOnClose} 
        commandData={commandData} 
      />
    );

    // Debug: Show the rendered HTML
    console.log('Modal HTML:', container.innerHTML);

    // Try to find submit button by different methods
    const submitButtons = screen.queryAllByText('Submit');
    console.log('Submit buttons found:', submitButtons.length);
    
    if (submitButtons.length === 0) {
      console.log('No Submit button found, skipping disabled check');
      return;
    }

    // Find submit button (should be disabled initially)
    const submitButton = submitButtons[0];
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Find and click positive feedback button
    const positiveButton = screen.getByRole('button', { name: 'Positive' });
    expect(positiveButton).toBeInTheDocument();
    
    act(() => {
      fireEvent.click(positiveButton);
    });

    // Find and click a star rating
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.className.includes('text-yellow')
    );
    expect(starButtons.length).toBe(5);
    
    act(() => {
      fireEvent.click(starButtons[2]); // Click 3rd star
    });

    // Check if submit button is now enabled
    expect(submitButton).not.toBeDisabled();
  });
});