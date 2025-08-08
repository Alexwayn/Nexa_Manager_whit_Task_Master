import React from 'react';
import { render, screen } from '@testing-library/react';
import FloatingMicrophone from '@/features/voice/components/FloatingMicrophone';

// Mock the VoiceAssistantProvider with correct values
const mockVoiceAssistant = {
  isListening: false,
  isProcessing: false,
  isEnabled: true,  // Make sure this is true
  microphonePermission: 'granted',  // Make sure this is 'granted'
  startListening: jest.fn(),
  stopListening: jest.fn(),
  error: null,
  command: '',
  response: ''
};

jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => {
    console.log('useVoiceAssistant mock called, returning:', mockVoiceAssistant);
    return mockVoiceAssistant;
  },
  VoiceAssistantProvider: ({ children }) => children
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }) => (
    <svg data-testid="microphone-svg" className={className}>
      <path d="microphone" />
    </svg>
  ),
  StopIcon: ({ className }) => (
    <svg data-testid="stop-svg" className={className}>
      <path d="stop" />
    </svg>
  )
}));

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('FloatingMicrophone - Fixed Mock Test', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should render the floating microphone button', () => {
    console.log('=== Starting fixed mock test ===');
    
    const { container } = render(<FloatingMicrophone />);
    
    console.log('Container innerHTML:', container.innerHTML);
    console.log('Container children length:', container.children.length);
    
    // Try to find the button by data-testid
    const button = screen.queryByTestId('floating-microphone');
    console.log('Button found by testid:', button);
    
    // Try to find any button
    const anyButton = container.querySelector('button');
    console.log('Any button found:', anyButton);
    
    // Try to find by role
    const buttonByRole = screen.queryByRole('button');
    console.log('Button found by role:', buttonByRole);
    
    // Check if the component rendered anything
    expect(container.children.length).toBeGreaterThan(0);
    expect(button).toBeInTheDocument();
  });
});
