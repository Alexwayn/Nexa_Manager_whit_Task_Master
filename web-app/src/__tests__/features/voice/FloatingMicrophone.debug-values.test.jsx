import React from 'react';
import { render } from '@testing-library/react';
import FloatingMicrophone from '@/features/voice/components/FloatingMicrophone';

// Mock the VoiceAssistantProvider with detailed logging
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
    console.log('useVoiceAssistant returning:', mockVoiceAssistant);
    return mockVoiceAssistant;
  },
  VoiceAssistantProvider: ({ children }) => children
}));

// Mock Heroicons with logging
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }) => {
    console.log('MicrophoneIcon rendered with className:', className);
    return React.createElement('div', { 
      'data-testid': 'microphone-icon', 
      className: className,
      children: 'MIC'
    });
  },
  StopIcon: ({ className }) => {
    console.log('StopIcon rendered with className:', className);
    return React.createElement('div', { 
      'data-testid': 'stop-icon', 
      className: className,
      children: 'STOP'
    });
  }
}));

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Create a wrapper component to catch any errors
const TestWrapper = ({ children }) => {
  try {
    console.log('TestWrapper rendering children');
    return children;
  } catch (error) {
    console.log('TestWrapper caught error:', error);
    return <div data-testid="error">Error: {error.message}</div>;
  }
};

describe('FloatingMicrophone - Debug Values Test', () => {
  it('should debug component values and rendering', () => {
    console.log('=== Starting debug values test ===');
    
    let result;
    try {
      console.log('About to render FloatingMicrophone...');
      result = render(
        <TestWrapper>
          <FloatingMicrophone />
        </TestWrapper>
      );
      console.log('Render completed successfully');
    } catch (error) {
      console.log('Render failed with error:', error);
      throw error;
    }
    
    const { container } = result;
    
    console.log('=== Container analysis ===');
    console.log('Container innerHTML:', container.innerHTML);
    console.log('Container children length:', container.children.length);
    console.log('Container firstChild:', container.firstChild);
    console.log('Container textContent:', container.textContent);
    
    console.log('=== Test completed ===');
    
    expect(container).toBeDefined();
  });
});
