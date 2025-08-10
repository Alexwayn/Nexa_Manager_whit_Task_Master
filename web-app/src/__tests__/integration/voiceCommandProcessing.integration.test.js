import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { processVoiceCommand, executeVoiceCommand } from '@/utils/voiceCommands';
import EmailCommandHandler from '@/utils/EmailCommandHandler';
import VoiceAssistantProvider from '@/components/voice/VoiceAssistantProvider';
import voiceAnalyticsService from '@/services/voiceAnalyticsService';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}));

jest.mock('@/services/voiceAnalyticsService');
jest.mock('@/utils/logger');
jest.mock('@/utils/EmailCommandHandler');

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
}));

const mockNavigate = jest.fn();

describe('Voice Command Processing Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    
    // Setup analytics service mocks
    voiceAnalyticsService.trackCommand.mockResolvedValue();
    voiceAnalyticsService.trackError.mockResolvedValue();
    
    // Setup email handler mocks
    EmailCommandHandler.canHandle.mockReturnValue(false);
    EmailCommandHandler.handle.mockResolvedValue({
      success: false,
      message: 'Not an email command'
    });
  });

  describe('Navigation Commands', () => {
    it('processes dashboard navigation command', async () => {
      const result = await processVoiceCommand('go to dashboard');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('navigate');
      expect(result.target).toBe('/dashboard');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('processes clients navigation command', async () => {
      const result = await processVoiceCommand('show clients');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('navigate');
      expect(result.target).toBe('/clients');
    });

    it('processes invoices navigation command', async () => {
      const result = await processVoiceCommand('go to invoices');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('navigate');
      expect(result.target).toBe('/invoices');
    });

    it('processes quotes navigation command', async () => {
      const result = await processVoiceCommand('show quotes');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('navigate');
      expect(result.target).toBe('/quotes');
    });

    it('processes expenses navigation command', async () => {
      const result = await processVoiceCommand('view expenses');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('navigate');
      expect(result.target).toBe('/expenses');
    });

    it('processes income navigation command', async () => {
      const result = await processVoiceCommand('show income');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('navigate');
      expect(result.target).toBe('/income');
    });

    it('processes calendar navigation command', async () => {
      const result = await processVoiceCommand('open calendar');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('navigate');
      expect(result.target).toBe('/calendar');
    });

    it('processes reports navigation command', async () => {
      const result = await processVoiceCommand('show reports');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('navigate');
      expect(result.target).toBe('/reports');
    });

    it('processes settings navigation command', async () => {
      const result = await processVoiceCommand('go to settings');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('navigate');
      expect(result.target).toBe('/settings');
    });

    it('handles fuzzy navigation matching', async () => {
      const result = await processVoiceCommand('dashbord'); // Misspelled
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('navigate');
      expect(result.target).toBe('/dashboard');
      expect(result.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('Action Commands', () => {
    it('processes create invoice command', async () => {
      const result = await processVoiceCommand('create new invoice');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('create');
      expect(result.target).toBe('invoice');
    });

    it('processes create client command', async () => {
      const result = await processVoiceCommand('add new client');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('create');
      expect(result.target).toBe('client');
    });

    it('processes create quote command', async () => {
      const result = await processVoiceCommand('create quote');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('create');
      expect(result.target).toBe('quote');
    });

    it('processes create expense command', async () => {
      const result = await processVoiceCommand('add expense');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('create');
      expect(result.target).toBe('expense');
    });

    it('processes create income command', async () => {
      const result = await processVoiceCommand('record income');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('create');
      expect(result.target).toBe('income');
    });

    it('processes create event command', async () => {
      const result = await processVoiceCommand('schedule meeting');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('create');
      expect(result.target).toBe('event');
    });

    it('processes search command', async () => {
      const result = await processVoiceCommand('search for john doe');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('search');
      expect(result.query).toBe('john doe');
    });

    it('processes filter command', async () => {
      const result = await processVoiceCommand('filter by pending');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('filter');
      expect(result.filter).toBe('pending');
    });

    it('processes sort command', async () => {
      const result = await processVoiceCommand('sort by date');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('sort');
      expect(result.sortBy).toBe('date');
    });
  });

  describe('Email Commands', () => {
    beforeEach(() => {
      EmailCommandHandler.canHandle.mockReturnValue(true);
      EmailCommandHandler.handle.mockResolvedValue({
        success: true,
        message: 'Email command processed'
      });
    });

    it('delegates email commands to EmailCommandHandler', async () => {
      const command = 'send email to john@example.com';
      const result = await processVoiceCommand(command);
      
      expect(EmailCommandHandler.canHandle).toHaveBeenCalledWith(command);
      expect(EmailCommandHandler.handle).toHaveBeenCalledWith(command);
      expect(result.success).toBe(true);
    });

    it('handles email command failures', async () => {
      EmailCommandHandler.handle.mockResolvedValue({
        success: false,
        message: 'Invalid email address'
      });

      const result = await processVoiceCommand('send email to invalid');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email address');
    });
  });

  describe('Help Commands', () => {
    it('processes help command', async () => {
      const result = await processVoiceCommand('help');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('help');
    });

    it('processes what can I say command', async () => {
      const result = await processVoiceCommand('what can I say');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('help');
    });

    it('processes show commands command', async () => {
      const result = await processVoiceCommand('show available commands');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('help');
    });
  });

  describe('System Commands', () => {
    it('processes refresh command', async () => {
      const result = await processVoiceCommand('refresh page');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('refresh');
    });

    it('processes go back command', async () => {
      const result = await processVoiceCommand('go back');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('back');
    });

    it('processes close command', async () => {
      const result = await processVoiceCommand('close this');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('close');
    });

    it('processes cancel command', async () => {
      const result = await processVoiceCommand('cancel');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('cancel');
    });
  });

  describe('Command Execution', () => {
    it('executes navigation commands', async () => {
      const command = {
        success: true,
        action: 'navigate',
        target: '/dashboard',
        confidence: 0.9
      };

      const result = await executeVoiceCommand(command);
      
      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('executes create commands', async () => {
      const command = {
        success: true,
        action: 'create',
        target: 'invoice',
        confidence: 0.9
      };

      const result = await executeVoiceCommand(command);
      
      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('/invoices/new');
    });

    it('executes help commands', async () => {
      const command = {
        success: true,
        action: 'help',
        confidence: 0.9
      };

      const result = await executeVoiceCommand(command);
      
      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('/voice/help');
    });

    it('executes refresh commands', async () => {
      // Mock window.location.reload
      Object.defineProperty(window, 'location', {
        value: { reload: jest.fn() },
        writable: true
      });

      const command = {
        success: true,
        action: 'refresh',
        confidence: 0.9
      };

      const result = await executeVoiceCommand(command);
      
      expect(result.success).toBe(true);
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('executes back commands', async () => {
      // Mock window.history.back
      Object.defineProperty(window, 'history', {
        value: { back: jest.fn() },
        writable: true
      });

      const command = {
        success: true,
        action: 'back',
        confidence: 0.9
      };

      const result = await executeVoiceCommand(command);
      
      expect(result.success).toBe(true);
      expect(window.history.back).toHaveBeenCalled();
    });

    it('handles unknown commands', async () => {
      const command = {
        success: true,
        action: 'unknown',
        confidence: 0.9
      };

      const result = await executeVoiceCommand(command);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown action');
    });

    it('handles failed commands', async () => {
      const command = {
        success: false,
        message: 'Command not recognized',
        confidence: 0.3
      };

      const result = await executeVoiceCommand(command);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Command not recognized');
    });
  });

  describe('Confidence Scoring', () => {
    it('assigns high confidence to exact matches', async () => {
      const result = await processVoiceCommand('go to dashboard');
      
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('assigns medium confidence to partial matches', async () => {
      const result = await processVoiceCommand('dashboard');
      
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.confidence).toBeLessThan(0.9);
    });

    it('assigns low confidence to fuzzy matches', async () => {
      const result = await processVoiceCommand('dashbord'); // Misspelled
      
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('assigns very low confidence to unrecognized commands', async () => {
      const result = await processVoiceCommand('xyz123 random text');
      
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('Command Suggestions', () => {
    it('provides suggestions for low confidence commands', async () => {
      const result = await processVoiceCommand('dashbord'); // Misspelled
      
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toContain('go to dashboard');
    });

    it('provides multiple suggestions for ambiguous commands', async () => {
      const result = await processVoiceCommand('create');
      
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(1);
      expect(result.suggestions).toContain('create invoice');
      expect(result.suggestions).toContain('create client');
    });

    it('provides no suggestions for high confidence commands', async () => {
      const result = await processVoiceCommand('go to dashboard');
      
      expect(result.suggestions).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('handles processing errors gracefully', async () => {
      // Mock an error in command processing
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const result = await processVoiceCommand(null);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Error processing command');
      
      console.error = originalConsoleError;
    });

    it('handles execution errors gracefully', async () => {
      // Mock navigation error
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      const command = {
        success: true,
        action: 'navigate',
        target: '/dashboard',
        confidence: 0.9
      };

      const result = await executeVoiceCommand(command);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Navigation failed');
    });
  });

  describe('Analytics Integration', () => {
    it('tracks successful command execution', async () => {
      const command = {
        success: true,
        action: 'navigate',
        target: '/dashboard',
        confidence: 0.9
      };

      await executeVoiceCommand(command);
      
      expect(voiceAnalyticsService.trackCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'navigate to /dashboard',
          success: true,
          confidence: 0.9
        })
      );
    });

    it('tracks failed command execution', async () => {
      const command = {
        success: false,
        message: 'Command not recognized',
        confidence: 0.3
      };

      await executeVoiceCommand(command);
      
      expect(voiceAnalyticsService.trackCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'unknown command',
          success: false,
          confidence: 0.3
        })
      );
    });

    it('tracks command processing errors', async () => {
      // Mock processing error
      const result = await processVoiceCommand(null);
      
      expect(voiceAnalyticsService.trackError).toHaveBeenCalledWith(
        'processing',
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('Performance', () => {
    it('processes commands quickly', async () => {
      const startTime = Date.now();
      await processVoiceCommand('go to dashboard');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('executes commands quickly', async () => {
      const command = {
        success: true,
        action: 'navigate',
        target: '/dashboard',
        confidence: 0.9
      };

      const startTime = Date.now();
      await executeVoiceCommand(command);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
    });

    it('handles concurrent command processing', async () => {
      const commands = [
        'go to dashboard',
        'show clients',
        'create invoice',
        'view reports'
      ];

      const promises = commands.map(cmd => processVoiceCommand(cmd));
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});
