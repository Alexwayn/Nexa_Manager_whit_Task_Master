import React, { useState, useEffect, useRef } from 'react';
import { 
  HandThumbUpIcon, 
  HandThumbDownIcon, 
  ChatBubbleLeftRightIcon,
  MicrophoneIcon 
} from '@heroicons/react/24/outline';
import VoiceFeedbackModal from './VoiceFeedbackModal';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';

/**
 * VoiceFeedbackButton Component
 * 
 * Provides feedback functionality for voice commands
 */
const VoiceFeedbackButton = ({ 
  disabled = false,
  iconOnly = false,
  feedbackCount,
  showCount = false,
  isLoading = false,
  onFeedbackSubmit,
  className = '',
  style = {},
  variant = 'default',
  size = 'default',
  ...props 
}) => {
  const { 
    lastCommand, 
    lastConfidence, 
    isEnabled, 
    feedbackCount: stateFeedbackCount 
  } = useVoiceAssistant();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef(null);

  // Clear messages after a delay
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Handle rapid clicks
  const handleClick = () => {
    if (disabled || isLoading || !isEnabled || !lastCommand) return;
    
    setClickCount(prev => prev + 1);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      if (!isModalOpen) {
        setIsModalOpen(true);
      }
      setClickCount(0);
    }, 100);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  const handleFeedbackSubmit = async (feedbackData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (onFeedbackSubmit) {
        await onFeedbackSubmit(feedbackData);
      }
      setSuccessMessage('Feedback submitted successfully!');
      setIsModalOpen(false);
    } catch (error) {
      setErrorMessage('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonDisabled = disabled || isLoading || !isEnabled || !lastCommand || isSubmitting;

  // Build CSS classes
  const getButtonClasses = () => {
    const baseClasses = [
      'voice-feedback-button',
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-md',
      'border',
      'font-medium',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'transition-colors',
      'duration-200'
    ];

    // Check if custom style has background properties that should override defaults
    const hasCustomBackground = style && (style.backgroundColor || style.background);

    // Variant classes
    const variantClasses = {
      primary: [
        'border-transparent',
        'text-white',
        ...(hasCustomBackground ? [] : ['bg-blue-600']),
        'hover:bg-blue-700',
        'focus:ring-blue-500'
      ],
      secondary: [
        'border-gray-300',
        'text-gray-700',
        ...(hasCustomBackground ? [] : ['bg-white']),
        'hover:bg-gray-50',
        'focus:ring-blue-500'
      ],
      default: [
        'border-gray-300',
        'text-gray-700',
        ...(hasCustomBackground ? [] : ['bg-white']),
        'hover:bg-gray-50',
        'focus:ring-blue-500'
      ]
    };

    // Size classes
    const sizeClasses = {
      sm: ['px-2.5', 'py-1.5', 'text-xs'],
      default: ['px-3', 'py-2', 'text-sm'],
      lg: ['px-4', 'py-2', 'text-base']
    };

    // Disabled classes
    const disabledClasses = isButtonDisabled ? [
      'opacity-50',
      'cursor-not-allowed'
    ] : [];

    const allClasses = [
      ...baseClasses,
      ...variantClasses[variant],
      ...sizeClasses[size],
      ...disabledClasses,
      `btn-${variant}`,
      `btn-${size}`
    ];

    // Add custom className if provided
    if (className) {
      allClasses.push(className);
    }

    return allClasses.filter(Boolean).join(' ');
  };

  // Build tooltip text
  const getTooltipText = () => {
    if (!isEnabled) {
      return 'Voice assistant is disabled';
    }
    if (!lastCommand) {
      return 'No voice command to provide feedback for';
    }
    const confidencePercent = Math.round((lastConfidence || 0) * 100);
    return `Give feedback for: \"${lastCommand}\" (Confidence: ${confidencePercent}%`;
  };

  // Build aria-label
  const getAriaLabel = () => {
    const currentFeedbackCount = feedbackCount || stateFeedbackCount;
    if (showCount && currentFeedbackCount) {
      return `${currentFeedbackCount} feedback items`;
    }
    return 'Give feedback';
  };

  // Build style - return the style object as-is for inline styles
  const getButtonStyle = () => {
    return style || {};
  };

  return (
    <>
      <div className="relative inline-flex">
        <button
          className={getButtonClasses()}
          style={getButtonStyle()}
          disabled={isButtonDisabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          title={getTooltipText()}
          aria-label={getAriaLabel()}
          aria-describedby="feedback-tooltip"
          role="button"
          data-testid="voice-feedback-button"
          {...props}
        >
        <ChatBubbleLeftRightIcon className="h-4 w-4" data-testid="feedback-icon" />
        {!iconOnly && (
          <span className="ml-2">
            Give feedback
            {showCount && (feedbackCount || stateFeedbackCount) && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                {feedbackCount || stateFeedbackCount}
              </span>
            )}
          </span>
        )}
        {showCount && (feedbackCount || stateFeedbackCount) && iconOnly && (
          <span 
            className="absolute -top-1 -right-1 px-1 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-[1rem] text-center"
            data-testid="feedback-count-badge"
          >
            {feedbackCount || stateFeedbackCount}
          </span>
        )}
      </button>
      </div>


      {/* Status Messages */}
      {isSubmitting && (
        <div className="mt-2 text-sm text-blue-600">
          Submitting feedback...
        </div>
      )}
      {successMessage && (
        <div className="mt-2 text-sm text-green-600">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mt-2 text-sm text-red-600">
          {errorMessage}
        </div>
      )}


      {/* Feedback Modal (guard in case module is mocked to undefined in tests) */}
      {VoiceFeedbackModal ? (
        <VoiceFeedbackModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          commandData={{
            command: lastCommand,
            confidence: lastConfidence,
            id: Date.now().toString(),
            sessionId: 'current-session'
          }}
          onFeedbackSubmitted={handleFeedbackSubmit}
        />
      ) : null}
    </>
  );
};

/**
 * VoiceFeedbackFloatingButton Component
 * 
 * Floating button for global voice feedback access
 */
const VoiceFeedbackFloatingButton = ({ disabled = false, ...props }) => {
  const { isEnabled } = useVoiceAssistant();
  
  const isButtonDisabled = disabled || !isEnabled;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <VoiceFeedbackButton
        iconOnly={true}
        disabled={isButtonDisabled}
        className="rounded-full p-3 shadow-lg"
        title={isButtonDisabled ? 'Voice assistant is disabled' : 'Give feedback on voice commands'}
        aria-label={isButtonDisabled ? 'Voice assistant is disabled' : 'Give feedback on voice commands'}
        {...props}
      />
    </div>
  );
};

export default VoiceFeedbackButton;
export { VoiceFeedbackFloatingButton };
