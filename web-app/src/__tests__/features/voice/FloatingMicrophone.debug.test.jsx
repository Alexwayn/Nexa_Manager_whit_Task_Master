import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock the VoiceAssistantProvider module BEFORE importing the component
jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: jest.fn(),
  VoiceAssistantProvider: ({ children }) => children
}));

import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';

// Get the mocked function
const mockUseVoiceAssistant = useVoiceAssistant;

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }) => <div data-testid="microphone-icon" className={className}>🎤</div>,
  StopIcon: ({ className }) => <div data-testid="stop-icon" className={className}>⏹️</div>
}));

// Import the component after mocking
import FloatingMicrophone from '@/features/voice/components/FloatingMicrophone';
console.log('Import successful, component:', typeof FloatingMicrophone);

describe('FloatingMicrophone Debug Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify mock is working and component renders', () => {
    // Set up mock return value
    mockUseVoiceAssistant.mockReturnValue({
      isEnabled: false,
      isListening: false,
      isProcessing: false,
      microphonePermission: 'denied',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
    });

    console.log('Before render - Mock calls:', mockUseVoiceAssistant.mock.calls.length);

    let renderResult;
    let renderError;
    
    try {
      // Render the component
      renderResult = render(
        <BrowserRouter>
          <FloatingMicrophone />
        </BrowserRouter>
      );
      console.log('Render successful');
    } catch (error) {
      renderError = error;
      console.log('Render error:', error.message);
    }

    console.log('After render - Mock calls:', mockUseVoiceAssistant.mock.calls.length);
    
    if (renderResult) {
      console.log('Container HTML:', renderResult.container.innerHTML);
    }

    // If there was a render error, fail the test with the error
    if (renderError) {
      throw renderError;
    }

    // Check if mock was called
    expect(mockUseVoiceAssistant).toHaveBeenCalled();
    
    // Try to find the button
    const button = screen.getByTestId('floating-microphone');
    expect(button).toBeInTheDocument();
    
    // The test should pass if mock is working
    expect(button).toBeDisabled();
  });
});
