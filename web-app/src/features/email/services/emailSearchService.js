import { supabase } from '@lib/supabaseClient';
import Logger from '@shared/utils/logger';

/**
 * Comprehensive Email Search Service
 * Provides advanced search capabilities including full-text search,
 * filtering, search history, and saved searches
 */
class EmailSearchService {
  constructor() {
    this.searchHistory = new Map();
    this.savedSearches = new Map();
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Perform comprehensive email search with advanced filtering
   */
  async searchEmails(userId, searchParams = {}) {
    try {
      const {
        query = '',
        filters = {},
        sortBy = 'received_at',
        sortOrder = 'desc',
        limit = 50,
        offset = 0,
        includeAttachments = false,
        highlightResults = true,
      } = searchParams;

      // Check cache first
      const cacheKey = this.generateCacheKey(userId, searchParams);
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Build search query
      let searchQuery = supabase
        .from('emails')
        .select(`
          *,
          ${includeAttachments ? 'attachments(*),' : ''}
          labels:email_labels(label_id, labels(name, color))
        `)
        .eq('user_id', userId);

      // Apply text search
      if (query.trim()) {
        searchQuery = this.applyTextSearch(searchQuery, query);
      }

      // Apply filters
      searchQuery = this.applyFilters(searchQuery, filters);

      // Apply sorting
      searchQuery = searchQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const { data, error, count } = await searchQuery
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Process results
      const processedResults = await this.processSearchResults(
        data || [],
        query,
        highlightResults
      );

      // Calculate relevance scores
      const scoredResults = this.calculateRelevanceScores(
        processedResults,
        query,
        filters
      );

      const result = {
        success: true,
        data: scoredResults,
        total: count || 0,
        hasMore: (data?.length || 0) === limit,
        searchParams,
        executedAt: new Date().toISOString(),
      };

      // Cache the result
      this.setCache(cacheKey, result);

      // Add to search history
      if (query.trim()) {
        this.addToSearchHistory(userId, query, filters);
      }

      return result;
    } catch (error) {
      Logger.error('Error in email search:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Apply text search across multiple fields
   */
  applyTextSearch(query, searchText) {
    const searchTerms = searchText.trim().split(/\s+/);
    
    // Build search conditions for each term
    const searchConditions = searchTerms.map(term => {
      const escapedTerm = term.replace(/[%_]/g, '\\$&');
      return `subject.ilike.%${escapedTerm}%,content_text.ilike.%${escapedTerm}%,sender_name.ilike.%${escapedTerm}%,sender_email.ilike.%${escapedTerm}%,recipient_emails.ilike.%${escapedTerm}%`;
    });

    // Combine conditions with OR for each term, AND between terms
    if (searchConditions.length === 1) {
      return query.or(searchConditions[0]);
    } else {
      // For multiple terms, we need to use a more complex approach
      // This is a simplified version - in production, you might want to use full-text search
      return query.or(searchConditions.join(','));
    }
  }

  /**
   * Apply various filters to the search query
   */
  applyFilters(query, filters) {
    const {
      folder_id,
      sender,
      recipient,
      subject,
      has_attachments,
      is_read,
      is_starred,
      is_important,
      labels = [],
      date_from,
      date_to,
      client_id,
      size_min,
      size_max,
      attachment_types = [],
    } = filters;

    if (folder_id) {
      query = query.eq('folder_id', folder_id);
    }

    if (sender) {
      query = query.or(`sender_email.ilike.%${sender}%,sender_name.ilike.%${sender}%`);
    }

    if (recipient) {
      query = query.ilike('recipient_emails', `%${recipient}%`);
    }

    if (subject) {
      query = query.ilike('subject', `%${subject}%`);
    }

    if (typeof has_attachments === 'boolean') {
      if (has_attachments) {
        query = query.gt('attachment_count', 0);
      } else {
        query = query.eq('attachment_count', 0);
      }
    }

    if (typeof is_read === 'boolean') {
      query = query.eq('is_read', is_read);
    }

    if (typeof is_starred === 'boolean') {
      query = query.eq('is_starred', is_starred);
    }

    if (typeof is_important === 'boolean') {
      query = query.eq('is_important', is_important);
    }

    if (labels.length > 0) {
      query = query.in('labels.label_id', labels);
    }

    if (date_from) {
      query = query.gte('received_at', date_from);
    }

    if (date_to) {
      query = query.lte('received_at', date_to);
    }

    if (client_id) {
      query = query.eq('client_id', client_id);
    }

    if (size_min) {
      query = query.gte('size_bytes', size_min);
    }

    if (size_max) {
      query = query.lte('size_bytes', size_max);
    }

    return query;
  }

  /**
   * Process search results and add highlighting
   */
  async processSearchResults(emails, searchQuery, highlightResults) {
    if (!highlightResults || !searchQuery.trim()) {
      return emails;
    }

    const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/);

    return emails.map(email => ({
      ...email,
      highlighted: {
        subject: this.highlightText(email.subject || '', searchTerms),
        content_text: this.highlightText(
          (email.content_text || '').substring(0, 500),
          searchTerms
        ),
        sender_name: this.highlightText(email.sender_name || '', searchTerms),
      },
    }));
  }

  /**
   * Highlight search terms in text
   */
  highlightText(text, searchTerms) {
    if (!text || !searchTerms.length) return text;

    let highlightedText = text;
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
      );
    });

    return highlightedText;
  }

  /**
   * Calculate relevance scores for search results
   */
  calculateRelevanceScores(emails, searchQuery, filters) {
    if (!searchQuery.trim()) {
      return emails.map(email => ({ ...email, relevanceScore: 1 }));
    }

    const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/);

    return emails.map(email => {
      let score = 0;
      const emailText = [
        email.subject || '',
        email.content_text || '',
        email.sender_name || '',
        email.sender_email || '',
      ].join(' ').toLowerCase();

      // Base score from term matches
      searchTerms.forEach(term => {
        const termCount = (emailText.match(new RegExp(term, 'g')) || []).length;
        score += termCount;

        // Boost score for matches in subject
        if ((email.subject || '').toLowerCase().includes(term)) {
          score += 5;
        }

        // Boost score for matches in sender name
        if ((email.sender_name || '').toLowerCase().includes(term)) {
          score += 3;
        }
      });

      // Boost recent emails
      const daysSinceReceived = Math.floor(
        (Date.now() - new Date(email.received_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceReceived < 7) {
        score += 2;
      } else if (daysSinceReceived < 30) {
        score += 1;
      }

      // Boost important emails
      if (email.is_important) {
        score += 3;
      }

      // Boost starred emails
      if (email.is_starred) {
        score += 2;
      }

      return {
        ...email,
        relevanceScore: Math.max(score, 1),
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Search within email attachments
   */
  async searchAttachments(userId, searchParams = {}) {
    try {
      const { query, fileTypes = [], sizeRange = {} } = searchParams;

      let attachmentQuery = supabase
        .from('email_attachments')
        .select(`
          *,
          emails!inner(id, subject, sender_name, received_at, user_id)
        `)
        .eq('emails.user_id', userId);

      if (query) {
        attachmentQuery = attachmentQuery.or(
          `filename.ilike.%${query}%,content_type.ilike.%${query}%`
        );
      }

      if (fileTypes.length > 0) {
        attachmentQuery = attachmentQuery.in('content_type', fileTypes);
      }

      if (sizeRange.min) {
        attachmentQuery = attachmentQuery.gte('size_bytes', sizeRange.min);
      }

      if (sizeRange.max) {
        attachmentQuery = attachmentQuery.lte('size_bytes', sizeRange.max);
      }

      const { data, error } = await attachmentQuery
        .order('emails.received_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      Logger.error('Error searching attachments:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get search suggestions based on user's email data
   */
  async getSearchSuggestions(userId, partialQuery = '') {
    try {
      const suggestions = [];

      // Get frequent senders
      const { data: senders } = await supabase
        .from('emails')
        .select('sender_name, sender_email')
        .eq('user_id', userId)
        .ilike('sender_name', `%${partialQuery}%`)
        .limit(5);

      if (senders) {
        suggestions.push(
          ...senders.map(sender => ({
            type: 'sender',
            value: sender.sender_name || sender.sender_email,
            label: `From: ${sender.sender_name || sender.sender_email}`,
          }))
        );
      }

      // Get frequent subjects
      const { data: subjects } = await supabase
        .from('emails')
        .select('subject')
        .eq('user_id', userId)
        .ilike('subject', `%${partialQuery}%`)
        .limit(5);

      if (subjects) {
        suggestions.push(
          ...subjects.map(subject => ({
            type: 'subject',
            value: subject.subject,
            label: `Subject: ${subject.subject}`,
          }))
        );
      }

      // Get labels
      const { data: labels } = await supabase
        .from('labels')
        .select('name, color')
        .eq('user_id', userId)
        .ilike('name', `%${partialQuery}%`)
        .limit(5);

      if (labels) {
        suggestions.push(
          ...labels.map(label => ({
            type: 'label',
            value: label.name,
            label: `Label: ${label.name}`,
            color: label.color,
          }))
        );
      }

      return {
        success: true,
        data: suggestions.slice(0, 10),
      };
    } catch (error) {
      Logger.error('Error getting search suggestions:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Save a search for future use
   */
  async saveSearch(userId, searchData) {
    try {
      const savedSearch = {
        user_id: userId,
        name: searchData.name,
        query: searchData.query || '',
        filters: searchData.filters || {},
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('saved_email_searches')
        .insert(savedSearch)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      Logger.error('Error saving search:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get saved searches for user
   */
  async getSavedSearches(userId) {
    try {
      const { data, error } = await supabase
        .from('saved_email_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      Logger.error('Error getting saved searches:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(userId, searchId) {
    try {
      const { error } = await supabase
        .from('saved_email_searches')
        .delete()
        .eq('id', searchId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      Logger.error('Error deleting saved search:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get search history for user
   */
  getSearchHistory(userId) {
    const userHistory = this.searchHistory.get(userId) || [];
    return userHistory.slice(0, 10); // Return last 10 searches
  }

  /**
   * Add search to history
   */
  addToSearchHistory(userId, query, filters) {
    if (!this.searchHistory.has(userId)) {
      this.searchHistory.set(userId, []);
    }

    const history = this.searchHistory.get(userId);
    const searchEntry = {
      query,
      filters,
      timestamp: new Date().toISOString(),
    };

    // Remove duplicate if exists
    const existingIndex = history.findIndex(
      entry => entry.query === query && 
      JSON.stringify(entry.filters) === JSON.stringify(filters)
    );

    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }

    // Add to beginning
    history.unshift(searchEntry);

    // Keep only last 20 searches
    if (history.length > 20) {
      history.splice(20);
    }
  }

  /**
   * Cache management
   */
  generateCacheKey(userId, searchParams) {
    return `search_${userId}_${JSON.stringify(searchParams)}`;
  }

  getFromCache(key) {
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.searchCache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.searchCache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    if (this.searchCache.size > 100) {
      const oldestKey = this.searchCache.keys().next().value;
      this.searchCache.delete(oldestKey);
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.searchCache.clear();
  }
}

// Export singleton instance
const emailSearchService = new EmailSearchService();
export default emailSearchService;