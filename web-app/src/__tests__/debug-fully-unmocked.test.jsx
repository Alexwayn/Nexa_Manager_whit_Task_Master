// Unmock both React and testing library for this specific test
jest.unmock('react');
jest.unmock('@testing-library/react');

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VoiceFeedbackButton from '@/components/voice/VoiceFeedbackButton';

// Mock the VoiceAssistantProvider
const mockUseVoiceAssistant = jest.fn();
jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => mockUseVoiceAssistant()
}));

// Mock the VoiceFeedbackModal
jest.mock('@/components/voice/VoiceFeedbackModal', () => {
  const React = require('react');
  return function MockVoiceFeedbackModal({ isOpen, onClose }) {
    return isOpen ? React.createElement('div', { 'data-testid': 'voice-feedback-modal' }, 'Mock Modal') : null;
  };
});

describe('VoiceFeedbackButton - Fully Unmocked Test', () => {
  const defaultState = {
    isEnabled: true,
    isLoading: false,
    lastCommand: 'test command',
    lastConfidence: 0.95,
    feedbackCount: 0
  };

  beforeEach(() => {
    mockUseVoiceAssistant.mockReturnValue(defaultState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render as a proper button element with correct ARIA attributes', () => {
    const { container } = render(
      React.createElement(BrowserRouter, null,
        React.createElement(VoiceFeedbackButton)
      )
    );

    console.log('Container HTML:', container.innerHTML);

    // Find the button element
    const feedbackButton = screen.getByTestId('voice-feedback-button');
    
    console.log('Button element:', feedbackButton);
    console.log('Button tagName:', feedbackButton.tagName);
    console.log('Button role:', feedbackButton.getAttribute('role'));
    console.log('Button aria-describedby:', feedbackButton.getAttribute('aria-describedby'));
    console.log('Button aria-label:', feedbackButton.getAttribute('aria-label'));
    console.log('Button disabled:', feedbackButton.disabled);
    console.log('Button className:', feedbackButton.className);

    // Verify it's actually a button element
    expect(feedbackButton.tagName).toBe('BUTTON');
    expect(feedbackButton).toHaveAttribute('role', 'button');
    expect(feedbackButton).toHaveAttribute('aria-describedby', 'feedback-tooltip');
    expect(feedbackButton).toHaveAttribute('aria-label', 'Give feedback');
    expect(feedbackButton.disabled).toBe(false);
  });
});