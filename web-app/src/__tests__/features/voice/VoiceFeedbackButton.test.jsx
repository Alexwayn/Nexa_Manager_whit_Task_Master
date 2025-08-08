import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceFeedbackButton from '../../../components/voice/VoiceFeedbackButton';

// Mock the VoiceFeedbackModal component
jest.mock('../../../components/voice/VoiceFeedbackModal', () => {
  const React = require('react');
  return function MockVoiceFeedbackModal({ isOpen, onClose, onFeedbackSubmitted, commandData }) {
    if (!isOpen) return null;
    
    return (
      <div data-testid="voice-feedback-modal">
        <h2>Voice Feedback Modal</h2>
        <p>Command: {commandData?.command || 'No command'}</p>
        <button onClick={() => onFeedbackSubmitted({ rating: 5, comment: 'Great!' })}>
          Submit
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock useVoiceAssistant hook
jest.mock('../../../providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: jest.fn(),
}));

import { useVoiceAssistant } from '../../../providers/VoiceAssistantProvider';
const mockUseVoiceAssistant = useVoiceAssistant;

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChatBubbleLeftRightIcon: ({ className, 'data-testid': testId }) => (
    <svg className={className} data-testid={testId}>feedback-icon</svg>
  ),
  HandThumbUpIcon: ({ className }) => <svg className={className}>thumb-up</svg>,
  HandThumbDownIcon: ({ className }) => <svg className={className}>thumb-down</svg>,
  MicrophoneIcon: ({ className }) => <svg className={className}>microphone</svg>,
}));

const defaultState = {
  isEnabled: true,
  lastCommand: 'test command',
  lastConfidence: 0.95,
  feedbackCount: 0,
  isListening: false,
  isProcessing: false,
  error: null,
  microphonePermission: 'granted'
};

const renderWithProviders = (ui, options = {}) => {
  const mockState = { ...defaultState, ...options.mockState };
  mockUseVoiceAssistant.mockReturnValue(mockState);
  
  // Render without BrowserRouter since VoiceFeedbackButton doesn't need it
  return render(ui);
};

describe('VoiceFeedbackButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders feedback button', () => {
    renderWithProviders(
      <VoiceFeedbackButton />,
      { mockState: { lastCommand: 'test command' } }
    );

    expect(screen.getByTestId('voice-feedback-button')).toBeInTheDocument();
  });

  it('shows correct icon and text', () => {
    renderWithProviders(
      <VoiceFeedbackButton />,
      { mockState: { lastCommand: 'test command' } }
    );

    expect(screen.getByTestId('feedback-icon')).toBeInTheDocument();
    expect(screen.getByTestId('voice-feedback-button')).toHaveTextContent(/feedback/i);
  });

  it('opens feedback modal when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceFeedbackButton />,
      { mockState: { lastCommand: 'test command' } }
    );

    const feedbackButton = screen.getByTestId('voice-feedback-button');
    await user.click(feedbackButton);

    await waitFor(() => {
      expect(screen.getByTestId('voice-feedback-modal')).toBeInTheDocument();
    });
  });

  it('handles feedback submission', async () => {
    const user = userEvent.setup();
    const onFeedbackSubmit = jest.fn();
    
    renderWithProviders(
      <VoiceFeedbackButton onFeedbackSubmit={onFeedbackSubmit} />,
      { mockState: { lastCommand: 'test command' } }
    );

    const feedbackButton = screen.getByTestId('voice-feedback-button');
    await user.click(feedbackButton);

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      return user.click(submitButton);
    });

    expect(onFeedbackSubmit).toHaveBeenCalledWith({
      rating: 5,
      comment: 'Great!',
    });
  });

  it('shows tooltip on hover', () => {
    renderWithProviders(
      <VoiceFeedbackButton />,
      { mockState: { lastCommand: 'test command' } }
    );

    const feedbackButton = screen.getByTestId('voice-feedback-button');
    expect(feedbackButton).toHaveAttribute('title');
  });

  it('supports keyboard navigation', async () => {
    renderWithProviders(
      <VoiceFeedbackButton />,
      { mockState: { lastCommand: 'test command' } }
    );

    const feedbackButton = screen.getByTestId('voice-feedback-button');
    
    // Focus the button
    feedbackButton.focus();
    expect(feedbackButton).toHaveFocus();

    // Activate with Enter key
    fireEvent.keyDown(feedbackButton, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByTestId('voice-feedback-modal')).toBeInTheDocument();
    });

    // Close with Escape key
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByTestId('voice-feedback-modal')).not.toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    renderWithProviders(
      <VoiceFeedbackButton onFeedbackSubmit={slowSubmit} />,
      { mockState: { lastCommand: 'test command' } }
    );

    const feedbackButton = screen.getByTestId('voice-feedback-button');
    await user.click(feedbackButton);

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      return user.click(submitButton);
    });

    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    expect(feedbackButton).toBeDisabled();
  });

  it('handles submission errors gracefully', async () => {
    const user = userEvent.setup();
    const failingSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    
    renderWithProviders(
      <VoiceFeedbackButton onFeedbackSubmit={failingSubmit} />,
      { mockState: { lastCommand: 'test command' } }
    );

    const feedbackButton = screen.getByTestId('voice-feedback-button');
    await user.click(feedbackButton);

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      return user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/failed to submit feedback/i)).toBeInTheDocument();
    });

    // Button should be re-enabled
    expect(feedbackButton).not.toBeDisabled();
  });

  it('displays success message after submission', async () => {
    const user = userEvent.setup();
    const successfulSubmit = jest.fn().mockResolvedValue({ success: true });
    
    renderWithProviders(
      <VoiceFeedbackButton onFeedbackSubmit={successfulSubmit} />,
      { mockState: { lastCommand: 'test command' } }
    );

    const feedbackButton = screen.getByTestId('voice-feedback-button');
    await user.click(feedbackButton);

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      return user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/feedback submitted successfully/i)).toBeInTheDocument();
    });
  });

  it('supports custom styling', () => {
    renderWithProviders(
      <VoiceFeedbackButton 
        className="custom-feedback-btn"
        style={{ backgroundColor: 'red' }}
      />,
      { mockState: { lastCommand: 'test command' } }
    );

    const feedbackButton = screen.getByTestId('voice-feedback-button');
    expect(feedbackButton).toHaveClass('custom-feedback-btn');
    expect(feedbackButton).toHaveStyle('background-color: red');
  });

  it('shows feedback count when available', () => {
    renderWithProviders(
      <VoiceFeedbackButton showCount={true} />,
      { 
        mockState: {
          lastCommand: 'test command',
          feedbackCount: 5 
        }
      }
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    const feedbackButton = screen.getByTestId('voice-feedback-button');
    expect(feedbackButton).toHaveAttribute('aria-label', '5 feedback items');
  });

  it('handles rapid clicks gracefully', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceFeedbackButton />,
      { mockState: { lastCommand: 'test command' } }
    );

    const feedbackButton = screen.getByTestId('voice-feedback-button');
    
    // Rapid clicks
    await user.click(feedbackButton);
    await user.click(feedbackButton);
    await user.click(feedbackButton);

    // Should only open one modal
    await waitFor(() => {
      expect(screen.getByTestId('voice-feedback-modal')).toBeInTheDocument();
    });
    
    // Verify there's only one modal by checking that getAllByTestId would throw
    expect(() => screen.getAllByTestId('voice-feedback-modal')).not.toThrow();
    expect(screen.getAllByTestId('voice-feedback-modal')).toHaveLength(1);
  });

  it('updates when voice state changes', () => {
    renderWithProviders(
      <VoiceFeedbackButton />,
      { mockState: { lastCommand: null } }
    );

    let feedbackButton = screen.getByTestId('voice-feedback-button');
    expect(feedbackButton).toBeDisabled();

    // Re-render with new state
    renderWithProviders(
      <VoiceFeedbackButton />,
      { mockState: { lastCommand: 'new command' } }
    );

    feedbackButton = screen.getByTestId('voice-feedback-button');
    expect(feedbackButton).not.toBeDisabled();
  });

  it('has proper ARIA attributes', () => {
    renderWithProviders(
      <VoiceFeedbackButton />,
      { mockState: { lastCommand: 'test command' } }
    );

    const feedbackButton = screen.getByTestId('voice-feedback-button');
    expect(feedbackButton).toHaveAttribute('role', 'button');
    expect(feedbackButton).toHaveAttribute('aria-describedby');
  });

  it('supports icon-only mode', () => {
    renderWithProviders(
      <VoiceFeedbackButton iconOnly={true} />,
      { mockState: { lastCommand: 'test command' } }
    );

    expect(screen.getByTestId('feedback-icon')).toBeInTheDocument();
    expect(screen.queryByText('Feedback')).not.toBeInTheDocument();
  });

  it('handles voice assistant disabled state', () => {
    renderWithProviders(
      <VoiceFeedbackButton />,
      { 
        mockState: {
          isEnabled: false,
          lastCommand: 'test command' 
        }
      }
    );

    const feedbackButton = screen.getByTestId('voice-feedback-button');
    expect(feedbackButton).toBeDisabled();
    expect(feedbackButton).toHaveAttribute('title', 'Voice assistant is disabled');
  });
});
