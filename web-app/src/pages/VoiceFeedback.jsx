import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ChartBarIcon,
  PlusIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import VoiceFeedbackModal from '../components/voice/VoiceFeedbackModal';
import { CommandSuggestionModal, CommandSuggestionsList } from '../components/voice/CommandSuggestion';
import VoiceFeedbackAnalytics from '../components/voice/VoiceFeedbackAnalytics';
import { FeedbackAnalysisTools } from '../components/voice/FeedbackAnalysisTools';
import voiceFeedbackService from '../services/voiceFeedbackService';

/**
 * Voice Feedback Dashboard Page
 * Main page for managing voice feedback, suggestions, and analytics
 */
const VoiceFeedback = () => {
  const [activeTab, setActiveTab] = useState('feedback');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feedbackData, suggestionsData] = await Promise.all([
        voiceFeedbackService.getFeedback(),
        voiceFeedbackService.getSuggestions()
      ]);
      setFeedback(feedbackData);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Error loading feedback data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmitted = () => {
    loadData();
  };

  const handleSuggestionSubmitted = () => {
    loadData();
  };

  const handleVote = () => {
    loadData();
  };

  const tabs = [
    {
      id: 'feedback',
      name: 'Feedback',
      icon: ChatBubbleLeftRightIcon,
      description: 'View and manage user feedback'
    },
    {
      id: 'suggestions',
      name: 'Suggestions',
      icon: LightBulbIcon,
      description: 'Command suggestions from users'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: ChartBarIcon,
      description: 'Feedback insights and trends'
    },
    {
      id: 'analysis',
      name: 'Analysis Tools',
      icon: CogIcon,
      description: 'Advanced feedback analysis tools'
    }
  ];

  const renderFeedbackList = () => {
    if (feedback.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <div className="text-lg font-medium">No feedback yet</div>
          <div className="text-sm">User feedback will appear here</div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {feedback.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.type === 'issue' ? 'bg-red-100 text-red-800' :
                    item.type === 'improvement' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {item.type}
                  </span>
                  {item.rating && (
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-4 w-4 ${
                            i < item.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  )}
                </div>
                
                <h4 className="font-medium text-gray-900 mb-1">
                  Command: "{item.command}"
                </h4>
                
                {item.expectedAction && (
                  <p className="text-sm text-gray-600 mb-2">
                    Expected: {item.expectedAction}
                  </p>
                )}
                
                {item.comments && (
                  <p className="text-sm text-gray-700 mb-2">
                    {item.comments}
                  </p>
                )}
                
                <div className="text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Voice Feedback</h1>
        <p className="text-gray-600 mt-2">
          Manage user feedback, suggestions, and analytics for voice commands
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'feedback' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">User Feedback</h2>
                <p className="text-gray-600">Review feedback from voice command users</p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Feedback
              </button>
            </div>
            {renderFeedbackList()}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Command Suggestions</h2>
                <p className="text-gray-600">New voice commands suggested by users</p>
              </div>
              <button
                onClick={() => setShowSuggestionModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Suggest Command
              </button>
            </div>
            <CommandSuggestionsList
              suggestions={suggestions}
              onVote={handleVote}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <VoiceFeedbackAnalytics />
        )}

        {activeTab === 'analysis' && (
          <FeedbackAnalysisTools />
        )}
      </div>

      {/* Modals */}
      <VoiceFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />

      <CommandSuggestionModal
        isOpen={showSuggestionModal}
        onClose={() => setShowSuggestionModal(false)}
        onSuggestionSubmitted={handleSuggestionSubmitted}
      />
    </div>
  );
};

export default VoiceFeedback;