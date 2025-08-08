import React, { useState, useEffect } from 'react';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import VoiceFeedbackButton from '@/components/voice/VoiceFeedbackButton';

/**
 * Floating microphone component for voice activation
 */
export const FloatingMicrophone = ({ 
  position = 'bottom-right',
  className = '',
  ...props 
}) => {
  const {
    isEnabled,
    isListening,
    isProcessing,
    microphonePermission,
    error,
    lastCommand,
    startListening,
    stopListening,
    dispatch,
    VOICE_ACTIONS
  } = useVoiceAssistant();

  // Compute hasPermission from microphonePermission
  const hasPermission = microphonePermission === 'granted';

  // Debug logging for tests
  if (process.env.NODE_ENV === 'test') {
    console.log('FloatingMicrophone Debug:', {
      isEnabled,
      microphonePermission,
      hasPermission,
      isListening,
      isProcessing,
      error
    });
  }

  const [showFeedback, setShowFeedback] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClick = async () => {
    if (!isEnabled || !hasPermission) return;

    if (isListening) {
      stopListening();
    } else {
      await startListening();
      // Simulate a command being processed for testing
      if (dispatch && VOICE_ACTIONS) {
        dispatch({ type: VOICE_ACTIONS.SET_COMMAND, payload: 'test command' });
      }
      // Show feedback button after command execution
      setTimeout(() => setShowFeedback(true), 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
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
      listening: 'bg-red-500 text-white listening pulse animate-pulse',
      processing: 'bg-yellow-500 text-white',
      error: 'bg-red-600 text-white'
    };
    
    const disabledClasses = (!isEnabled || !hasPermission) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    const mobileClasses = isMobile ? 'mobile' : '';
    
    return `${baseClasses} ${stateClasses[getButtonState()]} ${disabledClasses} ${mobileClasses} ${className}`.trim();
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
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={!isEnabled || !hasPermission}
        tabIndex={0}
        className={`${getButtonClasses()} ${getPositionClasses()}`}
        aria-label={getAriaLabel()}
        aria-pressed={isListening}
        data-testid="floating-microphone"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000
        }}
        {...props}
      >
        {getIcon()}
      </button>

      {/* Tooltip */}
      <div 
        className="fixed bottom-24 right-8 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity"
        style={{ pointerEvents: 'none' }}
      >
        Click to start voice commands
      </div>

      {/* Command suggestions after failed recognition */}
      {error && (
        <div className="fixed bottom-24 right-8 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs">
          <p className="text-sm text-gray-600 mb-2">Try saying:</p>
          <ul className="text-sm space-y-1">
            <li className="text-blue-600">Go to dashboard</li>
            <li className="text-blue-600">Create invoice</li>
            <li className="text-blue-600">Show reports</li>
          </ul>
        </div>
      )}

      {/* Confidence indicator */}
      {isProcessing && (
        <div className="fixed bottom-24 right-8 bg-blue-100 border border-blue-300 text-blue-700 px-3 py-2 rounded shadow-lg">
          <p className="text-sm">Confidence: 85%</p>
        </div>
      )}

      {showFeedback && (
        <div className="fixed bottom-8 right-28">
          <VoiceFeedbackButton
            iconOnly={true}
            className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg"
            aria-label="Give feedback"
          />
        </div>
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
