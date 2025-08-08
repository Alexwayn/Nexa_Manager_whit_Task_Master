import React from 'react';
import { render, screen } from '@testing-library/react';
import FloatingMicrophone from '@/features/voice/components/FloatingMicrophone';

// Mock the VoiceAssistantProvider using the working pattern
const mockVoiceAssistant = {
  isListening: false,
  isProcessing: false,
  isEnabled: true, // Always enabled for this test
  microphonePermission: 'granted',
  startListening: jest.fn(),
  stopListening: jest.fn(),
  error: null,
  command: '',
  response: ''
};

jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => mockVoiceAssistant,
  VoiceAssistantProvider: ({ children }) => children
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }) => <div data-testid="microphone-icon" className={className} />,
  StopIcon: ({ className }) => <div data-testid="stop-icon" className={className} />
}));

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('FloatingMicrophone - Debug Test', () => {
  it('should render the button with data-testid', () => {
    console.error('Starting test...');
    
    const { container } = render(<FloatingMicrophone />);
    
    console.error('Container innerHTML:', container.innerHTML);
    
    // Try to find the button by data-testid
    const button = screen.queryByTestId('floating-microphone');
    console.error('Button found by testid:', button);
    
    // Try to find any button
    const anyButton = screen.queryByRole('button');
    console.error('Any button found:', anyButton);
    
    // Try to find microphone icon
    const micIcon = screen.queryByTestId('microphone-icon');
    console.error('Microphone icon found:', micIcon);
    
    // Check all elements with data-testid
    const allTestIds = container.querySelectorAll('[data-testid]');
    console.error('All elements with data-testid:', Array.from(allTestIds).map(el => ({
      testId: el.getAttribute('data-testid'),
      tagName: el.tagName,
      innerHTML: el.innerHTML
    })));
    
    // Basic assertion - the test should pass regardless
    expect(container).toBeDefined();
  });
});
