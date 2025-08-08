// Mock useVoiceAssistant hook
const mockActivateVoice = jest.fn();
const mockDeactivateVoice = jest.fn();

// Create a mock state object that we can modify in tests
const mockVoiceAssistantState = {
  isListening: false,
  isProcessing: false,
  isEnabled: true,
  microphonePermission: 'granted',
  activateVoice: mockActivateVoice,
  deactivateVoice: mockDeactivateVoice,
  error: null,
  command: '',
  response: ''
};

jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => mockVoiceAssistantState,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Voice from '@/components/voice/Voice';
import '@/__tests__/config/voiceTestSetup';

// Local renderWithProviders function
const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('Voice Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state to defaults
    Object.assign(mockVoiceAssistantState, {
      isListening: false,
      isProcessing: false,
      isEnabled: true,
      microphonePermission: 'granted',
      activateVoice: mockActivateVoice,
      deactivateVoice: mockDeactivateVoice,
      error: null,
      command: '',
      response: ''
    });
  });

  it('renders voice component in button mode by default', () => {
    renderWithProviders(<Voice />);

    const voiceButton = screen.getByRole('button');
    expect(voiceButton).toBeInTheDocument();
  });



  it('renders voice component in floating mode', () => {
    renderWithProviders(<Voice mode="floating" />);

    const voiceComponent = screen.getByTestId('voice-component');
    expect(voiceComponent).toBeInTheDocument();
  });

  it('renders voice component in indicator mode', () => {
    renderWithProviders(<Voice mode="indicator" />);

    const voiceComponent = screen.getByTestId('voice-component');
    expect(voiceComponent).toBeInTheDocument();
  });

  it('shows listening state when voice is active', () => {
    mockVoiceAssistantState.isListening = true;
    
    renderWithProviders(<Voice />);

    const voiceButton = screen.getByRole('button');
    expect(voiceButton).toBeInTheDocument();
  });

  it('shows processing state', () => {
    mockVoiceAssistantState.isProcessing = true;
    
    renderWithProviders(<Voice />);

    const voiceButton = screen.getByRole('button');
    expect(voiceButton).toBeInTheDocument();
  });

  it('handles voice activation click', async () => {
    // Clear any previous calls
    mockActivateVoice.mockClear();
    
    const user = userEvent.setup();
    renderWithProviders(<Voice />);

    const button = screen.getByRole('button');
    
    // Verify button exists and is not disabled
    expect(button).toBeInTheDocument();
    expect(button.disabled).toBe(false);
    
    // Click the button using userEvent
    await user.click(button);
    
    // The VoiceActivationButton calls activateVoice directly in its handleActivation method
    // This should trigger our mock function
    expect(mockActivateVoice).toHaveBeenCalledTimes(1);
  });

  it('handles voice deactivation when listening', async () => {
    const user = userEvent.setup();
    const mockDeactivateVoice = jest.fn();
    mockVoiceAssistantState.isListening = true;
    mockVoiceAssistantState.deactivateVoice = mockDeactivateVoice;
    
    renderWithProviders(<Voice />);

    const voiceButton = screen.getByRole('button');
    await user.click(voiceButton);
    
    expect(mockDeactivateVoice).toHaveBeenCalled();
  });

  it('displays error message when error occurs', () => {
    mockVoiceAssistantState.error = 'Microphone access denied';
    
    renderWithProviders(<Voice />);

    expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    renderWithProviders(<Voice className="custom-voice" />);

    const voiceComponent = screen.getByTestId('voice-component');
    expect(voiceComponent).toHaveClass('custom-voice');
  });

  it('shows microphone icon when not listening', () => {
    renderWithProviders(<Voice />);

    const micIcon = screen.getByTestId('microphone-icon');
    expect(micIcon).toBeInTheDocument();
  });

  it('shows stop icon when listening', () => {
    mockVoiceAssistantState.isListening = true;
    
    renderWithProviders(<Voice />);

    const stopIcon = screen.getByTestId('stop-icon');
    expect(stopIcon).toBeInTheDocument();
  });

  it('shows processing state correctly', () => {
    mockVoiceAssistantState.isProcessing = true;
    
    renderWithProviders(<Voice />);

    const voiceButton = screen.getByRole('button');
    expect(voiceButton).toBeInTheDocument();
  });

  it('handles floating mode correctly', () => {
    renderWithProviders(<Voice mode="floating" />);

    const voiceComponent = screen.getByTestId('voice-component');
    expect(voiceComponent).toBeInTheDocument();
  });

  it('shows correct tooltip text based on state', () => {
    renderWithProviders(<Voice />);

    const voiceButton = screen.getByRole('button');
    expect(voiceButton).toHaveAttribute('title', 'Start voice command - Click to speak');
  });

  it('shows stop tooltip when listening', () => {
    mockVoiceAssistantState.isListening = true;
    
    renderWithProviders(<Voice />);

    const voiceButton = screen.getByRole('button');
    expect(voiceButton).toHaveAttribute('title', 'Stop listening - Click to stop voice recognition');
  });

  it('shows disabled state when voice assistant is disabled', () => {
    mockVoiceAssistantState.isEnabled = false;
    
    renderWithProviders(<Voice />);

    const voiceButton = screen.getByRole('button');
    expect(voiceButton).toHaveAttribute('title', 'Voice assistant is disabled');
  });

  it('renders indicator mode correctly', () => {
    mockVoiceAssistantState.isListening = true;
    
    renderWithProviders(<Voice mode="indicator" />);

    const voiceComponent = screen.getByTestId('voice-component');
    expect(voiceComponent).toBeInTheDocument();
  });
});
