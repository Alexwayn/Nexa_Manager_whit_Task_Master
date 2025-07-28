/**
 * Voice Feedback Service
 * Handles collection, storage, and analysis of user feedback for voice commands
 */

class VoiceFeedbackService {
  constructor() {
    this.storageKey = 'voice_feedback_data';
    this.suggestionsKey = 'voice_command_suggestions';
    this.maxFeedbackItems = 1000;
    this.maxSuggestions = 500;
  }

  /**
   * Collect feedback for a voice command
   * @param {Object} feedbackData - The feedback data
   * @param {string} feedbackData.commandId - Unique identifier for the command
   * @param {string} feedbackData.command - The voice command text
   * @param {string} feedbackData.action - The action that was executed
   * @param {number} feedbackData.rating - User rating (1-5)
   * @param {string} feedbackData.feedbackType - Type of feedback (positive, negative, suggestion)
   * @param {string} feedbackData.comment - User comment
   * @param {string} feedbackData.expectedAction - What the user expected to happen
   * @param {string} feedbackData.sessionId - Voice session ID
   * @param {Object} feedbackData.context - Context information
   */
  collectFeedback(feedbackData) {
    try {
      const feedback = {
        id: this.generateId(),
        timestamp: Date.now(),
        commandId: feedbackData.commandId,
        command: feedbackData.command,
        action: feedbackData.action,
        rating: feedbackData.rating,
        feedbackType: feedbackData.feedbackType,
        comment: feedbackData.comment || '',
        expectedAction: feedbackData.expectedAction || '',
        sessionId: feedbackData.sessionId,
        context: {
          currentPage: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          ...feedbackData.context
        },
        resolved: false,
        tags: this.extractTags(feedbackData)
      };

      this.storeFeedback(feedback);
      this.updateFeedbackAnalytics(feedback);
      
      console.log('Voice feedback collected:', feedback);
      return feedback;
    } catch (error) {
      console.error('Error collecting voice feedback:', error);
      throw error;
    }
  }

  /**
   * Submit a command suggestion
   * @param {Object} suggestionData - The suggestion data
   * @param {string} suggestionData.suggestedCommand - The suggested voice command
   * @param {string} suggestionData.expectedAction - What action it should perform
   * @param {string} suggestionData.category - Command category
   * @param {string} suggestionData.description - Description of the suggestion
   * @param {number} suggestionData.priority - Priority level (1-5)
   */
  submitSuggestion(suggestionData) {
    try {
      const suggestion = {
        id: this.generateId(),
        timestamp: Date.now(),
        suggestedCommand: suggestionData.suggestedCommand,
        expectedAction: suggestionData.expectedAction,
        category: suggestionData.category,
        description: suggestionData.description || '',
        priority: suggestionData.priority || 3,
        status: 'pending', // pending, reviewed, implemented, rejected
        votes: 0,
        context: {
          currentPage: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        tags: this.extractSuggestionTags(suggestionData)
      };

      this.storeSuggestion(suggestion);
      
      console.log('Command suggestion submitted:', suggestion);
      return suggestion;
    } catch (error) {
      console.error('Error submitting command suggestion:', error);
      throw error;
    }
  }

  /**
   * Vote on a command suggestion
   * @param {string} suggestionId - The suggestion ID
   * @param {number} vote - Vote value (1 for upvote, -1 for downvote)
   */
  voteOnSuggestion(suggestionId, vote) {
    try {
      const suggestions = this.getSuggestions();
      const suggestion = suggestions.find(s => s.id === suggestionId);
      
      if (suggestion) {
        suggestion.votes += vote;
        suggestion.lastVoted = Date.now();
        this.storeSuggestions(suggestions);
        
        console.log('Vote recorded for suggestion:', suggestionId, vote);
        return suggestion;
      }
      
      throw new Error('Suggestion not found');
    } catch (error) {
      console.error('Error voting on suggestion:', error);
      throw error;
    }
  }

  /**
   * Get all feedback data
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of feedback items
   */
  getFeedback(filters = {}) {
    try {
      let feedback = this.loadFeedback();
      
      // Apply filters
      if (filters.feedbackType) {
        feedback = feedback.filter(f => f.feedbackType === filters.feedbackType);
      }
      
      if (filters.rating) {
        feedback = feedback.filter(f => f.rating === filters.rating);
      }
      
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        feedback = feedback.filter(f => f.timestamp >= start && f.timestamp <= end);
      }
      
      if (filters.resolved !== undefined) {
        feedback = feedback.filter(f => f.resolved === filters.resolved);
      }
      
      // Sort by timestamp (newest first)
      return feedback.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting feedback:', error);
      return [];
    }
  }

  /**
   * Get all command suggestions
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of suggestion items
   */
  getSuggestions(filters = {}) {
    try {
      let suggestions = this.loadSuggestions();
      
      // Apply filters
      if (filters.category) {
        suggestions = suggestions.filter(s => s.category === filters.category);
      }
      
      if (filters.status) {
        suggestions = suggestions.filter(s => s.status === filters.status);
      }
      
      if (filters.priority) {
        suggestions = suggestions.filter(s => s.priority === filters.priority);
      }
      
      // Sort by votes and timestamp
      return suggestions.sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        return b.timestamp - a.timestamp;
      });
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Get feedback analytics
   * @returns {Object} Analytics data
   */
  getFeedbackAnalytics() {
    try {
      const feedback = this.getFeedback();
      const suggestions = this.getSuggestions();
      
      const analytics = {
        totalFeedback: feedback.length,
        totalSuggestions: suggestions.length,
        averageRating: this.calculateAverageRating(feedback),
        feedbackByType: this.groupByType(feedback),
        feedbackByRating: this.groupByRating(feedback),
        suggestionsByCategory: this.groupSuggestionsByCategory(suggestions),
        suggestionsByStatus: this.groupSuggestionsByStatus(suggestions),
        recentFeedback: feedback.slice(0, 10),
        topSuggestions: suggestions.slice(0, 10),
        trends: this.calculateTrends(feedback),
        commonIssues: this.identifyCommonIssues(feedback),
        improvementAreas: this.identifyImprovementAreas(feedback)
      };
      
      return analytics;
    } catch (error) {
      console.error('Error getting feedback analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Mark feedback as resolved
   * @param {string} feedbackId - The feedback ID
   * @param {string} resolution - Resolution notes
   */
  resolveFeedback(feedbackId, resolution = '') {
    try {
      const feedback = this.loadFeedback();
      const item = feedback.find(f => f.id === feedbackId);
      
      if (item) {
        item.resolved = true;
        item.resolution = resolution;
        item.resolvedAt = Date.now();
        this.storeFeedback(feedback);
        
        console.log('Feedback resolved:', feedbackId);
        return item;
      }
      
      throw new Error('Feedback not found');
    } catch (error) {
      console.error('Error resolving feedback:', error);
      throw error;
    }
  }

  /**
   * Update suggestion status
   * @param {string} suggestionId - The suggestion ID
   * @param {string} status - New status
   * @param {string} notes - Status change notes
   */
  updateSuggestionStatus(suggestionId, status, notes = '') {
    try {
      const suggestions = this.loadSuggestions();
      const suggestion = suggestions.find(s => s.id === suggestionId);
      
      if (suggestion) {
        suggestion.status = status;
        suggestion.statusNotes = notes;
        suggestion.statusUpdatedAt = Date.now();
        this.storeSuggestions(suggestions);
        
        console.log('Suggestion status updated:', suggestionId, status);
        return suggestion;
      }
      
      throw new Error('Suggestion not found');
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      throw error;
    }
  }

  // Private methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  extractTags(feedbackData) {
    const tags = [];
    
    if (feedbackData.rating <= 2) tags.push('low-rating');
    if (feedbackData.rating >= 4) tags.push('high-rating');
    if (feedbackData.comment && feedbackData.comment.length > 50) tags.push('detailed-feedback');
    if (feedbackData.expectedAction) tags.push('has-expectation');
    
    return tags;
  }

  extractSuggestionTags(suggestionData) {
    const tags = [];
    
    if (suggestionData.priority >= 4) tags.push('high-priority');
    if (suggestionData.description && suggestionData.description.length > 100) tags.push('detailed-suggestion');
    
    return tags;
  }

  storeFeedback(feedback) {
    let allFeedback = this.loadFeedback();
    
    if (Array.isArray(feedback)) {
      allFeedback = feedback;
    } else {
      allFeedback.push(feedback);
    }
    
    // Keep only the most recent items
    if (allFeedback.length > this.maxFeedbackItems) {
      allFeedback = allFeedback
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.maxFeedbackItems);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(allFeedback));
  }

  storeSuggestion(suggestion) {
    let allSuggestions = this.loadSuggestions();
    
    if (Array.isArray(suggestion)) {
      allSuggestions = suggestion;
    } else {
      allSuggestions.push(suggestion);
    }
    
    // Keep only the most recent items
    if (allSuggestions.length > this.maxSuggestions) {
      allSuggestions = allSuggestions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.maxSuggestions);
    }
    
    this.storeSuggestions(allSuggestions);
  }

  storeSuggestions(suggestions) {
    localStorage.setItem(this.suggestionsKey, JSON.stringify(suggestions));
  }

  loadFeedback() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading feedback data:', error);
      return [];
    }
  }

  loadSuggestions() {
    try {
      const data = localStorage.getItem(this.suggestionsKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading suggestions data:', error);
      return [];
    }
  }

  updateFeedbackAnalytics(feedback) {
    // Update real-time analytics if needed
    // This could trigger events for dashboard updates
  }

  calculateAverageRating(feedback) {
    if (feedback.length === 0) return 0;
    const sum = feedback.reduce((acc, f) => acc + (f.rating || 0), 0);
    return (sum / feedback.length).toFixed(2);
  }

  groupByType(feedback) {
    return feedback.reduce((acc, f) => {
      acc[f.feedbackType] = (acc[f.feedbackType] || 0) + 1;
      return acc;
    }, {});
  }

  groupByRating(feedback) {
    return feedback.reduce((acc, f) => {
      const rating = f.rating || 0;
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});
  }

  groupSuggestionsByCategory(suggestions) {
    return suggestions.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {});
  }

  groupSuggestionsByStatus(suggestions) {
    return suggestions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
  }

  calculateTrends(feedback) {
    // Calculate trends over time
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);
    
    const thisWeek = feedback.filter(f => f.timestamp >= oneWeekAgo).length;
    const lastWeek = feedback.filter(f => f.timestamp >= twoWeeksAgo && f.timestamp < oneWeekAgo).length;
    
    return {
      thisWeek,
      lastWeek,
      change: lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek * 100).toFixed(1) : 0
    };
  }

  identifyCommonIssues(feedback) {
    const negativeFeedback = feedback.filter(f => f.rating <= 2 || f.feedbackType === 'negative');
    const issues = {};
    
    negativeFeedback.forEach(f => {
      if (f.comment) {
        // Simple keyword extraction for common issues
        const keywords = f.comment.toLowerCase().match(/\b\w+\b/g) || [];
        keywords.forEach(keyword => {
          if (keyword.length > 3) {
            issues[keyword] = (issues[keyword] || 0) + 1;
          }
        });
      }
    });
    
    return Object.entries(issues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
  }

  identifyImprovementAreas(feedback) {
    const suggestions = feedback.filter(f => f.feedbackType === 'suggestion' || f.expectedAction);
    const areas = {};
    
    suggestions.forEach(f => {
      if (f.expectedAction) {
        areas[f.expectedAction] = (areas[f.expectedAction] || 0) + 1;
      }
    });
    
    return Object.entries(areas)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([area, count]) => ({ area, count }));
  }

  getEmptyAnalytics() {
    return {
      totalFeedback: 0,
      totalSuggestions: 0,
      averageRating: 0,
      feedbackByType: {},
      feedbackByRating: {},
      suggestionsByCategory: {},
      suggestionsByStatus: {},
      recentFeedback: [],
      topSuggestions: [],
      trends: { thisWeek: 0, lastWeek: 0, change: 0 },
      commonIssues: [],
      improvementAreas: []
    };
  }

  /**
   * Clear all feedback data
   */
  clearAllData() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.suggestionsKey);
    console.log('All voice feedback data cleared');
  }

  /**
   * Export feedback data
   * @returns {Object} Exported data
   */
  exportData() {
    return {
      feedback: this.loadFeedback(),
      suggestions: this.loadSuggestions(),
      exportedAt: Date.now()
    };
  }

  /**
   * Import feedback data
   * @param {Object} data - Data to import
   */
  importData(data) {
    if (data.feedback) {
      this.storeFeedback(data.feedback);
    }
    if (data.suggestions) {
      this.storeSuggestions(data.suggestions);
    }
    console.log('Voice feedback data imported');
  }
}

// Create and export singleton instance
const voiceFeedbackService = new VoiceFeedbackService();
export default voiceFeedbackService;