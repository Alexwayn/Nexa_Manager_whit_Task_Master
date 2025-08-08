// Mock for FloatingMicrophone component
import React from 'react';

// Enhanced mock for FloatingMicrophone with proper event handling
const MockFloatingMicrophone = React.forwardRef(({
  isListening = false,
  onStartListening = jest.fn(),
  onStopListening = jest.fn(),
  onTranscriptionUpdate = jest.fn(),
  onError = jest.fn(),
  className = '',
  style = {},
  disabled = false,
  size = 'medium',
  variant = 'primary',
  position = 'bottom-right',
  ...props
}, ref) => {
  // Mock state management
  const [mockIsListening, setMockIsListening] = React.useState(isListening);
  const [mockIsRecording, setMockIsRecording] = React.useState(false);
  const [mockTranscription, setMockTranscription] = React.useState('');

  // Mock methods that can be called via ref
  React.useImperativeHandle(ref, () => ({
    startListening: jest.fn(() => {
      setMockIsListening(true);
      setMockIsRecording(true);
      onStartListening();
    }),
    stopListening: jest.fn(() => {
      setMockIsListening(false);
      setMockIsRecording(false);
      onStopListening();
    }),
    toggleListening: jest.fn(() => {
      if (mockIsListening) {
        setMockIsListening(false);
        setMockIsRecording(false);
        onStopListening();
      } else {
        setMockIsListening(true);
        setMockIsRecording(true);
        onStartListening();
      }
    }),
    getTranscription: jest.fn(() => mockTranscription),
    clearTranscription: jest.fn(() => setMockTranscription('')),
    isListening: mockIsListening,
    isRecording: mockIsRecording,
  }));

  // Mock click handler
  const handleClick = jest.fn((event) => {
    if (disabled) return;
    
    // Create a proper mock event if needed
    const mockEvent = {
      ...event,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      target: event?.target || { tagName: 'BUTTON' },
      currentTarget: event?.currentTarget || { tagName: 'BUTTON' },
      type: 'click',
      bubbles: true,
      cancelable: true,
    };

    if (mockIsListening) {
      setMockIsListening(false);
      setMockIsRecording(false);
      onStopListening(mockEvent);
    } else {
      setMockIsListening(true);
      setMockIsRecording(true);
      onStartListening(mockEvent);
    }
  });

  // Mock keyboard handler
  const handleKeyDown = jest.fn((event) => {
    if (disabled) return;
    
    const mockEvent = {
      ...event,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      key: event?.key || 'Enter',
      code: event?.code || 'Enter',
      target: event?.target || { tagName: 'BUTTON' },
      currentTarget: event?.currentTarget || { tagName: 'BUTTON' },
      type: 'keydown',
      bubbles: true,
      cancelable: true,
    };

    if (mockEvent.key === 'Enter' || mockEvent.key === ' ') {
      mockEvent.preventDefault();
      handleClick(mockEvent);
    }
  });

  // Mock touch handlers for mobile
  const handleTouchStart = jest.fn((event) => {
    if (disabled) return;
    
    const mockEvent = {
      ...event,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      touches: event?.touches || [{ clientX: 0, clientY: 0 }],
      target: event?.target || { tagName: 'BUTTON' },
      currentTarget: event?.currentTarget || { tagName: 'BUTTON' },
      type: 'touchstart',
      bubbles: true,
      cancelable: true,
    };

    if (!mockIsListening) {
      setMockIsListening(true);
      setMockIsRecording(true);
      onStartListening(mockEvent);
    }
  });

  const handleTouchEnd = jest.fn((event) => {
    if (disabled) return;
    
    const mockEvent = {
      ...event,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      changedTouches: event?.changedTouches || [{ clientX: 0, clientY: 0 }],
      target: event?.target || { tagName: 'BUTTON' },
      currentTarget: event?.currentTarget || { tagName: 'BUTTON' },
      type: 'touchend',
      bubbles: true,
      cancelable: true,
    };

    if (mockIsListening) {
      setMockIsListening(false);
      setMockIsRecording(false);
      onStopListening(mockEvent);
    }
  });

  // Mock transcription simulation
  React.useEffect(() => {
    if (mockIsListening && mockIsRecording) {
      const timer = setTimeout(() => {
        const mockTranscriptionText = 'Mock transcription text for testing';
        setMockTranscription(mockTranscriptionText);
        onTranscriptionUpdate(mockTranscriptionText);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [mockIsListening, mockIsRecording, onTranscriptionUpdate]);

  // Determine button classes based on state and props
  const getButtonClasses = () => {
    const baseClasses = 'floating-microphone';
    const sizeClasses = {
      small: 'floating-microphone--small',
      medium: 'floating-microphone--medium',
      large: 'floating-microphone--large',
    };
    const variantClasses = {
      primary: 'floating-microphone--primary',
      secondary: 'floating-microphone--secondary',
      danger: 'floating-microphone--danger',
    };
    const positionClasses = {
      'top-left': 'floating-microphone--top-left',
      'top-right': 'floating-microphone--top-right',
      'bottom-left': 'floating-microphone--bottom-left',
      'bottom-right': 'floating-microphone--bottom-right',
    };

    return [
      baseClasses,
      sizeClasses[size] || sizeClasses.medium,
      variantClasses[variant] || variantClasses.primary,
      positionClasses[position] || positionClasses['bottom-right'],
      mockIsListening ? 'floating-microphone--listening' : '',
      mockIsRecording ? 'floating-microphone--recording' : '',
      disabled ? 'floating-microphone--disabled' : '',
      className,
    ].filter(Boolean).join(' ');
  };

  return (
    <button
      ref={ref}
      className={getButtonClasses()}
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      aria-label={mockIsListening ? 'Stop listening' : 'Start listening'}
      aria-pressed={mockIsListening}
      role="button"
      tabIndex={disabled ? -1 : 0}
      data-testid="floating-microphone"
      data-listening={mockIsListening}
      data-recording={mockIsRecording}
      {...props}
    >
      {/* Mock microphone icon */}
      <span className="floating-microphone__icon" aria-hidden="true">
        {mockIsListening ? '🔴' : '🎤'}
      </span>
      
      {/* Mock status indicator */}
      {mockIsListening && (
        <span className="floating-microphone__status" aria-hidden="true">
          Listening...
        </span>
      )}
      
      {/* Mock transcription display */}
      {mockTranscription && (
        <span className="floating-microphone__transcription" aria-live="polite">
          {mockTranscription}
        </span>
      )}
    </button>
  );
});

MockFloatingMicrophone.displayName = 'MockFloatingMicrophone';

// Export mock functions for testing
export const mockFloatingMicrophoneFunctions = {
  startListening: jest.fn(),
  stopListening: jest.fn(),
  toggleListening: jest.fn(),
  getTranscription: jest.fn(() => 'Mock transcription'),
  clearTranscription: jest.fn(),
  handleError: jest.fn(),
  handleTranscriptionUpdate: jest.fn(),
};

// Mock hooks that might be used by FloatingMicrophone
export const useMockSpeechRecognition = () => ({
  isListening: false,
  transcript: '',
  startListening: mockFloatingMicrophoneFunctions.startListening,
  stopListening: mockFloatingMicrophoneFunctions.stopListening,
  resetTranscript: mockFloatingMicrophoneFunctions.clearTranscription,
  browserSupportsSpeechRecognition: true,
  isMicrophoneAvailable: true,
});

export const useMockVoiceRecording = () => ({
  isRecording: false,
  audioBlob: null,
  startRecording: mockFloatingMicrophoneFunctions.startListening,
  stopRecording: mockFloatingMicrophoneFunctions.stopListening,
  clearRecording: mockFloatingMicrophoneFunctions.clearTranscription,
  error: null,
});

export default MockFloatingMicrophone;
