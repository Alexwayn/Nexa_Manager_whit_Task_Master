import React, { useState } from 'react';
import { 
  LightBulbIcon,
  PlusIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import voiceFeedbackService from '../../services/voiceFeedbackService';

/**
 * Command Suggestion Modal Component
 * Allows users to suggest new voice commands
 */
const CommandSuggestionModal = ({ 
  isOpen, 
  onClose, 
  onSuggestionSubmitted 
}) => {
  const [suggestedCommand, setSuggestedCommand] = useState('');
  const [expectedAction, setExpectedAction] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const suggestionData = {
        suggestedCommand,
        expectedAction,
        category,
        description,
        priority
      };

      await voiceFeedbackService.submitSuggestion(suggestionData);
      
      if (onSuggestionSubmitted) {
        onSuggestionSubmitted(suggestionData);
      }

      // Reset form
      setSuggestedCommand('');
      setExpectedAction('');
      setCategory('');
      setDescription('');
      setPriority(3);
      
      onClose();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert('Failed to submit suggestion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'Navigation',
    'Client Management',
    'Calendar',
    'Financial',
    'Reports',
    'Email',
    'Settings',
    'General',
    'Other'
  ];

  const priorityLevels = [
    { value: 1, label: 'Low', color: 'gray' },
    { value: 2, label: 'Medium-Low', color: 'blue' },
    { value: 3, label: 'Medium', color: 'yellow' },
    { value: 4, label: 'Medium-High', color: 'orange' },
    { value: 5, label: 'High', color: 'red' }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <LightBulbIcon className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-medium text-gray-900">
              Suggest New Command
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Suggested Command */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggested Voice Command *
            </label>
            <input
              type="text"
              value={suggestedCommand}
              onChange={(e) => setSuggestedCommand(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 'Create new invoice for client'"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Write the command as you would say it
            </p>
          </div>

          {/* Expected Action */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Action *
            </label>
            <input
              type="text"
              value={expectedAction}
              onChange={(e) => setExpectedAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 'Open invoice creation form with client pre-selected'"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe what should happen when this command is spoken
            </p>
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <div className="space-y-2">
              {priorityLevels.map((level) => (
                <label key={level.value} className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    value={level.value}
                    checked={priority === level.value}
                    onChange={(e) => setPriority(parseInt(e.target.value))}
                    className="mr-2"
                  />
                  <span className={`text-sm text-${level.color}-600 font-medium`}>
                    {level.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide any additional context or use cases for this command..."
            />
          </div>

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
              disabled={!suggestedCommand || !expectedAction || !category || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Command Suggestions List Component
 * Displays existing command suggestions with voting
 */
const CommandSuggestionsList = ({ suggestions = [], onVote, onStatusUpdate }) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);

  const handleVote = async (suggestionId, vote) => {
    try {
      await voiceFeedbackService.voteOnSuggestion(suggestionId, vote);
      if (onVote) {
        onVote(suggestionId, vote);
      }
    } catch (error) {
      console.error('Error voting on suggestion:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'reviewed': return 'blue';
      case 'implemented': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority) => {
    if (priority >= 4) return 'red';
    if (priority === 3) return 'yellow';
    if (priority === 2) return 'blue';
    return 'gray';
  };

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <LightBulbIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <div className="text-lg font-medium">No suggestions yet</div>
        <div className="text-sm">Be the first to suggest a new voice command!</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <div key={suggestion.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(suggestion.status)}-100 text-${getStatusColor(suggestion.status)}-800`}>
                  {suggestion.status}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getPriorityColor(suggestion.priority)}-100 text-${getPriorityColor(suggestion.priority)}-800`}>
                  Priority {suggestion.priority}
                </span>
                <span className="text-xs text-gray-500">
                  {suggestion.category}
                </span>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-1">
                "{suggestion.suggestedCommand}"
              </h4>
              
              <p className="text-sm text-gray-600 mb-2">
                Expected: {suggestion.expectedAction}
              </p>
              
              {suggestion.description && (
                <p className="text-sm text-gray-500">
                  {suggestion.description}
                </p>
              )}
            </div>
            
            {/* Voting */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => handleVote(suggestion.id, 1)}
                className="p-1 text-gray-400 hover:text-green-600"
                title="Upvote"
              >
                <ChevronUpIcon className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {suggestion.votes || 0}
              </span>
              <button
                onClick={() => handleVote(suggestion.id, -1)}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Downvote"
              >
                <ChevronDownIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 mt-2">
            Suggested {new Date(suggestion.timestamp).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export { CommandSuggestionModal, CommandSuggestionsList };
