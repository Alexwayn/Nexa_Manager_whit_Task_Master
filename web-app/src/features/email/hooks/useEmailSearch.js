import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import emailSearchService from '../services/emailSearchService';
import { useEmailContext } from '@shared/hooks/providers';

/**
 * Custom hook for email search functionality
 * Provides comprehensive search capabilities with caching, history, and suggestions
 */
export const useEmailSearch = () => {
  const { userId } = useAuth();
  const { addNotification } = useEmailContext();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  
  // Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  
  // Refs
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Initialize search data
   */
  useEffect(() => {
    if (userId) {
      loadSearchHistory();
      loadSavedSearches();
    }
  }, [userId]);

  /**
   * Load search history
   */
  const loadSearchHistory = useCallback(() => {
    if (!userId) return;
    
    try {
      const history = emailSearchService.getSearchHistory(userId);
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, [userId]);

  /**
   * Load saved searches
   */
  const loadSavedSearches = useCallback(async () => {
    if (!userId) return;
    
    try {
      const result = await emailSearchService.getSavedSearches(userId);
      if (result.success) {
        setSavedSearches(result.data);
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  }, [userId]);

  /**
   * Perform email search
   */
  const performSearch = useCallback(async (
    query = searchQuery,
    filters = searchFilters,
    page = 0,
    append = false
  ) => {
    if (!userId) return;

    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const searchParams = {
        query: query.trim(),
        filters,
        sortBy: filters.sortBy || 'received_at',
        sortOrder: filters.sortOrder || 'desc',
        limit: pageSize,
        offset: page * pageSize,
        includeAttachments: filters.includeAttachments || false,
        highlightResults: true,
      };

      const result = await emailSearchService.searchEmails(userId, searchParams);

      if (result.success) {
        if (append) {
          setSearchResults(prev => [...prev, ...result.data]);
        } else {
          setSearchResults(result.data);
        }
        
        setTotalResults(result.total);
        setHasMore(result.hasMore);
        setCurrentPage(page);
        
        // Update search history
        if (query.trim()) {
          loadSearchHistory();
        }
      } else {
        setSearchError(result.error);
        addNotification({
          type: 'error',
          message: `Search failed: ${result.error}`,
        });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setSearchError(error.message);
        addNotification({
          type: 'error',
          message: `Search error: ${error.message}`,
        });
      }
    } finally {
      setIsSearching(false);
    }
  }, [userId, searchQuery, searchFilters, pageSize, addNotification]);

  /**
   * Debounced search
   */
  const debouncedSearch = useCallback((query, filters = {}) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim() || Object.keys(filters).length > 0) {
        performSearch(query, filters, 0, false);
      } else {
        setSearchResults([]);
        setTotalResults(0);
        setHasMore(false);
      }
    }, 300);
  }, [performSearch]);

  /**
   * Handle search query change
   */
  const handleSearchQueryChange = useCallback((query) => {
    setSearchQuery(query);
    debouncedSearch(query, searchFilters);
    
    // Get suggestions for non-empty queries
    if (query.trim().length > 1) {
      getSuggestions(query);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchFilters, debouncedSearch]);

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((newFilters) => {
    const updatedFilters = { ...searchFilters, ...newFilters };
    setSearchFilters(updatedFilters);
    debouncedSearch(searchQuery, updatedFilters);
  }, [searchQuery, searchFilters, debouncedSearch]);

  /**
   * Load more results (pagination)
   */
  const loadMore = useCallback(() => {
    if (!isSearching && hasMore) {
      performSearch(searchQuery, searchFilters, currentPage + 1, true);
    }
  }, [isSearching, hasMore, searchQuery, searchFilters, currentPage, performSearch]);

  /**
   * Get search suggestions
   */
  const getSuggestions = useCallback(async (query) => {
    if (!userId || !query.trim()) return;

    try {
      const result = await emailSearchService.getSearchSuggestions(userId, query);
      if (result.success) {
        setSearchSuggestions(result.data);
        setShowSuggestions(result.data.length > 0);
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  }, [userId]);

  /**
   * Apply suggestion
   */
  const applySuggestion = useCallback((suggestion) => {
    switch (suggestion.type) {
      case 'sender':
        handleFilterChange({ sender: suggestion.value });
        break;
      case 'subject':
        setSearchQuery(suggestion.value);
        debouncedSearch(suggestion.value, searchFilters);
        break;
      case 'label':
        handleFilterChange({ 
          labels: [...(searchFilters.labels || []), suggestion.value] 
        });
        break;
      default:
        setSearchQuery(suggestion.value);
        debouncedSearch(suggestion.value, searchFilters);
    }
    setShowSuggestions(false);
  }, [searchFilters, debouncedSearch, handleFilterChange]);

  /**
   * Apply search from history
   */
  const applyHistorySearch = useCallback((historyItem) => {
    setSearchQuery(historyItem.query);
    setSearchFilters(historyItem.filters);
    performSearch(historyItem.query, historyItem.filters, 0, false);
  }, [performSearch]);

  /**
   * Save current search
   */
  const saveCurrentSearch = useCallback(async (name) => {
    if (!userId || (!searchQuery.trim() && Object.keys(searchFilters).length === 0)) {
      addNotification({
        type: 'warning',
        message: 'No search criteria to save',
      });
      return;
    }

    try {
      const result = await emailSearchService.saveSearch(userId, {
        name,
        query: searchQuery,
        filters: searchFilters,
      });

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Search saved successfully',
        });
        loadSavedSearches();
      } else {
        addNotification({
          type: 'error',
          message: `Failed to save search: ${result.error}`,
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Error saving search: ${error.message}`,
      });
    }
  }, [userId, searchQuery, searchFilters, addNotification, loadSavedSearches]);

  /**
   * Apply saved search
   */
  const applySavedSearch = useCallback((savedSearch) => {
    setSearchQuery(savedSearch.query || '');
    setSearchFilters(savedSearch.filters || {});
    performSearch(savedSearch.query || '', savedSearch.filters || {}, 0, false);
  }, [performSearch]);

  /**
   * Delete saved search
   */
  const deleteSavedSearch = useCallback(async (searchId) => {
    if (!userId) return;

    try {
      const result = await emailSearchService.deleteSavedSearch(userId, searchId);
      
      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Saved search deleted',
        });
        loadSavedSearches();
      } else {
        addNotification({
          type: 'error',
          message: `Failed to delete search: ${result.error}`,
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Error deleting search: ${error.message}`,
      });
    }
  }, [userId, addNotification, loadSavedSearches]);

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchFilters({});
    setSearchResults([]);
    setTotalResults(0);
    setHasMore(false);
    setCurrentPage(0);
    setSearchError(null);
    setShowSuggestions(false);
    setSearchSuggestions([]);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  /**
   * Search within attachments
   */
  const searchAttachments = useCallback(async (searchParams = {}) => {
    if (!userId) return { success: false, data: [] };

    setIsSearching(true);
    try {
      const result = await emailSearchService.searchAttachments(userId, searchParams);
      return result;
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Attachment search error: ${error.message}`,
      });
      return { success: false, data: [] };
    } finally {
      setIsSearching(false);
    }
  }, [userId, addNotification]);

  /**
   * Toggle advanced search
   */
  const toggleAdvancedSearch = useCallback(() => {
    setShowAdvancedSearch(prev => !prev);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Search state
    searchQuery,
    searchFilters,
    searchResults,
    isSearching,
    searchError,
    hasMore,
    totalResults,
    currentPage,
    
    // Advanced search
    showAdvancedSearch,
    searchSuggestions,
    showSuggestions,
    searchHistory,
    savedSearches,
    
    // Actions
    handleSearchQueryChange,
    handleFilterChange,
    performSearch,
    loadMore,
    clearSearch,
    
    // Suggestions
    getSuggestions,
    applySuggestion,
    setShowSuggestions,
    
    // History
    applyHistorySearch,
    
    // Saved searches
    saveCurrentSearch,
    applySavedSearch,
    deleteSavedSearch,
    
    // Advanced features
    searchAttachments,
    toggleAdvancedSearch,
  };
};