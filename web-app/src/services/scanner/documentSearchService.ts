// Document search service for full-text search and indexing
import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';
import type { ProcessedDocument, DocumentFilters } from '@/types/scanner';

export interface SearchResult {
  document: ProcessedDocument;
  score: number;
  highlights: SearchHighlight[];
}

export interface SearchHighlight {
  field: string;
  snippet: string;
  startIndex: number;
  endIndex: number;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  includeHighlights?: boolean;
  searchFields?: SearchField[];
  filters?: Omit<DocumentFilters, 'searchText'>;
  sortBy?: 'relevance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export type SearchField = 'title' | 'description' | 'textContent' | 'tags' | 'category';

export interface SearchStatistics {
  totalResults: number;
  searchTime: number;
  topCategories: Array<{ category: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
}

export interface SearchSuggestion {
  query: string;
  type: 'completion' | 'correction' | 'related';
  score: number;
}

export class DocumentSearchService {
  private readonly TABLE_NAME = 'scanned_documents';
  private readonly SEARCH_HISTORY_TABLE = 'document_search_history';

  /**
   * Perform full-text search on documents
   */
  async searchDocuments(
    query: string,
    userId: string,
    options: SearchOptions = {}
  ): Promise<{
    results: SearchResult[];
    statistics: SearchStatistics;
    suggestions: SearchSuggestion[];
  }> {
    const startTime = Date.now();

    try {
      // Log search query for analytics
      await this.logSearchQuery(query, userId);

      // Build search query
      const searchResults = await this.performSearch(query, userId, options);
      
      // Calculate statistics
      const statistics = await this.calculateSearchStatistics(searchResults, startTime);
      
      // Generate suggestions
      const suggestions = await this.generateSearchSuggestions(query, userId);

      return {
        results: searchResults,
        statistics,
        suggestions
      };
    } catch (error) {
      Logger.error('Failed to search documents:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform the actual search query
   */
  private async performSearch(
    query: string,
    userId: string,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const {
      limit = 20,
      offset = 0,
      includeHighlights = true,
      searchFields = ['title', 'description', 'textContent', 'tags'],
      filters = {},
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = options;

    // Build the search query using PostgreSQL full-text search
    let searchQuery = supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('created_by', userId);

    // Apply filters
    if (filters.category) {
      searchQuery = searchQuery.eq('category', filters.category);
    }
    if (filters.clientId) {
      searchQuery = searchQuery.eq('client_id', filters.clientId);
    }
    if (filters.projectId) {
      searchQuery = searchQuery.eq('project_id', filters.projectId);
    }
    if (filters.tags && filters.tags.length > 0) {
      searchQuery = searchQuery.overlaps('tags', filters.tags);
    }
    if (filters.dateRange) {
      searchQuery = searchQuery
        .gte('created_at', filters.dateRange.start.toISOString())
        .lte('created_at', filters.dateRange.end.toISOString());
    }

    // Apply full-text search
    if (query.trim()) {
      const searchTerm = this.preprocessSearchQuery(query);
      
      if (searchFields.includes('title') || searchFields.includes('description') || searchFields.includes('textContent')) {
        // Use PostgreSQL full-text search with ranking
        const tsQuery = searchTerm.split(' ').map(term => `${term}:*`).join(' & ');
        
        searchQuery = searchQuery.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,text_content.ilike.%${searchTerm}%`
        );
      }

      if (searchFields.includes('tags')) {
        // Search in tags array
        const tagSearchTerms = searchTerm.split(' ').map(term => `%${term}%`);
        const tagConditions = tagSearchTerms.map(term => `tags.cs.{${term}}`).join(',');
        searchQuery = searchQuery.or(tagConditions);
      }
    }

    // Apply sorting
    if (sortBy === 'date') {
      searchQuery = searchQuery.order('created_at', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'title') {
      searchQuery = searchQuery.order('title', { ascending: sortOrder === 'asc' });
    } else {
      // Default to relevance sorting (by created_at for now, can be enhanced with ranking)
      searchQuery = searchQuery.order('created_at', { ascending: false });
    }

    // Apply pagination
    searchQuery = searchQuery.range(offset, offset + limit - 1);

    const { data, error } = await searchQuery;

    if (error) {
      Logger.error('Search query failed:', error);
      throw new Error(`Search query failed: ${error.message}`);
    }

    // Convert results and add highlights
    const results: SearchResult[] = [];
    
    for (const record of data || []) {
      const document = this.mapRecordToDocument(record);
      const score = this.calculateRelevanceScore(document, query);
      const highlights = includeHighlights ? this.generateHighlights(document, query) : [];

      results.push({
        document,
        score,
        highlights
      });
    }

    // Sort by relevance score if needed
    if (sortBy === 'relevance') {
      results.sort((a, b) => sortOrder === 'asc' ? a.score - b.score : b.score - a.score);
    }

    return results;
  }

  /**
   * Calculate search statistics
   */
  private async calculateSearchStatistics(
    results: SearchResult[],
    startTime: number
  ): Promise<SearchStatistics> {
    const searchTime = Date.now() - startTime;
    const totalResults = results.length;

    // Calculate category distribution
    const categoryCount = new Map<string, number>();
    const tagCount = new Map<string, number>();

    results.forEach(result => {
      const category = result.document.category;
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);

      result.document.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });

    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topTags = Array.from(tagCount.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalResults,
      searchTime,
      topCategories,
      topTags
    };
  }

  /**
   * Generate search suggestions
   */
  private async generateSearchSuggestions(
    query: string,
    userId: string
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    try {
      // Get recent search history for completion suggestions
      const { data: recentSearches } = await supabase
        .from(this.SEARCH_HISTORY_TABLE)
        .select('query')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentSearches) {
        const completions = recentSearches
          .filter(search => 
            search.query.toLowerCase().startsWith(query.toLowerCase()) && 
            search.query.toLowerCase() !== query.toLowerCase()
          )
          .slice(0, 3)
          .map(search => ({
            query: search.query,
            type: 'completion' as const,
            score: 0.8
          }));

        suggestions.push(...completions);
      }

      // Generate related search suggestions based on document content
      const relatedSuggestions = await this.generateRelatedSuggestions(query, userId);
      suggestions.push(...relatedSuggestions);

    } catch (error) {
      Logger.error('Failed to generate search suggestions:', error);
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Generate related search suggestions
   */
  private async generateRelatedSuggestions(
    query: string,
    userId: string
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    try {
      // Get common tags and categories from user's documents
      const { data: documents } = await supabase
        .from(this.TABLE_NAME)
        .select('category, tags')
        .eq('created_by', userId)
        .limit(100);

      if (documents) {
        const categories = new Set<string>();
        const tags = new Set<string>();

        documents.forEach(doc => {
          categories.add(doc.category);
          doc.tags?.forEach((tag: string) => tags.add(tag));
        });

        // Suggest categories
        Array.from(categories)
          .filter(category => category.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 2)
          .forEach(category => {
            suggestions.push({
              query: `category:${category}`,
              type: 'related',
              score: 0.6
            });
          });

        // Suggest tags
        Array.from(tags)
          .filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3)
          .forEach(tag => {
            suggestions.push({
              query: `tag:${tag}`,
              type: 'related',
              score: 0.7
            });
          });
      }
    } catch (error) {
      Logger.error('Failed to generate related suggestions:', error);
    }

    return suggestions;
  }

  /**
   * Index a document for search
   */
  async indexDocument(document: ProcessedDocument): Promise<void> {
    try {
      // The document is already indexed when saved to the database
      // This method can be used for additional indexing operations if needed
      Logger.info(`Document ${document.id} indexed for search`);
    } catch (error) {
      Logger.error('Failed to index document:', error);
      throw error;
    }
  }

  /**
   * Remove document from search index
   */
  async removeFromIndex(documentId: string): Promise<void> {
    try {
      // Document is removed from index when deleted from database
      Logger.info(`Document ${documentId} removed from search index`);
    } catch (error) {
      Logger.error('Failed to remove document from index:', error);
      throw error;
    }
  }

  /**
   * Get search analytics for a user
   */
  async getSearchAnalytics(userId: string, days: number = 30): Promise<{
    totalSearches: number;
    topQueries: Array<{ query: string; count: number }>;
    searchTrends: Array<{ date: string; count: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: searches } = await supabase
        .from(this.SEARCH_HISTORY_TABLE)
        .select('query, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (!searches) {
        return { totalSearches: 0, topQueries: [], searchTrends: [] };
      }

      const totalSearches = searches.length;

      // Calculate top queries
      const queryCount = new Map<string, number>();
      searches.forEach(search => {
        queryCount.set(search.query, (queryCount.get(search.query) || 0) + 1);
      });

      const topQueries = Array.from(queryCount.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate search trends by day
      const trendMap = new Map<string, number>();
      searches.forEach(search => {
        const date = new Date(search.created_at).toISOString().split('T')[0];
        trendMap.set(date, (trendMap.get(date) || 0) + 1);
      });

      const searchTrends = Array.from(trendMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalSearches,
        topQueries,
        searchTrends
      };
    } catch (error) {
      Logger.error('Failed to get search analytics:', error);
      throw error;
    }
  }

  /**
   * Log search query for analytics
   */
  private async logSearchQuery(query: string, userId: string): Promise<void> {
    try {
      await supabase
        .from(this.SEARCH_HISTORY_TABLE)
        .insert([{
          user_id: userId,
          query: query.trim(),
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      Logger.error('Failed to log search query:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Preprocess search query
   */
  private preprocessSearchQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  /**
   * Calculate relevance score for a document
   */
  private calculateRelevanceScore(document: ProcessedDocument, query: string): number {
    const searchTerms = this.preprocessSearchQuery(query).split(' ');
    let score = 0;

    searchTerms.forEach(term => {
      // Title matches get highest score
      if (document.title.toLowerCase().includes(term)) {
        score += 10;
      }

      // Description matches get medium score
      if (document.description?.toLowerCase().includes(term)) {
        score += 5;
      }

      // Text content matches get lower score
      if (document.textContent.toLowerCase().includes(term)) {
        score += 2;
      }

      // Tag matches get high score
      if (document.tags.some(tag => tag.toLowerCase().includes(term))) {
        score += 8;
      }

      // Category matches get medium score
      if (document.category.toLowerCase().includes(term)) {
        score += 6;
      }
    });

    // Boost score based on OCR confidence
    score *= (document.ocrConfidence || 0.5);

    return score;
  }

  /**
   * Generate search highlights
   */
  private generateHighlights(document: ProcessedDocument, query: string): SearchHighlight[] {
    const highlights: SearchHighlight[] = [];
    const searchTerms = this.preprocessSearchQuery(query).split(' ');

    searchTerms.forEach(term => {
      // Highlight in title
      const titleIndex = document.title.toLowerCase().indexOf(term);
      if (titleIndex !== -1) {
        highlights.push({
          field: 'title',
          snippet: this.createSnippet(document.title, titleIndex, term.length),
          startIndex: titleIndex,
          endIndex: titleIndex + term.length
        });
      }

      // Highlight in description
      if (document.description) {
        const descIndex = document.description.toLowerCase().indexOf(term);
        if (descIndex !== -1) {
          highlights.push({
            field: 'description',
            snippet: this.createSnippet(document.description, descIndex, term.length),
            startIndex: descIndex,
            endIndex: descIndex + term.length
          });
        }
      }

      // Highlight in text content
      const textIndex = document.textContent.toLowerCase().indexOf(term);
      if (textIndex !== -1) {
        highlights.push({
          field: 'textContent',
          snippet: this.createSnippet(document.textContent, textIndex, term.length, 100),
          startIndex: textIndex,
          endIndex: textIndex + term.length
        });
      }
    });

    return highlights.slice(0, 5); // Limit highlights
  }

  /**
   * Create a snippet around a search term
   */
  private createSnippet(text: string, index: number, termLength: number, maxLength: number = 50): string {
    const start = Math.max(0, index - maxLength / 2);
    const end = Math.min(text.length, index + termLength + maxLength / 2);
    
    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
  }

  /**
   * Map database record to ProcessedDocument
   */
  private mapRecordToDocument(record: any): ProcessedDocument {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      tags: record.tags || [],
      clientId: record.client_id,
      projectId: record.project_id,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      createdBy: record.created_by,
      originalFile: {
        url: record.original_file_url,
        name: record.original_file_name,
        size: record.original_file_size,
        type: record.original_file_type
      },
      enhancedFile: {
        url: record.enhanced_file_url,
        size: record.enhanced_file_size
      },
      pdfFile: record.pdf_file_url ? {
        url: record.pdf_file_url,
        size: record.pdf_file_size
      } : undefined,
      textContent: record.text_content,
      ocrConfidence: record.ocr_confidence,
      ocrLanguage: record.ocr_language,
      status: record.status,
      processingErrors: record.processing_errors,
      sharingSettings: record.sharing_settings,
      accessLog: record.access_log || []
    };
  }
}

// Create and export singleton instance
export const documentSearchService = new DocumentSearchService();
export default documentSearchService;