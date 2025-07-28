import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Voice from '@/features/voice/components/Voice';
import { VoiceAssistantProvider } from '@/features/voice/providers/VoiceAssistantProvider';

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <VoiceAssistantProvider>
        {component}
      </VoiceAssistantProvider>
    </BrowserRouter>
  );
};

describe('Voice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Web Speech API
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

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }]
        })
      },
      writable: true,
    });
  });

  it('renders voice interface correctly', () => {
    renderWithProviders(<Voice />);

    expect(screen.getByText(/voice assistant/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /activate voice/i })).toBeInTheDocument();
  });

  it('shows voice activation button', () => {
    renderWithProviders(<Voice />);

    const activationButton = screen.getByRole('button', { name: /activate voice/i });
    expect(activationButton).toBeInTheDocument();
    expect(activationButton).not.toBeDisabled();
  });

  it('displays voice indicator when listening', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const activationButton = screen.getByRole('button', { name: /activate voice/i });
    await user.click(activationButton);

    expect(screen.getByTestId('voice-indicator')).toBeInTheDocument();
    expect(screen.getByText(/listening/i)).toBeInTheDocument();
  });

  it('shows command help when help button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const helpButton = screen.getByRole('button', { name: /voice commands help/i });
    await user.click(helpButton);

    expect(screen.getByText(/available voice commands/i)).toBeInTheDocument();
  });

  it('handles voice recognition start and stop', async () => {
    const user = userEvent.setup();
    const mockRecognition = new global.SpeechRecognition();
    
    renderWithProviders(<Voice />);

    const activationButton = screen.getByRole('button', { name: /activate voice/i });
    
    // Start recognition
    await user.click(activationButton);
    expect(mockRecognition.start).toHaveBeenCalled();

    // Stop recognition
    await user.click(activationButton);
    expect(mockRecognition.stop).toHaveBeenCalled();
  });

  it('processes voice commands correctly', async () => {
    const user = userEvent.setup();
    const mockRecognition = new global.SpeechRecognition();
    
    renderWithProviders(<Voice />);

    await user.click(screen.getByRole('button', { name: /activate voice/i }));

    // Simulate voice recognition result
    const resultEvent = {
      results: [{
        0: { transcript: 'go to dashboard' },
        isFinal: true
      }]
    };

    mockRecognition.addEventListener.mock.calls
      .find(call => call[0] === 'result')[1](resultEvent);

    await waitFor(() => {
      expect(screen.getByText(/processing command/i)).toBeInTheDocument();
    });
  });

  it('shows error messages for recognition failures', async () => {
    const user = userEvent.setup();
    const mockRecognition = new global.SpeechRecognition();
    
    renderWithProviders(<Voice />);

    await user.click(screen.getByRole('button', { name: /activate voice/i }));

    // Simulate recognition error
    const errorEvent = { error: 'network' };
    mockRecognition.addEventListener.mock.calls
      .find(call => call[0] === 'error')[1](errorEvent);

    await waitFor(() => {
      expect(screen.getByText(/voice recognition error/i)).toBeInTheDocument();
    });
  });

  it('handles microphone permission requests', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const activationButton = screen.getByRole('button', { name: /activate voice/i });
    await user.click(activationButton);

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true
    });
  });

  it('shows permission denied message', async () => {
    const user = userEvent.setup();
    navigator.mediaDevices.getUserMedia.mockRejectedValue(
      new Error('Permission denied')
    );

    renderWithProviders(<Voice />);

    const activationButton = screen.getByRole('button', { name: /activate voice/i });
    await user.click(activationButton);

    await waitFor(() => {
      expect(screen.getByText(/microphone permission denied/i)).toBeInTheDocument();
    });
  });

  it('displays voice feedback button', () => {
    renderWithProviders(<Voice />);

    const feedbackButton = screen.getByRole('button', { name: /voice feedback/i });
    expect(feedbackButton).toBeInTheDocument();
  });

  it('opens feedback modal when feedback button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const feedbackButton = screen.getByRole('button', { name: /voice feedback/i });
    await user.click(feedbackButton);

    expect(screen.getByRole('dialog', { name: /voice feedback/i })).toBeInTheDocument();
  });

  it('shows voice onboarding for new users', () => {
    // Mock first-time user
    localStorage.getItem = jest.fn().mockReturnValue(null);

    renderWithProviders(<Voice />);

    expect(screen.getByText(/welcome to voice assistant/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start onboarding/i })).toBeInTheDocument();
  });

  it('skips onboarding for returning users', () => {
    // Mock returning user
    localStorage.getItem = jest.fn().mockReturnValue('true');

    renderWithProviders(<Voice />);

    expect(screen.queryByText(/welcome to voice assistant/i)).not.toBeInTheDocument();
  });

  it('shows demo mode option', () => {
    renderWithProviders(<Voice />);

    const demoButton = screen.getByRole('button', { name: /try demo/i });
    expect(demoButton).toBeInTheDocument();
  });

  it('launches demo when demo button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const demoButton = screen.getByRole('button', { name: /try demo/i });
    await user.click(demoButton);

    expect(screen.getByText(/voice assistant demo/i)).toBeInTheDocument();
  });

  it('displays voice settings', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const settingsButton = screen.getByRole('button', { name: /voice settings/i });
    await user.click(settingsButton);

    expect(screen.getByText(/voice configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/language/i)).toBeInTheDocument();
    expect(screen.getByText(/sensitivity/i)).toBeInTheDocument();
  });

  it('handles language selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const settingsButton = screen.getByRole('button', { name: /voice settings/i });
    await user.click(settingsButton);

    const languageSelect = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelect, 'es-ES');

    expect(languageSelect).toHaveValue('es-ES');
  });

  it('adjusts voice sensitivity', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const settingsButton = screen.getByRole('button', { name: /voice settings/i });
    await user.click(settingsButton);

    const sensitivitySlider = screen.getByRole('slider', { name: /sensitivity/i });
    fireEvent.change(sensitivitySlider, { target: { value: '0.8' } });

    expect(sensitivitySlider).toHaveValue('0.8');
  });

  it('shows voice command history', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const historyButton = screen.getByRole('button', { name: /command history/i });
    await user.click(historyButton);

    expect(screen.getByText(/recent commands/i)).toBeInTheDocument();
  });

  it('clears command history', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const historyButton = screen.getByRole('button', { name: /command history/i });
    await user.click(historyButton);

    const clearButton = screen.getByRole('button', { name: /clear history/i });
    await user.click(clearButton);

    expect(screen.getByText(/history cleared/i)).toBeInTheDocument();
  });

  it('supports keyboard shortcuts', () => {
    renderWithProviders(<Voice />);

    // Test voice activation shortcut
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true });

    expect(screen.getByText(/listening/i)).toBeInTheDocument();
  });

  it('shows voice status in header', () => {
    renderWithProviders(<Voice />);

    const statusIndicator = screen.getByTestId('voice-status');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator).toHaveTextContent(/ready/i);
  });

  it('handles continuous listening mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const settingsButton = screen.getByRole('button', { name: /voice settings/i });
    await user.click(settingsButton);

    const continuousToggle = screen.getByRole('checkbox', { name: /continuous listening/i });
    await user.click(continuousToggle);

    expect(continuousToggle).toBeChecked();
  });

  it('shows voice analytics', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const analyticsButton = screen.getByRole('button', { name: /voice analytics/i });
    await user.click(analyticsButton);

    expect(screen.getByText(/usage statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/command success rate/i)).toBeInTheDocument();
  });

  it('handles voice command suggestions', async () => {
    const user = userEvent.setup();
    const mockRecognition = new global.SpeechRecognition();
    
    renderWithProviders(<Voice />);

    await user.click(screen.getByRole('button', { name: /activate voice/i }));

    // Simulate low confidence result
    const resultEvent = {
      results: [{
        0: { transcript: 'go to dashbord', confidence: 0.3 },
        isFinal: true
      }]
    };

    mockRecognition.addEventListener.mock.calls
      .find(call => call[0] === 'result')[1](resultEvent);

    await waitFor(() => {
      expect(screen.getByText(/did you mean/i)).toBeInTheDocument();
      expect(screen.getByText(/go to dashboard/i)).toBeInTheDocument();
    });
  });

  it('provides accessibility features', () => {
    renderWithProviders(<Voice />);

    // Check ARIA labels
    const voiceRegion = screen.getByRole('region', { name: /voice assistant/i });
    expect(voiceRegion).toBeInTheDocument();

    const activationButton = screen.getByRole('button', { name: /activate voice/i });
    expect(activationButton).toHaveAttribute('aria-describedby');
  });

  it('handles offline mode', () => {
    // Mock offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    renderWithProviders(<Voice />);

    expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
    expect(screen.getByText(/voice features limited/i)).toBeInTheDocument();
  });

  it('shows browser compatibility warnings', () => {
    // Mock unsupported browser
    delete global.SpeechRecognition;
    delete global.webkitSpeechRecognition;

    renderWithProviders(<Voice />);

    expect(screen.getByText(/voice recognition not supported/i)).toBeInTheDocument();
    expect(screen.getByText(/upgrade your browser/i)).toBeInTheDocument();
  });

  it('handles voice command timeout', async () => {
    const user = userEvent.setup();
    const mockRecognition = new global.SpeechRecognition();
    
    renderWithProviders(<Voice />);

    await user.click(screen.getByRole('button', { name: /activate voice/i }));

    // Simulate timeout
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(screen.getByText(/listening timeout/i)).toBeInTheDocument();
    });
  });

  it('provides voice training mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const trainingButton = screen.getByRole('button', { name: /voice training/i });
    await user.click(trainingButton);

    expect(screen.getByText(/improve recognition/i)).toBeInTheDocument();
    expect(screen.getByText(/repeat these phrases/i)).toBeInTheDocument();
  });

  it('shows voice command confidence levels', async () => {
    const user = userEvent.setup();
    const mockRecognition = new global.SpeechRecognition();
    
    renderWithProviders(<Voice />);

    await user.click(screen.getByRole('button', { name: /activate voice/i }));

    const resultEvent = {
      results: [{
        0: { transcript: 'go to dashboard', confidence: 0.95 },
        isFinal: true
      }]
    };

    mockRecognition.addEventListener.mock.calls
      .find(call => call[0] === 'result')[1](resultEvent);

    await waitFor(() => {
      expect(screen.getByText(/confidence: 95%/i)).toBeInTheDocument();
    });
  });

  it('handles multiple voice commands in sequence', async () => {
    const user = userEvent.setup();
    const mockRecognition = new global.SpeechRecognition();
    
    renderWithProviders(<Voice />);

    await user.click(screen.getByRole('button', { name: /activate voice/i }));

    // First command
    const firstResult = {
      results: [{
        0: { transcript: 'go to dashboard' },
        isFinal: true
      }]
    };

    mockRecognition.addEventListener.mock.calls
      .find(call => call[0] === 'result')[1](firstResult);

    await waitFor(() => {
      expect(screen.getByText(/processing command/i)).toBeInTheDocument();
    });

    // Second command
    const secondResult = {
      results: [{
        0: { transcript: 'create invoice' },
        isFinal: true
      }]
    };

    mockRecognition.addEventListener.mock.calls
      .find(call => call[0] === 'result')[1](secondResult);

    await waitFor(() => {
      expect(screen.getByText(/command queue: 2/i)).toBeInTheDocument();
    });
  });

  it('provides voice command export functionality', async () => {
    const user = userEvent.setup();
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

    renderWithProviders(<Voice />);

    const exportButton = screen.getByRole('button', { name: /export voice data/i });
    await user.click(exportButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});