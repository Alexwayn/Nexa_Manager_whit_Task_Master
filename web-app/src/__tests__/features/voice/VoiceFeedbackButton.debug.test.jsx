import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VoiceFeedbackButton from '../../../components/voice/VoiceFeedbackButton';

// Mock useVoiceAssistant hook
const mockUseVoiceAssistant = jest.fn();

jest.mock('../../../providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => mockUseVoiceAssistant(),
}));

// Mock VoiceFeedbackModal
jest.mock('../../../components/voice/VoiceFeedbackModal', () => {
  return function MockVoiceFeedbackModal({ isOpen, onClose, onFeedbackSubmitted, commandData }) {
    if (!isOpen) return null;
    return (
      <div data-testid="voice-feedback-modal">
        <button onClick={onClose} data-testid="modal-close">Close</button>
        <button 
          onClick={() => onFeedbackSubmitted({ rating: 5, comment: 'Test feedback' })}
          data-testid="modal-submit"
        >
          Submit
        </button>
        <div data-testid="modal-command">{commandData?.command}</div>
      </div>
    );
  };
});

// Mock Heroicons
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
  mockUseVoiceAssistant.mockReturnValue({ state: mockState });
  
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('VoiceFeedbackButton Debug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debug what is actually rendered', () => {
    const { container } = renderWithProviders(<VoiceFeedbackButton />);
    
    const button = screen.getByTestId('voice-feedback-button');
    console.log('Button HTML:', button.outerHTML);
    console.log('Button text content:', button.textContent);
    console.log('Button inner text:', button.innerText);
    
    const icon = container.querySelector('[data-testid="feedback-icon"]');
    console.log('Icon found:', !!icon);
    if (icon) {
      console.log('Icon HTML:', icon.outerHTML);
    }
    
    console.log('All text in document:', document.body.textContent);
    
    expect(button).toBeInTheDocument();
  });
});