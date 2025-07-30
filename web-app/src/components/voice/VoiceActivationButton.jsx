import React from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';

/**
 * VoiceActivationButton Component
 * A UI component that allows users to manually activate the voice assistant
 */

export function VoiceActivationButton({ 
  size = 'md', 
  className = '',
  onClick,
  ...props
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

  // Determine current state
  const isDisabled = !isEnabled || microphonePermission === 'denied';
  
  // Get button classes based on state
  const getButtonClasses = () => {
    let classes = [
      'rounded-full shadow-lg flex items-center justify-center transition-all duration-300',
      'focus:outline-none focus:ring-2 focus:ring-blue-500',
      sizeClasses[size]
    ];

    if (isDisabled) {
      classes.push('cursor-not-allowed', 'bg-gray-300', 'text-gray-500');
    } else if (isProcessing) {
      classes.push('bg-yellow-500', 'hover:bg-yellow-600', 'text-white');
    } else if (isListening) {
      classes.push('bg-red-500', 'hover:bg-red-600', 'text-white', 'animate-pulse');
    } else {
      classes.push('bg-blue-500', 'hover:bg-blue-600', 'text-white');
    }

    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  };

  // Handle activation (both click and keyboard)
  const handleActivation = async () => {
    if (isDisabled) return;
    
    if (onClick) {
      onClick();
    }
    
    if (isListening) {
      await deactivateVoice();
    } else {
      await activateVoice();
    }
  };

  // Handle keyboard events
  const handleKeyDown = async (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      await handleActivation();
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

  // Get icon with test IDs - only show one at a time
  const getIcon = () => {
    if (isListening) {
      return <StopIcon className={iconSizes[size]} data-testid="stop-icon" />;
    }
    return <MicrophoneIcon className={iconSizes[size]} data-testid="microphone-icon" />;
  };

  return (
    <button
      onClick={handleActivation}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      className={getButtonClasses()}
      title={getTooltipText()}
      aria-label={getTooltipText()}
      role="button"
      {...props}
    >
      {getIcon()}
    </button>
  );
}

export default VoiceActivationButton;