import React from 'react';
import { render, screen } from '@testing-library/react';
import VoiceFeedbackButton from '../components/voice/VoiceFeedbackButton';

// Mock the useVoiceAssistant hook
jest.mock('../providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => ({
    isEnabled: true,
    isListening: false,
    isProcessing: false,
    error: null,
    feedbackCount: 5,
    lastCommand: 'test command',
    lastConfidence: 0.95,
  }),
}));

// Mock VoiceFeedbackModal
jest.mock('../components/voice/VoiceFeedbackModal', () => {
  return function MockVoiceFeedbackModal({ isOpen, onClose, onFeedbackSubmitted, commandData }) {
    if (!isOpen) return null;
    return (
      <div data-testid="voice-feedback-modal">
        <h2>Voice Feedback Modal</h2>
        <button onClick={onClose} data-testid="modal-close">Close</button>
        <button onClick={() => onFeedbackSubmitted({ rating: 5, comment: 'Great!' })} data-testid="modal-submit">
          Submit
        </button>
      </div>
    );
  };
});

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  HandThumbUpIcon: () => React.createElement('svg', { 'data-testid': 'feedback-icon' }, 'thumbs-up'),
  HandThumbDownIcon: () => React.createElement('svg', { 'data-testid': 'thumbs-down-icon' }, 'thumbs-down'),
  ChatBubbleLeftRightIcon: () => React.createElement('svg', { 'data-testid': 'chat-icon' }, 'chat'),
  MicrophoneIcon: () => React.createElement('svg', { 'data-testid': 'microphone-icon' }, 'microphone'),
}));

describe('VoiceFeedbackButton - Fragment Issue Resolution', () => {
  test('renders correctly with all ARIA attributes and data-testid', () => {
    console.log('Testing VoiceFeedbackButton rendering...');
    
    const { container } = render(<VoiceFeedbackButton />);
    
    console.log('Container HTML:', container.innerHTML);
    
    // Test that the button is found by data-testid
    const button = screen.getByTestId('voice-feedback-button');
    expect(button).toBeInTheDocument();
    console.log('✅ Button found by data-testid');
    
    // Test that the button is found by role
    const buttonByRole = screen.getByRole('button');
    expect(buttonByRole).toBeInTheDocument();
    console.log('✅ Button found by role');
    
    // Test ARIA attributes
    expect(button).toHaveAttribute('aria-label');
    console.log('✅ Button has aria-label');
    
    // Test that the icon is present
    const icon = screen.getByTestId('feedback-icon');
    expect(icon).toBeInTheDocument();
    console.log('✅ Feedback icon found');
    
    console.log('🎉 All tests passed! Fragment issue has been resolved.');
  });

  test('renders with different states', () => {
    console.log('Testing different component states...');
    
    // Test with feedback count
    const { rerender } = render(<VoiceFeedbackButton showCount={true} />);
    
    let button = screen.getByTestId('voice-feedback-button');
    expect(button).toBeInTheDocument();
    console.log('✅ Button renders with showCount=true');
    
    // Test icon-only mode
    rerender(<VoiceFeedbackButton iconOnly={true} />);
    
    button = screen.getByTestId('voice-feedback-button');
    expect(button).toBeInTheDocument();
    console.log('✅ Button renders in icon-only mode');
    
    console.log('🎉 Component renders correctly in different states!');
  });
});