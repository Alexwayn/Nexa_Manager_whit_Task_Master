import React from 'react';
import { render, screen } from '@testing-library/react';
import FloatingMicrophone from '@/features/voice/components/FloatingMicrophone';

// Mock the VoiceAssistantProvider
const mockVoiceAssistant = {
  isListening: false,
  isProcessing: false,
  isEnabled: true,
  microphonePermission: 'granted',
  startListening: jest.fn(),
  stopListening: jest.fn(),
  error: null,
  command: '',
  response: ''
};

jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => {
    console.log('useVoiceAssistant called, returning:', mockVoiceAssistant);
    return mockVoiceAssistant;
  },
  VoiceAssistantProvider: ({ children }) => children
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }) => {
    console.log('MicrophoneIcon rendered with className:', className);
    return <div data-testid="microphone-icon" className={className} />;
  },
  StopIcon: ({ className }) => {
    console.log('StopIcon rendered with className:', className);
    return <div data-testid="stop-icon" className={className} />;
  }
}));

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('FloatingMicrophone - Console Log Test', () => {
  it('should render and show debug info', () => {
    console.log('=== Starting console log test ===');
    
    const { container } = render(<FloatingMicrophone />);
    
    console.log('=== Container innerHTML ===');
    console.log(container.innerHTML);
    
    console.log('=== Container firstChild ===');
    console.log(container.firstChild);
    
    console.log('=== Container children length ===');
    console.log(container.children.length);
    
    console.log('=== Looking for button by testid ===');
    const button = screen.queryByTestId('floating-microphone');
    console.log('Button found:', button);
    
    console.log('=== Looking for any button ===');
    const anyButton = container.querySelector('button');
    console.log('Any button found:', anyButton);
    
    console.log('=== All elements in container ===');
    console.log(container.querySelectorAll('*'));
    
    console.log('=== Test completed ===');
    
    expect(container).toBeDefined();
  });
});
