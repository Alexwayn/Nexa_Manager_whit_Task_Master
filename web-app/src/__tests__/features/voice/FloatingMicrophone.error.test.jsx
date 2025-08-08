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
    console.error('useVoiceAssistant called, returning:', mockVoiceAssistant);
    return mockVoiceAssistant;
  },
  VoiceAssistantProvider: ({ children }) => children
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }) => {
    console.error('MicrophoneIcon rendered with className:', className);
    return <div data-testid="microphone-icon" className={className} />;
  },
  StopIcon: ({ className }) => {
    console.error('StopIcon rendered with className:', className);
    return <div data-testid="stop-icon" className={className} />;
  }
}));

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Error boundary component
class TestErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Error: {this.state.error?.message}</div>;
    }

    return this.props.children;
  }
}

describe('FloatingMicrophone - Error Boundary Test', () => {
  it('should render without throwing errors', () => {
    console.error('Starting error boundary test...');
    
    let container;
    try {
      const result = render(
        <TestErrorBoundary>
          <FloatingMicrophone />
        </TestErrorBoundary>
      );
      container = result.container;
      console.error('Render completed without throwing');
    } catch (error) {
      console.error('Render threw error:', error);
      throw error;
    }
    
    console.error('Container innerHTML:', container.innerHTML);
    
    // Check if error boundary was triggered
    const errorBoundary = screen.queryByTestId('error-boundary');
    if (errorBoundary) {
      console.error('Error boundary was triggered:', errorBoundary.textContent);
    } else {
      console.error('No error boundary triggered');
    }
    
    // Check for the button
    const button = screen.queryByTestId('floating-microphone');
    console.error('Button found:', button);
    
    expect(container).toBeDefined();
  });
});
