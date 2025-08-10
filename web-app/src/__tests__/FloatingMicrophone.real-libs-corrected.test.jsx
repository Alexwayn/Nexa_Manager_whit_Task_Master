// Test with real React and React Testing Library
const React = require('react');
import { render, screen } from '../../../node_modules/@testing-library/react/dist/index.js';
import FloatingMicrophone from '../components/FloatingMicrophone';

// Mock the useVoiceAssistant hook from the correct path
jest.mock('../providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => ({
    isEnabled: true,
    microphonePermission: 'granted',
    isListening: false,
    isProcessing: false,
    error: null,
    lastCommand: null,
    startListening: jest.fn(),
    stopListening: jest.fn(),
    toggleListening: jest.fn(),
  }),
}));

// Mock the voice components
jest.mock('../components/voice', () => {
  const ReactLocal = require('react');
  return {
    VoiceActivationButton: (props) => ReactLocal.createElement('button', {
      'data-testid': 'floating-microphone',
      className: props.className,
      onClick: props.onClick,
    }, 'Voice Button'),
  };
});

// Removed global mock for VoiceFeedbackButton to avoid interference with other tests

// Mock Heroicons
jest.mock('@heroicons/react/24/solid', () => {
  const ReactLocal = require('react');
  return {
    MicrophoneIcon: () => ReactLocal.createElement('svg', { 'data-testid': 'microphone-icon' }, 'Mic'),
    StopIcon: () => ReactLocal.createElement('svg', { 'data-testid': 'stop-icon' }, 'Stop'),
  };
});

describe('FloatingMicrophone with Real Libraries', () => {
  test('renders microphone button when enabled', () => {
    console.log('Starting test with real libraries...');
    
    const { container } = render(React.createElement(FloatingMicrophone));
    
    console.log('Container innerHTML:', container.innerHTML);
    console.log('Container children length:', container.children.length);
    
    // Try to find the button
    const buttons = container.querySelectorAll('button');
    console.log('Number of buttons found:', buttons.length);
    
    if (buttons.length > 0) {
      console.log('First button:', buttons[0].outerHTML);
    }
    
    // Look for the specific test id
    const micButton = container.querySelector('[data-testid="floating-microphone"]');
    console.log('Microphone button found:', !!micButton);
    
    if (micButton) {
      console.log('Microphone button HTML:', micButton.outerHTML);
    }
    
    expect(buttons.length).toBeGreaterThan(0);
  });
});
