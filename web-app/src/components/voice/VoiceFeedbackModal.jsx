import React, { useState } from 'react';
import { 
  StarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  LightBulbIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import voiceFeedbackService from '../../services/voiceFeedbackService';

/**
 * Voice Feedback Modal Component
 * Allows users to provide feedback on voice commands
 */
const VoiceFeedbackModal = ({ 
  isOpen, 
  onClose, 
  commandData = {},
  onFeedbackSubmitted 
}) => {
  const [feedbackType, setFeedbackType] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [expectedAction, setExpectedAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const feedbackData = {
        commandId: commandData.id || Date.now().toString(),
        command: commandData.command || '',
        action: commandData.action || '',
        rating,
        feedbackType,
        comment,
        expectedAction,
        sessionId: commandData.sessionId || '',
        context: {
          currentPage: window.location.pathname,
          commandSuccess: commandData.success,
          confidence: commandData.confidence
        }
      };

      await voiceFeedbackService.collectFeedback(feedbackData);
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedbackData);
      }

      // Reset form
      setFeedbackType('');
      setRating(0);
      setComment('');
      setExpectedAction('');
      
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes = [
    { id: 'positive', label: 'Positive', icon: HandThumbUpIcon, color: 'green' },
    { id: 'negative', label: 'Negative', icon: HandThumbDownIcon, color: 'red' },
    { id: 'suggestion', label: 'Suggestion', icon: LightBulbIcon, color: 'blue' }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Voice Command Feedback
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Command Info */}
        {commandData.command && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">Command:</p>
            <p className="font-medium">"{commandData.command}"</p>
            {commandData.action && (
              <>
                <p className="text-sm text-gray-600 mt-2">Action:</p>
                <p className="font-medium">{commandData.action}</p>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Feedback Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = feedbackType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFeedbackType(type.id)}
                    className={`p-3 border rounded-md flex flex-col items-center space-y-1 transition-colors ${
                      isSelected
                        ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700`
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating (1-5 stars)
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-yellow-400 hover:text-yellow-500"
                >
                  {star <= rating ? (
                    <StarIconSolid className="h-6 w-6" />
                  ) : (
                    <StarIcon className="h-6 w-6" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Share your thoughts about this voice command..."
            />
          </div>

          {/* Expected Action (for negative feedback) */}
          {feedbackType === 'negative' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What did you expect to happen?
              </label>
              <input
                type="text"
                value={expectedAction}
                onChange={(e) => setExpectedAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the expected behavior..."
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!feedbackType || !rating || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoiceFeedbackModal;