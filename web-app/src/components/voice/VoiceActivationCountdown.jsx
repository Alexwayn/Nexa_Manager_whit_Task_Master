import React from 'react';
import { cn } from '@/shared/utils/cn';

/**
 * VoiceActivationCountdown Component
 * Displays visual countdown for voice activation timeout
 */
const VoiceActivationCountdown = ({
  isVisible = false,
  remainingTime = 0,
  totalTime = 10000,
  percentage = 100,
  secondsLeft = 0,
  onCancel = null,
  className = '',
  size = 'medium',
  position = 'bottom-right'
}) => {
  if (!isVisible) return null;

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20',
    large: 'w-24 h-24'
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  const circumference = 2 * Math.PI * 30; // radius = 30
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColorClass = () => {
    if (percentage > 60) return 'text-green-500';
    if (percentage > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStrokeColor = () => {
    if (percentage > 60) return '#10b981'; // green-500
    if (percentage > 30) return '#f59e0b'; // yellow-500
    return '#ef4444'; // red-500
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex items-center justify-center',
        'bg-white/90 backdrop-blur-sm rounded-full shadow-lg border-2 border-gray-200',
        'transition-all duration-300 ease-in-out',
        sizeClasses[size],
        positionClasses[position],
        className
      )}
      role="timer"
      aria-label={`Voice activation timeout: ${secondsLeft} seconds remaining`}
    >
      {/* Circular Progress */}
      <div className="relative flex items-center justify-center">
        <svg
          className="transform -rotate-90"
          width="64"
          height="64"
          viewBox="0 0 64 64"
        >
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r="30"
            stroke="#e5e7eb"
            strokeWidth="4"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r="30"
            stroke={getStrokeColor()}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        {/* Countdown text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'text-lg font-bold transition-colors duration-300',
              getColorClass()
            )}
          >
            {secondsLeft}
          </span>
        </div>
      </div>

      {/* Cancel button (appears on hover) */}
      {onCancel && (
        <button
          onClick={() => onCancel('manual')}
          className={cn(
            'absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full',
            'flex items-center justify-center text-xs font-bold',
            'hover:bg-red-600 transition-colors duration-200',
            'opacity-0 hover:opacity-100 group-hover:opacity-100',
            'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-300'
          )}
          aria-label="Cancel voice activation"
          title="Cancel voice activation"
        >
          ×
        </button>
      )}

      {/* Pulse animation for low time */}
      {percentage < 30 && (
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-red-400',
            'animate-ping opacity-75'
          )}
        />
      )}
    </div>
  );
};

export default VoiceActivationCountdown;
