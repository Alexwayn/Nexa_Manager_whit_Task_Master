import React from 'react';
import { render } from '@testing-library/react';

// Create a simple test component first
const SimpleButton = () => {
  console.log('SimpleButton rendering...');
  return (
    <button data-testid="simple-button">
      Simple Button
    </button>
  );
};

// Mock the VoiceAssistantProvider
jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => {
    console.log('useVoiceAssistant mock called');
    return {
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
  }
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }) => {
    console.log('MicrophoneIcon rendering with className:', className);
    return <div data-testid="mic-icon" className={className}>MIC</div>;
  },
  StopIcon: ({ className }) => {
    console.log('StopIcon rendering with className:', className);
    return <div data-testid="stop-icon" className={className}>STOP</div>;
  }
}));

// Set window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('FloatingMicrophone - Import Test', () => {
  it('should test simple button first', () => {
    console.log('=== Testing simple button ===');
    const { container } = render(<SimpleButton />);
    
    console.log('Simple button container innerHTML:', container.innerHTML);
    console.log('Simple button container children length:', container.children.length);
    
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('should test FloatingMicrophone import', async () => {
    console.log('=== Testing FloatingMicrophone import ===');
    
    let FloatingMicrophone;
    try {
      console.log('Attempting to import FloatingMicrophone...');
      const module = await import('@/features/voice/components/FloatingMicrophone');
      FloatingMicrophone = module.default;
      console.log('FloatingMicrophone imported successfully:', typeof FloatingMicrophone);
    } catch (error) {
      console.log('Import error:', error);
      throw error;
    }
    
    console.log('About to render FloatingMicrophone...');
    const { container } = render(<FloatingMicrophone />);
    
    console.log('FloatingMicrophone container innerHTML:', container.innerHTML);
    console.log('FloatingMicrophone container children length:', container.children.length);
    
    expect(container).toBeDefined();
  });
});
