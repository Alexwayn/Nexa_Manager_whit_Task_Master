/**
 * @jest-environment jsdom
 */

import emailSearchService from '../emailSearchService';
import { supabase } from '../supabaseClient';
import Logger from '@utils/Logger';

// Mock dependencies
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          or: jest.fn(() => ({
            textSearch: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null,
                  count: 0,
                })),
              })),
            })),
          })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({
        data: [{ id: 'search-123' }],
        error: null,
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          error: null,
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          error: null,
        })),
      })),
    })),
    rpc: jest.fn(() => Promise.resolve({
      data: [],
      error: null,
    })),
  },
}));

jest.mock('@utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

describe('EmailSearchService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Search', () => {
    test('should perform basic text search', async () => {
      const mockResults = [
        { id: '1', subject: 'Meeting tomorrow', relevance_score: 0.95 },
        { id: '2', subject: 'Meeting notes', relevance_score: 0.85 },
      ];

      supabase.from().select().eq().or().textSearch().order().range.mockResolvedValueOnce({
        data: mockResults,
        error: null,
        count: 2,
      });

      const result = await emailSearchService.searchEmails(mockUserId, 'meeting');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('relevance_score');
    });

    test('should handle empty search query', async () => {
      const result = await emailSearchService.searchEmails(mockUserId, '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Search query is required');
    });

    test('should handle search with no results', async () => {
      supabase.from().select().eq().or().textSearch().order().range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      });

      const result = await emailSearchService.searchEmails(mockUserId, 'nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('Advanced Search', () => {
    test('should search with sender filter', async () => {
      const searchParams = {
        sender: 'john@example.com',
        query: 'project',
      };

      const result = await emailSearchService.advancedSearch(mockUserId, searchParams);

      expect(result.success).toBe(true);
      expect(supabase.from().select().eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    test('should search with date range filter', async () => {
      const searchParams = {
        query: 'report',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      };

      const result = await emailSearchService.advancedSearch(mockUserId, searchParams);

      expect(result.success).toBe(true);
    });

    test('should search with attachment filter', async () => {
      const searchParams = {
        query: 'document',
        hasAttachments: true,
      };

      const result = await emailSearchService.advancedSearch(mockUserId, searchParams);

      expect(result.success).toBe(true);
    });

    test('should search with read status filter', async () => {
      const searchParams = {
        query: 'urgent',
        isRead: false,
      };

      const result = await emailSearchService.advancedSearch(mockUserId, searchParams);

      expect(result.success).toBe(true);
    });

    test('should search with folder filter', async () => {
      const searchParams = {
        query: 'invoice',
        folderId: 'business',
      };

      const result = await emailSearchService.advancedSearch(mockUserId, searchParams);

      expect(result.success).toBe(true);
    });

    test('should search with label filter', async () => {
      const searchParams = {
        query: 'important',
        labels: ['urgent', 'work'],
      };

      const result = await emailSearchService.advancedSearch(mockUserId, searchParams);

      expect(result.success).toBe(true);
    });
  });

  describe('Attachment Search', () => {
    test('should search attachments by filename', async () => {
      const mockAttachments = [
        { 
          id: '1', 
          filename: 'report.pdf', 
          file_size: 1024,
          emails: { id: 'email-1', subject: 'Monthly Report' }
        },
      ];

      supabase.from().select().eq().ilike.mockResolvedValueOnce({
        data: mockAttachments,
        error: null,
      });

      const result = await emailSearchService.searchAttachments(mockUserId, {
        query: 'report',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('filename', 'report.pdf');
    });

    test('should search attachments by file type', async () => {
      const searchParams = {
        fileTypes: ['pdf', 'docx'],
      };

      const result = await emailSearchService.searchAttachments(mockUserId, searchParams);

      expect(result.success).toBe(true);
    });

    test('should search attachments by size range', async () => {
      const searchParams = {
        sizeRange: {
          min: 1024,
          max: 1048576, // 1MB
        },
      };

      const result = await emailSearchService.searchAttachments(mockUserId, searchParams);

      expect(result.success).toBe(true);
    });
  });

  describe('Search Suggestions', () => {
    test('should get search suggestions', async () => {
      const mockSuggestions = [
        { term: 'meeting', frequency: 25 },
        { term: 'project', frequency: 18 },
        { term: 'report', frequency: 12 },
      ];

      supabase.rpc.mockResolvedValueOnce({
        data: mockSuggestions,
        error: null,
      });

      const result = await emailSearchService.getSearchSuggestions(mockUserId, 'me');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toHaveProperty('term', 'meeting');
    });

    test('should get sender suggestions', async () => {
      const mockSenders = [
        { email: 'john@example.com', name: 'John Doe', count: 15 },
        { email: 'jane@example.com', name: 'Jane Smith', count: 8 },
      ];

      supabase.from().select().eq().ilike().order().limit.mockResolvedValueOnce({
        data: mockSenders,
        error: null,
      });

      const result = await emailSearchService.getSenderSuggestions(mockUserId, 'john');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    test('should get subject suggestions', async () => {
      const mockSubjects = [
        { subject: 'Weekly Meeting', count: 5 },
        { subject: 'Project Update', count: 3 },
      ];

      const result = await emailSearchService.getSubjectSuggestions(mockUserId, 'meeting');

      expect(result.success).toBe(true);
    });
  });

  describe('Search History', () => {
    test('should save search query', async () => {
      const result = await emailSearchService.saveSearchQuery(mockUserId, 'important meeting');

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('search_history');
    });

    test('should get search history', async () => {
      const mockHistory = [
        { id: '1', query: 'meeting', searched_at: '2024-01-01T10:00:00Z' },
        { id: '2', query: 'project', searched_at: '2024-01-01T09:00:00Z' },
      ];

      supabase.from().select().eq().order().limit.mockResolvedValueOnce({
        data: mockHistory,
        error: null,
      });

      const result = await emailSearchService.getSearchHistory(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    test('should clear search history', async () => {
      const result = await emailSearchService.clearSearchHistory(mockUserId);

      expect(result.success).toBe(true);
      expect(supabase.from().delete).toHaveBeenCalled();
    });

    test('should get popular searches', async () => {
      const mockPopular = [
        { query: 'meeting', count: 25 },
        { query: 'invoice', count: 18 },
      ];

      supabase.rpc.mockResolvedValueOnce({
        data: mockPopular,
        error: null,
      });

      const result = await emailSearchService.getPopularSearches(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Search Filters', () => {
    test('should build date filter', () => {
      const filter = emailSearchService.buildDateFilter('2024-01-01', '2024-12-31');
      
      expect(filter).toHaveProperty('gte');
      expect(filter).toHaveProperty('lte');
    });

    test('should build sender filter', () => {
      const filter = emailSearchService.buildSenderFilter(['john@example.com', 'jane@example.com']);
      
      expect(filter).toHaveProperty('in');
    });

    test('should build attachment filter', () => {
      const filter = emailSearchService.buildAttachmentFilter(true);
      
      expect(filter).toHaveProperty('gt', 0);
    });

    test('should combine multiple filters', () => {
      const filters = {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        sender: 'john@example.com',
        hasAttachments: true,
        isRead: false,
      };

      const combinedFilter = emailSearchService.combineFilters(filters);
      
      expect(combinedFilter).toHaveProperty('and');
      expect(combinedFilter.and).toBeInstanceOf(Array);
    });
  });

  describe('Search Analytics', () => {
    test('should track search performance', async () => {
      const searchMetrics = {
        query: 'meeting',
        resultsCount: 25,
        searchTime: 150,
        userId: mockUserId,
      };

      const result = await emailSearchService.trackSearchPerformance(searchMetrics);

      expect(result.success).toBe(true);
    });

    test('should get search analytics', async () => {
      const mockAnalytics = {
        totalSearches: 100,
        averageSearchTime: 200,
        popularQueries: ['meeting', 'project', 'invoice'],
        searchTrends: [
          { date: '2024-01-01', count: 10 },
          { date: '2024-01-02', count: 15 },
        ],
      };

      supabase.rpc.mockResolvedValueOnce({
        data: mockAnalytics,
        error: null,
      });

      const result = await emailSearchService.getSearchAnalytics(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalSearches', 100);
    });
  });

  describe('Full-Text Search', () => {
    test('should perform full-text search with ranking', async () => {
      const mockResults = [
        { 
          id: '1', 
          subject: 'Important meeting',
          ts_rank: 0.95,
          highlighted_content: 'Important <mark>meeting</mark> tomorrow'
        },
      ];

      supabase.rpc.mockResolvedValueOnce({
        data: mockResults,
        error: null,
      });

      const result = await emailSearchService.fullTextSearch(mockUserId, 'meeting', {
        includeHighlights: true,
      });

      expect(result.success).toBe(true);
      expect(result.data[0]).toHaveProperty('highlighted_content');
    });

    test('should search with phrase matching', async () => {
      const result = await emailSearchService.phraseSearch(mockUserId, '"project meeting"');

      expect(result.success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('phrase_search_emails', expect.any(Object));
    });

    test('should search with wildcard patterns', async () => {
      const result = await emailSearchService.wildcardSearch(mockUserId, 'meet*');

      expect(result.success).toBe(true);
    });
  });

  describe('Search Optimization', () => {
    test('should optimize search query', () => {
      const optimized = emailSearchService.optimizeQuery('  MEETING   tomorrow  ');
      
      expect(optimized).toBe('meeting tomorrow');
    });

    test('should remove stop words', () => {
      const cleaned = emailSearchService.removeStopWords('the meeting is tomorrow');
      
      expect(cleaned).toBe('meeting tomorrow');
    });

    test('should handle special characters', () => {
      const sanitized = emailSearchService.sanitizeQuery('meeting@work.com');
      
      expect(sanitized).toBe('meeting work com');
    });
  });

  describe('Error Handling', () => {
    test('should handle search timeout', async () => {
      supabase.from().select.mockRejectedValueOnce(new Error('Query timeout'));

      const result = await emailSearchService.searchEmails(mockUserId, 'meeting');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query timeout');
      expect(Logger.error).toHaveBeenCalled();
    });

    test('should handle invalid search parameters', async () => {
      const result = await emailSearchService.advancedSearch(mockUserId, {
        dateFrom: 'invalid-date',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date format');
    });

    test('should handle database errors gracefully', async () => {
      supabase.from().select.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await emailSearchService.searchEmails(mockUserId, 'test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });

  describe('Performance', () => {
    test('should cache frequent searches', async () => {
      // First search
      await emailSearchService.searchEmails(mockUserId, 'meeting');
      
      // Second search (should use cache)
      const result = await emailSearchService.searchEmails(mockUserId, 'meeting');

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
    });

    test('should paginate large result sets', async () => {
      const result = await emailSearchService.searchEmails(mockUserId, 'meeting', {
        limit: 10,
        offset: 20,
      });

      expect(result.success).toBe(true);
      expect(result.pagination).toHaveProperty('limit', 10);
      expect(result.pagination).toHaveProperty('offset', 20);
    });

    test('should limit search result size', async () => {
      const result = await emailSearchService.searchEmails(mockUserId, 'meeting', {
        limit: 1000, // Should be capped
      });

      expect(result.success).toBe(true);
      expect(result.pagination.limit).toBeLessThanOrEqual(100); // Max limit
    });
  });
});