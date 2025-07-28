import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';
import VoiceFeedbackModal from './VoiceFeedbackModal';

/**
 * VoiceFeedbackButton - Quick feedback collection button
 * Provides easy access to feedback collection for voice commands
 */
export function VoiceFeedbackButton({ 
  command, 
  action, 
  size = 'sm',
  variant = 'outline',
  className = '',
  showQuickActions = true 
}) {
  const [showModal, setShowModal] = useState(false);
  const { collectFeedback, sessionId } = useVoiceAssistant();

  const handleQuickFeedback = async (type, rating) => {
    try {
      await collectFeedback({
        command: command || 'unknown',
        action: action || 'unknown',
        type,
        rating,
        quickFeedback: true
      });
    } catch (error) {
      console.error('Error submitting quick feedback:', error);
    }
  };

  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  const variantClasses = {
    outline: 'border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
    solid: 'bg-blue-500 hover:bg-blue-600 text-white'
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showQuickActions && (
        <>
          <button
            onClick={() => handleQuickFeedback('success', 5)}
            className={`
              ${sizeClasses[size]} 
              ${variantClasses[variant]}
              rounded-md flex items-center justify-center
              transition-colors duration-200
              text-green-600 hover:text-green-700 hover:bg-green-50
            `}
            title="Good command"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => handleQuickFeedback('issue', 2)}
            className={`
              ${sizeClasses[size]} 
              ${variantClasses[variant]}
              rounded-md flex items-center justify-center
              transition-colors duration-200
              text-red-600 hover:text-red-700 hover:bg-red-50
            `}
            title="Poor command"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </>
      )}
      
      <button
        onClick={() => setShowModal(true)}
        className={`
          ${sizeClasses[size]} 
          ${variantClasses[variant]}
          rounded-md flex items-center justify-center
          transition-colors duration-200
          text-blue-600 hover:text-blue-700 hover:bg-blue-50
        `}
        title="Detailed feedback"
      >
        <MessageSquare className="w-4 h-4" />
      </button>

      {showModal && (
        <VoiceFeedbackModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          commandData={{
            command: command || '',
            action: action || ''
          }}
        />
      )}
    </div>
  );
}

/**
 * VoiceFeedbackFloatingButton - Floating feedback button for global access
 */
export function VoiceFeedbackFloatingButton({ 
  position = 'bottom-right',
  className = '' 
}) {
  const [showModal, setShowModal] = useState(false);
  const { lastCommand } = useVoiceAssistant();

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4'
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`
          ${positionClasses[position]}
          w-12 h-12 bg-blue-500 hover:bg-blue-600 
          text-white rounded-full shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-200 transform hover:scale-105
          z-50 ${className}
        `}
        title="Voice Command Feedback"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {showModal && (
        <VoiceFeedbackModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          commandData={{
            command: lastCommand || ''
          }}
        />
      )}
    </>
  );
}

export default VoiceFeedbackButton;