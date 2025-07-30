import React, { useState, useEffect } from 'react';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';
import VoiceActivationButton from './VoiceActivationButton';
import VoiceIndicator from './VoiceIndicator';
import FloatingMicrophone from './FloatingMicrophone';

/**
 * Main Voice component that orchestrates voice assistant functionality
 */
const Voice = ({ 
  mode = 'button', // 'button', 'floating', 'indicator'
  className = '',
  onCommand,
  onError,
  ...props 
}) => {
  const {
    isListening,
    isProcessing,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    processCommand
  } = useVoiceAssistant();

  const [lastCommand, setLastCommand] = useState('');

  useEffect(() => {
    if (transcript && confidence > 0.7) {
      setLastCommand(transcript);
      if (onCommand) {
        onCommand(transcript, confidence);
      }
    }
  }, [transcript, confidence, onCommand]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const renderComponent = () => {
    switch (mode) {
      case 'floating':
        return (
          <FloatingMicrophone
            isListening={isListening}
            isProcessing={isProcessing}
            onToggle={handleToggleListening}
            className={className}
            {...props}
          />
        );
      
      case 'indicator':
        return (
          <VoiceIndicator
            isListening={isListening}
            isProcessing={isProcessing}
            transcript={transcript}
            confidence={confidence}
            className={className}
            {...props}
          />
        );
      
      case 'button':
      default:
        return (
          <VoiceActivationButton
            isListening={isListening}
            isProcessing={isProcessing}
            onToggle={handleToggleListening}
            className={className}
            {...props}
          />
        );
    }
  };

  return (
    <div className={`voice-component ${className}`} data-testid="voice-component">
      {renderComponent()}
      {error && (
        <div className="voice-error text-red-500 text-sm mt-2" data-testid="voice-error">
          {error}
        </div>
      )}
      {lastCommand && (
        <div className="voice-last-command text-gray-600 text-sm mt-1" data-testid="voice-last-command">
          Last: {lastCommand}
        </div>
      )}
    </div>
  );
};

export default Voice;