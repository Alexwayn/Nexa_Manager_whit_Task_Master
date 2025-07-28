import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import VoiceFeedbackButton from '@/features/voice/components/VoiceFeedbackButton';
import { VoiceAssistantProvider } from '@/features/voice/providers/VoiceAssistantProvider';

// Mock the VoiceFeedbackModal
jest.mock('@/features/voice/components/VoiceFeedbackModal', () => {
  return function MockVoiceFeedbackModal({ isOpen, onClose, onSubmit, command, confidence }) {
    if (!isOpen) return null;
    return (
      <div data-testid="voice-feedback-modal">
        <div data-testid="modal-command">{command}</div>
        <div data-testid="modal-confidence">{confidence}</div>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({ rating: 4, comment: 'Test feedback' })}>
          Submit
        </button>
      </div>
    );
  };
});

const renderWithProviders = (component, voiceState = {}) => {
  const defaultState = {
    isListening: false,
    isProcessing: false,
    lastCommand: null,
    lastConfidence: null,
    ...voiceState
  };

  return render(
    <BrowserRouter>
      <VoiceAssistantProvider initialState={defaultState}>
        {component}
      </VoiceAssistantProvider>
    </BrowserRouter>
  );
};

describe('VoiceFeedbackButton', () => {
  it('renders feedback button', () => {
    renderWithProviders(<VoiceFeedbackButton />);

    const feedbackButton = screen.getByLabelText(/give feedback/i);
    expect(feedbackButton).toBeInTheDocument();
    expect(feedbackButton).toHaveClass('voice-feedback-button');
  });

  it('shows correct icon and text', () => {
    renderWithProviders(<VoiceFeedbackButton />);

    expect(screen.getByTestId('feedback-icon')).toBeInTheDocument();
    expect(screen.getByText(/feedback/i)).toBeInTheDocument();
  });

  it('opens feedback modal when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceFeedbackButton />,
      { 
        lastCommand: 'go to dashboard',
        lastConfidence: 0.85 
      }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
    await user.click(feedbackButton);

    await waitFor(() => {
      expect(screen.getByTestId('voice-feedback-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-command')).toHaveTextContent('go to dashboard');
      expect(screen.getByTestId('modal-confidence')).toHaveTextContent('0.85');
    });
  });

  it('handles feedback submission', async () => {
    const user = userEvent.setup();
    const mockOnFeedbackSubmit = jest.fn();
    
    renderWithProviders(
      <VoiceFeedbackButton onFeedbackSubmit={mockOnFeedbackSubmit} />,
      { 
        lastCommand: 'create invoice',
        lastConfidence: 0.92 
      }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
    await user.click(feedbackButton);

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      return user.click(submitButton);
    });

    expect(mockOnFeedbackSubmit).toHaveBeenCalledWith({
      rating: 4,
      comment: 'Test feedback'
    });

    // Modal should close after submission
    await waitFor(() => {
      expect(screen.queryByTestId('voice-feedback-modal')).not.toBeInTheDocument();
    });
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackButton />);

    const feedbackButton = screen.getByLabelText(/give feedback/i);
    await user.click(feedbackButton);

    await waitFor(() => {
      const closeButton = screen.getByText('Close');
      return user.click(closeButton);
    });

    expect(screen.queryByTestId('voice-feedback-modal')).not.toBeInTheDocument();
  });

  it('is disabled when no command has been executed', () => {
    renderWithProviders(
      <VoiceFeedbackButton />,
      { lastCommand: null }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
    expect(feedbackButton).toBeDisabled();
  });

  it('is enabled when a command has been executed', () => {
    renderWithProviders(
      <VoiceFeedbackButton />,
      { 
        lastCommand: 'show clients',
        lastConfidence: 0.78 
      }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
    expect(feedbackButton).not.toBeDisabled();
  });

  it('shows tooltip with command information', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceFeedbackButton />,
      { 
        lastCommand: 'go to settings',
        lastConfidence: 0.95 
      }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
    await user.hover(feedbackButton);

    await waitFor(() => {
      expect(screen.getByText(/give feedback for: "go to settings"/i)).toBeInTheDocument();
      expect(screen.getByText(/confidence: 95%/i)).toBeInTheDocument();
    });
  });

  it('supports different button variants', () => {
    const { rerender } = renderWithProviders(
      <VoiceFeedbackButton variant="primary" />,
      { lastCommand: 'test command' }
    );

    let feedbackButton = screen.getByLabelText(/give feedback/i);
    expect(feedbackButton).toHaveClass('btn-primary');

    rerender(
      <BrowserRouter>
        <VoiceAssistantProvider initialState={{ lastCommand: 'test command' }}>
          <VoiceFeedbackButton variant="secondary" />
        </VoiceAssistantProvider>
      </BrowserRouter>
    );

    feedbackButton = screen.getByLabelText(/give feedback/i);
    expect(feedbackButton).toHaveClass('btn-secondary');
  });

  it('supports different sizes', () => {
    const { rerender } = renderWithProviders(
      <VoiceFeedbackButton size="sm" />,
      { lastCommand: 'test command' }
    );

    let feedbackButton = screen.getByLabelText(/give feedback/i);
    expect(feedbackButton).toHaveClass('btn-sm');

    rerender(
      <BrowserRouter>
        <VoiceAssistantProvider initialState={{ lastCommand: 'test command' }}>
          <VoiceFeedbackButton size="lg" />
        </VoiceAssistantProvider>
      </BrowserRouter>
    );

    feedbackButton = screen.getByLabelText(/give feedback/i);
    expect(feedbackButton).toHaveClass('btn-lg');
  });

  it('handles keyboard navigation', async () => {
    renderWithProviders(
      <VoiceFeedbackButton />,
      { lastCommand: 'test command' }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
    
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
      { lastCommand: 'test command' }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
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
      { lastCommand: 'test command' }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
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
      { lastCommand: 'test command' }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
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
      { lastCommand: 'test command' }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
    expect(feedbackButton).toHaveClass('custom-feedback-btn');
    expect(feedbackButton).toHaveStyle('background-color: red');
  });

  it('shows feedback count when available', () => {
    renderWithProviders(
      <VoiceFeedbackButton showCount={true} />,
      { 
        lastCommand: 'test command',
        feedbackCount: 5 
      }
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByLabelText(/5 feedback items/i)).toBeInTheDocument();
  });

  it('handles rapid clicks gracefully', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceFeedbackButton />,
      { lastCommand: 'test command' }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
    
    // Rapid clicks
    await user.click(feedbackButton);
    await user.click(feedbackButton);
    await user.click(feedbackButton);

    // Should only open one modal
    const modals = screen.getAllByTestId('voice-feedback-modal');
    expect(modals).toHaveLength(1);
  });

  it('updates when voice state changes', () => {
    const { rerender } = renderWithProviders(
      <VoiceFeedbackButton />,
      { lastCommand: null }
    );

    let feedbackButton = screen.getByLabelText(/give feedback/i);
    expect(feedbackButton).toBeDisabled();

    rerender(
      <BrowserRouter>
        <VoiceAssistantProvider initialState={{ lastCommand: 'new command' }}>
          <VoiceFeedbackButton />
        </VoiceAssistantProvider>
      </BrowserRouter>
    );

    feedbackButton = screen.getByLabelText(/give feedback/i);
    expect(feedbackButton).not.toBeDisabled();
  });

  it('has proper ARIA attributes', () => {
    renderWithProviders(
      <VoiceFeedbackButton />,
      { lastCommand: 'test command' }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
    expect(feedbackButton).toHaveAttribute('role', 'button');
    expect(feedbackButton).toHaveAttribute('aria-describedby');
  });

  it('supports icon-only mode', () => {
    renderWithProviders(
      <VoiceFeedbackButton iconOnly={true} />,
      { lastCommand: 'test command' }
    );

    expect(screen.getByTestId('feedback-icon')).toBeInTheDocument();
    expect(screen.queryByText(/feedback/i)).not.toBeInTheDocument();
  });

  it('handles voice assistant disabled state', () => {
    renderWithProviders(
      <VoiceFeedbackButton />,
      { 
        isEnabled: false,
        lastCommand: 'test command' 
      }
    );

    const feedbackButton = screen.getByLabelText(/give feedback/i);
    expect(feedbackButton).toBeDisabled();
    expect(feedbackButton).toHaveAttribute('title', /voice assistant is disabled/i);
  });
});