import React, { useState, useEffect } from 'react';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

/**
 * Floating microphone component for voice activation
 */
const FloatingMicrophone = ({ 
  position = 'bottom-right',
  className = '',
  ...props 
}) => {
  const {
    isEnabled,
    isListening,
    isProcessing,
    hasPermission,
    error,
    startListening,
    stopListening
  } = useVoiceAssistant();

  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);

  const handleClick = async () => {
    if (!isEnabled || !hasPermission) return;

    if (isListening) {
      stopListening();
    } else {
      await startListening();
      // Show feedback button after command execution
      setTimeout(() => setShowFeedback(true), 2000);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-8 right-8';
      case 'bottom-left':
        return 'bottom-8 left-8';
      case 'top-right':
        return 'top-8 right-8';
      case 'top-left':
        return 'top-8 left-8';
      default:
        return 'bottom-8 right-8';
    }
  };

  const getButtonState = () => {
    if (error) return 'error';
    if (isProcessing) return 'processing';
    if (isListening) return 'listening';
    return 'idle';
  };

  const getButtonClasses = () => {
    const baseClasses = 'floating-microphone fixed w-16 h-16 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center';
    const stateClasses = {
      idle: 'bg-blue-500 hover:bg-blue-600 text-white',
      listening: 'bg-red-500 text-white animate-pulse pulse',
      processing: 'bg-yellow-500 text-white',
      error: 'bg-red-600 text-white'
    };
    
    const disabledClasses = (!isEnabled || !hasPermission) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    
    return `${baseClasses} ${stateClasses[getButtonState()]} ${disabledClasses} ${className}`;
  };

  const getAriaLabel = () => {
    if (!isEnabled) return 'Voice assistant (disabled)';
    if (!hasPermission) return 'Voice assistant (no permission)';
    if (isListening) return 'Stop listening - Click to stop voice recognition';
    return 'Voice assistant - Click to start voice commands';
  };

  const getIcon = () => {
    if (error) return <div data-testid="error-icon">⚠️</div>;
    if (isProcessing) return <div data-testid="processing-icon">⏳</div>;
    if (isListening) return <div data-testid="listening-icon"><StopIcon className="w-6 h-6" /></div>;
    return <div data-testid="microphone-icon"><MicrophoneIcon className="w-6 h-6" /></div>;
  };

  return (
    <>
      <button
        className={`${getButtonClasses()} ${getPositionClasses()}`}
        onClick={handleClick}
        disabled={!isEnabled || !hasPermission}
        aria-label={getAriaLabel()}
        aria-pressed={isListening}
        data-testid="floating-microphone"
        {...props}
      >
        {getIcon()}
      </button>

      {showFeedback && (
        <button
          className="fixed bottom-8 right-28 w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center"
          onClick={() => setShowFeedback(false)}
          aria-label="Give feedback on voice command"
          data-testid="feedback-button"
        >
          💬
        </button>
      )}

      {error && (
        <div className="fixed bottom-24 right-8 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-lg max-w-xs">
          <p className="text-sm">
            {error.includes('Permission') ? 'Microphone permission required' : 'Voice recognition error'}
          </p>
        </div>
      )}

      {!hasPermission && (
        <div className="fixed bottom-24 right-8 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded shadow-lg max-w-xs">
          <p className="text-sm">Click to start voice commands</p>
        </div>
      )}
    </>
  );
};

export default FloatingMicrophone;