import React from 'react';
import { MicrophoneIcon, SpeakerWaveIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';
import { cn } from '@/shared/utils/cn';

/**
 * VoiceIndicator Component
 * Shows the current state of the voice assistant (inactive, listening, processing)
 */

export function VoiceIndicator({ 
  size = 'md', 
  showLabel = true, 
  className = '',
  position = 'bottom-right' // 'bottom-right', 'top-right', 'bottom-left', 'top-left'
}) {
  const { 
    isListening, 
    isProcessing, 
    isEnabled, 
    error,
    lastCommand,
    lastResponse,
    microphonePermission
  } = useVoiceAssistant();

  // Size variants
  const sizeClasses = {
    sm: {
      container: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-xs',
      pulse: 'w-2 h-2'
    },
    md: {
      container: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-sm',
      pulse: 'w-3 h-3'
    },
    lg: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-base',
      pulse: 'w-4 h-4'
    }
  };

  // Position classes for floating indicator
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'top-right': 'fixed top-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-left': 'fixed top-6 left-6'
  };

  // Get current state
  const getCurrentState = () => {
    if (error) return 'error';
    if (!isEnabled || microphonePermission === 'denied') return 'disabled';
    if (isProcessing) return 'processing';
    if (isListening) return 'listening';
    return 'inactive';
  };

  const currentState = getCurrentState();

  // State configurations
  const stateConfig = {
    inactive: {
      icon: MicrophoneIcon,
      color: 'text-gray-400',
      bgColor: 'bg-gray-100',
      label: 'Voice Assistant Ready',
      description: 'Click to activate'
    },
    listening: {
      icon: MicrophoneIcon,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      label: 'Listening...',
      description: 'Speak your command',
      animate: true
    },
    processing: {
      icon: SpeakerWaveIcon,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      label: 'Processing...',
      description: 'Please wait',
      animate: true
    },
    error: {
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: 'Error',
      description: error || 'Something went wrong'
    },
    disabled: {
      icon: MicrophoneIcon,
      color: 'text-gray-300',
      bgColor: 'bg-gray-50',
      label: 'Disabled',
      description: microphonePermission === 'denied' 
        ? 'Microphone access denied' 
        : 'Voice assistant disabled'
    }
  };

  const config = stateConfig[currentState];
  const IconComponent = config.icon;

  // Don't render if not enabled and no error
  if (!isEnabled && !error && currentState === 'inactive') {
    return null;
  }

  return (
    <div className={cn(
      'z-50 flex items-center gap-3',
      positionClasses[position],
      className
    )}>
      {/* Main Indicator */}
      <div className={cn(
        'flex items-center justify-center rounded-full shadow-lg transition-all duration-300',
        sizeClasses[size].container,
        config.bgColor,
        config.animate && 'animate-pulse'
      )}>
        <IconComponent className={cn(
          sizeClasses[size].icon,
          config.color
        )} />
        
        {/* Pulse animation for listening state */}
        {currentState === 'listening' && (
          <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75" />
        )}
      </div>

      {/* Status Panel */}
      {(isListening || isProcessing || error) && showLabel && (
        <div className={cn(
          'bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs',
          position.includes('right') ? 'mr-16' : 'ml-16'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <div className={cn(
              'rounded-full',
              sizeClasses[size].pulse,
              config.color === 'text-red-500' ? 'bg-red-400' : 
              config.color === 'text-yellow-500' ? 'bg-yellow-400' : 'bg-gray-400',
              config.animate && 'animate-pulse'
            )} />
            <span className={cn(
              'font-medium',
              sizeClasses[size].text,
              config.color
            )}>
              {config.label}
            </span>
          </div>
          
          <p className={cn(
            'text-gray-600 mb-2',
            sizeClasses[size].text
          )}>
            {config.description}
          </p>

          {/* Show last command if listening */}
          {lastCommand && isListening && (
            <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 mb-1">
              Heard: "{lastCommand}"
            </div>
          )}

          {/* Show last response if processing */}
          {lastResponse && isProcessing && (
            <div className="text-xs text-green-600 bg-green-50 rounded px-2 py-1">
              {lastResponse}
            </div>
          )}

          {/* Error details */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
              {error}
            </div>
          )}

          {/* Arrow pointer */}
          <div className={cn(
            'absolute w-0 h-0 border-4 border-transparent border-t-white',
            position.includes('right') ? 'right-3 top-full' : 'left-3 top-full'
          )} />
        </div>
      )}

      {/* Quick Commands Help (only when listening) */}
      {isListening && showLabel && (
        <div className={cn(
          'bg-gray-900 text-white rounded-lg shadow-lg p-3 max-w-sm',
          position.includes('right') ? 'mr-16' : 'ml-16',
          position.includes('bottom') ? 'mb-16' : 'mt-16'
        )}>
          <h4 className={cn(
            'font-medium mb-2',
            sizeClasses[size].text
          )}>
            Try saying:
          </h4>
          <div className={cn(
            'space-y-1',
            sizeClasses[size].text === 'text-xs' ? 'text-xs' : 'text-sm'
          )}>
            <div>• "Go to dashboard"</div>
            <div>• "Open clients"</div>
            <div>• "Create new invoice"</div>
            <div>• "Show analytics"</div>
            <div>• "What can you do?"</div>
          </div>
          
          {/* Arrow pointer */}
          <div className={cn(
            'absolute w-0 h-0 border-4 border-transparent',
            position.includes('bottom') 
              ? 'border-b-gray-900 top-full' 
              : 'border-t-gray-900 bottom-full',
            position.includes('right') ? 'right-3' : 'left-3'
          )} />
        </div>
      )}
    </div>
  );
}

export default VoiceIndicator;