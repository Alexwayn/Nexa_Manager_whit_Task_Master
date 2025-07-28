import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import VoiceAssistantDemo from '@/features/voice/components/VoiceAssistantDemo';
import { VoiceAssistantProvider } from '@/features/voice/providers/VoiceAssistantProvider';
import voiceAnalyticsService from '@/services/voiceAnalyticsService';

// Mock services
jest.mock('@/services/voiceAnalyticsService');

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <VoiceAssistantProvider>
        {component}
      </VoiceAssistantProvider>
    </BrowserRouter>
  );
};

describe('VoiceAssistantDemo', () => {
  const mockDemoCommands = [
    {
      id: 'demo-nav',
      command: 'go to dashboard',
      description: 'Navigate to the main dashboard',
      category: 'navigation',
      expectedResult: 'Navigates to dashboard page'
    },
    {
      id: 'demo-create',
      command: 'create new invoice',
      description: 'Create a new invoice',
      category: 'action',
      expectedResult: 'Opens invoice creation form'
    },
    {
      id: 'demo-help',
      command: 'help',
      description: 'Show available commands',
      category: 'help',
      expectedResult: 'Displays command list'
    }
  ];

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

    // Mock analytics service
    voiceAnalyticsService.trackCommand.mockResolvedValue();
    voiceAnalyticsService.trackError.mockResolvedValue();
  });

  it('renders demo interface correctly', () => {
    renderWithProviders(<VoiceAssistantDemo />);

    expect(screen.getByText(/voice assistant demo/i)).toBeInTheDocument();
    expect(screen.getByText(/try these commands/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start demo/i })).toBeInTheDocument();
  });

  it('displays demo commands list', () => {
    renderWithProviders(<VoiceAssistantDemo commands={mockDemoCommands} />);

    expect(screen.getByText('go to dashboard')).toBeInTheDocument();
    expect(screen.getByText('create new invoice')).toBeInTheDocument();
    expect(screen.getByText('help')).toBeInTheDocument();
  });

  it('starts demo mode when start button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo />);

    const startButton = screen.getByRole('button', { name: /start demo/i });
    await user.click(startButton);

    expect(screen.getByText(/demo active/i)).toBeInTheDocument();
    expect(screen.getByText(/say one of the commands/i)).toBeInTheDocument();
  });

  it('highlights current demo command', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo commands={mockDemoCommands} />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    const firstCommand = screen.getByTestId('demo-command-0');
    expect(firstCommand).toHaveClass('highlighted');
  });

  it('processes voice commands during demo', async () => {
    const user = userEvent.setup();
    const mockRecognition = new global.SpeechRecognition();
    
    renderWithProviders(<VoiceAssistantDemo commands={mockDemoCommands} />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

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
      expect(screen.getByText(/command recognized/i)).toBeInTheDocument();
    });
  });

  it('shows command execution results', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo commands={mockDemoCommands} />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    // Simulate successful command execution
    const executeButton = screen.getByRole('button', { name: /execute go to dashboard/i });
    await user.click(executeButton);

    expect(screen.getByText(/navigates to dashboard page/i)).toBeInTheDocument();
    expect(screen.getByTestId('success-indicator')).toBeInTheDocument();
  });

  it('handles demo command failures', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo commands={mockDemoCommands} />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    // Simulate command failure
    const failButton = screen.getByRole('button', { name: /simulate failure/i });
    await user.click(failButton);

    expect(screen.getByText(/command failed/i)).toBeInTheDocument();
    expect(screen.getByTestId('error-indicator')).toBeInTheDocument();
  });

  it('progresses through demo commands sequentially', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo commands={mockDemoCommands} />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    // Complete first command
    await user.click(screen.getByRole('button', { name: /next command/i }));

    const secondCommand = screen.getByTestId('demo-command-1');
    expect(secondCommand).toHaveClass('highlighted');
  });

  it('shows demo progress indicator', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo commands={mockDemoCommands} />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '3');
  });

  it('completes demo successfully', async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn();
    
    renderWithProviders(
      <VoiceAssistantDemo 
        commands={mockDemoCommands}
        onComplete={mockOnComplete}
      />
    );

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    // Complete all commands
    for (let i = 0; i < mockDemoCommands.length; i++) {
      await user.click(screen.getByRole('button', { name: /next command/i }));
    }

    expect(screen.getByText(/demo completed/i)).toBeInTheDocument();
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('allows restarting demo', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo commands={mockDemoCommands} />);

    // Complete demo
    await user.click(screen.getByRole('button', { name: /start demo/i }));
    
    for (let i = 0; i < mockDemoCommands.length; i++) {
      await user.click(screen.getByRole('button', { name: /next command/i }));
    }

    // Restart demo
    await user.click(screen.getByRole('button', { name: /restart demo/i }));

    expect(screen.getByText(/demo active/i)).toBeInTheDocument();
    const firstCommand = screen.getByTestId('demo-command-0');
    expect(firstCommand).toHaveClass('highlighted');
  });

  it('provides skip option for commands', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo commands={mockDemoCommands} />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    const skipButton = screen.getByRole('button', { name: /skip command/i });
    await user.click(skipButton);

    const secondCommand = screen.getByTestId('demo-command-1');
    expect(secondCommand).toHaveClass('highlighted');
  });

  it('shows voice recognition feedback', async () => {
    const user = userEvent.setup();
    const mockRecognition = new global.SpeechRecognition();
    
    renderWithProviders(<VoiceAssistantDemo />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    // Simulate listening state
    mockRecognition.addEventListener.mock.calls
      .find(call => call[0] === 'start')[1]();

    expect(screen.getByText(/listening/i)).toBeInTheDocument();
    expect(screen.getByTestId('listening-indicator')).toBeInTheDocument();
  });

  it('handles microphone permission errors', async () => {
    const user = userEvent.setup();
    const mockRecognition = new global.SpeechRecognition();
    
    renderWithProviders(<VoiceAssistantDemo />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    // Simulate permission error
    const errorEvent = { error: 'not-allowed' };
    mockRecognition.addEventListener.mock.calls
      .find(call => call[0] === 'error')[1](errorEvent);

    expect(screen.getByText(/microphone permission required/i)).toBeInTheDocument();
  });

  it('provides manual command input option', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    const manualButton = screen.getByRole('button', { name: /type command/i });
    await user.click(manualButton);

    const textInput = screen.getByRole('textbox', { name: /enter command/i });
    await user.type(textInput, 'go to dashboard');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(screen.getByText(/command recognized/i)).toBeInTheDocument();
  });

  it('shows command confidence scores', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    // Simulate command with confidence score
    const textInput = screen.getByRole('textbox', { name: /enter command/i });
    await user.type(textInput, 'go to dashboard');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText(/confidence: 95%/i)).toBeInTheDocument();
  });

  it('tracks demo analytics', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    expect(voiceAnalyticsService.trackCommand).toHaveBeenCalledWith(
      'demo_started',
      expect.any(Object)
    );
  });

  it('provides accessibility features', () => {
    renderWithProviders(<VoiceAssistantDemo />);

    // Check ARIA labels
    expect(screen.getByRole('region', { name: /demo controls/i })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /demo commands/i })).toBeInTheDocument();
    
    // Check keyboard navigation
    const startButton = screen.getByRole('button', { name: /start demo/i });
    startButton.focus();
    expect(startButton).toHaveFocus();
  });

  it('supports different demo modes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo mode="guided" />);

    expect(screen.getByText(/guided demo/i)).toBeInTheDocument();
    
    await user.click(screen.getByRole('button', { name: /start demo/i }));
    
    expect(screen.getByText(/follow the instructions/i)).toBeInTheDocument();
  });

  it('shows demo tips and hints', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    expect(screen.getByText(/tip:/i)).toBeInTheDocument();
    expect(screen.getByText(/speak clearly/i)).toBeInTheDocument();
  });

  it('handles demo interruption', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo />);

    await user.click(screen.getByRole('button', { name: /start demo/i }));

    const stopButton = screen.getByRole('button', { name: /stop demo/i });
    await user.click(stopButton);

    expect(screen.getByText(/demo stopped/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start demo/i })).toBeInTheDocument();
  });

  it('provides demo feedback collection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo />);

    // Complete demo
    await user.click(screen.getByRole('button', { name: /start demo/i }));
    
    for (let i = 0; i < mockDemoCommands.length; i++) {
      await user.click(screen.getByRole('button', { name: /next command/i }));
    }

    expect(screen.getByText(/how was the demo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rate demo/i })).toBeInTheDocument();
  });

  it('shows demo performance metrics', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceAssistantDemo />);

    // Complete demo
    await user.click(screen.getByRole('button', { name: /start demo/i }));
    
    for (let i = 0; i < mockDemoCommands.length; i++) {
      await user.click(screen.getByRole('button', { name: /next command/i }));
    }

    expect(screen.getByText(/demo statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/commands completed/i)).toBeInTheDocument();
    expect(screen.getByText(/success rate/i)).toBeInTheDocument();
  });

  it('supports custom demo scenarios', () => {
    const customCommands = [
      {
        id: 'custom-1',
        command: 'custom command',
        description: 'Custom demo command',
        category: 'custom'
      }
    ];

    renderWithProviders(
      <VoiceAssistantDemo 
        commands={customCommands}
        title="Custom Demo"
      />
    );

    expect(screen.getByText(/custom demo/i)).toBeInTheDocument();
    expect(screen.getByText('custom command')).toBeInTheDocument();
  });

  it('handles browser compatibility issues', () => {
    // Mock unsupported browser
    delete global.SpeechRecognition;
    delete global.webkitSpeechRecognition;

    renderWithProviders(<VoiceAssistantDemo />);

    expect(screen.getByText(/voice recognition not supported/i)).toBeInTheDocument();
    expect(screen.getByText(/try manual input/i)).toBeInTheDocument();
  });

  it('provides demo sharing functionality', async () => {
    const user = userEvent.setup();
    
    // Mock Web Share API
    global.navigator.share = jest.fn().mockResolvedValue();

    renderWithProviders(<VoiceAssistantDemo />);

    const shareButton = screen.getByRole('button', { name: /share demo/i });
    await user.click(shareButton);

    expect(global.navigator.share).toHaveBeenCalledWith({
      title: 'Voice Assistant Demo',
      text: 'Try out the voice assistant demo',
      url: expect.any(String)
    });
  });
});