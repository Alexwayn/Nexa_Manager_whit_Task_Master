import React from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';
import { cn } from '@/shared/utils/cn';

/**
 * VoiceActivationButton Component
 * A UI component that allows users to manually activate the voice assistant
 */

export function VoiceActivationButton({ 
  size = 'md', 
  variant = 'primary', 
  className = '',
  showLabel = false,
  disabled = false
}) {
  const { 
    isListening, 
    isProcessing, 
    isEnabled, 
    microphonePermission,
    activateVoice, 
    deactivateVoice 
  } = useVoiceAssistant();

  // Size variants
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  // Variant styles
  const variantClasses = {
    primary: {
      base: 'bg-blue-500 hover:bg-blue-600 text-white',
      listening: 'bg-red-500 hover:bg-red-600 text-white animate-pulse',
      processing: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed'
    },
    secondary: {
      base: 'bg-gray-500 hover:bg-gray-600 text-white',
      listening: 'bg-red-500 hover:bg-red-600 text-white animate-pulse',
      processing: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      disabled: 'bg-gray-200 text-gray-400 cursor-not-allowed'
    },
    minimal: {
      base: 'bg-transparent hover:bg-gray-100 text-gray-600 border border-gray-300',
      listening: 'bg-red-50 hover:bg-red-100 text-red-600 border-red-300 animate-pulse',
      processing: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border-yellow-300',
      disabled: 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
    }
  };

  // Determine current state
  const isDisabled = disabled || !isEnabled || microphonePermission === 'denied';
  const currentVariant = isDisabled 
    ? variantClasses[variant].disabled
    : isProcessing 
    ? variantClasses[variant].processing
    : isListening 
    ? variantClasses[variant].listening 
    : variantClasses[variant].base;

  // Handle activation (both click and keyboard)
  const handleActivation = () => {
    if (isDisabled) return;
    
    if (isListening) {
      deactivateVoice();
    } else {
      activateVoice();
    }
  };

  // Handle keyboard events
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivation();
    }
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (microphonePermission === 'denied') {
      return 'Microphone access denied. Please enable microphone permissions.';
    }
    if (!isEnabled) {
      return 'Voice assistant is disabled';
    }
    if (isProcessing) {
      return 'Processing voice command...';
    }
    if (isListening) {
      return 'Stop listening - Click to stop voice recognition';
    }
    return 'Start voice command - Click to speak';
  };

  // Get icon
  const getIcon = () => {
    if (isListening) {
      return <StopIcon className={iconSizes[size]} />;
    }
    return <MicrophoneIcon className={iconSizes[size]} />;
  };

  // Get status text
  const getStatusText = () => {
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Listening...';
    return 'Voice Assistant';
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleActivation}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        className={cn(
          'rounded-full shadow-lg flex items-center justify-center transition-all duration-300',
          'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          sizeClasses[size],
          currentVariant,
          className
        )}
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        {getIcon()}
      </button>

      {showLabel && (
        <div className="flex flex-col">
          <span className={cn(
            'text-sm font-medium',
            isDisabled ? 'text-gray-400' : 'text-gray-700'
          )}>
            {getStatusText()}
          </span>
          {(isListening || isProcessing) && (
            <span className="text-xs text-gray-500">
              {isListening ? 'Speak now...' : 'Please wait...'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default VoiceActivationButton;