/**
 * Voice Assistant Help Service
 * Provides comprehensive help, documentation, and command reference for the voice assistant
 */

import { 
  navigationCommands, 
  actionCommands, 
  helpCommands, 
  systemCommands 
} from '@/utils/voiceCommands';
import { allCalendarCommands } from '@/services/CalendarCommandHandler';
import { allTransactionCommands } from '@/services/TransactionCommandHandler';
import { allReportCommands } from '@/services/ReportCommandHandler';
import { allEmailCommands } from '@/services/EmailCommandHandler';

/**
 * Command categories for organization
 */
export const COMMAND_CATEGORIES = {
  NAVIGATION: 'navigation',
  ACTIONS: 'actions',
  CALENDAR: 'calendar',
  TRANSACTIONS: 'transactions',
  REPORTS: 'reports',
  EMAIL: 'email',
  HELP: 'help',
  SYSTEM: 'system'
};

/**
 * Comprehensive command reference with descriptions and examples
 */
export const COMMAND_REFERENCE = {
  [COMMAND_CATEGORIES.NAVIGATION]: {
    title: 'Navigation Commands',
    description: 'Navigate between different pages and sections',
    icon: 'MapIcon',
    commands: [
      {
        command: 'go to dashboard',
        aliases: ['open dashboard', 'show dashboard', 'dashboard'],
        description: 'Navigate to the main dashboard',
        example: 'Say: "Go to dashboard"',
        category: 'navigation'
      },
      {
        command: 'go to clients',
        aliases: ['open clients', 'show clients', 'client list', 'clients'],
        description: 'Navigate to the clients management page',
        example: 'Say: "Open clients"',
        category: 'navigation'
      },
      {
        command: 'go to invoices',
        aliases: ['open invoices', 'show invoices', 'invoice list', 'invoices'],
        description: 'Navigate to the invoices page',
        example: 'Say: "Show invoices"',
        category: 'navigation'
      },
      {
        command: 'go to reports',
        aliases: ['open reports', 'show reports', 'reports'],
        description: 'Navigate to the reports section',
        example: 'Say: "Go to reports"',
        category: 'navigation'
      },
      {
        command: 'go to calendar',
        aliases: ['open calendar', 'show calendar', 'calendar'],
        description: 'Navigate to the calendar view',
        example: 'Say: "Open calendar"',
        category: 'navigation'
      },
      {
        command: 'go to financial',
        aliases: ['open financial', 'show financial', 'financial', 'finances', 'transactions'],
        description: 'Navigate to financial management',
        example: 'Say: "Go to financial"',
        category: 'navigation'
      },
      {
        command: 'go back',
        aliases: ['back', 'previous page'],
        description: 'Go back to the previous page',
        example: 'Say: "Go back"',
        category: 'navigation'
      }
    ]
  },

  [COMMAND_CATEGORIES.ACTIONS]: {
    title: 'Action Commands',
    description: 'Create, manage, and perform actions on your data',
    icon: 'PlusIcon',
    commands: [
      {
        command: 'create new invoice',
        aliases: ['new invoice', 'add invoice'],
        description: 'Start creating a new invoice',
        example: 'Say: "Create new invoice"',
        category: 'actions'
      },
      {
        command: 'create new client',
        aliases: ['new client', 'add client'],
        description: 'Start adding a new client',
        example: 'Say: "Add new client"',
        category: 'actions'
      },
      {
        command: 'search for [item]',
        aliases: ['find [item]', 'look for [item]'],
        description: 'Search for specific items or information',
        example: 'Say: "Search for John Smith"',
        category: 'actions'
      },
      {
        command: 'export data',
        aliases: ['export invoices', 'export clients', 'export reports'],
        description: 'Export data in various formats',
        example: 'Say: "Export invoices"',
        category: 'actions'
      },
      {
        command: 'refresh',
        aliases: ['reload', 'update'],
        description: 'Refresh the current page',
        example: 'Say: "Refresh"',
        category: 'actions'
      }
    ]
  },

  [COMMAND_CATEGORIES.CALENDAR]: {
    title: 'Calendar Commands',
    description: 'Manage your schedule, events, and appointments',
    icon: 'CalendarIcon',
    commands: [
      {
        command: 'create event',
        aliases: ['new event', 'add event', 'schedule event'],
        description: 'Create a new calendar event',
        example: 'Say: "Create event"',
        category: 'calendar'
      },
      {
        command: 'schedule appointment',
        aliases: ['create appointment', 'new appointment', 'book appointment'],
        description: 'Schedule a new appointment',
        example: 'Say: "Schedule appointment"',
        category: 'calendar'
      },
      {
        command: 'my schedule',
        aliases: ['show my events', 'list events'],
        description: 'View your upcoming events',
        example: 'Say: "Show my schedule"',
        category: 'calendar'
      },
      {
        command: 'today\'s events',
        aliases: ['what do i have today', 'today\'s schedule'],
        description: 'View today\'s scheduled events',
        example: 'Say: "What do I have today?"',
        category: 'calendar'
      }
    ]
  },

  [COMMAND_CATEGORIES.TRANSACTIONS]: {
    title: 'Financial Transaction Commands',
    description: 'Manage income, expenses, and financial records',
    icon: 'CurrencyDollarIcon',
    commands: [
      {
        command: 'add income',
        aliases: ['record income', 'new income'],
        description: 'Record a new income transaction',
        example: 'Say: "Add income"',
        category: 'transactions'
      },
      {
        command: 'add expense',
        aliases: ['record expense', 'new expense'],
        description: 'Record a new expense transaction',
        example: 'Say: "Record expense"',
        category: 'transactions'
      },
      {
        command: 'show my transactions',
        aliases: ['list transactions', 'my transactions'],
        description: 'View your transaction history',
        example: 'Say: "Show my transactions"',
        category: 'transactions'
      },
      {
        command: 'financial overview',
        aliases: ['show financial overview'],
        description: 'View financial summary and overview',
        example: 'Say: "Financial overview"',
        category: 'transactions'
      }
    ]
  },

  [COMMAND_CATEGORIES.REPORTS]: {
    title: 'Report Commands',
    description: 'Generate and manage various business reports',
    icon: 'ChartBarIcon',
    commands: [
      {
        command: 'generate revenue report',
        aliases: ['create revenue report', 'revenue report'],
        description: 'Generate a revenue analysis report',
        example: 'Say: "Generate revenue report"',
        category: 'reports'
      },
      {
        command: 'generate client report',
        aliases: ['create client report', 'client report'],
        description: 'Generate a client analysis report',
        example: 'Say: "Create client report"',
        category: 'reports'
      },
      {
        command: 'show analytics',
        aliases: ['financial analytics', 'get financial analytics'],
        description: 'View financial analytics and insights',
        example: 'Say: "Show analytics"',
        category: 'reports'
      },
      {
        command: 'cash flow forecast',
        aliases: ['show cash flow forecast', 'forecast'],
        description: 'View cash flow projections',
        example: 'Say: "Show cash flow forecast"',
        category: 'reports'
      }
    ]
  },

  [COMMAND_CATEGORIES.EMAIL]: {
    title: 'Email Commands',
    description: 'Manage your email communications',
    icon: 'EnvelopeIcon',
    commands: [
      {
        command: 'compose email',
        aliases: ['new email', 'write email'],
        description: 'Start composing a new email',
        example: 'Say: "Compose email"',
        category: 'email'
      },
      {
        command: 'check my email',
        aliases: ['check email', 'show inbox'],
        description: 'Check your email inbox',
        example: 'Say: "Check my email"',
        category: 'email'
      },
      {
        command: 'search emails',
        aliases: ['find emails'],
        description: 'Search through your emails',
        example: 'Say: "Search emails"',
        category: 'email'
      },
      {
        command: 'mark as read',
        aliases: ['mark as unread'],
        description: 'Mark emails as read or unread',
        example: 'Say: "Mark as read"',
        category: 'email'
      }
    ]
  },

  [COMMAND_CATEGORIES.HELP]: {
    title: 'Help Commands',
    description: 'Get assistance and learn about available features',
    icon: 'QuestionMarkCircleIcon',
    commands: [
      {
        command: 'help',
        aliases: ['what can you do', 'what can i say'],
        description: 'Get general help and information',
        example: 'Say: "Help"',
        category: 'help'
      },
      {
        command: 'voice commands',
        aliases: ['show commands', 'list commands'],
        description: 'Show available voice commands',
        example: 'Say: "Voice commands"',
        category: 'help'
      },
      {
        command: 'help me with [feature]',
        aliases: ['help with [feature]', '[feature] help'],
        description: 'Get help with specific features',
        example: 'Say: "Help me with invoices"',
        category: 'help'
      }
    ]
  },

  [COMMAND_CATEGORIES.SYSTEM]: {
    title: 'System Commands',
    description: 'Control voice assistant settings and behavior',
    icon: 'CogIcon',
    commands: [
      {
        command: 'voice settings',
        aliases: ['open voice settings', 'configure voice'],
        description: 'Open voice assistant settings',
        example: 'Say: "Voice settings"',
        category: 'system'
      },
      {
        command: 'stop listening',
        aliases: ['stop', 'cancel'],
        description: 'Stop voice recognition',
        example: 'Say: "Stop listening"',
        category: 'system'
      },
      {
        command: 'repeat',
        aliases: ['say that again', 'what did you say'],
        description: 'Repeat the last response',
        example: 'Say: "Repeat"',
        category: 'system'
      }
    ]
  }
};

/**
 * Search commands by query
 * @param {string} query - Search query
 * @returns {Array} Matching commands
 */
export function searchCommands(query) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const results = [];

  // Search through all command categories
  Object.values(COMMAND_REFERENCE).forEach(category => {
    category.commands.forEach(cmd => {
      const matchScore = calculateMatchScore(cmd, normalizedQuery);
      if (matchScore > 0) {
        results.push({
          ...cmd,
          category: category.title,
          matchScore
        });
      }
    });
  });

  // Sort by match score (highest first)
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Calculate match score for a command against a query
 * @param {Object} command - Command object
 * @param {string} query - Search query
 * @returns {number} Match score (0-100)
 */
function calculateMatchScore(command, query) {
  let score = 0;

  // Exact match in command
  if (command.command.toLowerCase().includes(query)) {
    score += 50;
  }

  // Exact match in description
  if (command.description.toLowerCase().includes(query)) {
    score += 30;
  }

  // Match in aliases
  const aliasMatch = command.aliases.some(alias => 
    alias.toLowerCase().includes(query)
  );
  if (aliasMatch) {
    score += 40;
  }

  // Partial word matches
  const queryWords = query.split(' ');
  const commandWords = command.command.toLowerCase().split(' ');
  const descriptionWords = command.description.toLowerCase().split(' ');

  queryWords.forEach(queryWord => {
    if (commandWords.some(word => word.includes(queryWord))) {
      score += 10;
    }
    if (descriptionWords.some(word => word.includes(queryWord))) {
      score += 5;
    }
  });

  return Math.min(score, 100);
}

/**
 * Get commands by category
 * @param {string} category - Category name
 * @returns {Object|null} Category object with commands
 */
export function getCommandsByCategory(category) {
  return COMMAND_REFERENCE[category] || null;
}

/**
 * Get all command categories
 * @returns {Array} Array of category objects
 */
export function getAllCategories() {
  return Object.entries(COMMAND_REFERENCE).map(([key, category]) => ({
    id: key,
    ...category
  }));
}

/**
 * Get contextual help based on current page/context
 * @param {string} context - Current page or context
 * @returns {Object} Contextual help information
 */
export function getContextualHelp(context) {
  const contextualHelp = {
    '/dashboard': {
      title: 'Dashboard Help',
      description: 'From the dashboard, you can navigate to different sections and get an overview of your business.',
      suggestedCommands: [
        'go to clients',
        'go to invoices',
        'show analytics',
        'create new invoice'
      ]
    },
    '/clients': {
      title: 'Client Management Help',
      description: 'Manage your clients, add new ones, and view client details.',
      suggestedCommands: [
        'create new client',
        'search for [client name]',
        'export clients',
        'go to invoices'
      ]
    },
    '/invoices': {
      title: 'Invoice Management Help',
      description: 'Create, manage, and track your invoices.',
      suggestedCommands: [
        'create new invoice',
        'search for [invoice]',
        'export invoices',
        'go to clients'
      ]
    },
    '/reports': {
      title: 'Reports Help',
      description: 'Generate various business reports and analytics.',
      suggestedCommands: [
        'generate revenue report',
        'create client report',
        'show analytics',
        'cash flow forecast'
      ]
    },
    '/calendar': {
      title: 'Calendar Help',
      description: 'Manage your schedule, events, and appointments.',
      suggestedCommands: [
        'create event',
        'schedule appointment',
        'my schedule',
        'today\'s events'
      ]
    },
    '/financial': {
      title: 'Financial Management Help',
      description: 'Track income, expenses, and financial transactions.',
      suggestedCommands: [
        'add income',
        'record expense',
        'show my transactions',
        'financial overview'
      ]
    },
    '/email': {
      title: 'Email Help',
      description: 'Manage your email communications and correspondence.',
      suggestedCommands: [
        'compose email',
        'check my email',
        'search emails',
        'show inbox'
      ]
    }
  };

  return contextualHelp[context] || {
    title: 'General Help',
    description: 'Use voice commands to navigate and control Nexa Manager efficiently.',
    suggestedCommands: [
      'help',
      'what can you do',
      'voice commands',
      'go to dashboard'
    ]
  };
}

/**
 * Get quick start guide
 * @returns {Object} Quick start information
 */
export function getQuickStartGuide() {
  return {
    title: 'Voice Assistant Quick Start',
    steps: [
      {
        step: 1,
        title: 'Activate Voice Assistant',
        description: 'Click the microphone button or say "Hey Nexa" to activate voice recognition.',
        tip: 'Make sure your microphone is enabled and working properly.'
      },
      {
        step: 2,
        title: 'Wait for the Signal',
        description: 'Wait for the beep sound or visual indicator that the assistant is listening.',
        tip: 'The microphone icon will change color when actively listening.'
      },
      {
        step: 3,
        title: 'Speak Your Command',
        description: 'Speak clearly and naturally. Use commands like "Go to clients" or "Create new invoice".',
        tip: 'You don\'t need to speak slowly, just clearly and at normal volume.'
      },
      {
        step: 4,
        title: 'Get Confirmation',
        description: 'The assistant will confirm your command and execute the action.',
        tip: 'If the command wasn\'t understood, try rephrasing or saying "help" for assistance.'
      }
    ],
    commonCommands: [
      'go to dashboard',
      'create new invoice',
      'show my clients',
      'help me with reports',
      'what can you do'
    ]
  };
}

/**
 * Get troubleshooting guide
 * @returns {Object} Troubleshooting information
 */
export function getTroubleshootingGuide() {
  return {
    title: 'Voice Assistant Troubleshooting',
    issues: [
      {
        problem: 'Voice assistant not responding',
        solutions: [
          'Check if your microphone is enabled in browser settings',
          'Ensure you\'re using a supported browser (Chrome, Firefox, Safari)',
          'Try refreshing the page and activating voice assistant again',
          'Check if microphone permissions are granted to the website'
        ]
      },
      {
        problem: 'Commands not being recognized',
        solutions: [
          'Speak more clearly and at normal volume',
          'Try using exact command phrases from the help guide',
          'Reduce background noise in your environment',
          'Check if your microphone is working properly'
        ]
      },
      {
        problem: 'Wrong actions being executed',
        solutions: [
          'Use more specific command phrases',
          'Try alternative phrasings for the same command',
          'Say "stop" to cancel current action',
          'Review the command reference for exact syntax'
        ]
      },
      {
        problem: 'Voice assistant stops working',
        solutions: [
          'Refresh the page and try again',
          'Check browser console for error messages',
          'Ensure stable internet connection',
          'Try using a different browser or device'
        ]
      }
    ]
  };
}

export default {
  COMMAND_CATEGORIES,
  COMMAND_REFERENCE,
  searchCommands,
  getCommandsByCategory,
  getAllCategories,
  getContextualHelp,
  getQuickStartGuide,
  getTroubleshootingGuide
};