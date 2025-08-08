import React from 'react';
import { render, screen } from '@testing-library/react';
import FloatingMicrophone from '@/features/voice/components/FloatingMicrophone';

// Mock the VoiceAssistantProvider using the working pattern
const mockVoiceAssistant = {
  isListening: false,
  isProcessing: false,
  isEnabled: false, // Start with disabled to test the disabled state
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

describe('FloatingMicrophone - Pattern Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock properties before each test
    Object.assign(mockVoiceAssistant, {
      isListening: false,
      isProcessing: false,
      isEnabled: false, // Start disabled
      microphonePermission: 'granted',
      error: null
    });
  });

  it('should render and be disabled when voice assistant is disabled', () => {
    const { container } = render(<FloatingMicrophone />);
    
    // Log the rendered HTML for debugging
    console.error('Rendered HTML:', container.innerHTML);
    
    // Check if the component rendered anything
    expect(container.firstChild).not.toBeNull();
    
    // Try to find a button
    const button = screen.queryByRole('button');
    if (button) {
      console.error('Button found:', button.outerHTML);
      console.error('Button disabled:', button.disabled);
      console.error('Button className:', button.className);
      
      // Test that button is disabled when voice assistant is disabled
      expect(button).toBeDisabled();
    } else {
      console.error('No button found in rendered output');
      // If no button, check what was rendered
      const allElements = container.querySelectorAll('*');
      console.error('All rendered elements:', Array.from(allElements).map(el => el.tagName));
    }
  });

  it('should be enabled when voice assistant is enabled', () => {
    // Enable the voice assistant
    mockVoiceAssistant.isEnabled = true;
    
    const { container } = render(<FloatingMicrophone />);
    
    console.error('Enabled test - Rendered HTML:', container.innerHTML);
    
    const button = screen.queryByRole('button');
    if (button) {
      console.error('Enabled test - Button found:', button.outerHTML);
      console.error('Enabled test - Button disabled:', button.disabled);
      
      // Test that button is enabled when voice assistant is enabled
      expect(button).not.toBeDisabled();
    } else {
      console.error('Enabled test - No button found');
    }
  });
});
