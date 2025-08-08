import voiceFeedbackService from '@/services/voiceFeedbackService';

// Mock fetch
global.fetch = jest.fn();

// Mock Blob
class MockBlob {
  constructor(content, options) {
    this.content = content;
    this.options = options;
    this.size = content ? content.join('').length : 0;
    this.type = options?.type || '';
  }
}

global.Blob = MockBlob;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock Logger
jest.mock('@/shared/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('VoiceFeedbackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Feedback Submission', () => {
    it('submits feedback successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'feedback-123',
          status: 'submitted',
          message: 'Feedback received successfully'
        })
      };

      fetch.mockResolvedValue(mockResponse);

      const feedbackData = {
        command: 'go to dashboard',
        rating: 5,
        comment: 'Worked perfectly!',
        confidence: 0.9,
        sessionId: 'session-123',
        context: {
          currentPath: '/dashboard',
          responseTime: 150
        }
      };

      const result = await voiceFeedbackService.submitFeedback(feedbackData);

      expect(fetch).toHaveBeenCalledWith('/api/voice/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('"command":"go to dashboard"')
      });

      // Verify the body contains timestamp and userAgent
      const fetchCall = fetch.mock.calls[0];
      const bodyData = JSON.parse(fetchCall[1].body);
      expect(bodyData.timestamp).toEqual(expect.any(Number));
      expect(bodyData.userAgent).toBe(navigator.userAgent);

      expect(result).toEqual({
        success: true,
        data: {
          id: 'feedback-123',
          status: 'submitted',
          message: 'Feedback received successfully'
        }
      });
    });

    it('handles feedback submission errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({
          error: 'Database connection failed'
        })
      };

      fetch.mockResolvedValue(mockResponse);

      const feedbackData = {
        command: 'test command',
        rating: 3,
        comment: 'Had some issues',
        confidence: 0.7,
        sessionId: 'session-123'
      };

      const result = await voiceFeedbackService.submitFeedback(feedbackData);

      expect(result).toEqual({
        success: false,
        error: 'Database connection failed',
        status: 500
      });
    });

    it('handles network errors during submission', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const feedbackData = {
        command: 'test command',
        rating: 4,
        confidence: 0.8,
        sessionId: 'session-123'
      };

      const result = await voiceFeedbackService.submitFeedback(feedbackData);

      expect(result).toEqual({
        success: false,
        error: 'Network error',
        offline: true
      });
    });

    it('stores feedback locally when offline', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const feedbackData = {
        command: 'test command',
        rating: 4,
        confidence: 0.8,
        sessionId: 'session-123'
      };

      await voiceFeedbackService.submitFeedback(feedbackData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'voice_feedback_queue',
        expect.stringContaining('"command":"test command"')
      );
    });

    it('validates required feedback fields', async () => {
      const invalidFeedbackData = {
        // Missing required fields
        comment: 'Test comment'
      };

      const result = await voiceFeedbackService.submitFeedback(invalidFeedbackData);

      expect(result).toEqual({
        success: false,
        error: 'Missing required fields: command, rating, sessionId'
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('validates rating range', async () => {
      const invalidFeedbackData = {
        command: 'test command',
        rating: 6, // Invalid rating (should be 1-5)
        sessionId: 'session-123'
      };

      const result = await voiceFeedbackService.submitFeedback(invalidFeedbackData);

      expect(result).toEqual({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    });
  });

  describe('Offline Queue Management', () => {
    it('queues feedback when offline', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const feedbackData = {
        command: 'test command',
        rating: 4,
        confidence: 0.8,
        sessionId: 'session-123'
      };

      await voiceFeedbackService.submitFeedback(feedbackData);

      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const queueCall = setItemCalls.find(call => call[0] === 'voice_feedback_queue');
      
      expect(queueCall).toBeDefined();
      
      const queueData = JSON.parse(queueCall[1]);
      expect(queueData).toHaveLength(1);
      expect(queueData[0]).toMatchObject(feedbackData);
    });

    it('syncs queued feedback when back online', async () => {
      // Setup existing queue
      const queuedFeedback = [
        {
          command: 'queued command 1',
          rating: 4,
          sessionId: 'session-1',
          timestamp: Date.now() - 60000
        },
        {
          command: 'queued command 2',
          rating: 5,
          sessionId: 'session-2',
          timestamp: Date.now() - 30000
        }
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(queuedFeedback));

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ status: 'success' })
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await voiceFeedbackService.syncQueuedFeedback();

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        synced: 2,
        failed: 0
      });

      // Should clear the queue after successful sync
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('voice_feedback_queue');
    });

    it('handles partial sync failures', async () => {
      const queuedFeedback = [
        { command: 'cmd1', rating: 4, sessionId: 'session-1' },
        { command: 'cmd2', rating: 5, sessionId: 'session-2' }
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(queuedFeedback));

      // First call succeeds, second fails
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ status: 'success' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({ error: 'Server error' })
        });

      const result = await voiceFeedbackService.syncQueuedFeedback();

      expect(result).toEqual({
        success: false,
        synced: 1,
        failed: 1
      });

      // Should keep failed items in queue
      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const queueCall = setItemCalls.find(call => call[0] === 'voice_feedback_queue');
      
      if (queueCall) {
        const remainingQueue = JSON.parse(queueCall[1]);
        expect(remainingQueue).toHaveLength(1);
        expect(remainingQueue[0].command).toBe('cmd2');
      }
    });

    it('gets queued feedback count', () => {
      const queuedFeedback = [
        { command: 'cmd1', rating: 4 },
        { command: 'cmd2', rating: 5 }
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(queuedFeedback));

      const count = voiceFeedbackService.getQueuedFeedbackCount();

      expect(count).toBe(2);
    });

    it('returns zero for empty queue', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const count = voiceFeedbackService.getQueuedFeedbackCount();

      expect(count).toBe(0);
    });
  });

  describe('Feedback Retrieval', () => {
    it('retrieves feedback by session', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          feedback: [
            {
              id: 'feedback-1',
              command: 'test command',
              rating: 5,
              sessionId: 'session-123'
            }
          ],
          total: 1
        })
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await voiceFeedbackService.getFeedbackBySession('session-123');

      expect(fetch).toHaveBeenCalledWith('/api/voice/feedback/session/session-123');
      expect(result).toEqual({
        success: true,
        data: {
          feedback: expect.any(Array),
          total: 1
        }
      });
    });

    it('retrieves feedback analytics', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          averageRating: 4.2,
          totalFeedback: 150,
          ratingDistribution: {
            1: 5,
            2: 10,
            3: 25,
            4: 60,
            5: 50
          },
          commonIssues: [
            'Recognition accuracy',
            'Response time',
            'Command understanding'
          ]
        })
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await voiceFeedbackService.getFeedbackAnalytics();

      expect(fetch).toHaveBeenCalledWith('/api/voice/feedback/analytics');
      expect(result.data).toMatchObject({
        averageRating: 4.2,
        totalFeedback: 150,
        ratingDistribution: expect.any(Object),
        commonIssues: expect.any(Array)
      });
    });
  });

  describe('Command Suggestions', () => {
    it('gets command suggestions based on failed commands', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          suggestions: [
            {
              original: 'go dashbord',
              suggested: 'go to dashboard',
              confidence: 0.9,
              category: 'navigation'
            },
            {
              original: 'create invoic',
              suggested: 'create invoice',
              confidence: 0.85,
              category: 'action'
            }
          ]
        })
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await voiceFeedbackService.getCommandSuggestions('go dashbord');

      expect(fetch).toHaveBeenCalledWith('/api/voice/suggestions?command=go%20dashbord');
      expect(result.data.suggestions).toHaveLength(2);
      expect(result.data.suggestions[0]).toMatchObject({
        original: 'go dashbord',
        suggested: 'go to dashboard',
        confidence: 0.9
      });
    });

    it('handles empty suggestions gracefully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          suggestions: []
        })
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await voiceFeedbackService.getCommandSuggestions('unknown command');

      expect(result.data.suggestions).toHaveLength(0);
    });
  });

  describe('Feedback Categories', () => {
    it('categorizes feedback by rating', () => {
      const feedbackData = [
        { rating: 5, comment: 'Excellent' },
        { rating: 4, comment: 'Good' },
        { rating: 3, comment: 'Average' },
        { rating: 2, comment: 'Poor' },
        { rating: 1, comment: 'Terrible' }
      ];

      const categorized = voiceFeedbackService.categorizeFeedback(feedbackData);

      expect(categorized).toEqual({
        positive: 2, // ratings 4-5
        neutral: 1,  // rating 3
        negative: 2  // ratings 1-2
      });
    });

    it('extracts common issues from feedback comments', () => {
      const feedbackData = [
        { rating: 2, comment: 'Voice recognition is poor' },
        { rating: 3, comment: 'Sometimes does not recognize commands' },
        { rating: 2, comment: 'Recognition accuracy needs improvement' },
        { rating: 4, comment: 'Good but response time is slow' },
        { rating: 3, comment: 'Slow response time' }
      ];

      const issues = voiceFeedbackService.extractCommonIssues(feedbackData);

      expect(issues).toContain('recognition');
      expect(issues).toContain('response time');
    });
  });

  describe('Data Export', () => {
    it('exports feedback data', async () => {
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockResolvedValue(new Blob(['feedback data'], { type: 'text/csv' }))
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await voiceFeedbackService.exportFeedback('csv', {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(fetch).toHaveBeenCalledWith('/api/voice/feedback/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: 'csv',
          filters: {
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          }
        })
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
    });
  });
});
