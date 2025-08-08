// Real test for VoiceActivationButton without custom mocks
// This test bypasses the problematic custom mock system

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Create mock functions
const mockActivateVoice = jest.fn().mockResolvedValue();
const mockDeactivateVoice = jest.fn().mockResolvedValue();

// Mock the VoiceAssistantProvider with a function that returns current state
const mockUseVoiceAssistant = jest.fn();

jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => mockUseVoiceAssistant()
}));

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className, 'data-testid': testId }) => (
    <div className={className} data-testid={testId || 'microphone-icon'}>Mic</div>
  ),
  StopIcon: ({ className, 'data-testid': testId }) => (
    <div className={className} data-testid={testId || 'stop-icon'}>Stop</div>
  )
}));

import VoiceActivationButton from '@/components/voice/VoiceActivationButton';

describe('VoiceActivationButton Real Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default mock state
    mockUseVoiceAssistant.mockReturnValue({
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

  it('debug: verify mock is working', () => {
    // Test that our mock state is being used
    mockUseVoiceAssistant.mockReturnValue({
      isListening: true,
      isProcessing: false,
      isEnabled: true,
      microphonePermission: 'granted',
      activateVoice: mockActivateVoice,
      deactivateVoice: mockDeactivateVoice,
      error: null,
      command: '',
      response: ''
    });
    
    render(<VoiceActivationButton />);
    
    const button = screen.getByRole('button');
    console.log('Button HTML:', button.outerHTML);
    console.log('Button disabled:', button.disabled);
    console.log('Button classes:', button.className);
    
    // This should pass if our mock is working
    expect(button).toBeInTheDocument();
  });



  it('renders correctly when not listening', () => {
    render(<VoiceActivationButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'Start voice command - Click to speak');
    
    // Should show microphone icon when not listening
    const microphoneIcon = screen.getByTestId('microphone-icon');
    expect(microphoneIcon).toBeInTheDocument();
  });

  it('renders correctly when listening', () => {
    // Set state to listening
    mockUseVoiceAssistant.mockReturnValue({
      isListening: true,
      isProcessing: false,
      isEnabled: true,
      microphonePermission: 'granted',
      activateVoice: mockActivateVoice,
      deactivateVoice: mockDeactivateVoice,
      error: null,
      command: '',
      response: ''
    });
    
    render(<VoiceActivationButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'Stop listening - Click to stop voice recognition');
    
    // Should show stop icon when listening
    const stopIcon = screen.getByTestId('stop-icon');
    expect(stopIcon).toBeInTheDocument();
  });

  it('is disabled when voice assistant is disabled', () => {
    // Set state to disabled
    mockUseVoiceAssistant.mockReturnValue({
      isListening: false,
      isProcessing: false,
      isEnabled: false,
      microphonePermission: 'granted',
      activateVoice: mockActivateVoice,
      deactivateVoice: mockDeactivateVoice,
      error: null,
      command: '',
      response: ''
    });
    
    render(<VoiceActivationButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'Voice assistant is disabled');
  });

  it('is disabled when microphone permission is denied', () => {
    // Set microphone permission to denied
    mockUseVoiceAssistant.mockReturnValue({
      isListening: false,
      isProcessing: false,
      isEnabled: true,
      microphonePermission: 'denied',
      activateVoice: mockActivateVoice,
      deactivateVoice: mockDeactivateVoice,
      error: null,
      command: '',
      response: ''
    });
    
    render(<VoiceActivationButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'Microphone access denied. Please enable microphone permissions.');
  });

  it('calls activateVoice when clicked and not listening', async () => {
    render(<VoiceActivationButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockActivateVoice).toHaveBeenCalledTimes(1);
    });
    expect(mockDeactivateVoice).not.toHaveBeenCalled();
  });

  it('calls deactivateVoice when clicked and listening', async () => {
    // Set state to listening
    mockUseVoiceAssistant.mockReturnValue({
      isListening: true,
      isProcessing: false,
      isEnabled: true,
      microphonePermission: 'granted',
      activateVoice: mockActivateVoice,
      deactivateVoice: mockDeactivateVoice,
      error: null,
      command: '',
      response: ''
    });
    
    render(<VoiceActivationButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockDeactivateVoice).toHaveBeenCalledTimes(1);
    });
    expect(mockActivateVoice).not.toHaveBeenCalled();
  });

  it('calls custom onClick handler when provided', async () => {
    const customOnClick = jest.fn();
    render(<VoiceActivationButton onClick={customOnClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(customOnClick).toHaveBeenCalledTimes(1);
      expect(mockActivateVoice).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call voice functions when disabled', () => {
    // Set state to disabled
    mockUseVoiceAssistant.mockReturnValue({
      isListening: false,
      isProcessing: false,
      isEnabled: false,
      microphonePermission: 'granted',
      activateVoice: mockActivateVoice,
      deactivateVoice: mockDeactivateVoice,
      error: null,
      command: '',
      response: ''
    });
    
    render(<VoiceActivationButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockActivateVoice).not.toHaveBeenCalled();
    expect(mockDeactivateVoice).not.toHaveBeenCalled();
  });
});