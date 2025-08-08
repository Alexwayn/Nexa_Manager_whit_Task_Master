import React, { useEffect, useState } from 'react';
import { cn } from '@/shared/utils/cn';

/**
 * WakeWordFeedback Component
 * Provides visual and audio feedback for wake word detection
 */
const WakeWordFeedback = ({
  isDetected = false,
  isListening = false,
  wakeWord = 'hey nexa',
  confidence = 0,
  onDismiss = null,
  showConfidence = true,
  autoHide = true,
  autoHideDelay = 3000,
  position = 'top-center',
  size = 'medium',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isDetected) {
      setIsVisible(true);
      setAnimationClass('animate-bounce');

      // Auto-hide after delay
      if (autoHide) {
        const timer = setTimeout(() => {
          setAnimationClass('animate-fade-out');
          setTimeout(() => {
            setIsVisible(false);
            if (onDismiss) onDismiss();
          }, 300);
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
      setAnimationClass('');
    }
  }, [isDetected, autoHide, autoHideDelay, onDismiss]);

  if (!isVisible) return null;

  const sizeClasses = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-4 py-3 text-base',
    large: 'px-6 py-4 text-lg'
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4'
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceBackground = () => {
    if (confidence >= 0.8) return 'bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-orange-50 border-orange-200';
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex items-center space-x-3',
        'bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border-2',
        'transition-all duration-300 ease-in-out',
        sizeClasses[size],
        positionClasses[position],
        getConfidenceBackground(),
        animationClass,
        className
      )}
      role="alert"
      aria-live="polite"
      aria-label={`Wake word "${wakeWord}" detected with ${Math.round(confidence * 100)}% confidence`}
    >
      {/* Wake word icon */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
            isListening && 'animate-pulse'
          )}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">
            Wake word detected!
          </span>
          {isListening && (
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-100" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-200" />
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          "{wakeWord}"
          {showConfidence && (
            <span className={cn('ml-2 font-medium', getConfidenceColor())}>
              ({Math.round(confidence * 100)}% confidence)
            </span>
          )}
        </div>

        {isListening && (
          <div className="text-xs text-blue-600 mt-1">
            Listening for commands...
          </div>
        )}
      </div>

      {/* Confidence bar */}
      {showConfidence && (
        <div className="flex-shrink-0 w-16">
          <div className="text-xs text-gray-500 mb-1">Confidence</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                confidence >= 0.8 ? 'bg-green-500' :
                confidence >= 0.6 ? 'bg-yellow-500' : 'bg-orange-500'
              )}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            'flex-shrink-0 w-6 h-6 text-gray-400 hover:text-gray-600',
            'transition-colors duration-200 focus:outline-none'
          )}
          aria-label="Dismiss wake word notification"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Pulse animation overlay */}
      {isDetected && (
        <div
          className={cn(
            'absolute inset-0 rounded-lg border-2 border-blue-400',
            'animate-ping opacity-30 pointer-events-none'
          )}
        />
      )}
    </div>
  );
};

export default WakeWordFeedback;
