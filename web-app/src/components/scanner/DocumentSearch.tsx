// Document search component with advanced search capabilities
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  ClockIcon,
  TagIcon,
  FolderIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { documentSearchService, type SearchResult, type SearchOptions, type SearchField } from '@/services/scanner/documentSearchService';
import { documentTaggingService } from '@/services/scanner/documentTaggingService';
import clientService from '@/lib/clientService';
import type { ProcessedDocument } from '@/types/scanner';

interface DocumentSearchProps {
  onDocumentSelect: (document: ProcessedDocument) => void;
  onSearchResults?: (results: SearchResult[]) => void;
  userId: string;
  className?: string;
}

interface SearchFilters {
  category?: string;
  clientId?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface AdvancedSearchState {
  isOpen: boolean;
  searchFields: SearchField[];
  sortBy: 'relevance' | 'date' | 'title';
  sortOrder: 'asc' | 'desc';
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({
  onDocumentSelect,
  onSearchResults,
  userId,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Advanced search state
  const [advancedSearch, setAdvancedSearch] = useState<AdvancedSearchState>({
    isOpen: false,
    searchFields: ['title', 'description', 'textContent', 'tags'],
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  // Available options for filters
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const debouncedQuery = useDebounce(query, 300);

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
    loadRecentSearches();
  }, [userId]);

  // Perform search when query or filters change
  useEffect(() => {
    if (debouncedQuery.trim() || Object.keys(filters).length > 0) {
      performSearch();
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [debouncedQuery, filters, advancedSearch.searchFields, advancedSearch.sortBy, advancedSearch.sortOrder]);

  // Load filter options
  const loadFilterOptions = async () => {
    try {
      // Load categories
      const categoriesData = await documentTaggingService.getDocumentCategories();
      setCategories(categoriesData.map(cat => ({ id: cat.id, name: cat.name })));

      // Load clients
      const clientsResult = await clientService.getClients({ userId, limit: 100 });
      if (clientsResult.data) {
        setClients(clientsResult.data.map(client => ({ 
          id: client.id, 
          name: client.displayName || client.full_name 
        })));
      }

      // Load user tags
      const userTags = await documentTaggingService.getUserTags(userId);
      setAvailableTags(userTags.map(tag => tag.name));
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  // Load recent searches
  const loadRecentSearches = async () => {
    try {
      const analytics = await documentSearchService.getSearchAnalytics(userId, 7);
      setRecentSearches(analytics.topQueries.slice(0, 5).map(q => q.query));
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  // Perform search
  const performSearch = useCallback(async () => {
    if (!debouncedQuery.trim() && Object.keys(filters).length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const searchOptions: SearchOptions = {
        limit: 20,
        includeHighlights: true,
        searchFields: advancedSearch.searchFields,
        sortBy: advancedSearch.sortBy,
        sortOrder: advancedSearch.sortOrder,
        filters: {
          category: filters.category,
          clientId: filters.clientId,
          tags: filters.tags,
          dateRange: filters.dateRange
        }
      };

      const searchResult = await documentSearchService.searchDocuments(
        debouncedQuery,
        userId,
        searchOptions
      );

      setResults(searchResult.results);
      setShowResults(true);
      setSuggestions(searchResult.suggestions.map(s => s.query));
      
      if (onSearchResults) {
        onSearchResults(searchResult.results);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, filters, advancedSearch, userId, onSearchResults]);

  // Handle search input change
  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(value.length > 0);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    performSearch();
  };

  // Handle filter changes
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
  };

  // Toggle advanced search
  const toggleAdvancedSearch = () => {
    setAdvancedSearch(prev => ({
      ...prev,
      isOpen: !prev.isOpen
    }));
  };

  // Format search result highlights
  const formatHighlight = (text: string, highlights: any[]) => {
    if (!highlights.length) return text;
    
    // Simple highlighting - in a real implementation, you'd want more sophisticated highlighting
    let highlightedText = text;
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight.snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.clientId) count++;
    if (filters.tags?.length) count++;
    if (filters.dateRange) count++;
    return count;
  }, [filters]);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setShowSuggestions(query.length > 0)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          {/* Filter and Advanced Search Buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            <button
              onClick={toggleAdvancedSearch}
              className={`p-1.5 rounded-md hover:bg-gray-100 ${
                advancedSearch.isOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-400'
              }`}
              title="Advanced search"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`p-1.5 rounded-md hover:bg-gray-100 relative ${
                activeFiltersCount > 0 ? 'text-blue-600' : 'text-gray-400'
              }`}
              title="Filters"
            >
              <FunnelIcon className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Advanced Search Options */}
      {advancedSearch.isOpen && (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search in:
              </label>
              <div className="space-y-2">
                {[
                  { value: 'title', label: 'Title' },
                  { value: 'description', label: 'Description' },
                  { value: 'textContent', label: 'Text Content' },
                  { value: 'tags', label: 'Tags' }
                ].map(field => (
                  <label key={field.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={advancedSearch.searchFields.includes(field.value as SearchField)}
                      onChange={(e) => {
                        const fields = e.target.checked
                          ? [...advancedSearch.searchFields, field.value as SearchField]
                          : advancedSearch.searchFields.filter(f => f !== field.value);
                        setAdvancedSearch(prev => ({ ...prev, searchFields: fields }));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by:
              </label>
              <select
                value={advancedSearch.sortBy}
                onChange={(e) => setAdvancedSearch(prev => ({ 
                  ...prev, 
                  sortBy: e.target.value as 'relevance' | 'date' | 'title' 
                }))}
                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="title">Title</option>
              </select>
              
              <select
                value={advancedSearch.sortOrder}
                onChange={(e) => setAdvancedSearch(prev => ({ 
                  ...prev, 
                  sortOrder: e.target.value as 'asc' | 'desc' 
                }))}
                className="w-full mt-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {/* Quick Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick filters:
              </label>
              <div className="space-y-2">
                <select
                  value={filters.category || ''}
                  onChange={(e) => updateFilter('category', e.target.value || undefined)}
                  className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.clientId || ''}
                  onChange={(e) => updateFilter('clientId', e.target.value || undefined)}
                  className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All clients</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
              >
                Clear all filters ({activeFiltersCount})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (query.length > 0 || recentSearches.length > 0) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Query Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2">Suggestions</div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-sm"
                >
                  <MagnifyingGlassIcon className="inline h-4 w-4 mr-2 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && query.length === 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2">Recent searches</div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-sm"
                >
                  <ClockIcon className="inline h-4 w-4 mr-2 text-gray-400" />
                  {search}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((result, index) => (
                <button
                  key={result.document.id}
                  onClick={() => {
                    onDocumentSelect(result.document);
                    setShowResults(false);
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-md border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {result.document.title}
                      </div>
                      {result.document.description && (
                        <div className="text-sm text-gray-600 truncate">
                          {result.document.description}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          <FolderIcon className="h-3 w-3 mr-1" />
                          {result.document.category}
                        </span>
                        {result.document.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        <span className="text-xs text-gray-500">
                          {result.document.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No documents found
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {(showSuggestions || showResults) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowSuggestions(false);
            setShowResults(false);
          }}
        />
      )}
    </div>
  );
};

export default DocumentSearch;