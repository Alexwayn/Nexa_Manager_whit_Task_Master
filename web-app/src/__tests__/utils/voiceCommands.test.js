import { processVoiceCommand, executeVoiceCommand } from '@/utils/voiceCommands';
import { navigationCommands, actionCommands, helpCommands, systemCommands } from '@/utils/voiceCommands';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/dashboard' })
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn()
  }
}));

jest.mock('@/shared/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock command handlers
jest.mock('@/services/CalendarCommandHandler', () => ({
  __esModule: true,
  processCalendarCommand: jest.fn(),
  executeCalendarCommand: jest.fn(),
  calendarNavigationCommands: {},
  calendarActionCommands: {},
  allCalendarCommands: []
}));

jest.mock('@/services/TransactionCommandHandler', () => ({
  __esModule: true,
  processTransactionCommand: jest.fn(),
  executeTransactionCommand: jest.fn(),
  transactionCommands: {},
  allTransactionCommands: []
}));

jest.mock('@/services/ReportCommandHandler', () => ({
  __esModule: true,
  processReportCommand: jest.fn(),
  executeReportCommand: jest.fn(),
  reportCommands: {},
  allReportCommands: []
}));

jest.mock('@/services/EmailCommandHandler', () => ({
  __esModule: true,
  emailCommandHandler: {
    getAllCommands: jest.fn(() => []),
  },
}));

jest.mock('@/services/helpService', () => ({
  getHelpContent: jest.fn(),
  getCommandHelp: jest.fn(),
  getAvailableCommands: jest.fn(),
}));

jest.mock('@/services/EmailCommandHandler', () => ({
  handleEmailCommand: jest.fn(),
  allEmailCommands: []
}));

describe('Voice Commands Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processVoiceCommand', () => {
    describe('Navigation Commands', () => {
      it('processes dashboard navigation command', () => {
        const result = processVoiceCommand('go to dashboard');
        
        expect(result).toEqual({
          action: 'navigate',
          path: '/dashboard',
        });
      });

      it('processes clients navigation command', () => {
        const result = processVoiceCommand('show clients');
        
        expect(result).toEqual({
          action: 'navigate',
          path: '/clients',
        });
      });

      it('processes invoices navigation command', () => {
        const result = processVoiceCommand('open invoices');
        
        expect(result).toEqual({
          action: 'navigate',
          path: '/invoices',
        });
      });

      it('processes reports navigation command', () => {
        const result = processVoiceCommand('view reports');
        
        expect(result).toEqual({
          action: 'navigate',
          path: '/reports',
        });
      });

      it('handles case-insensitive navigation commands', () => {
        const result = processVoiceCommand('GO TO DASHBOARD');
        
        expect(result).toEqual({
          action: 'navigate',
          path: '/dashboard',
        });
      });
    });

    describe('Action Commands', () => {
      it('processes create invoice command', () => {
        const result = processVoiceCommand('create new invoice');
        
        expect(result).toEqual({
          action: 'create',
          type: 'invoice',
        });
      });

      it('processes add client command', () => {
        const result = processVoiceCommand('add client');
        
        expect(result).toEqual({
          action: 'create',
          type: 'client',
        });
      });

      it('processes search command', () => {
        const result = processVoiceCommand('search for john doe');
        
        expect(result).toEqual({
          action: 'search',
          query: 'john doe',
        });
      });

      it('processes export command', () => {
        const result = processVoiceCommand('export data');
        
        expect(result).toEqual({
          action: 'export',
          type: 'data',
        });
      });
    });

    describe('Help Commands', () => {
      it('processes general help command', () => {
        const result = processVoiceCommand('help');
        
        expect(result).toEqual({
          action: 'help',
          type: 'general',
        });
      });

      it('processes specific help command', () => {
        const result = processVoiceCommand('help with invoices');
        
        expect(result).toEqual({
          action: 'help',
          type: 'invoices',
        });
      });

      it('processes voice commands help', () => {
        const result = processVoiceCommand('show voice commands');
        
        expect(result).toEqual({
          action: 'help',
          type: 'commands',
        });
      });
    });

    describe('System Commands', () => {
      it('processes settings command', () => {
        const result = processVoiceCommand('open settings');
        
        expect(result).toEqual({
          action: 'navigate',
          path: '/settings',
        });
      });

      it('processes logout command', () => {
        const result = processVoiceCommand('log out');
        
        expect(result).toEqual({
          action: 'system',
          type: 'logout',
          confidence: expect.any(Number)
        });
      });
    });

    describe('Fuzzy Matching', () => {
      it('handles slight variations in commands', () => {
        const result = processVoiceCommand('go dashboard');
        
        expect(result.action).toBe('navigate');
        expect(result.target).toBe('/dashboard');
      });

      it('handles typos and speech recognition errors', () => {
        const result = processVoiceCommand('dashbord');
        
        expect(result.action).toBe('navigate');
        expect(result.target).toBe('/dashboard');
      });

      it('handles partial commands', () => {
        const result = processVoiceCommand('clients');
        
        expect(result.action).toBe('navigate');
        expect(result.target).toBe('/clients');
      });
    });

    describe('Unknown Commands', () => {
      it('returns unknown action for unrecognized commands', () => {
        const result = processVoiceCommand('xyz random command');
        
        expect(result).toEqual({
          action: 'unknown',
          command: 'xyz random command',
          confidence: 0
        });
      });

      it('handles empty commands', () => {
        const result = processVoiceCommand('');
        
        expect(result).toEqual({
          action: 'unknown',
          command: '',
          confidence: 0
        });
      });

      it('handles null/undefined commands', () => {
        const result = processVoiceCommand(null);
        
        expect(result).toEqual({
          action: 'unknown',
          command: null,
          confidence: 0
        });
      });
    });

    describe('Confidence Scoring', () => {
      it('assigns higher confidence to exact matches', () => {
        const result = processVoiceCommand('go to dashboard');
        
        expect(result.confidence).toBeGreaterThan(0.8);
      });

      it('assigns lower confidence to fuzzy matches', () => {
        const result = processVoiceCommand('dashbord');
        
        expect(result.confidence).toBeLessThan(0.8);
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      it('assigns zero confidence to unknown commands', () => {
        const result = processVoiceCommand('completely unknown command');
        
        expect(result.confidence).toBe(0);
      });
    });
  });

  describe('executeVoiceCommand', () => {
    const mockNavigate = jest.fn();
    
    beforeEach(() => {
      require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
    });

    describe('Navigation Execution', () => {
      it('executes navigation commands', async () => {
        const command = {
          action: 'navigate',
          target: '/dashboard',
          confidence: 0.9
        };
        
        const result = await executeVoiceCommand(command, mockNavigate);
        
        expect(result).toEqual({
          success: true,
          message: 'Navigated to dashboard',
          action: 'navigate'
        });
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });

      it('handles navigation errors', async () => {
        mockNavigate.mockImplementation(() => {
          throw new Error('Navigation failed');
        });
        
        const command = {
          action: 'navigate',
          target: '/dashboard',
          confidence: 0.9
        };
        
        const result = await executeVoiceCommand(command, mockNavigate);
        
        expect(result).toEqual({
          success: false,
          message: 'Failed to navigate: Navigation failed',
          action: 'navigate'
        });
      });
    });

    describe('Create Actions', () => {
      it('executes create invoice command', async () => {
        const command = {
          action: 'create',
          type: 'invoice',
          confidence: 0.9
        };
        
        const result = await executeVoiceCommand(command, mockNavigate);
        
        expect(result).toEqual({
          success: true,
          message: 'Opening new invoice form',
          action: 'create'
        });
        expect(mockNavigate).toHaveBeenCalledWith('/invoices/new');
      });

      it('executes create client command', async () => {
        const command = {
          action: 'create',
          type: 'client',
          confidence: 0.9
        };
        
        const result = await executeVoiceCommand(command, mockNavigate);
        
        expect(result).toEqual({
          success: true,
          message: 'Opening new client form',
          action: 'create'
        });
        expect(mockNavigate).toHaveBeenCalledWith('/clients/new');
      });
    });

    describe('Help Actions', () => {
      it('executes general help command', async () => {
        const command = {
          action: 'help',
          type: 'general',
          confidence: 0.9
        };
        
        const result = await executeVoiceCommand(command, mockNavigate);
        
        expect(result).toEqual({
          success: true,
          message: 'Opening help center',
          action: 'help'
        });
        expect(mockNavigate).toHaveBeenCalledWith('/help');
      });

      it('executes voice commands help', async () => {
        const command = {
          action: 'help',
          type: 'commands',
          confidence: 0.9
        };
        
        const result = await executeVoiceCommand(command, mockNavigate);
        
        expect(result).toEqual({
          success: true,
          message: 'Showing voice commands',
          action: 'help'
        });
        expect(mockNavigate).toHaveBeenCalledWith('/voice');
      });
    });

    describe('Search Actions', () => {
      it('executes search command', async () => {
        const command = {
          action: 'search',
          query: 'john doe',
          confidence: 0.9
        };
        
        const result = await executeVoiceCommand(command, mockNavigate);
        
        expect(result).toEqual({
          success: true,
          message: 'Searching for: john doe',
          action: 'search'
        });
      });
    });

    describe('System Actions', () => {
      it('executes logout command', async () => {
        const command = {
          action: 'system',
          type: 'logout',
          confidence: 0.9
        };
        
        const result = await executeVoiceCommand(command, mockNavigate);
        
        expect(result).toEqual({
          success: true,
          message: 'Logging out...',
          action: 'system'
        });
      });
    });

    describe('Unknown Commands', () => {
      it('handles unknown commands gracefully', async () => {
        const command = {
          action: 'unknown',
          command: 'xyz random command',
          confidence: 0
        };
        
        const result = await executeVoiceCommand(command, mockNavigate);
        
        expect(result).toEqual({
          success: false,
          message: 'Command not recognized: xyz random command',
          action: 'unknown'
        });
      });
    });

    describe('Low Confidence Commands', () => {
      it('handles low confidence commands', async () => {
        const command = {
          action: 'navigate',
          target: '/dashboard',
          confidence: 0.3
        };
        
        const result = await executeVoiceCommand(command, mockNavigate);
        
        expect(result).toEqual({
          success: false,
          message: 'Command confidence too low. Please try again.',
          action: 'navigate'
        });
      });
    });

    describe('Error Handling', () => {
      it('handles execution errors gracefully', async () => {
        const command = {
          action: 'navigate',
          target: '/dashboard',
          confidence: 0.9
        };
        
        mockNavigate.mockImplementation(() => {
          throw new Error('Unexpected error');
        });
        
        const result = await executeVoiceCommand(command, mockNavigate);
        
        expect(result.success).toBe(false);
        expect(result.message).toContain('Failed to navigate');
      });
    });
  });

  describe('Command Categories', () => {
    it('exports navigation commands', () => {
      expect(navigationCommands).toBeDefined();
      expect(Array.isArray(navigationCommands)).toBe(true);
    });

    it('exports action commands', () => {
      expect(actionCommands).toBeDefined();
      expect(Array.isArray(actionCommands)).toBe(true);
    });

    it('exports help commands', () => {
      expect(helpCommands).toBeDefined();
      expect(Array.isArray(helpCommands)).toBe(true);
    });

    it('exports system commands', () => {
      expect(systemCommands).toBeDefined();
      expect(Array.isArray(systemCommands)).toBe(true);
    });
  });
});
