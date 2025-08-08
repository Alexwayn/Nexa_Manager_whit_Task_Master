import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock the VoiceAssistantProvider module BEFORE importing the component
jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: jest.fn(),
  VoiceAssistantProvider: ({ children }) => children
}));

import FloatingMicrophone from '@/features/voice/components/FloatingMicrophone';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';

// Get the mocked function
const mockUseVoiceAssistant = useVoiceAssistant;

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }) => <div data-testid="microphone-icon" className={className}>🎤</div>,
  StopIcon: ({ className }) => <div data-testid="stop-icon" className={className}>⏹️</div>
}));

// Default mock values (matching the working test)
const defaultMockValues = {
  isEnabled: true,
  isListening: false,
  isProcessing: false,
  microphonePermission: 'granted',
  error: null,
  startListening: jest.fn(),
  stopListening: jest.fn(),
  isRecording: false,
  transcript: '',
  confidence: 0,
  lastCommand: null,
  isCommandExecuting: false,
  commandHistory: [],
  settings: {
    language: 'en-US',
    autoStart: false,
    continuousMode: false,
    noiseReduction: true,
    echoCancellation: true
  },
  initializeVoiceAssistant: jest.fn(),
  cleanup: jest.fn(),
  executeCommand: jest.fn(),
  updateSettings: jest.fn(),
  clearTranscript: jest.fn(),
  clearError: jest.fn()
};

describe('FloatingMicrophone Working Test', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set default mock return value
    mockUseVoiceAssistant.mockReturnValue(defaultMockValues);
    
    // Mock window.innerWidth for mobile detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  // Helper function to render with router and mocked provider
  const renderWithMockedProvider = (component, customMockValues = {}) => {
    const mockValues = { ...defaultMockValues, ...customMockValues };
    mockUseVoiceAssistant.mockReturnValue(mockValues);
    
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should render the floating microphone button', () => {
    console.error('Before render - Mock calls:', mockUseVoiceAssistant.mock.calls.length);
    
    const { container } = renderWithMockedProvider(<FloatingMicrophone />);
    
    console.error('After render - Mock calls:', mockUseVoiceAssistant.mock.calls.length);
    console.error('Container HTML:', container.innerHTML);
    
    const button = screen.getByTestId('floating-microphone');
    expect(button).toBeInTheDocument();
    
    console.error('Button className:', button.className);
    console.error('Button disabled:', button.disabled);
    
    expect(button).toHaveClass('floating-microphone');
    
    // Verify the mock was called
    expect(mockUseVoiceAssistant).toHaveBeenCalled();
  });

  it('should be disabled when voice assistant is disabled', () => {
    const disabledMockValues = {
      ...defaultMockValues,
      isEnabled: false,
      microphonePermission: 'denied'
    };

    renderWithMockedProvider(<FloatingMicrophone />, disabledMockValues);
    
    const button = screen.getByTestId('floating-microphone');
    expect(button).toBeDisabled();
    expect(mockUseVoiceAssistant).toHaveBeenCalled();
  });
});
