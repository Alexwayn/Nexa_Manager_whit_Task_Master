/**
 * Calendar Command Handler
 * Handles voice commands related to calendar operations
 */

import { toast } from 'react-hot-toast';
import { format, addDays, addWeeks, addMonths, parseISO, isValid } from 'date-fns';
import { getEvents, createEvent, updateEvent, deleteEvent, EVENT_TYPES, EVENT_PRIORITIES } from '@features/calendar/services/eventService';
import Logger from '@utils/Logger';

export interface CalendarCommandContext {
  navigate?: (path: string) => void;
  currentPath?: string;
  userId?: string;
  onEventCreated?: (event: any) => void;
  onEventUpdated?: (event: any) => void;
  onEventDeleted?: (eventId: string) => void;
  onCalendarRefresh?: () => void;
}

export interface CalendarAction {
  action: string;
  type?: string;
  data?: any;
  message?: string;
  eventId?: string;
  date?: string;
  time?: string;
  title?: string;
  description?: string;
  location?: string;
  priority?: string;
  clientId?: string;
  path?: string;
  query?: string;
}

/**
 * Calendar navigation commands
 */
export const calendarNavigationCommands = {
  // Basic calendar navigation
  'go to calendar': () => ({ action: 'navigate', path: '/calendar' }),
  'open calendar': () => ({ action: 'navigate', path: '/calendar' }),
  'show calendar': () => ({ action: 'navigate', path: '/calendar' }),
  'calendar': () => ({ action: 'navigate', path: '/calendar' }),

  // Calendar views
  'show month view': () => ({ action: 'calendar-view', type: 'month' }),
  'month view': () => ({ action: 'calendar-view', type: 'month' }),
  'show week view': () => ({ action: 'calendar-view', type: 'week' }),
  'week view': () => ({ action: 'calendar-view', type: 'week' }),
  'show day view': () => ({ action: 'calendar-view', type: 'day' }),
  'day view': () => ({ action: 'calendar-view', type: 'day' }),

  // Date navigation
  'go to today': () => ({ action: 'calendar-navigate', type: 'today' }),
  'show today': () => ({ action: 'calendar-navigate', type: 'today' }),
  'today': () => ({ action: 'calendar-navigate', type: 'today' }),
  'next month': () => ({ action: 'calendar-navigate', type: 'next-month' }),
  'previous month': () => ({ action: 'calendar-navigate', type: 'prev-month' }),
  'next week': () => ({ action: 'calendar-navigate', type: 'next-week' }),
  'previous week': () => ({ action: 'calendar-navigate', type: 'prev-week' }),
};

/**
 * Calendar action commands
 */
export const calendarActionCommands = {
  // Event creation
  'create event': () => ({ action: 'create-event', type: 'general' }),
  'new event': () => ({ action: 'create-event', type: 'general' }),
  'add event': () => ({ action: 'create-event', type: 'general' }),
  'schedule event': () => ({ action: 'create-event', type: 'general' }),

  'create appointment': () => ({ action: 'create-event', type: 'appointment' }),
  'new appointment': () => ({ action: 'create-event', type: 'appointment' }),
  'schedule appointment': () => ({ action: 'create-event', type: 'appointment' }),
  'book appointment': () => ({ action: 'create-event', type: 'appointment' }),

  'create meeting': () => ({ action: 'create-event', type: 'meeting' }),
  'new meeting': () => ({ action: 'create-event', type: 'meeting' }),
  'schedule meeting': () => ({ action: 'create-event', type: 'meeting' }),

  'create reminder': () => ({ action: 'create-event', type: 'reminder' }),
  'new reminder': () => ({ action: 'create-event', type: 'reminder' }),
  'add reminder': () => ({ action: 'create-event', type: 'reminder' }),
  'set reminder': () => ({ action: 'create-event', type: 'reminder' }),

  // Event management
  'show my events': () => ({ action: 'list-events', type: 'all' }),
  'list events': () => ({ action: 'list-events', type: 'all' }),
  'my schedule': () => ({ action: 'list-events', type: 'all' }),
  'what do i have today': () => ({ action: 'list-events', type: 'today' }),
  'today\'s events': () => ({ action: 'list-events', type: 'today' }),
  'what do i have tomorrow': () => ({ action: 'list-events', type: 'tomorrow' }),
  'tomorrow\'s events': () => ({ action: 'list-events', type: 'tomorrow' }),
  'this week\'s events': () => ({ action: 'list-events', type: 'week' }),
  'next week\'s events': () => ({ action: 'list-events', type: 'next-week' }),

  // Event search
  'find event': () => ({ action: 'search-events', query: '' }),
  'search events': () => ({ action: 'search-events', query: '' }),
  'look for event': () => ({ action: 'search-events', query: '' }),

  // Quick actions
  'refresh calendar': () => ({ action: 'refresh-calendar' }),
  'update calendar': () => ({ action: 'refresh-calendar' }),
  'reload calendar': () => ({ action: 'refresh-calendar' }),
};

/**
 * Process calendar-specific voice commands
 * @param command - The voice command to process
 * @param context - Current application context
 * @returns CalendarAction object
 */
export function processCalendarCommand(command: string, context: CalendarCommandContext = {}): CalendarAction {
  if (!command || typeof command !== 'string') {
    return { action: 'error', message: 'Invalid calendar command' };
  }

  const normalizedCommand = command.toLowerCase().trim();
  
  // Check navigation commands
  const navCommand = calendarNavigationCommands[normalizedCommand];
  if (navCommand) {
    return navCommand();
  }

  // Check action commands
  const actionCommand = calendarActionCommands[normalizedCommand];
  if (actionCommand) {
    return actionCommand();
  }

  // Process dynamic calendar commands
  return processCalendarPartialMatches(normalizedCommand, context);
}

/**
 * Process partial matches and dynamic calendar commands
 * @param command - Normalized command
 * @param context - Application context
 * @returns CalendarAction object
 */
function processCalendarPartialMatches(command: string, context: CalendarCommandContext): CalendarAction {
  // Event creation with details
  if (command.startsWith('create event ') || command.startsWith('schedule ') || command.startsWith('add event ')) {
    return parseEventCreationCommand(command);
  }

  // Event search with query
  if (command.startsWith('find event ') || command.startsWith('search for event ') || command.startsWith('look for ')) {
    const query = command.replace(/^(find event |search for event |look for )/, '');
    return { action: 'search-events', query };
  }

  // Date-specific queries
  if (command.includes('what do i have on ') || command.includes('events on ') || command.includes('schedule for ')) {
    const dateStr = extractDateFromCommand(command);
    if (dateStr) {
      return { action: 'list-events', type: 'date', date: dateStr };
    }
  }

  // Event modification
  if (command.startsWith('cancel ') || command.startsWith('delete ') || command.startsWith('remove ')) {
    const eventQuery = command.replace(/^(cancel |delete |remove )/, '');
    return { action: 'delete-event', query: eventQuery };
  }

  if (command.startsWith('reschedule ') || command.startsWith('move ') || command.startsWith('change ')) {
    const eventQuery = command.replace(/^(reschedule |move |change )/, '');
    return { action: 'reschedule-event', query: eventQuery };
  }

  // Time-based navigation
  if (command.includes('go to ') && (command.includes('date') || command.includes('day') || command.includes('month'))) {
    const dateStr = extractDateFromCommand(command);
    if (dateStr) {
      return { action: 'calendar-navigate', type: 'date', date: dateStr };
    }
  }

  // Fuzzy matching for calendar commands
  return processCalendarFuzzyMatches(command);
}

/**
 * Parse event creation commands with details
 * @param command - The command string
 * @returns CalendarAction for event creation
 */
function parseEventCreationCommand(command: string): CalendarAction {
  const eventData: any = {
    type: EVENT_TYPES.APPOINTMENT,
    priority: EVENT_PRIORITIES.MEDIUM,
  };

  // Extract event type
  if (command.includes('appointment')) {
    eventData.type = EVENT_TYPES.APPOINTMENT;
  } else if (command.includes('meeting')) {
    eventData.type = EVENT_TYPES.APPOINTMENT; // Use appointment type for meetings
  } else if (command.includes('reminder')) {
    eventData.type = EVENT_TYPES.REMINDER;
  }

  // Extract title (everything after "create event" or similar)
  let titleMatch = command.match(/(?:create event|schedule|add event)\s+(.+?)(?:\s+(?:on|at|for)\s+|$)/);
  if (titleMatch) {
    eventData.title = titleMatch[1].trim();
  }

  // Extract date
  const dateStr = extractDateFromCommand(command);
  if (dateStr) {
    eventData.date = dateStr;
  }

  // Extract time
  const timeStr = extractTimeFromCommand(command);
  if (timeStr) {
    eventData.start_time = timeStr;
  }

  // Extract location
  const locationMatch = command.match(/(?:at|in)\s+([^,]+?)(?:\s+(?:on|at|for)\s+|$)/);
  if (locationMatch) {
    eventData.location = locationMatch[1].trim();
  }

  // Extract priority
  if (command.includes('urgent') || command.includes('important') || command.includes('high priority')) {
    eventData.priority = EVENT_PRIORITIES.HIGH;
  } else if (command.includes('low priority')) {
    eventData.priority = EVENT_PRIORITIES.LOW;
  }

  return { action: 'create-event', type: eventData.type, data: eventData };
}

/**
 * Extract date from command string
 * @param command - The command string
 * @returns Date string in YYYY-MM-DD format or null
 */
function extractDateFromCommand(command: string): string | null {
  const today = new Date();
  
  // Handle relative dates
  if (command.includes('today')) {
    return format(today, 'yyyy-MM-dd');
  }
  if (command.includes('tomorrow')) {
    return format(addDays(today, 1), 'yyyy-MM-dd');
  }
  if (command.includes('next week')) {
    return format(addWeeks(today, 1), 'yyyy-MM-dd');
  }
  if (command.includes('next month')) {
    return format(addMonths(today, 1), 'yyyy-MM-dd');
  }

  // Handle specific dates (basic patterns)
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
    /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
    /(\d{1,2})-(\d{1,2})-(\d{4})/,   // DD-MM-YYYY
  ];

  for (const pattern of datePatterns) {
    const match = command.match(pattern);
    if (match) {
      try {
        let year, month, day;
        if (pattern.source.includes('yyyy')) {
          // YYYY-MM-DD format
          [, year, month, day] = match;
        } else {
          // MM/DD/YYYY or DD-MM-YYYY format
          [, month, day, year] = match;
        }
        
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isValid(date)) {
          return format(date, 'yyyy-MM-dd');
        }
      } catch (error) {
        Logger.warn('Error parsing date from command:', error);
      }
    }
  }

  return null;
}

/**
 * Extract time from command string
 * @param command - The command string
 * @returns Time string in HH:MM format or null
 */
function extractTimeFromCommand(command: string): string | null {
  // Handle time patterns
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,  // HH:MM am/pm
    /(\d{1,2})\s*(am|pm)/i,           // H am/pm
    /at\s+(\d{1,2}):(\d{2})/i,        // at HH:MM
    /at\s+(\d{1,2})\s*(am|pm)/i,      // at H am/pm
  ];

  for (const pattern of timePatterns) {
    const match = command.match(pattern);
    if (match) {
      try {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const period = match[3] || match[2]; // am/pm might be in different positions

        if (period && period.toLowerCase() === 'pm' && hours !== 12) {
          hours += 12;
        } else if (period && period.toLowerCase() === 'am' && hours === 12) {
          hours = 0;
        }

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } catch (error) {
        Logger.warn('Error parsing time from command:', error);
      }
    }
  }

  return null;
}

/**
 * Process fuzzy matches for calendar commands
 * @param command - The command to match
 * @returns CalendarAction or error
 */
function processCalendarFuzzyMatches(command: string): CalendarAction {
  const fuzzyMatches = [
    { patterns: ['calender', 'calander', 'schedule'], action: () => ({ action: 'navigate', path: '/calendar' }) },
    { patterns: ['apointment', 'appointment', 'meeting'], action: () => ({ action: 'create-event', type: 'appointment' }) },
    { patterns: ['remind', 'reminder'], action: () => ({ action: 'create-event', type: 'reminder' }) },
    { patterns: ['event', 'events'], action: () => ({ action: 'list-events', type: 'all' }) },
  ];

  for (const match of fuzzyMatches) {
    if (match.patterns.some(pattern => command.includes(pattern))) {
      return match.action();
    }
  }

  return { action: 'error', message: `I didn't understand the calendar command "${command}". Try saying "help with calendar" to see what I can do.` };
}

/**
 * Execute a processed calendar command
 * @param action - The action object from processCalendarCommand
 * @param context - Application context
 * @returns Promise<string> Response message
 */
export async function executeCalendarCommand(action: CalendarAction, context: CalendarCommandContext = {}): Promise<string> {
  const { navigate, currentPath, userId } = context;

  try {
    switch (action.action) {
      case 'navigate':
        return await handleCalendarNavigation(action, navigate, currentPath);
      
      case 'calendar-view':
        return await handleCalendarViewChange(action, context);
      
      case 'calendar-navigate':
        return await handleCalendarDateNavigation(action, context);
      
      case 'create-event':
        return await handleEventCreation(action, context);
      
      case 'list-events':
        return await handleEventListing(action, context);
      
      case 'search-events':
        return await handleEventSearch(action, context);
      
      case 'delete-event':
        return await handleEventDeletion(action, context);
      
      case 'reschedule-event':
        return await handleEventReschedule(action, context);
      
      case 'refresh-calendar':
        return await handleCalendarRefresh(context);
      
      case 'error':
        return action.message || "I didn't understand that calendar command.";
      
      default:
        return "I'm not sure how to handle that calendar command.";
    }
  } catch (error) {
    Logger.error('Error executing calendar command:', error);
    return "Sorry, there was an error processing your calendar command.";
  }
}

// Calendar command execution handlers

async function handleCalendarNavigation(action: CalendarAction, navigate?: (path: string) => void, currentPath?: string): Promise<string> {
  if (!navigate) {
    return "Navigation is not available right now.";
  }

  if (currentPath === action.path) {
    return "You're already on the calendar page.";
  }

  navigate(action.path!);
  return "Opening the calendar.";
}

async function handleCalendarViewChange(action: CalendarAction, context: CalendarCommandContext): Promise<string> {
  // This would typically interact with calendar state management
  const viewNames = {
    'month': 'month view',
    'week': 'week view',
    'day': 'day view',
  };

  const viewName = viewNames[action.type as keyof typeof viewNames] || action.type;
  return `Switching to ${viewName}.`;
}

async function handleCalendarDateNavigation(action: CalendarAction, context: CalendarCommandContext): Promise<string> {
  const navigationMessages = {
    'today': "Navigating to today's date.",
    'next-month': "Moving to next month.",
    'prev-month': "Moving to previous month.",
    'next-week': "Moving to next week.",
    'prev-week': "Moving to previous week.",
    'date': `Navigating to ${action.date}.`,
  };

  return navigationMessages[action.type as keyof typeof navigationMessages] || "Navigating in calendar.";
}

async function handleEventCreation(action: CalendarAction, context: CalendarCommandContext): Promise<string> {
  try {
    if (!context.userId) {
      return "User authentication required to create events.";
    }

    const eventData = {
      user_id: context.userId,
      title: action.data?.title || `New ${action.type}`,
      type: action.data?.type || EVENT_TYPES.APPOINTMENT,
      date: action.data?.date || format(new Date(), 'yyyy-MM-dd'),
      start_time: action.data?.start_time || '09:00',
      end_time: action.data?.end_time || '10:00',
      location: action.data?.location || '',
      note: action.data?.description || '',
      priority: action.data?.priority || EVENT_PRIORITIES.MEDIUM,
      reminder: true,
    };

    const result = await createEvent(eventData);
    
    if (context.onEventCreated) {
      context.onEventCreated(result);
    }

    toast.success(`${action.type} created successfully!`);
    return `Created ${action.type} "${eventData.title}" for ${eventData.date} at ${eventData.start_time}.`;
  } catch (error) {
    Logger.error('Error creating event:', error);
    return `Sorry, I couldn't create the ${action.type}. Please try again.`;
  }
}

async function handleEventListing(action: CalendarAction, context: CalendarCommandContext): Promise<string> {
  try {
    if (!context.userId) {
      return "User authentication required to view events.";
    }

    let startDate: string | undefined;
    let endDate: string | undefined;
    const today = new Date();

    switch (action.type) {
      case 'today':
        startDate = endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'tomorrow':
        const tomorrow = addDays(today, 1);
        startDate = endDate = format(tomorrow, 'yyyy-MM-dd');
        break;
      case 'week':
        startDate = format(today, 'yyyy-MM-dd');
        endDate = format(addDays(today, 7), 'yyyy-MM-dd');
        break;
      case 'next-week':
        startDate = format(addWeeks(today, 1), 'yyyy-MM-dd');
        endDate = format(addWeeks(today, 2), 'yyyy-MM-dd');
        break;
      case 'date':
        startDate = endDate = action.date;
        break;
    }

    const result = await getEvents({
      userId: context.userId,
      startDate,
      endDate,
      limit: 10,
    });

    const events = result.data || [];
    
    if (events.length === 0) {
      const timeframe = action.type === 'today' ? 'today' : 
                      action.type === 'tomorrow' ? 'tomorrow' :
                      action.type === 'date' ? `on ${action.date}` :
                      `for the ${action.type}`;
      return `You have no events scheduled ${timeframe}.`;
    }

    const eventList = events.map(event => 
      `${event.title} at ${event.start_time} ${event.location ? `in ${event.location}` : ''}`
    ).join(', ');

    const timeframe = action.type === 'today' ? 'today' : 
                    action.type === 'tomorrow' ? 'tomorrow' :
                    action.type === 'date' ? `on ${action.date}` :
                    `for the ${action.type}`;

    return `You have ${events.length} event${events.length > 1 ? 's' : ''} ${timeframe}: ${eventList}.`;
  } catch (error) {
    Logger.error('Error listing events:', error);
    return "Sorry, I couldn't retrieve your events. Please try again.";
  }
}

async function handleEventSearch(action: CalendarAction, context: CalendarCommandContext): Promise<string> {
  try {
    if (!context.userId) {
      return "User authentication required to search events.";
    }

    if (!action.query) {
      return "What event would you like me to search for?";
    }

    const result = await getEvents({
      userId: context.userId,
      search: action.query,
      limit: 5,
    });

    const events = result.data || [];
    
    if (events.length === 0) {
      return `I couldn't find any events matching "${action.query}".`;
    }

    const eventList = events.map(event => 
      `${event.title} on ${event.date} at ${event.start_time}`
    ).join(', ');

    return `Found ${events.length} event${events.length > 1 ? 's' : ''} matching "${action.query}": ${eventList}.`;
  } catch (error) {
    Logger.error('Error searching events:', error);
    return "Sorry, I couldn't search for events. Please try again.";
  }
}

async function handleEventDeletion(action: CalendarAction, context: CalendarCommandContext): Promise<string> {
  // This would require more sophisticated event identification
  // For now, return a helpful message
  return `To delete an event, please specify which event you'd like to cancel. You can say "cancel [event name]" or use the calendar interface.`;
}

async function handleEventReschedule(action: CalendarAction, context: CalendarCommandContext): Promise<string> {
  // This would require more sophisticated event identification and date parsing
  // For now, return a helpful message
  return `To reschedule an event, please specify which event and the new date/time. You can say "reschedule [event name] to [new date/time]" or use the calendar interface.`;
}

async function handleCalendarRefresh(context: CalendarCommandContext): Promise<string> {
  if (context.onCalendarRefresh) {
    context.onCalendarRefresh();
    return "Refreshing your calendar.";
  }
  
  return "Calendar refresh is not available right now.";
}

// Export all calendar commands for integration with main voice command system
export const allCalendarCommands = {
  ...calendarNavigationCommands,
  ...calendarActionCommands,
};