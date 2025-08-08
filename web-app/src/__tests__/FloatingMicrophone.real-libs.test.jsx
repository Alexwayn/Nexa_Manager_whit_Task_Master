// Test with real React Testing Library (bypassing mocks)
import { jest } from '@jest/globals';

// Import real libraries directly from node_modules
const realReact = require('../../../node_modules/react');
const realRTL = require('../../../node_modules/@testing-library/react');
const realJestDom = require('../../../node_modules/@testing-library/jest-dom');

// Extend Jest matchers
expect.extend(realJestDom);

// Mock the voice assistant hook
const mockUseVoiceAssistant = jest.fn(() => ({
  isEnabled: true,
  isListening: false,
  isProcessing: false,
  microphonePermission: 'granted',
  error: null,
  startListening: jest.fn(),
  stopListening: jest.fn(),
  toggleListening: jest.fn(),
}));

// Mock the provider
jest.doMock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: mockUseVoiceAssistant,
}));

// Mock Heroicons
jest.doMock('@heroicons/react/24/solid', () => ({
  MicrophoneIcon: ({ className, ...props }) => 
    realReact.createElement('div', { 
      'data-testid': 'microphone-icon', 
      className, 
      ...props 
    }),
  StopIcon: ({ className, ...props }) => 
    realReact.createElement('div', { 
      'data-testid': 'stop-icon', 
      className, 
      ...props 
    }),
}));

// Import the component after mocks are set up
const FloatingMicrophone = require('@/components/FloatingMicrophone').default;

describe('FloatingMicrophone with Real Libraries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVoiceAssistant.mockReturnValue({
      isEnabled: true,
      isListening: false,
      isProcessing: false,
      microphonePermission: 'granted',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      toggleListening: jest.fn(),
    });
  });

  test('renders microphone button with real libraries', () => {
    console.log('=== Real Libraries Test ===');
    
    const { container, getByRole } = realRTL.render(
      realReact.createElement(FloatingMicrophone)
    );
    
    console.log('Container innerHTML:', container.innerHTML);
    console.log('Container children length:', container.children.length);
    
    // Try to find button
    try {
      const button = getByRole('button');
      console.log('Button found:', button);
      expect(button).toBeInTheDocument();
    } catch (error) {
      console.log('Button not found:', error.message);
      
      // Try alternative searches
      const buttons = container.querySelectorAll('button');
      console.log('Direct button search found:', buttons.length);
      
      const testIdElements = container.querySelectorAll('[data-testid]');
      console.log('Elements with data-testid:', testIdElements.length);
      
      throw error;
    }
  });
});
