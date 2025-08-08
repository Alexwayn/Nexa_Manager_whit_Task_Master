import React from 'react';
import { render, screen } from '@testing-library/react';
import VoiceFeedbackButton from '../features/voice/components/VoiceFeedbackButton';

// Mock the VoiceAssistantProvider
jest.mock('../features/voice/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => ({
    isEnabled: false,
    lastCommand: 'test command',
    isListening: false,
    isProcessing: false,
    error: null,
    startListening: jest.fn(),
    stopListening: jest.fn(),
    clearError: jest.fn(),
  }),
}));

// Mock the VoiceFeedbackModal
jest.mock('../features/voice/components/VoiceFeedbackModal', () => ({
  __esModule: true,
  default: () => null,
}));

describe('VoiceFeedbackButton Debug', () => {
  it('should render and show what we get', () => {
    const { container } = render(<VoiceFeedbackButton />);
    
    console.log('Container HTML:', container.innerHTML);
    
    const feedbackButton = container.querySelector('[data-testid="voice-feedback-button"]') || 
                          container.querySelector('button') ||
                          container.firstChild;
    
    console.log('Button element:', feedbackButton);
    console.log('Button tagName:', feedbackButton?.tagName);
    console.log('Button role:', feedbackButton?.getAttribute('role'));
    console.log('Button aria-label:', feedbackButton?.getAttribute('aria-label'));
    console.log('Button attributes:', feedbackButton?.attributes ? Array.from(feedbackButton.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', ') : 'none');
    
    // Just check that something was rendered
    expect(container.firstChild).toBeTruthy();
  });
});