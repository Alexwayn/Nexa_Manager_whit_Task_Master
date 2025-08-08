/**
 * @jest-environment jsdom
 */

import { emailSearchService } from '../../features/email/services/emailSearchService.js';
import { supabase } from '@lib/supabaseClient';
import Logger from '@/utils/Logger';

jest.mock('@lib/supabaseClient');

jest.mock('@/utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

describe('EmailSearchService', () => {
  const mockUserId = 'user-123';
  let mockEmails;

  beforeEach(() => {
    jest.clearAllMocks();
    emailSearchService.clearCache();
    supabase.__resetAllMocks();
    mockEmails = supabase.from('emails');
    mockEmails.__resetMockResponse();
  });



  describe('Basic Search', () => {
    test('should perform basic text search', async () => {
      const mockResults = {
        data: [
          { id: '1', subject: 'Meeting tomorrow', relevance_score: 0.95 },
          { id: '2', subject: 'Meeting notes', relevance_score: 0.85 },
        ],
        error: null,
        count: 2,
      };
      mockEmails.__setMockResponse(mockResults);

      const result = await emailSearchService.searchEmails(mockUserId, { query: 'meeting' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('relevance_score');
      mockEmails.__resetMockResponse();
    });

    test('should handle empty search query', async () => {
      mockEmails.__setMockResponse({ data: [], error: null, count: 0 });

      const result = await emailSearchService.searchEmails(mockUserId, { query: '' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(supabase.from).not.toHaveBeenCalled();
      mockEmails.__resetMockResponse();
    });

    test('should handle search with no results', async () => {
      mockEmails.__setMockResponse({ data: [], error: null, count: 0 });

      const result = await emailSearchService.searchEmails(mockUserId, { query: 'nonexistent' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('Advanced Search', () => {
    beforeEach(() => {
      mockEmails.__setMockResponse({ data: [], error: null, count: 0 });
    });

    test('should search with sender filter', async () => {
      const searchParams = {
        query: 'project',
        filters: { sender: 'john@example.com' },
      };
      const result = await emailSearchService.searchEmails(mockUserId, searchParams);
      expect(result.success).toBe(true);
    });

    test('should search with date range filter', async () => {
      const searchParams = {
        query: 'report',
        filters: {
          date_from: '2024-01-01',
          date_to: '2024-12-31',
        },
      };
      const result = await emailSearchService.searchEmails(mockUserId, searchParams);
      expect(result.success).toBe(true);
    });

    test('should search with attachment filter', async () => {
      const searchParams = {
        query: 'document',
        filters: { has_attachments: true },
      };
      const result = await emailSearchService.searchEmails(mockUserId, searchParams);
      expect(result.success).toBe(true);
    });

    test('should search with read status filter', async () => {
      const searchParams = {
        query: 'urgent',
        filters: { is_read: false },
      };
      const result = await emailSearchService.searchEmails(mockUserId, searchParams);
      expect(result.success).toBe(true);
    });

    test('should search with folder filter', async () => {
      const searchParams = {
        query: 'invoice',
        filters: { folder_id: 'business' },
      };
      const result = await emailSearchService.searchEmails(mockUserId, searchParams);
      expect(result.success).toBe(true);
    });

    test('should search with label filter', async () => {
      const searchParams = {
        query: 'important',
        filters: { labels: ['urgent', 'work'] },
      };
      const result = await emailSearchService.searchEmails(mockUserId, searchParams);
      expect(result.success).toBe(true);
    });
  });

  describe('Attachment Search', () => {
    beforeEach(() => {
      mockEmails.__setMockResponse({ data: [], error: null, count: 0 });
    });
    test('should search attachments by filename', async () => {
      const mockAttachments = [
        { 
          id: '1', 
          filename: 'report.pdf', 
          file_size: 1024,
          emails: { id: 'email-1', subject: 'Monthly Report' }
        },
      ];

      supabase.from().ilike.mockResolvedValue({ data: mockAttachments, error: null });

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

      supabase.from().in.mockResolvedValue({ data: [], error: null });
      supabase.from().lte.mockResolvedValue({ data: [], error: null });

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
    beforeEach(() => {
      mockEmails.__setMockResponse({ data: [], error: null, count: 0 });
    });
    test('should get search suggestions', async () => {
      const mockSuggestions = [
        { term: 'meeting', frequency: 25 },
        { term: 'project', frequency: 18 },
        { term: 'report', frequency: 12 },
      ];

      supabase.rpc.mockResolvedValue({ data: mockSuggestions, error: null });

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

      supabase.from().select().ilike.mockResolvedValue({ data: mockSenders, error: null });

      const result = await emailSearchService.getSenderSuggestions(mockUserId, 'john');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    test('should get subject suggestions', async () => {
      const mockSubjects = [
        { subject: 'Weekly Meeting', count: 5 },
        { subject: 'Project Update', count: 3 },
      ];

      supabase.from().select().ilike.mockResolvedValue({ data: mockSubjects, error: null });

      const result = await emailSearchService.getSubjectSuggestions(mockUserId, 'meeting');

      expect(result.success).toBe(true);
    });
  });

  describe('Search History', () => {
    beforeEach(() => {
      mockEmails.__setMockResponse({ data: [], error: null, count: 0 });
    });
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

      supabase.from().select().eq().order.mockResolvedValue({ data: mockHistory, error: null });

      const result = await emailSearchService.getSearchHistory(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    test('should clear search history', async () => {


      const result = await emailSearchService.clearSearchHistory(mockUserId);

      expect(result.success).toBe(true);
      expect(deleteMock).toHaveBeenCalled();
    });

    test('should get popular searches', async () => {
      const mockPopular = [
        { query: 'meeting', count: 25 },
        { query: 'invoice', count: 18 },
      ];

      supabase.rpc.mockResolvedValue({ data: mockPopular, error: null });

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
    beforeEach(() => {
      mockEmails.__setMockResponse({ data: [], error: null, count: 0 });
    });
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

      supabase.rpc.mockResolvedValue({ data: mockAnalytics, error: null });

      const result = await emailSearchService.getSearchAnalytics(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalSearches', 100);
    });
  });

  describe('Full-Text Search', () => {
    beforeEach(() => {
      mockEmails.__setMockResponse({ data: [], error: null, count: 0 });
    });
    test('should perform full-text search with ranking', async () => {
      const mockResults = [
        { 
          id: '1', 
          subject: 'Important meeting',
          ts_rank: 0.95,
          highlighted_content: 'Important <mark>meeting</mark> tomorrow'
        },
      ];

      supabase.rpc.mockResolvedValue({ data: mockResults, error: null });

      const result = await emailSearchService.fullTextSearch(mockUserId, 'meeting', {
        includeHighlights: true,
      });

      expect(result.success).toBe(true);
      expect(result.data[0]).toHaveProperty('highlighted_content');
    });

    test('should search with phrase matching', async () => {
      supabase.rpc.mockResolvedValue({ data: [], error: null });
      const result = await emailSearchService.phraseSearch(mockUserId, '"project meeting"');

      expect(result.success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('phrase_search_emails', expect.any(Object));
    });

    test('should search with wildcard patterns', async () => {
      supabase.from().ilike.mockResolvedValue({ data: [], error: null });
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
    beforeEach(() => {
      mockEmails.__setMockResponse({ data: [], error: null, count: 0 });
    });
    test('should handle search timeout', async () => {
      textSearchMock.mockRejectedValue(new Error('Query timeout'));

      const result = await emailSearchService.searchEmails(mockUserId, 'meeting');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query timeout');
      expect(Logger.error).toHaveBeenCalled();
    });

    test('should handle invalid search parameters', async () => {
      const result = await emailSearchService.searchEmails(mockUserId, {
        filters: { date_from: 'invalid-date' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date');
    });

    test('should handle database errors gracefully', async () => {
      textSearchMock.mockRejectedValue(new Error('Database connection failed'));

      const result = await emailSearchService.searchEmails(mockUserId, 'test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });

  describe('Caching', () => {
    test('should return cached results on second call', async () => {
      const searchParams = { query: 'cache test' };
      const mockData = { data: [{ id: '1', subject: 'cache test', relevance_score: 1 }], error: null, count: 1 };

      mockEmails.__setMockResponse(mockData);

      const firstResult = await emailSearchService.searchEmails(mockUserId, searchParams);
      expect(firstResult.success).toBe(true);
      expect(firstResult.cached).toBe(false);
      expect(firstResult.data[0].subject).toBe('cache test');

      const secondResult = await emailSearchService.searchEmails(mockUserId, searchParams);
      expect(secondResult.success).toBe(true);
      expect(secondResult.cached).toBe(true);
      expect(secondResult.data[0].subject).toBe('cache test');

      expect(mockEmails.range).toHaveBeenCalledTimes(1);
      mockEmails.__resetMockResponse();
    });
  });

  describe('Performance', () => {
    test('should paginate large result sets', async () => {
      mockEmails.__setMockResponse({ data: [], error: null, count: 1000 });
      const searchParams = { query: 'performance test', page: 2, limit: 50 };
      const result = await emailSearchService.searchEmails(mockUserId, searchParams);
      expect(result.success).toBe(true);
      expect(mockEmails.range).toHaveBeenCalledWith(50, 99);
      mockEmails.__resetMockResponse();
    });

    test('should limit search result size', async () => {
      mockEmails.__setMockResponse({ data: [], error: null, count: 100 });
      const searchParams = { query: 'performance test', limit: 50 };
      const result = await emailSearchService.searchEmails(mockUserId, searchParams);
      expect(result.success).toBe(true);
      expect(mockEmails.range).toHaveBeenCalledWith(0, 49);
      mockEmails.__resetMockResponse();
      mockEmails.__resetMockResponse();
    });
  });
});
