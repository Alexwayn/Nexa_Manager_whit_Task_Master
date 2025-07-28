/**
 * Voice Command Handlers
 * Processes voice commands and executes corresponding actions
 */

import { toast } from 'react-hot-toast';
import { 
  processCalendarCommand, 
  executeCalendarCommand, 
  allCalendarCommands 
} from '@/services/CalendarCommandHandler';
import { 
  processTransactionCommand, 
  executeTransactionCommand, 
  allTransactionCommands 
} from '@/services/TransactionCommandHandler';
import { 
  processReportCommand, 
  executeReportCommand, 
  allReportCommands 
} from '@/services/ReportCommandHandler';
import { 
  processEmailCommand, 
  executeEmailCommand, 
  allEmailCommands 
} from '@/services/EmailCommandHandler';

// Navigation commands
export const navigationCommands = {
  // Dashboard navigation
  'go to dashboard': () => ({ action: 'navigate', path: '/dashboard' }),
  'open dashboard': () => ({ action: 'navigate', path: '/dashboard' }),
  'show dashboard': () => ({ action: 'navigate', path: '/dashboard' }),
  'dashboard': () => ({ action: 'navigate', path: '/dashboard' }),

  // Client management
  'go to clients': () => ({ action: 'navigate', path: '/clients' }),
  'open clients': () => ({ action: 'navigate', path: '/clients' }),
  'show clients': () => ({ action: 'navigate', path: '/clients' }),
  'client list': () => ({ action: 'navigate', path: '/clients' }),
  'clients': () => ({ action: 'navigate', path: '/clients' }),

  // Invoice management
  'go to invoices': () => ({ action: 'navigate', path: '/invoices' }),
  'open invoices': () => ({ action: 'navigate', path: '/invoices' }),
  'show invoices': () => ({ action: 'navigate', path: '/invoices' }),
  'invoice list': () => ({ action: 'navigate', path: '/invoices' }),
  'invoices': () => ({ action: 'navigate', path: '/invoices' }),

  // Calendar navigation
  'go to calendar': () => ({ action: 'navigate', path: '/calendar' }),
  'open calendar': () => ({ action: 'navigate', path: '/calendar' }),
  'show calendar': () => ({ action: 'navigate', path: '/calendar' }),
  'calendar': () => ({ action: 'navigate', path: '/calendar' }),

  // Financial navigation
  'go to financial': () => ({ action: 'navigate', path: '/financial' }),
  'open financial': () => ({ action: 'navigate', path: '/financial' }),
  'show financial': () => ({ action: 'navigate', path: '/financial' }),
  'financial': () => ({ action: 'navigate', path: '/financial' }),
  'finances': () => ({ action: 'navigate', path: '/financial' }),
  'transactions': () => ({ action: 'navigate', path: '/financial' }),

  // Reports
  'go to reports': () => ({ action: 'navigate', path: '/reports' }),
  'open reports': () => ({ action: 'navigate', path: '/reports' }),
  'show reports': () => ({ action: 'navigate', path: '/reports' }),
  'reports': () => ({ action: 'navigate', path: '/reports' }),

  // Analytics
  'go to analytics': () => ({ action: 'navigate', path: '/analytics' }),
  'open analytics': () => ({ action: 'navigate', path: '/analytics' }),
  'show analytics': () => ({ action: 'navigate', path: '/analytics' }),
  'analytics': () => ({ action: 'navigate', path: '/analytics' }),

  // Settings
  'go to settings': () => ({ action: 'navigate', path: '/settings' }),
  'open settings': () => ({ action: 'navigate', path: '/settings' }),
  'show settings': () => ({ action: 'navigate', path: '/settings' }),
  'settings': () => ({ action: 'navigate', path: '/settings' }),

  // Profile
  'go to profile': () => ({ action: 'navigate', path: '/profile' }),
  'open profile': () => ({ action: 'navigate', path: '/profile' }),
  'my profile': () => ({ action: 'navigate', path: '/profile' }),
  'profile': () => ({ action: 'navigate', path: '/profile' }),

  // Go back
  'go back': () => ({ action: 'navigate', path: 'back' }),
  'back': () => ({ action: 'navigate', path: 'back' }),
  'previous page': () => ({ action: 'navigate', path: 'back' }),
};

// Action commands
export const actionCommands = {
  // Create new items
  'create new invoice': () => ({ action: 'create', type: 'invoice' }),
  'new invoice': () => ({ action: 'create', type: 'invoice' }),
  'add invoice': () => ({ action: 'create', type: 'invoice' }),

  'create new client': () => ({ action: 'create', type: 'client' }),
  'new client': () => ({ action: 'create', type: 'client' }),
  'add client': () => ({ action: 'create', type: 'client' }),

  'create new report': () => ({ action: 'create', type: 'report' }),
  'new report': () => ({ action: 'create', type: 'report' }),
  'add report': () => ({ action: 'create', type: 'report' }),

  // Calendar actions
  'create event': () => ({ action: 'calendar', type: 'create-event' }),
  'new event': () => ({ action: 'calendar', type: 'create-event' }),
  'add event': () => ({ action: 'calendar', type: 'create-event' }),
  'schedule event': () => ({ action: 'calendar', type: 'create-event' }),
  'create appointment': () => ({ action: 'calendar', type: 'create-appointment' }),
  'new appointment': () => ({ action: 'calendar', type: 'create-appointment' }),
  'schedule appointment': () => ({ action: 'calendar', type: 'create-appointment' }),
  'book appointment': () => ({ action: 'calendar', type: 'create-appointment' }),
  'my schedule': () => ({ action: 'calendar', type: 'list-events' }),
  'show my events': () => ({ action: 'calendar', type: 'list-events' }),
  'today\'s events': () => ({ action: 'calendar', type: 'today-events' }),
  'what do i have today': () => ({ action: 'calendar', type: 'today-events' }),

  // Transaction actions
  'add income': () => ({ action: 'transaction', type: 'create-income' }),
  'record income': () => ({ action: 'transaction', type: 'create-income' }),
  'new income': () => ({ action: 'transaction', type: 'create-income' }),
  'add expense': () => ({ action: 'transaction', type: 'create-expense' }),
  'record expense': () => ({ action: 'transaction', type: 'create-expense' }),
  'new expense': () => ({ action: 'transaction', type: 'create-expense' }),
  'show my transactions': () => ({ action: 'transaction', type: 'list-transactions' }),
  'list transactions': () => ({ action: 'transaction', type: 'list-transactions' }),
  'my transactions': () => ({ action: 'transaction', type: 'list-transactions' }),
  'financial overview': () => ({ action: 'transaction', type: 'overview' }),
  'show financial overview': () => ({ action: 'transaction', type: 'overview' }),

  // Report actions
  'generate revenue report': () => ({ action: 'report', type: 'generate-revenue' }),
  'create revenue report': () => ({ action: 'report', type: 'generate-revenue' }),
  'revenue report': () => ({ action: 'report', type: 'generate-revenue' }),
  'generate client report': () => ({ action: 'report', type: 'generate-client' }),
  'create client report': () => ({ action: 'report', type: 'generate-client' }),
  'client report': () => ({ action: 'report', type: 'generate-client' }),
  'generate tax report': () => ({ action: 'report', type: 'generate-tax' }),
  'create tax report': () => ({ action: 'report', type: 'generate-tax' }),
  'tax report': () => ({ action: 'report', type: 'generate-tax' }),
  'generate aging report': () => ({ action: 'report', type: 'generate-aging' }),
  'aging report': () => ({ action: 'report', type: 'generate-aging' }),
  'get financial analytics': () => ({ action: 'report', type: 'analytics' }),
  'show analytics': () => ({ action: 'report', type: 'analytics' }),
  'financial analytics': () => ({ action: 'report', type: 'analytics' }),
  'show cash flow forecast': () => ({ action: 'report', type: 'forecast' }),
  'cash flow forecast': () => ({ action: 'report', type: 'forecast' }),
  'forecast': () => ({ action: 'report', type: 'forecast' }),
  'schedule report': () => ({ action: 'report', type: 'schedule' }),
  'schedule weekly report': () => ({ action: 'report', type: 'schedule-weekly' }),
  'schedule monthly report': () => ({ action: 'report', type: 'schedule-monthly' }),

  // Email actions
  'compose email': () => ({ action: 'email', type: 'compose' }),
  'new email': () => ({ action: 'email', type: 'compose' }),
  'write email': () => ({ action: 'email', type: 'compose' }),
  'send email': () => ({ action: 'email', type: 'send' }),
  'check email': () => ({ action: 'email', type: 'check' }),
  'check my email': () => ({ action: 'email', type: 'check' }),
  'show inbox': () => ({ action: 'email', type: 'inbox' }),
  'open inbox': () => ({ action: 'email', type: 'inbox' }),
  'my inbox': () => ({ action: 'email', type: 'inbox' }),
  'search emails': () => ({ action: 'email', type: 'search' }),
  'find emails': () => ({ action: 'email', type: 'search' }),
  'mark as read': () => ({ action: 'email', type: 'mark-read' }),
  'mark as unread': () => ({ action: 'email', type: 'mark-unread' }),
  'star email': () => ({ action: 'email', type: 'star' }),
  'unstar email': () => ({ action: 'email', type: 'unstar' }),
  'delete email': () => ({ action: 'email', type: 'delete' }),
  'archive email': () => ({ action: 'email', type: 'archive' }),
  'reply to email': () => ({ action: 'email', type: 'reply' }),
  'forward email': () => ({ action: 'email', type: 'forward' }),

  // Search commands
  'search': () => ({ action: 'search', query: '' }),
  'find': () => ({ action: 'search', query: '' }),
  'look for': () => ({ action: 'search', query: '' }),

  // Export commands
  'export data': () => ({ action: 'export', type: 'all' }),
  'export invoices': () => ({ action: 'export', type: 'invoices' }),
  'export clients': () => ({ action: 'export', type: 'clients' }),
  'export reports': () => ({ action: 'export', type: 'reports' }),

  // Refresh
  'refresh': () => ({ action: 'refresh' }),
  'reload': () => ({ action: 'refresh' }),
  'update': () => ({ action: 'refresh' }),
};

// Help and information commands
export const helpCommands = {
  'help': () => ({ action: 'help', type: 'general' }),
  'what can you do': () => ({ action: 'help', type: 'capabilities' }),
  'what can i say': () => ({ action: 'help', type: 'commands' }),
  'voice commands': () => ({ action: 'help', type: 'commands' }),
  'how do i': () => ({ action: 'help', type: 'howto' }),
  'help me with invoices': () => ({ action: 'help', type: 'invoices' }),
  'help me with clients': () => ({ action: 'help', type: 'clients' }),
  'help me with reports': () => ({ action: 'help', type: 'reports' }),
  'help with reports': () => ({ action: 'help', type: 'reports' }),
  'report help': () => ({ action: 'help', type: 'reports' }),
  'help me with analytics': () => ({ action: 'help', type: 'reports' }),
  'analytics help': () => ({ action: 'help', type: 'reports' }),
  'help me with calendar': () => ({ action: 'help', type: 'calendar' }),
  'help with calendar': () => ({ action: 'help', type: 'calendar' }),
  'calendar help': () => ({ action: 'help', type: 'calendar' }),
  'help me with transactions': () => ({ action: 'help', type: 'transactions' }),
  'help with transactions': () => ({ action: 'help', type: 'transactions' }),
  'transaction help': () => ({ action: 'help', type: 'transactions' }),
  'help me with finances': () => ({ action: 'help', type: 'transactions' }),
  'financial help': () => ({ action: 'help', type: 'transactions' }),
  'help me with email': () => ({ action: 'help', type: 'email' }),
  'help with email': () => ({ action: 'help', type: 'email' }),
  'email help': () => ({ action: 'help', type: 'email' }),
  'help me with emails': () => ({ action: 'help', type: 'email' }),
  'help with emails': () => ({ action: 'help', type: 'email' }),
};

// System commands
export const systemCommands = {
  'open voice settings': () => ({ action: 'system', type: 'voice-settings' }),
  'voice settings': () => ({ action: 'system', type: 'voice-settings' }),
  'configure voice': () => ({ action: 'system', type: 'voice-settings' }),
  
  'stop listening': () => ({ action: 'system', type: 'stop-listening' }),
  'stop': () => ({ action: 'system', type: 'stop-listening' }),
  'cancel': () => ({ action: 'system', type: 'stop-listening' }),
  
  'repeat': () => ({ action: 'system', type: 'repeat' }),
  'say that again': () => ({ action: 'system', type: 'repeat' }),
  'what did you say': () => ({ action: 'system', type: 'repeat' }),
};

// Combine all command sets
export const allCommands = {
  ...navigationCommands,
  ...actionCommands,
  ...helpCommands,
  ...systemCommands,
  ...allCalendarCommands,
  ...allTransactionCommands,
  ...allReportCommands,
  ...allEmailCommands,
};

/**
 * Process a voice command and return the appropriate action
 * @param {string} command - The voice command to process
 * @param {Object} context - Current application context
 * @returns {Object} Action object with type and parameters
 */
export function processVoiceCommand(command, context = {}) {
  if (!command || typeof command !== 'string') {
    return { action: 'error', message: 'Invalid command' };
  }

  // Normalize the command
  const normalizedCommand = command.toLowerCase().trim();
  
  // Check for exact matches first
  if (allCommands[normalizedCommand]) {
    return allCommands[normalizedCommand]();
  }

  // Check for partial matches and dynamic commands
  return processPartialMatches(normalizedCommand, context);
}

/**
 * Process partial matches and dynamic commands
 * @param {string} command - Normalized command
 * @param {Object} context - Application context
 * @returns {Object} Action object
 */
function processPartialMatches(command, context) {
  // Calendar commands first (before general search)
  const calendarResult = processCalendarCommand(command);
  if (calendarResult.action !== 'error') {
    return calendarResult;
  }

  // Transaction commands
  const transactionResult = processTransactionCommand(command);
  if (transactionResult.action !== 'error') {
    return transactionResult;
  }

  // Report commands
  const reportResult = processReportCommand(command);
  if (reportResult.action !== 'error') {
    return reportResult;
  }

  // Email commands
  const emailResult = processEmailCommand(command);
  if (emailResult.action !== 'error') {
    return emailResult;
  }

  // Search commands with query
  if (command.startsWith('search for ')) {
    const query = command.replace('search for ', '');
    return { action: 'search', query };
  }

  if (command.startsWith('find ')) {
    const query = command.replace('find ', '');
    return { action: 'search', query };
  }

  if (command.startsWith('look for ')) {
    const query = command.replace('look for ', '');
    return { action: 'search', query };
  }

  // Navigation with "go to" prefix
  if (command.startsWith('go to ')) {
    const destination = command.replace('go to ', '');
    return processNavigationDestination(destination);
  }

  if (command.startsWith('open ')) {
    const destination = command.replace('open ', '');
    return processNavigationDestination(destination);
  }

  if (command.startsWith('show ')) {
    const destination = command.replace('show ', '');
    return processNavigationDestination(destination);
  }

  // Create commands
  if (command.startsWith('create ') || command.startsWith('new ') || command.startsWith('add ')) {
    return processCreateCommand(command);
  }

  // Help commands
  if (command.includes('help')) {
    return processHelpCommand(command);
  }

  // Fuzzy matching for common commands
  return processFuzzyMatches(command);
}

/**
 * Process navigation destinations
 * @param {string} destination - The destination to navigate to
 * @returns {Object} Navigation action
 */
function processNavigationDestination(destination) {
  const destinationMap = {
    'dashboard': '/dashboard',
    'home': '/dashboard',
    'clients': '/clients',
    'client': '/clients',
    'invoices': '/invoices',
    'invoice': '/invoices',
    'reports': '/reports',
    'report': '/reports',
    'calendar': '/calendar',
    'schedule': '/calendar',
    'events': '/calendar',
    'analytics': '/analytics',
    'settings': '/settings',
    'profile': '/profile',
    'financial': '/financial',
    'finances': '/financial',
    'money': '/financial',
    'transactions': '/financial',
    'income': '/financial',
    'expenses': '/financial',
    'expense': '/financial',
    'email': '/email',
    'emails': '/email',
    'mail': '/email',
    'inbox': '/email/inbox',
    'sent': '/email/sent',
    'drafts': '/email/drafts',
    'compose': '/email/compose',
    'help': '/help',
    'voice help': '/voice-help',
    'voice commands': '/voice-help',
    'command help': '/voice-help',
    'voice assistant help': '/voice-help',
  };

  const path = destinationMap[destination];
  if (path) {
    return { action: 'navigate', path };
  }

  return { action: 'error', message: `I don't know how to navigate to "${destination}"` };
}

/**
 * Process create commands
 * @param {string} command - The create command
 * @returns {Object} Create action
 */
function processCreateCommand(command) {
  if (command.includes('invoice')) {
    return { action: 'create', type: 'invoice' };
  }
  if (command.includes('client')) {
    return { action: 'create', type: 'client' };
  }
  if (command.includes('report')) {
    return { action: 'create', type: 'report' };
  }
  if (command.includes('event') || command.includes('appointment')) {
    return { action: 'calendar', type: 'create-event' };
  }
  if (command.includes('income') || command.includes('revenue')) {
    return { action: 'transaction', type: 'create-income' };
  }
  if (command.includes('expense') || command.includes('cost') || command.includes('payment')) {
    return { action: 'transaction', type: 'create-expense' };
  }
  if (command.includes('email') || command.includes('mail') || command.includes('message')) {
    return { action: 'email', type: 'compose' };
  }

  return { action: 'error', message: 'I can help you create invoices, clients, reports, calendar events, income, expenses, or emails. What would you like to create?' };
}

/**
 * Process help commands
 * @param {string} command - The help command
 * @returns {Object} Help action
 */
function processHelpCommand(command) {
  if (command.includes('invoice')) {
    return { action: 'help', type: 'invoices' };
  }
  if (command.includes('client')) {
    return { action: 'help', type: 'clients' };
  }
  if (command.includes('report') || command.includes('analytics') || command.includes('revenue') || command.includes('forecast') || command.includes('aging')) {
    return { action: 'help', type: 'reports' };
  }
  if (command.includes('calendar') || command.includes('event') || command.includes('appointment')) {
    return { action: 'help', type: 'calendar' };
  }
  if (command.includes('transaction') || command.includes('income') || command.includes('expense') || command.includes('financial') || command.includes('money')) {
    return { action: 'help', type: 'transactions' };
  }
  if (command.includes('email') || command.includes('mail') || command.includes('inbox') || command.includes('compose')) {
    return { action: 'help', type: 'email' };
  }
  if (command.includes('command')) {
    return { action: 'help', type: 'commands' };
  }

  return { action: 'help', type: 'general' };
}

/**
 * Process fuzzy matches for common typos and variations
 * @param {string} command - The command to match
 * @returns {Object} Action or error
 */
function processFuzzyMatches(command) {
  // Simple fuzzy matching for common commands
  const fuzzyMatches = [
    { patterns: ['dashbord', 'dashbaord', 'dash'], action: () => ({ action: 'navigate', path: '/dashboard' }) },
    { patterns: ['clints', 'client', 'custmers'], action: () => ({ action: 'navigate', path: '/clients' }) },
    { patterns: ['invoic', 'bills', 'billing'], action: () => ({ action: 'navigate', path: '/invoices' }) },
    { patterns: ['reprt', 'reporting'], action: () => ({ action: 'navigate', path: '/reports' }) },
    { patterns: ['analytic', 'stats', 'statistics'], action: () => ({ action: 'navigate', path: '/analytics' }) },
    { patterns: ['mail', 'emai', 'inbox', 'mesage'], action: () => ({ action: 'navigate', path: '/email' }) },
  ];

  for (const match of fuzzyMatches) {
    if (match.patterns.some(pattern => command.includes(pattern))) {
      return match.action();
    }
  }

  return { action: 'error', message: `I didn't understand "${command}". Try saying "help" to see what I can do.` };
}

/**
 * Execute a processed voice command
 * @param {Object} action - The action object from processVoiceCommand
 * @param {Object} context - Application context (router, etc.)
 * @returns {Promise<string>} Response message
 */
export async function executeVoiceCommand(action, context = {}) {
  const { navigate, currentPath } = context;

  try {
    switch (action.action) {
      case 'navigate':
        return await handleNavigation(action, navigate, currentPath);
      
      case 'create':
        return await handleCreate(action, navigate);
      
      case 'calendar':
        return await executeCalendarCommand(action, navigate);
      
      case 'transaction':
        return await executeTransactionCommand(action, context);
      
      case 'report':
        return await executeReportCommand(action, context);
      
      case 'email':
        return await executeEmailCommand(action, context);
      
      case 'search':
        return await handleSearch(action, context);
      
      case 'export':
        return await handleExport(action, context);
      
      case 'help':
        return await handleHelp(action, context);
      
      case 'system':
        return await handleSystem(action, context);
      
      case 'refresh':
        window.location.reload();
        return "Refreshing the page...";
      
      case 'error':
        return action.message || "I didn't understand that command.";
      
      default:
        return "I'm not sure how to handle that command.";
    }
  } catch (error) {
    console.error('Error executing voice command:', error);
    return "Sorry, there was an error processing your command.";
  }
}

// Command execution handlers
async function handleNavigation(action, navigate, currentPath) {
  if (!navigate) {
    return "Navigation is not available right now.";
  }

  if (action.path === 'back') {
    window.history.back();
    return "Going back to the previous page.";
  }

  if (currentPath === action.path) {
    return "You're already on that page.";
  }

  navigate(action.path);
  
  const pageNames = {
    '/dashboard': 'dashboard',
    '/clients': 'clients page',
    '/invoices': 'invoices page',
    '/reports': 'reports page',
    '/analytics': 'analytics page',
    '/settings': 'settings page',
    '/profile': 'profile page',
  };

  const pageName = pageNames[action.path] || 'the requested page';
  return `Navigating to the ${pageName}.`;
}

async function handleCreate(action, navigate) {
  const createRoutes = {
    'invoice': '/invoices/new',
    'client': '/clients/new',
    'report': '/reports/new',
    'email': '/email/compose',
  };

  const route = createRoutes[action.type];
  if (route && navigate) {
    navigate(route);
    return `Creating a new ${action.type}.`;
  }

  return `I can help you create a new ${action.type}, but navigation is not available right now.`;
}

async function handleSearch(action, context) {
  if (action.query) {
    // Trigger search with the query
    if (context.onSearch) {
      context.onSearch(action.query);
      return `Searching for "${action.query}".`;
    }
    return `I would search for "${action.query}", but search functionality is not available right now.`;
  }
  
  return "What would you like to search for?";
}

async function handleExport(action, context) {
  if (context.onExport) {
    context.onExport(action.type);
    return `Exporting ${action.type} data.`;
  }
  
  return `I would export ${action.type} data, but export functionality is not available right now.`;
}

async function handleHelp(action, context = {}) {
  const { navigate } = context;
  
  const helpResponses = {
    general: "I can help you navigate Nexa Manager, create invoices and clients, search for information, manage your calendar, handle financial transactions, and more. Try saying 'what can you do' for a full list of commands, or say 'voice help' to open the complete command reference.",
    
    capabilities: "I can help you with: navigating between pages (say 'go to dashboard'), creating new items (say 'create new invoice'), searching (say 'search for client name'), exporting data, managing calendar events (say 'schedule appointment'), handling financial transactions (say 'add income' or 'record expense'), and getting help. Say 'voice help' for the complete command reference. What would you like to do?",
    
    commands: "Opening the complete voice commands help page for you...",
    
    invoices: "For invoices, you can say: 'Go to invoices', 'Create new invoice', 'Search for invoice', or 'Export invoices'. What would you like to do with invoices?",
    
    clients: "For clients, you can say: 'Go to clients', 'Create new client', 'Search for client', or 'Export clients'. What would you like to do with clients?",
    
    reports: "For reports, you can say: 'Go to reports', 'Generate revenue report', 'Create client report', 'Show tax report', 'Generate aging report', 'Get financial analytics', 'Show cash flow forecast', 'Schedule weekly report', or 'Export report as PDF'. What would you like to do with reports?",
    
    calendar: "For calendar, you can say: 'Go to calendar', 'Create event', 'Schedule appointment', 'My schedule', 'Today's events', 'What do I have today', or 'Book appointment'. What would you like to do with your calendar?",
    
    transactions: "For financial transactions, you can say: 'Add income', 'Record expense', 'Show my transactions', 'Go to financial', 'List income', 'List expenses', 'Search transactions', or 'Financial overview'. What would you like to do with your finances?",
    
    email: "For email, you can say: 'Compose email', 'Check my email', 'Show inbox', 'Search emails', 'Reply to email', 'Forward email', 'Mark as read', 'Star email', 'Delete email', 'Archive email', 'Send email to [contact]', or 'Go to email'. What would you like to do with your emails?",
    
    howto: "I can help you learn how to use different features. Try asking 'Help me with invoices', 'Help me with clients', 'Help me with reports', 'Help me with calendar', 'Help me with transactions', or 'Help me with email'. For a complete command reference, say 'voice help'.",
  };

  // Navigate to voice help page for commands help
  if (action.type === 'commands' && navigate) {
    navigate('/voice-help');
  }

  return helpResponses[action.type] || helpResponses.general;
}

async function handleSystem(action, context) {
  switch (action.type) {
    case 'voice-settings':
      if (context.onOpenVoiceSettings) {
        context.onOpenVoiceSettings();
        return "Opening voice settings.";
      }
      return "Voice settings are not available right now.";
    
    case 'stop-listening':
      if (context.onStopListening) {
        context.onStopListening();
        return "Stopping voice recognition.";
      }
      return "Voice recognition stopped.";
    
    case 'repeat':
      if (context.lastResponse) {
        return context.lastResponse;
      }
      return "I don't have anything to repeat.";
    
    default:
      return "System command not recognized.";
  }
}