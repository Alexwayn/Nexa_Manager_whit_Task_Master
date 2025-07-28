import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import FloatingMicrophone from '@/features/voice/components/FloatingMicrophone';
import { VoiceAssistantProvider } from '@/features/voice/providers/VoiceAssistantProvider';

// Mock the VoiceFeedbackModal
jest.mock('@/features/voice/components/VoiceFeedbackModal', () => {
  return function MockVoiceFeedbackModal({ isOpen, onClose, onSubmit }) {
    if (!isOpen) return null;
    return (
      <div data-testid="voice-feedback-modal">
        <button onClick={onClose}>Close Modal</button>
        <button onClick={() => onSubmit({ rating: 5, comment: 'Test' })}>
          Submit Feedback
        </button>
      </div>
    );
  };
});

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <VoiceAssistantProvider>
        {component}
      </VoiceAssistantProvider>
    </BrowserRouter>
  );
};

describe('FloatingMicrophone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }]
        })
      },
      writable: true
    });

    // Mock SpeechRecognition
    global.SpeechRecognition = jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      continuous: false,
      interimResults: false,
      lang: 'en-US'
    }));

    global.webkitSpeechRecognition = global.SpeechRecognition;
  });

  it('renders floating microphone button', () => {
    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    expect(micButton).toBeInTheDocument();
    expect(micButton).toHaveClass('floating-microphone');
  });

  it('shows correct icon based on voice state', async () => {
    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    
    // Initially should show microphone icon
    expect(screen.getByTestId('microphone-icon')).toBeInTheDocument();

    // Click to start listening
    fireEvent.click(micButton);

    await waitFor(() => {
      expect(screen.getByTestId('listening-icon')).toBeInTheDocument();
    });
  });

  it('toggles voice recognition on click', async () => {
    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    
    // Start listening
    fireEvent.click(micButton);
    
    await waitFor(() => {
      expect(micButton).toHaveAttribute('aria-pressed', 'true');
    });

    // Stop listening
    fireEvent.click(micButton);
    
    await waitFor(() => {
      expect(micButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('shows feedback button after command execution', async () => {
    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    fireEvent.click(micButton);

    // Simulate command execution
    await waitFor(() => {
      // After a command is processed, feedback button should appear
      expect(screen.getByLabelText(/give feedback/i)).toBeInTheDocument();
    });
  });

  it('opens feedback modal when feedback button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FloatingMicrophone />);

    // First trigger a command to show feedback button
    const micButton = screen.getByLabelText(/voice assistant/i);
    fireEvent.click(micButton);

    await waitFor(() => {
      const feedbackButton = screen.getByLabelText(/give feedback/i);
      return user.click(feedbackButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('voice-feedback-modal')).toBeInTheDocument();
    });
  });

  it('handles feedback submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FloatingMicrophone />);

    // Trigger command and open feedback modal
    const micButton = screen.getByLabelText(/voice assistant/i);
    fireEvent.click(micButton);

    await waitFor(() => {
      const feedbackButton = screen.getByLabelText(/give feedback/i);
      return user.click(feedbackButton);
    });

    await waitFor(() => {
      const submitButton = screen.getByText('Submit Feedback');
      return user.click(submitButton);
    });

    // Modal should close after submission
    await waitFor(() => {
      expect(screen.queryByTestId('voice-feedback-modal')).not.toBeInTheDocument();
    });
  });

  it('shows processing state during command execution', async () => {
    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    fireEvent.click(micButton);

    // Simulate processing state
    await waitFor(() => {
      expect(screen.getByTestId('processing-icon')).toBeInTheDocument();
    });
  });

  it('displays error state when recognition fails', async () => {
    // Mock recognition error
    global.SpeechRecognition = jest.fn().mockImplementation(() => ({
      start: jest.fn().mockImplementation(function() {
        setTimeout(() => {
          this.onerror({ error: 'network' });
        }, 100);
      }),
      stop: jest.fn(),
      abort: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));

    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    fireEvent.click(micButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });
  });

  it('handles permission denied gracefully', async () => {
    // Mock permission denied
    navigator.mediaDevices.getUserMedia.mockRejectedValue(
      new Error('Permission denied')
    );

    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    fireEvent.click(micButton);

    await waitFor(() => {
      expect(screen.getByText(/microphone permission required/i)).toBeInTheDocument();
    });
  });

  it('shows tooltip on hover', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    await user.hover(micButton);

    await waitFor(() => {
      expect(screen.getByText(/click to start voice commands/i)).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation', async () => {
    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    
    // Focus the button
    micButton.focus();
    expect(micButton).toHaveFocus();

    // Activate with Enter key
    fireEvent.keyDown(micButton, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(micButton).toHaveAttribute('aria-pressed', 'true');
    });

    // Activate with Space key
    fireEvent.keyDown(micButton, { key: ' ', code: 'Space' });
    
    await waitFor(() => {
      expect(micButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('maintains position during scroll', () => {
    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    expect(micButton).toHaveStyle('position: fixed');
    expect(micButton).toHaveStyle('bottom: 2rem');
    expect(micButton).toHaveStyle('right: 2rem');

    // Simulate scroll
    fireEvent.scroll(window, { target: { scrollY: 500 } });

    // Button should maintain its position
    expect(micButton).toHaveStyle('position: fixed');
  });

  it('shows pulse animation during listening', async () => {
    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    fireEvent.click(micButton);

    await waitFor(() => {
      expect(micButton).toHaveClass('listening');
      expect(micButton).toHaveClass('pulse');
    });
  });

  it('handles rapid clicks gracefully', async () => {
    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    
    // Rapid clicks
    fireEvent.click(micButton);
    fireEvent.click(micButton);
    fireEvent.click(micButton);

    // Should not cause errors and maintain consistent state
    await waitFor(() => {
      expect(micButton).toBeInTheDocument();
    });
  });

  it('cleans up resources on unmount', () => {
    const { unmount } = renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    fireEvent.click(micButton);

    unmount();

    // Should not cause memory leaks or errors
    expect(true).toBe(true); // Test passes if no errors thrown
  });

  it('adapts to mobile viewport', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    expect(micButton).toHaveClass('mobile');
  });

  it('shows command suggestions after failed recognition', async () => {
    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    fireEvent.click(micButton);

    // Simulate failed command recognition
    await waitFor(() => {
      expect(screen.getByText(/try saying/i)).toBeInTheDocument();
      expect(screen.getByText(/go to dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/create invoice/i)).toBeInTheDocument();
    });
  });

  it('handles voice assistant disabled state', () => {
    // Mock disabled context
    const DisabledProvider = ({ children }) => (
      <VoiceAssistantProvider initialState={{ isEnabled: false }}>
        {children}
      </VoiceAssistantProvider>
    );

    render(
      <BrowserRouter>
        <DisabledProvider>
          <FloatingMicrophone />
        </DisabledProvider>
      </BrowserRouter>
    );

    const micButton = screen.getByLabelText(/voice assistant/i);
    expect(micButton).toBeDisabled();
    expect(micButton).toHaveAttribute('aria-label', 'Voice assistant (disabled)');
  });

  it('shows confidence indicator for recognized commands', async () => {
    renderWithProviders(<FloatingMicrophone />);

    const micButton = screen.getByLabelText(/voice assistant/i);
    fireEvent.click(micButton);

    // Simulate command recognition with confidence
    await waitFor(() => {
      expect(screen.getByText(/confidence: 85%/i)).toBeInTheDocument();
    });
  });

  it('handles multiple feedback sessions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FloatingMicrophone />);

    // First feedback session
    const micButton = screen.getByLabelText(/voice assistant/i);
    fireEvent.click(micButton);

    await waitFor(async () => {
      const feedbackButton = screen.getByLabelText(/give feedback/i);
      await user.click(feedbackButton);
    });

    await waitFor(async () => {
      const submitButton = screen.getByText('Submit Feedback');
      await user.click(submitButton);
    });

    // Second feedback session
    fireEvent.click(micButton);

    await waitFor(async () => {
      const feedbackButton = screen.getByLabelText(/give feedback/i);
      await user.click(feedbackButton);
    });

    expect(screen.getByTestId('voice-feedback-modal')).toBeInTheDocument();
  });
});