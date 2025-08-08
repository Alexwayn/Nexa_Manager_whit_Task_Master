import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock the VoiceFeedbackModal
jest.mock('../components/voice/VoiceFeedbackModal', () => {
  return function MockVoiceFeedbackModal({ isOpen, onClose, onSubmit }) {
    return isOpen ? (
      <div data-testid="voice-feedback-modal">
        <button onClick={() => onSubmit({ rating: 5, comment: 'Great!' })}>
          Submit
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

// Mock the VoiceAssistantProvider
jest.mock('../providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: jest.fn(),
}));

import VoiceFeedbackButton from '../components/voice/VoiceFeedbackButton';

// Get the mock function after the mock is set up
const { useVoiceAssistant: mockUseVoiceAssistant } = require('../providers/VoiceAssistantProvider');

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChatBubbleLeftRightIcon: ({ className, 'data-testid': testId }) => (
    <svg className={className} data-testid={testId}>feedback-icon</svg>
  ),
  HandThumbUpIcon: ({ className }) => <svg className={className}>thumb-up</svg>,
  HandThumbDownIcon: ({ className }) => <svg className={className}>thumb-down</svg>,
  MicrophoneIcon: ({ className }) => <svg className={className}>microphone</svg>,
}));

const defaultState = {
  isEnabled: true,
  lastCommand: 'test command',
  lastConfidence: 0.95,
  feedbackCount: 0,
  isListening: false,
  isProcessing: false,
  error: null,
  microphonePermission: 'granted'
};

const renderWithProviders = (ui, options = {}) => {
  const mockState = { ...defaultState, ...options.mockState };
  mockUseVoiceAssistant.mockReturnValue(mockState);
  
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('Debug Original Mock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render VoiceFeedbackButton with original mock setup', () => {
    console.log('Starting test...');
    
    try {
      const result = renderWithProviders(
        <VoiceFeedbackButton />,
        { mockState: { lastCommand: 'test command' } }
      );

      console.log('Container HTML:', result.container.innerHTML);
      
      // Try to find the button by different methods
      const buttonByTestId = screen.queryByTestId('voice-feedback-button');
      const buttonByRole = screen.queryByRole('button');
      
      console.log('Button by testid:', buttonByTestId);
      console.log('Button by role:', buttonByRole);
      
      if (buttonByRole) {
        console.log('Button tagName:', buttonByRole.tagName);
        console.log('Button attributes:', Array.from(buttonByRole.attributes).map(attr => `${attr.name}="${attr.value}"`));
      }
      
      expect(buttonByTestId).toBeInTheDocument();
    } catch (error) {
      console.error('Test error:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  });
});