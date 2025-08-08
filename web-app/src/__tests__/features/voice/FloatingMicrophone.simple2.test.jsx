import React from 'react';
import { render } from '@testing-library/react';
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

describe('FloatingMicrophone - Simple Test', () => {
  it('should render successfully', () => {
    console.error('Starting test...');
    
    let container;
    try {
      const result = render(<FloatingMicrophone />);
      container = result.container;
      console.error('Render completed successfully');
    } catch (error) {
      console.error('Render failed with error:', error);
      throw error;
    }
    
    console.error('Container innerHTML:', container.innerHTML);
    console.error('Container firstChild:', container.firstChild);
    console.error('Container children length:', container.children.length);
    
    // Basic assertion
    expect(container).toBeDefined();
  });
});
