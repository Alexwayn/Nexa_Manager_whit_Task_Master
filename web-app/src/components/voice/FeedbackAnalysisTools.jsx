import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Star, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import voiceFeedbackService from '@/services/voiceFeedbackService';

/**
 * FeedbackAnalysisTools - Administrative tools for analyzing voice feedback
 */
export function FeedbackAnalysisTools() {
  const [feedback, setFeedback] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    rating: 'all',
    dateRange: '7d',
    status: 'all'
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feedbackData, suggestionsData, analyticsData] = await Promise.all([
        voiceFeedbackService.getFeedback(filters),
        voiceFeedbackService.getSuggestions(filters),
        voiceFeedbackService.getAnalytics(filters)
      ]);

      setFeedback(feedbackData);
      setSuggestions(suggestionsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading feedback data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveFeedback = async (feedbackId, resolution) => {
    try {
      await voiceFeedbackService.resolveFeedback(feedbackId, resolution);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error resolving feedback:', error);
    }
  };

  const handleUpdateSuggestionStatus = async (suggestionId, status) => {
    try {
      await voiceFeedbackService.updateSuggestionStatus(suggestionId, status);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error updating suggestion status:', error);
    }
  };

  const exportData = () => {
    const data = {
      feedback,
      suggestions,
      analytics,
      exportDate: new Date().toISOString(),
      filters
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-feedback-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading feedback data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Feedback Analysis Tools</h2>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="success">Success</option>
            <option value="issue">Issues</option>
            <option value="suggestion">Suggestions</option>
            <option value="error">Errors</option>
          </select>

          <select
            value={filters.rating}
            onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalFeedback}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageRating?.toFixed(1)}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{analytics.successRate?.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Issues</p>
                <p className="text-2xl font-bold text-red-600">{analytics.openIssues}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Feedback</h3>
        </div>
        <div className="divide-y">
          {feedback.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">"{item.command}"</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.type === 'success' ? 'bg-green-100 text-green-800' :
                      item.type === 'issue' ? 'bg-red-100 text-red-800' :
                      item.type === 'suggestion' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.type}
                    </span>
                    {item.rating && (
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {item.comments && (
                    <p className="text-gray-600 mb-2">{item.comments}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                    {item.confidence && (
                      <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                    )}
                    {item.autoGenerated && (
                      <span className="text-blue-600">Auto-generated</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'open' && (
                    <>
                      <button
                        onClick={() => handleResolveFeedback(item.id, 'resolved')}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleResolveFeedback(item.id, 'dismissed')}
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {item.status === 'resolved' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Insights</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Rating trend is positive</p>
              <p className="text-sm text-gray-600">Voice command ratings have improved by 15% over the last month</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Navigation commands perform best</p>
              <p className="text-sm text-gray-600">Navigation-related voice commands have the highest success rate at 94%</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Recognition accuracy needs improvement</p>
              <p className="text-sm text-gray-600">Consider updating the voice recognition model for better accuracy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Command Suggestions</h3>
        </div>
        <div className="divide-y">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">"{suggestion.command}"</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                      suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {suggestion.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      suggestion.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                      suggestion.status === 'approved' ? 'bg-green-100 text-green-800' :
                      suggestion.status === 'implemented' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {suggestion.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{suggestion.expectedAction}</p>
                  {suggestion.description && (
                    <p className="text-sm text-gray-500 mb-2">{suggestion.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{new Date(suggestion.timestamp).toLocaleString()}</span>
                    <span>Votes: {suggestion.votes}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {suggestion.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateSuggestionStatus(suggestion.id, 'approved')}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateSuggestionStatus(suggestion.id, 'rejected')}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {suggestion.status === 'approved' && (
                    <button
                      onClick={() => handleUpdateSuggestionStatus(suggestion.id, 'implemented')}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Mark Implemented
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FeedbackAnalysisTools;
