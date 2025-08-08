import voiceAnalyticsService from '@/services/voiceAnalyticsService';

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

describe('VoiceAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Command Tracking', () => {
    it('tracks successful voice commands', () => {
      const commandData = {
        command: 'go to dashboard',
        confidence: 0.9,
        success: true,
        responseTime: 150,
        sessionId: 'test-session-123'
      };

      voiceAnalyticsService.trackCommand(commandData);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      
      // Verify the data structure
      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const analyticsCall = setItemCalls.find(call => call[0] === 'voice_analytics');
      
      expect(analyticsCall).toBeDefined();
      
      const storedData = JSON.parse(analyticsCall[1]);
      expect(storedData.commands).toHaveLength(1);
      expect(storedData.commands[0]).toMatchObject({
        command: 'go to dashboard',
        confidence: 0.9,
        success: true,
        responseTime: 150,
        sessionId: 'test-session-123',
        timestamp: expect.any(Number)
      });
    });

    it('tracks failed voice commands', () => {
      const commandData = {
        command: 'unknown command',
        confidence: 0.2,
        success: false,
        error: 'Command not recognized',
        sessionId: 'test-session-123'
      };

      voiceAnalyticsService.trackCommand(commandData);

      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const analyticsCall = setItemCalls.find(call => call[0] === 'voice_analytics');
      
      const storedData = JSON.parse(analyticsCall[1]);
      expect(storedData.commands[0]).toMatchObject({
        command: 'unknown command',
        confidence: 0.2,
        success: false,
        error: 'Command not recognized'
      });
    });

    it('maintains command history with timestamps', () => {
      const command1 = {
        command: 'first command',
        confidence: 0.8,
        success: true,
        sessionId: 'session-1'
      };

      const command2 = {
        command: 'second command',
        confidence: 0.9,
        success: true,
        sessionId: 'session-1'
      };

      voiceAnalyticsService.trackCommand(command1);
      voiceAnalyticsService.trackCommand(command2);

      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const lastCall = setItemCalls[setItemCalls.length - 1];
      
      const storedData = JSON.parse(lastCall[1]);
      expect(storedData.commands).toHaveLength(2);
      expect(storedData.commands[0].timestamp).toBeLessThanOrEqual(storedData.commands[1].timestamp);
    });

    it('limits command history to prevent storage overflow', () => {
      // Mock existing data with many commands
      const existingData = {
        commands: Array.from({ length: 1000 }, (_, i) => ({
          command: `command ${i}`,
          confidence: 0.8,
          success: true,
          timestamp: Date.now() - i * 1000,
          sessionId: 'old-session'
        })),
        sessions: [],
        errors: []
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingData));

      const newCommand = {
        command: 'new command',
        confidence: 0.9,
        success: true,
        sessionId: 'new-session'
      };

      voiceAnalyticsService.trackCommand(newCommand);

      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const lastCall = setItemCalls[setItemCalls.length - 1];
      
      const storedData = JSON.parse(lastCall[1]);
      expect(storedData.commands.length).toBeLessThanOrEqual(500); // Should be trimmed
    });
  });

  describe('Error Tracking', () => {
    it('tracks voice recognition errors', () => {
      const errorData = {
        type: 'recognition_error',
        error: 'no-speech',
        context: {
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        },
        sessionId: 'test-session-123'
      };

      voiceAnalyticsService.trackError(errorData);

      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const analyticsCall = setItemCalls.find(call => call[0] === 'voice_analytics');
      
      const storedData = JSON.parse(analyticsCall[1]);
      expect(storedData.errors).toHaveLength(1);
      expect(storedData.errors[0]).toMatchObject({
        type: 'recognition_error',
        error: 'no-speech',
        sessionId: 'test-session-123',
        timestamp: expect.any(Number)
      });
    });

    it('tracks permission errors', () => {
      const errorData = {
        type: 'permission_error',
        error: 'Microphone access denied',
        sessionId: 'test-session-123'
      };

      voiceAnalyticsService.trackError(errorData);

      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const analyticsCall = setItemCalls.find(call => call[0] === 'voice_analytics');
      
      const storedData = JSON.parse(analyticsCall[1]);
      expect(storedData.errors[0].type).toBe('permission_error');
    });

    it('tracks command execution errors', () => {
      const errorData = {
        type: 'execution_error',
        error: 'Failed to navigate',
        command: 'go to dashboard',
        sessionId: 'test-session-123'
      };

      voiceAnalyticsService.trackError(errorData);

      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const analyticsCall = setItemCalls.find(call => call[0] === 'voice_analytics');
      
      const storedData = JSON.parse(analyticsCall[1]);
      expect(storedData.errors[0]).toMatchObject({
        type: 'execution_error',
        error: 'Failed to navigate',
        command: 'go to dashboard'
      });
    });
  });

  describe('Session Tracking', () => {
    it('tracks voice assistant sessions', () => {
      const sessionData = {
        sessionId: 'test-session-123',
        startTime: Date.now(),
        endTime: Date.now() + 60000,
        commandCount: 5,
        successRate: 0.8,
        averageConfidence: 0.85,
        userAgent: navigator.userAgent
      };

      voiceAnalyticsService.trackSession(sessionData);

      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const analyticsCall = setItemCalls.find(call => call[0] === 'voice_analytics');
      
      const storedData = JSON.parse(analyticsCall[1]);
      expect(storedData.sessions).toHaveLength(1);
      expect(storedData.sessions[0]).toMatchObject(sessionData);
    });

    it('calculates session duration correctly', () => {
      const startTime = Date.now();
      const endTime = startTime + 120000; // 2 minutes

      const sessionData = {
        sessionId: 'test-session-123',
        startTime,
        endTime,
        commandCount: 3,
        successRate: 1.0,
        averageConfidence: 0.9
      };

      voiceAnalyticsService.trackSession(sessionData);

      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const analyticsCall = setItemCalls.find(call => call[0] === 'voice_analytics');
      
      const storedData = JSON.parse(analyticsCall[1]);
      const session = storedData.sessions[0];
      
      expect(session.duration).toBe(120000);
    });
  });

  describe('Analytics Retrieval', () => {
    it('retrieves analytics data', () => {
      const mockData = {
        commands: [
          {
            command: 'test command',
            confidence: 0.8,
            success: true,
            timestamp: Date.now(),
            sessionId: 'session-1'
          }
        ],
        sessions: [
          {
            sessionId: 'session-1',
            startTime: Date.now() - 60000,
            endTime: Date.now(),
            commandCount: 1,
            successRate: 1.0
          }
        ],
        errors: []
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));

      const analytics = voiceAnalyticsService.getAnalytics();

      expect(analytics).toEqual(mockData);
    });

    it('returns empty analytics when no data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const analytics = voiceAnalyticsService.getAnalytics();

      expect(analytics).toEqual({
        commands: [],
        sessions: [],
        errors: []
      });
    });

    it('handles corrupted analytics data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const analytics = voiceAnalyticsService.getAnalytics();

      expect(analytics).toEqual({
        commands: [],
        sessions: [],
        errors: []
      });
    });
  });

  describe('Analytics Summary', () => {
    it('generates analytics summary', () => {
      const mockData = {
        commands: [
          { command: 'cmd1', confidence: 0.9, success: true, timestamp: Date.now() - 1000, sessionId: 's1' },
          { command: 'cmd2', confidence: 0.8, success: true, timestamp: Date.now() - 2000, sessionId: 's1' },
          { command: 'cmd3', confidence: 0.7, success: false, timestamp: Date.now() - 3000, sessionId: 's1' }
        ],
        sessions: [
          { sessionId: 's1', commandCount: 3, successRate: 0.67, averageConfidence: 0.8 }
        ],
        errors: [
          { type: 'recognition_error', error: 'no-speech', timestamp: Date.now() - 4000 }
        ]
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));

      const summary = voiceAnalyticsService.getAnalyticsSummary();

      expect(summary).toMatchObject({
        totalCommands: 3,
        successfulCommands: 2,
        failedCommands: 1,
        successRate: expect.closeTo(0.67, 2),
        averageConfidence: expect.closeTo(0.8, 2),
        totalSessions: 1,
        totalErrors: 1,
        mostCommonErrors: expect.any(Array),
        commandFrequency: expect.any(Object)
      });
    });

    it('handles empty analytics data in summary', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const summary = voiceAnalyticsService.getAnalyticsSummary();

      expect(summary).toMatchObject({
        totalCommands: 0,
        successfulCommands: 0,
        failedCommands: 0,
        successRate: 0,
        averageConfidence: 0,
        totalSessions: 0,
        totalErrors: 0,
        mostCommonErrors: [],
        commandFrequency: {}
      });
    });
  });

  describe('Data Management', () => {
    it('clears analytics data', () => {
      voiceAnalyticsService.clearAnalytics();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('voice_analytics');
    });

    it('exports analytics data', () => {
      const mockData = {
        commands: [{ command: 'test', success: true }],
        sessions: [{ sessionId: 'test' }],
        errors: []
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));

      const exported = voiceAnalyticsService.exportAnalytics();

      expect(exported).toEqual(mockData);
    });

    it('imports analytics data', () => {
      const importData = {
        commands: [{ command: 'imported', success: true }],
        sessions: [{ sessionId: 'imported' }],
        errors: []
      };

      voiceAnalyticsService.importAnalytics(importData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'voice_analytics',
        JSON.stringify(importData)
      );
    });
  });

  describe('Performance Metrics', () => {
    it('tracks response times', () => {
      const commandData = {
        command: 'test command',
        confidence: 0.9,
        success: true,
        responseTime: 250,
        sessionId: 'session-1'
      };

      voiceAnalyticsService.trackCommand(commandData);

      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const analyticsCall = setItemCalls.find(call => call[0] === 'voice_analytics');
      
      const storedData = JSON.parse(analyticsCall[1]);
      expect(storedData.commands[0].responseTime).toBe(250);
    });

    it('calculates average response time', () => {
      const mockData = {
        commands: [
          { responseTime: 100, success: true },
          { responseTime: 200, success: true },
          { responseTime: 300, success: true }
        ],
        sessions: [],
        errors: []
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));

      const summary = voiceAnalyticsService.getAnalyticsSummary();

      expect(summary.averageResponseTime).toBe(200);
    });
  });
});
