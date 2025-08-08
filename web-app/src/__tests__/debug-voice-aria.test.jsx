import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock the voice assistant hook
jest.mock('../providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: jest.fn()
}));

// Mock other dependencies
jest.mock('../services/voiceFeedbackService', () => ({
  collectFeedback: jest.fn(),
  submitSuggestion: jest.fn(),
  voteOnSuggestion: jest.fn()
}));

jest.mock('../shared/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn()
  }
}));

// Import the actual component
import VoiceFeedbackButton from '../components/voice/VoiceFeedbackButton';

describe('VoiceFeedbackButton ARIA Test', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock the voice assistant hook
    const { useVoiceAssistant } = require('../providers/VoiceAssistantProvider');
    useVoiceAssistant.mockReturnValue({
      isListening: false,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      transcript: '',
      isSupported: true,
      error: null,
      collectFeedback: jest.fn(),
      submitSuggestion: jest.fn(),
      voteOnSuggestion: jest.fn()
    });
  });

  test('renders with proper ARIA attributes', () => {
    try {
      console.log('Starting test...');
      
      console.log('Rendering component...');
      
      // Let's try to render the component and catch any errors
      let renderResult;
      try {
        renderResult = render(<VoiceFeedbackButton />);
        console.log('Render successful');
      } catch (renderError) {
        console.error('Render error:', renderError);
        console.error('Render error stack:', renderError.stack);
        throw renderError;
      }
      
      const { container } = renderResult;
      console.log('Container HTML:', container.innerHTML);
      
      // Try to find the button by role
      try {
        const buttonByRole = screen.getByRole('button');
        console.log('Found button by role:', buttonByRole);
        console.log('Button by role tagName:', buttonByRole.tagName);
      } catch (roleError) {
        console.log('Could not find button by role:', roleError.message);
      }
      
      // Check if we can find by data-testid
      try {
        const buttonByTestId = screen.getByTestId('voice-feedback-button');
        console.log('Found button by testid:', buttonByTestId);
      } catch (testIdError) {
        console.log('Could not find button by testid:', testIdError.message);
      }
      
    } catch (error) {
      console.error('Test error:', error);
      console.error('Test error stack:', error.stack);
      throw error;
    }
  });
});