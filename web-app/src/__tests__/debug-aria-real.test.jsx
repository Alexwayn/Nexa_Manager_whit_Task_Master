import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VoiceFeedbackButton from '@components/voice/VoiceFeedbackButton';

// Mock the useVoiceAssistant hook - must be declared before jest.mock due to hoisting
const mockUseVoiceAssistant = jest.fn();

jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => mockUseVoiceAssistant()
}));

// Mock the VoiceFeedbackModal component
jest.mock('@components/voice/VoiceFeedbackModal', () => {
  return function MockVoiceFeedbackModal({ isOpen, onClose, onSubmit }) {
    if (!isOpen) return null;
    return (
      <div data-testid="voice-feedback-modal">
        <button onClick={() => onSubmit({ rating: 5, comment: 'Great!' })}>
          Submit
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

describe('VoiceFeedbackButton Real Testing Library', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVoiceAssistant.mockReturnValue(defaultState);
  });

  it('should render with proper ARIA attributes using real testing library', () => {
    const { container } = render(
      <BrowserRouter>
        <VoiceFeedbackButton />
      </BrowserRouter>
    );
    
    console.log('Container HTML:', container.innerHTML);
    
    const feedbackButton = screen.getByTestId('voice-feedback-button');
    
    console.log('Button element:', feedbackButton);
    console.log('Button attributes:', {
      role: feedbackButton.getAttribute('role'),
      'aria-describedby': feedbackButton.getAttribute('aria-describedby'),
      'aria-label': feedbackButton.getAttribute('aria-label'),
      disabled: feedbackButton.disabled,
      tagName: feedbackButton.tagName
    });

    expect(feedbackButton).toHaveAttribute('role', 'button');
    expect(feedbackButton).toHaveAttribute('aria-describedby');
  });
});