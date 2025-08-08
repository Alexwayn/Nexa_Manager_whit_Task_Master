import React from 'react';
import { render } from '@testing-library/react';
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
  useVoiceAssistant: () => mockVoiceAssistant,
  VoiceAssistantProvider: ({ children }) => children
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }) => <div data-testid="microphone-icon" className={className}>MIC</div>,
  StopIcon: ({ className }) => <div data-testid="stop-icon" className={className}>STOP</div>
}));

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('FloatingMicrophone - HTML Output Test', () => {
  it('should show actual HTML output', () => {
    console.log('=== Starting HTML output test ===');
    
    const { container } = render(<FloatingMicrophone />);
    
    console.log('=== Raw container.innerHTML ===');
    console.log(container.innerHTML);
    
    console.log('=== Container.outerHTML ===');
    console.log(container.outerHTML);
    
    console.log('=== Container children ===');
    console.log('Children count:', container.children.length);
    for (let i = 0; i < container.children.length; i++) {
      console.log(`Child ${i}:`, container.children[i].outerHTML);
    }
    
    console.log('=== Direct button search ===');
    const buttons = container.getElementsByTagName('button');
    console.log('Buttons found:', buttons.length);
    for (let i = 0; i < buttons.length; i++) {
      console.log(`Button ${i}:`, buttons[i].outerHTML);
    }
    
    console.log('=== Test completed ===');
    
    expect(container).toBeDefined();
  });
});
