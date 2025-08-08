import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import helpService from '@/services/helpService';
import { Logger } from '@/utils/Logger';

// Mock Logger
jest.mock('@/utils/logger');

describe('helpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock fetch
    global.fetch = jest.fn();
  });

  describe('getVoiceCommands', () => {
    it('returns voice commands successfully', async () => {
      const mockCommands = [
        {
          id: 'nav-dashboard',
          category: 'navigation',
          command: 'go to dashboard',
          description: 'Navigate to the main dashboard',
          examples: ['go to dashboard', 'show dashboard'],
          confidence: 0.95
        }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      const result = await helpService.getVoiceCommands();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCommands);
    });

    it('fetches commands from API when cache is empty', async () => {
      const mockCommands = [
        {
          id: 'nav-dashboard',
          category: 'navigation',
          command: 'go to dashboard',
          description: 'Navigate to the main dashboard'
        }
      ];

      localStorage.getItem.mockReturnValue(null);
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ commands: mockCommands })
      });

      const result = await helpService.getVoiceCommands();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCommands);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'voice_commands_cache',
        JSON.stringify(mockCommands)
      );
    });

    it('handles API errors gracefully', async () => {
      localStorage.getItem.mockReturnValue(null);
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await helpService.getVoiceCommands();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(Logger.error).toHaveBeenCalled();
    });

    it('returns cached commands when API fails', async () => {
      const cachedCommands = [{ id: 'cached', command: 'cached command' }];
      
      localStorage.getItem.mockReturnValue(JSON.stringify(cachedCommands));
      global.fetch.mockRejectedValue(new Error('API error'));

      const result = await helpService.getVoiceCommands();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedCommands);
    });

    it('handles corrupted cache data', async () => {
      localStorage.getItem.mockReturnValue('invalid json');
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ commands: [] })
      });

      const result = await helpService.getVoiceCommands();

      expect(result.success).toBe(true);
      expect(Logger.warn).toHaveBeenCalledWith(
        'Corrupted voice commands cache, fetching fresh data'
      );
    });
  });

  describe('searchVoiceCommands', () => {
    const mockCommands = [
      {
        id: 'nav-dashboard',
        category: 'navigation',
        command: 'go to dashboard',
        description: 'Navigate to the main dashboard',
        examples: ['go to dashboard', 'show dashboard']
      },
      {
        id: 'create-invoice',
        category: 'action',
        command: 'create invoice',
        description: 'Create a new invoice',
        examples: ['create invoice', 'new invoice']
      }
    ];

    beforeEach(() => {
      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));
    });

    it('searches commands by query', async () => {
      const result = await helpService.searchVoiceCommands('dashboard');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].command).toBe('go to dashboard');
    });

    it('searches commands by category', async () => {
      const result = await helpService.searchVoiceCommands('', 'navigation');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].category).toBe('navigation');
    });

    it('searches commands by both query and category', async () => {
      const result = await helpService.searchVoiceCommands('create', 'action');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].command).toBe('create invoice');
    });

    it('returns empty results for no matches', async () => {
      const result = await helpService.searchVoiceCommands('nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('searches in command examples', async () => {
      const result = await helpService.searchVoiceCommands('show dashboard');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].command).toBe('go to dashboard');
    });

    it('performs case-insensitive search', async () => {
      const result = await helpService.searchVoiceCommands('DASHBOARD');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getCommandCategories', () => {
    it('returns unique command categories', async () => {
      const mockCommands = [
        { category: 'navigation' },
        { category: 'action' },
        { category: 'navigation' },
        { category: 'help' }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      const result = await helpService.getCommandCategories();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['navigation', 'action', 'help']);
    });

    it('handles empty commands list', async () => {
      localStorage.getItem.mockReturnValue(JSON.stringify([]));

      const result = await helpService.getCommandCategories();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getPopularCommands', () => {
    it('returns commands sorted by usage count', async () => {
      const mockCommands = [
        { id: 'cmd1', command: 'command 1', usageCount: 10 },
        { id: 'cmd2', command: 'command 2', usageCount: 25 },
        { id: 'cmd3', command: 'command 3', usageCount: 5 }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      const result = await helpService.getPopularCommands(2);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].usageCount).toBe(25);
      expect(result.data[1].usageCount).toBe(10);
    });

    it('handles commands without usage count', async () => {
      const mockCommands = [
        { id: 'cmd1', command: 'command 1' },
        { id: 'cmd2', command: 'command 2', usageCount: 5 }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      const result = await helpService.getPopularCommands();

      expect(result.success).toBe(true);
      expect(result.data[0].usageCount).toBe(5);
    });
  });

  describe('updateCommandUsage', () => {
    it('increments command usage count', async () => {
      const mockCommands = [
        { id: 'cmd1', command: 'command 1', usageCount: 5 }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      const result = await helpService.updateCommandUsage('cmd1');

      expect(result.success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'voice_commands_cache',
        expect.stringContaining('"usageCount":6')
      );
    });

    it('initializes usage count for new commands', async () => {
      const mockCommands = [
        { id: 'cmd1', command: 'command 1' }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      const result = await helpService.updateCommandUsage('cmd1');

      expect(result.success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'voice_commands_cache',
        expect.stringContaining('"usageCount":1')
      );
    });

    it('handles non-existent command IDs', async () => {
      const mockCommands = [
        { id: 'cmd1', command: 'command 1' }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      const result = await helpService.updateCommandUsage('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Command not found');
    });
  });

  describe('getCommandSuggestions', () => {
    it('returns command suggestions based on input', async () => {
      const mockCommands = [
        { command: 'go to dashboard', description: 'Navigate to dashboard' },
        { command: 'go to settings', description: 'Open settings' },
        { command: 'create invoice', description: 'Create new invoice' }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      const result = await helpService.getCommandSuggestions('go to');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].command).toContain('go to');
    });

    it('returns fuzzy match suggestions', async () => {
      const mockCommands = [
        { command: 'go to dashboard', description: 'Navigate to dashboard' }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      const result = await helpService.getCommandSuggestions('dashbord');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].command).toBe('go to dashboard');
    });

    it('limits suggestion count', async () => {
      const mockCommands = Array.from({ length: 10 }, (_, i) => ({
        command: `command ${i}`,
        description: `Description ${i}`
      }));

      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      const result = await helpService.getCommandSuggestions('command', 5);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
    });
  });

  describe('exportCommands', () => {
    it('exports commands as JSON', async () => {
      const mockCommands = [
        { id: 'cmd1', command: 'command 1' }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      const result = await helpService.exportCommands('json');

      expect(result.success).toBe(true);
      expect(result.data).toContain('command 1');
      expect(result.mimeType).toBe('application/json');
    });

    it('exports commands as CSV', async () => {
      const mockCommands = [
        { id: 'cmd1', command: 'command 1', category: 'test' }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      const result = await helpService.exportCommands('csv');

      expect(result.success).toBe(true);
      expect(result.data).toContain('command,category');
      expect(result.data).toContain('command 1,test');
      expect(result.mimeType).toBe('text/csv');
    });

    it('handles unsupported export formats', async () => {
      const result = await helpService.exportCommands('xml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported format');
    });
  });

  describe('importCommands', () => {
    it('imports commands from JSON', async () => {
      const importData = JSON.stringify([
        { id: 'imported', command: 'imported command' }
      ]);

      const result = await helpService.importCommands(importData, 'json');

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('validates imported command structure', async () => {
      const importData = JSON.stringify([
        { invalid: 'structure' }
      ]);

      const result = await helpService.importCommands(importData, 'json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid command structure');
    });

    it('handles malformed JSON', async () => {
      const result = await helpService.importCommands('invalid json', 'json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });
  });

  describe('clearCache', () => {
    it('clears voice commands cache', async () => {
      const result = await helpService.clearCache();

      expect(result.success).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('voice_commands_cache');
      expect(Logger.info).toHaveBeenCalledWith('Voice commands cache cleared');
    });
  });

  describe('getHelpTopics', () => {
    it('returns available help topics', async () => {
      const result = await helpService.getHelpTopics();

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('includes voice-related topics', async () => {
      const result = await helpService.getHelpTopics();

      const voiceTopics = result.data.filter(topic => 
        topic.category === 'voice' || topic.title.toLowerCase().includes('voice')
      );
      
      expect(voiceTopics.length).toBeGreaterThan(0);
    });
  });

  describe('getCommandHistory', () => {
    it('returns command execution history', async () => {
      const mockHistory = [
        { command: 'go to dashboard', timestamp: Date.now(), success: true },
        { command: 'create invoice', timestamp: Date.now() - 1000, success: false }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockHistory));

      const result = await helpService.getCommandHistory();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistory);
    });

    it('returns empty history when none exists', async () => {
      localStorage.getItem.mockReturnValue(null);

      const result = await helpService.getCommandHistory();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('limits history entries', async () => {
      const mockHistory = Array.from({ length: 200 }, (_, i) => ({
        command: `command ${i}`,
        timestamp: Date.now() - i * 1000,
        success: true
      }));

      localStorage.getItem.mockReturnValue(JSON.stringify(mockHistory));

      const result = await helpService.getCommandHistory(50);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(50);
    });
  });

  describe('addToCommandHistory', () => {
    it('adds command to history', async () => {
      const existingHistory = [
        { command: 'old command', timestamp: Date.now() - 1000, success: true }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(existingHistory));

      const result = await helpService.addToCommandHistory('new command', true);

      expect(result.success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'voice_command_history',
        expect.stringContaining('new command')
      );
    });

    it('maintains history size limit', async () => {
      const existingHistory = Array.from({ length: 100 }, (_, i) => ({
        command: `command ${i}`,
        timestamp: Date.now() - i * 1000,
        success: true
      }));

      localStorage.getItem.mockReturnValue(JSON.stringify(existingHistory));

      const result = await helpService.addToCommandHistory('new command', true);

      expect(result.success).toBe(true);
      
      const savedHistory = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedHistory).toHaveLength(100); // Should maintain limit
    });
  });

  describe('Performance', () => {
    it('caches commands for performance', async () => {
      const mockCommands = [{ id: 'test', command: 'test' }];
      localStorage.getItem.mockReturnValue(JSON.stringify(mockCommands));

      // First call
      await helpService.getVoiceCommands();
      
      // Second call should use cache
      await helpService.getVoiceCommands();

      expect(localStorage.getItem).toHaveBeenCalledTimes(2);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles large command datasets efficiently', async () => {
      const largeCommandSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `cmd${i}`,
        command: `command ${i}`,
        category: `category${i % 10}`,
        description: `Description for command ${i}`
      }));

      localStorage.getItem.mockReturnValue(JSON.stringify(largeCommandSet));

      const startTime = Date.now();
      const result = await helpService.searchVoiceCommands('command 500');
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });
  });
});
