import React from 'react';
import { render } from '@testing-library/react';
import VoiceFeedbackButton from '../components/voice/VoiceFeedbackButton';

// Mock the useVoiceAssistant hook
jest.mock('../providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => ({
    state: {
      isEnabled: true,
      isListening: false,
      isProcessing: false,
      error: null,
      feedbackCount: 5,
      voiceState: 'idle',
      lastCommand: 'test command',
      lastConfidence: 0.95,
    },
    startListening: jest.fn(),
    stopListening: jest.fn(),
    clearError: jest.fn(),
  }),
}));

// Mock the VoiceFeedbackModal
jest.mock('../components/voice/VoiceFeedbackModal', () => {
  return function MockVoiceFeedbackModal({ isOpen }) {
    if (!isOpen) return null;
    return <div data-testid="voice-feedback-modal">Modal</div>;
  };
});

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChatBubbleLeftRightIcon: (props) => <svg {...props} data-testid="feedback-icon">icon</svg>,
}));

describe('VoiceFeedbackButton Simple Test', () => {
  test('renders without crashing', () => {
    const { container } = render(<VoiceFeedbackButton />);
    expect(container).toBeTruthy();
  });

  test('renders button element', () => {
    const { container } = render(<VoiceFeedbackButton />);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });

  test('has voice-feedback-button class', () => {
    const { container } = render(<VoiceFeedbackButton />);
    const button = container.querySelector('.voice-feedback-button');
    expect(button).toBeTruthy();
  });

  test('has data-testid attribute', () => {
    const { container } = render(<VoiceFeedbackButton />);
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    expect(button).toBeTruthy();
  });

  test('contains feedback text', () => {
    const { container } = render(<VoiceFeedbackButton />);
    expect(container.textContent).toMatch(/feedback/i);
  });
});