import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Create the mock function before the jest.mock call
const mockUseVoiceAssistant = jest.fn();

// Mock the entire VoiceAssistantProvider module
jest.mock('@/providers/VoiceAssistantProvider', () => ({
  __esModule: true,
  useVoiceAssistant: () => mockUseVoiceAssistant(),
  VoiceAssistantProvider: ({ children }) => children,
  default: ({ children }) => children
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }) => <div data-testid="microphone-icon" className={className}>🎤</div>,
  StopIcon: ({ className }) => <div data-testid="stop-icon" className={className}>⏹️</div>
}));

// Now import the component
import FloatingMicrophone from '@/features/voice/components/FloatingMicrophone';

// Default mock values for disabled state
const disabledMockValues = {
  isEnabled: false,
  isListening: false,
  isProcessing: false,
  microphonePermission: 'denied',
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

describe('FloatingMicrophone Simple Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVoiceAssistant.mockReturnValue(disabledMockValues);
  });

  // Helper function to render with router and mocked provider
  const renderWithMockedProvider = (component, customMockValues = {}) => {
    const mockValues = { ...disabledMockValues, ...customMockValues };
    mockUseVoiceAssistant.mockReturnValue(mockValues);
    
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should be disabled when voice assistant is disabled', () => {
    console.log('Mock values:', disabledMockValues);
    console.log('Mock function calls before render:', mockUseVoiceAssistant.mock.calls.length);
    
    // Set NODE_ENV to test to enable debug logging
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    
    renderWithMockedProvider(<FloatingMicrophone />);

    const button = screen.getByTestId('floating-microphone');
    console.log('Button disabled:', button.disabled);
    console.log('Button classes:', button.className);
    console.log('Button aria-label:', button.getAttribute('aria-label'));
    console.log('Mock calls after render:', mockUseVoiceAssistant.mock.calls.length);
    
    // Check if the component is actually calling useVoiceAssistant
    if (mockUseVoiceAssistant.mock.calls.length > 0) {
      console.log('Mock was called with:', mockUseVoiceAssistant.mock.calls);
    } else {
      console.log('Mock was never called - component may not be using useVoiceAssistant');
    }
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
    
    expect(button).toBeDisabled();
  });
});
