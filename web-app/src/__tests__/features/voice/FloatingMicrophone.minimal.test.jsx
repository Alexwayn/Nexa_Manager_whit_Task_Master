import React from 'react';
import { render, screen } from '@testing-library/react';

// Create a minimal version of FloatingMicrophone to test
const MinimalFloatingMicrophone = () => {
  console.error('MinimalFloatingMicrophone rendering...');
  
  return (
    <button data-testid="minimal-button">
      Test Button
    </button>
  );
};

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
  MicrophoneIcon: ({ className }) => <div data-testid="microphone-icon" className={className} />,
  StopIcon: ({ className }) => <div data-testid="stop-icon" className={className} />
}));

describe('Minimal Component Test', () => {
  it('should render a minimal button', () => {
    console.error('Starting minimal test...');
    
    const { container } = render(<MinimalFloatingMicrophone />);
    
    console.error('Minimal container innerHTML:', container.innerHTML);
    
    const button = screen.queryByTestId('minimal-button');
    console.error('Minimal button found:', button);
    
    expect(button).toBeInTheDocument();
  });
});
