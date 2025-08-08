import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VoiceFeedbackButton from '../components/voice/VoiceFeedbackButton';

// Mock VoiceFeedbackModal
jest.mock('../components/voice/VoiceFeedbackModal', () => {
  return function MockVoiceFeedbackModal() {
    return <div>Mock Modal</div>;
  };
});

// Mock useVoiceAssistant hook
jest.mock('../providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => ({
    isEnabled: true,
    lastCommand: 'test command',
    lastConfidence: 0.95,
    feedbackCount: 0,
    isListening: false,
    isProcessing: false,
    error: null,
    microphonePermission: 'granted'
  })
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChatBubbleLeftRightIcon: ({ className }) => <svg className={className}>chat</svg>,
  HandThumbUpIcon: ({ className }) => <svg className={className}>thumb-up</svg>,
  HandThumbDownIcon: ({ className }) => <svg className={className}>thumb-down</svg>,
  MicrophoneIcon: ({ className }) => <svg className={className}>microphone</svg>,
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('VoiceFeedbackButton ARIA Debug', () => {
  test('debug rendered output', () => {
    const { container } = renderWithProviders(<VoiceFeedbackButton />);
    
    console.log('=== CONTAINER HTML ===');
    console.log(container.innerHTML);
    
    const feedbackButton = screen.getByTestId('voice-feedback-button');
    console.log('=== BUTTON ELEMENT ===');
    console.log('tagName:', feedbackButton.tagName);
    console.log('role:', feedbackButton.getAttribute('role'));
    console.log('aria-label:', feedbackButton.getAttribute('aria-label'));
    console.log('aria-describedby:', feedbackButton.getAttribute('aria-describedby'));
    console.log('data-testid:', feedbackButton.getAttribute('data-testid'));
    console.log('className:', feedbackButton.className);
    console.log('outerHTML:', feedbackButton.outerHTML);
    
    // Test the actual assertion
    expect(feedbackButton).toHaveAttribute('role', 'button');
  });
});