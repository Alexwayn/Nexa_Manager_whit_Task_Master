import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * Event Service - Comprehensive data service for calendar events
 *
 * Features:
 * - Full CRUD operations for events
 * - Recurring event patterns and generation
 * - Event reminders and notifications
 * - Integration with clients, quotes, and invoices
 * - Advanced search and filtering
 * - Event statistics and reporting
 */

// Event type constants
export const EVENT_TYPES = {
  APPOINTMENT: 'appointment',
  QUOTE: 'quote',
  INVOICE: 'invoice',
  INCOME: 'income',
  EXPENSE: 'expense',
  REMINDER: 'reminder',
};

// Event priority constants
export const EVENT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

// Recurring pattern constants
export const RECURRENCE_PATTERNS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

// Reminder types
export const REMINDER_TYPES = {
  PUSH: 'push',
  EMAIL: 'email',
  BOTH: 'both',
};

/**
 * Get all events for the current user with optional filtering
 * @param {Object} options - Filtering and pagination options
 * @returns {Promise<Object>} Events data with pagination info
 */
export const getEvents = async (options = {}) => {
  try {
    const {
      startDate,
      endDate,
      type,
      clientId,
      priority,
      search,
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'asc',
    } = options;

    let query = supabase.from('events').select(`
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `);

    // Date range filtering
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Type filtering
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    // Client filtering
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Priority filtering
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    // Search functionality
    if (search) {
      query = query.or(`title.ilike.%${search}%,note.ilike.%${search}%,location.ilike.%${search}%`);
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      Logger.error('Error fetching events:', error);
      throw new Error(`Error fetching events: ${error.message}`);
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    Logger.error('Error in getEvents:', error);
    throw error;
  }
};

/**
 * Get events for a specific date range (used by calendar views)
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of events
 */
export const getEventsForDateRange = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(
        `
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `,
      )
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('start_time');

    if (error) {
      Logger.error('Error fetching events for date range:', error);
      throw new Error(`Error fetching events: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    Logger.error('Error in getEventsForDateRange:', error);
    throw error;
  }
};

/**
 * Get a single event by ID
 * @param {string} id - Event ID
 * @returns {Promise<Object>} Event data
 */
export const getEvent = async id => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(
        `
        *,
        clients (
          id,
          name,
          email,
          phone,
          address,
          city,
          postal_code,
          province
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      Logger.error('Error fetching event:', error);
      throw new Error(`Error fetching event: ${error.message}`);
    }

    return data;
  } catch (error) {
    Logger.error('Error in getEvent:', error);
    throw error;
  }
};

/**
 * Create a new event
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Created event
 */
export const createEvent = async eventData => {
  try {
    // Validate required fields
    const requiredFields = ['title', 'type', 'date'];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }

    // Validate event type
    if (!Object.values(EVENT_TYPES).includes(eventData.type)) {
      throw new Error('Invalid event type');
    }

    // Validate priority
    if (eventData.priority && !Object.values(EVENT_PRIORITIES).includes(eventData.priority)) {
      throw new Error('Invalid priority');
    }

    // Format the event data
    const formattedEvent = {
      ...eventData,
      priority: eventData.priority || EVENT_PRIORITIES.MEDIUM,
      color: eventData.color || getDefaultColorForType(eventData.type),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('events')
      .insert([formattedEvent])
      .select(
        `
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `,
      )
      .single();

    if (error) {
      Logger.error('Error creating event:', error);
      throw new Error(`Error creating event: ${error.message}`);
    }

    return data;
  } catch (error) {
    Logger.error('Error in createEvent:', error);
    throw error;
  }
};

/**
 * Update an existing event
 * @param {string} id - Event ID
 * @param {Object} updates - Event updates
 * @returns {Promise<Object>} Updated event
 */
export const updateEvent = async (id, updates) => {
  try {
    // Validate event type if provided
    if (updates.type && !Object.values(EVENT_TYPES).includes(updates.type)) {
      throw new Error('Invalid event type');
    }

    // Validate priority if provided
    if (updates.priority && !Object.values(EVENT_PRIORITIES).includes(updates.priority)) {
      throw new Error('Invalid priority');
    }

    const formattedUpdates = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('events')
      .update(formattedUpdates)
      .eq('id', id)
      .select(
        `
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `,
      )
      .single();

    if (error) {
      Logger.error('Error updating event:', error);
      throw new Error(`Error updating event: ${error.message}`);
    }

    return data;
  } catch (error) {
    Logger.error('Error in updateEvent:', error);
    throw error;
  }
};

/**
 * Delete an event
 * @param {string} id - Event ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteEvent = async id => {
  try {
    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) {
      Logger.error('Error deleting event:', error);
      throw new Error(`Error deleting event: ${error.message}`);
    }

    return true;
  } catch (error) {
    Logger.error('Error in deleteEvent:', error);
    throw error;
  }
};

/**
 * Duplicate an event
 * @param {string} id - Event ID to duplicate
 * @param {Object} modifications - Optional modifications for the duplicate
 * @returns {Promise<Object>} Duplicated event
 */
export const duplicateEvent = async (id, modifications = {}) => {
  try {
    // Get the original event
    const originalEvent = await getEvent(id);

    // Remove ID and timestamps, apply modifications
    const { id: _, created_at, updated_at, ...eventData } = originalEvent;
    const duplicateData = {
      ...eventData,
      ...modifications,
      title: modifications.title || `${originalEvent.title} (Copy)`,
    };

    return await createEvent(duplicateData);
  } catch (error) {
    Logger.error('Error in duplicateEvent:', error);
    throw error;
  }
};

/**
 * Create recurring events based on pattern
 * @param {Object} eventData - Base event data
 * @param {Object} recurrencePattern - Recurrence configuration
 * @returns {Promise<Array>} Created recurring events
 */
export const createRecurringEvents = async (eventData, recurrencePattern) => {
  try {
    const { pattern, interval = 1, endDate, count } = recurrencePattern;

    if (!Object.values(RECURRENCE_PATTERNS).includes(pattern)) {
      throw new Error('Invalid recurrence pattern');
    }

    const events = [];
    const startDate = new Date(eventData.date);
    let currentDate = new Date(startDate);
    let eventCount = 0;

    // Maximum safety limit
    const maxEvents = count || 100;

    while (eventCount < maxEvents) {
      // Check end date condition
      if (endDate && currentDate > new Date(endDate)) {
        break;
      }

      // Create event for current date
      const eventForDate = {
        ...eventData,
        date: currentDate.toISOString().split('T')[0],
        title: eventCount === 0 ? eventData.title : `${eventData.title} (${eventCount + 1})`,
      };

      const createdEvent = await createEvent(eventForDate);
      events.push(createdEvent);

      eventCount++;

      // Calculate next date based on pattern
      currentDate = calculateNextRecurrenceDate(currentDate, pattern, interval);
    }

    return events;
  } catch (error) {
    Logger.error('Error in createRecurringEvents:', error);
    throw error;
  }
};

/**
 * Calculate next date for recurring event
 * @param {Date} currentDate - Current date
 * @param {string} pattern - Recurrence pattern
 * @param {number} interval - Interval multiplier
 * @returns {Date} Next occurrence date
 */
const calculateNextRecurrenceDate = (currentDate, pattern, interval) => {
  const nextDate = new Date(currentDate);

  switch (pattern) {
    case RECURRENCE_PATTERNS.DAILY:
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case RECURRENCE_PATTERNS.WEEKLY:
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      break;
    case RECURRENCE_PATTERNS.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    default:
      throw new Error('Unsupported recurrence pattern');
  }

  return nextDate;
};

/**
 * Get events statistics
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} Statistics data
 */
export const getEventStatistics = async (options = {}) => {
  try {
    const { startDate, endDate } = options;

    let query = supabase.from('events').select('type, priority, date');

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      Logger.error('Error fetching event statistics:', error);
      throw new Error(`Error fetching statistics: ${error.message}`);
    }

    // Calculate statistics
    const total = data.length;
    const byType = {};
    const byPriority = {};

    data.forEach(event => {
      // Count by type
      byType[event.type] = (byType[event.type] || 0) + 1;

      // Count by priority
      byPriority[event.priority] = (byPriority[event.priority] || 0) + 1;
    });

    return {
      total,
      byType,
      byPriority,
    };
  } catch (error) {
    Logger.error('Error in getEventStatistics:', error);
    throw error;
  }
};

/**
 * Search events with advanced filtering
 * @param {Object} searchOptions - Search parameters
 * @returns {Promise<Array>} Filtered events
 */
export const searchEvents = async (searchOptions = {}) => {
  try {
    const {
      query: searchQuery,
      type,
      priority,
      clientId,
      startDate,
      endDate,
      hasReminder,
      limit = 50,
    } = searchOptions;

    let query = supabase.from('events').select(`
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `);

    // Text search
    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,note.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`,
      );
    }

    // Filter by type
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    // Filter by client
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Date range
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Filter by reminder
    if (hasReminder !== undefined) {
      query = query.eq('reminder', hasReminder);
    }

    // Apply limit and order
    query = query
      .order('date', { ascending: false })
      .order('start_time', { ascending: true })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      Logger.error('Error searching events:', error);
      throw new Error(`Error searching events: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    Logger.error('Error in searchEvents:', error);
    throw error;
  }
};

/**
 * Get events for a specific client
 * @param {string} clientId - Client ID
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Client events
 */
export const getClientEvents = async (clientId, options = {}) => {
  try {
    const { startDate, endDate, limit = 50 } = options;

    let query = supabase
      .from('events')
      .select(
        `
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `,
      )
      .eq('client_id', clientId);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    query = query.order('date', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      Logger.error('Error fetching client events:', error);
      throw new Error(`Error fetching client events: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    Logger.error('Error in getClientEvents:', error);
    throw error;
  }
};

/**
 * Get upcoming events with reminders
 * @param {number} hoursAhead - Hours to look ahead for reminders
 * @returns {Promise<Array>} Events with upcoming reminders
 */
export const getUpcomingReminders = async (hoursAhead = 24) => {
  try {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('events')
      .select(
        `
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `,
      )
      .eq('reminder', true)
      .gte('date', now.toISOString().split('T')[0])
      .lte('date', futureTime.toISOString().split('T')[0])
      .order('date')
      .order('start_time');

    if (error) {
      Logger.error('Error fetching upcoming reminders:', error);
      throw new Error(`Error fetching reminders: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    Logger.error('Error in getUpcomingReminders:', error);
    throw error;
  }
};

/**
 * Get default color for event type
 * @param {string} type - Event type
 * @returns {string} Hex color code
 */
export const getDefaultColorForType = type => {
  const colorMap = {
    [EVENT_TYPES.APPOINTMENT]: '#3B82F6', // Blue
    [EVENT_TYPES.QUOTE]: '#F59E0B', // Amber
    [EVENT_TYPES.INVOICE]: '#10B981', // Emerald
    [EVENT_TYPES.INCOME]: '#059669', // Green
    [EVENT_TYPES.EXPENSE]: '#DC2626', // Red
    [EVENT_TYPES.REMINDER]: '#8B5CF6', // Purple
  };

  return colorMap[type] || '#6B7280'; // Default gray
};

/**
 * Validate event time slot availability
 * @param {string} date - Event date
 * @param {string} startTime - Start time
 * @param {string} endTime - End time
 * @param {string} excludeEventId - Event ID to exclude from check (for updates)
 * @returns {Promise<boolean>} Whether the time slot is available
 */
export const validateTimeSlotAvailability = async (
  date,
  startTime,
  endTime,
  excludeEventId = null,
) => {
  try {
    if (!startTime || !endTime) {
      return true; // All-day events or events without time don't conflict
    }

    let query = supabase
      .from('events')
      .select('id, start_time, end_time')
      .eq('date', date)
      .not('start_time', 'is', null)
      .not('end_time', 'is', null);

    if (excludeEventId) {
      query = query.neq('id', excludeEventId);
    }

    const { data, error } = await query;

    if (error) {
      Logger.error('Error checking time slot availability:', error);
      return true; // Allow creation if check fails
    }

    // Check for time conflicts
    for (const event of data) {
      if (timeRangesOverlap(startTime, endTime, event.start_time, event.end_time)) {
        return false; // Conflict found
      }
    }

    return true; // No conflicts
  } catch (error) {
    Logger.error('Error in validateTimeSlotAvailability:', error);
    return true; // Allow creation if check fails
  }
};

/**
 * Check if two time ranges overlap
 * @param {string} start1 - Start time of first range (HH:MM format)
 * @param {string} end1 - End time of first range (HH:MM format)
 * @param {string} start2 - Start time of second range (HH:MM format)
 * @param {string} end2 - End time of second range (HH:MM format)
 * @returns {boolean} Whether the ranges overlap
 */
const timeRangesOverlap = (start1, end1, start2, end2) => {
  const startTime1 = new Date(`2000-01-01T${start1}`);
  const endTime1 = new Date(`2000-01-01T${end1}`);
  const startTime2 = new Date(`2000-01-01T${start2}`);
  const endTime2 = new Date(`2000-01-01T${end2}`);

  return startTime1 < endTime2 && endTime1 > startTime2;
};

/**
 * Format event for display
 * @param {Object} event - Event object
 * @returns {Object} Formatted event
 */
export const formatEventForDisplay = event => {
  const typeLabels = {
    [EVENT_TYPES.APPOINTMENT]: 'Appointment',
    [EVENT_TYPES.QUOTE]: 'Quote',
    [EVENT_TYPES.INVOICE]: 'Invoice',
    [EVENT_TYPES.INCOME]: 'Income',
    [EVENT_TYPES.EXPENSE]: 'Expense',
    [EVENT_TYPES.REMINDER]: 'Reminder',
  };

  const priorityLabels = {
    [EVENT_PRIORITIES.LOW]: 'Low',
    [EVENT_PRIORITIES.MEDIUM]: 'Medium',
    [EVENT_PRIORITIES.HIGH]: 'High',
  };

  return {
    ...event,
    typeLabel: typeLabels[event.type] || event.type,
    priorityLabel: priorityLabels[event.priority] || event.priority,
    formattedDate: new Date(event.date).toLocaleDateString('en-US'),
    formattedTime:
      event.start_time && event.end_time ? `${event.start_time} - ${event.end_time}` : 'All day',
  };
};

export default {
  // CRUD operations
  getEvents,
  getEventsForDateRange,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  duplicateEvent,

  // Recurring events
  createRecurringEvents,

  // Search and filtering
  searchEvents,
  getClientEvents,

  // Statistics and reporting
  getEventStatistics,

  // Reminders
  getUpcomingReminders,

  // Utilities
  validateTimeSlotAvailability,
  formatEventForDisplay,
  getDefaultColorForType,

  // Constants
  EVENT_TYPES,
  EVENT_PRIORITIES,
  RECURRENCE_PATTERNS,
  REMINDER_TYPES,
};
