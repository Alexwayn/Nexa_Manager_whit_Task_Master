import { supabase } from '@lib/supabaseClient';
import { createEvent } from './eventService';
import {
  sendEventNotification,
  sendEventReminder,
  sendEventCancellation,
} from '@shared/services';
import Logger from '@shared/utils/logger';

/**
 * Recurring Events Service - Advanced Recurring Event Management
 *
 * Features:
 * - RFC 5545 compliant recurrence rules
 * - Complex recurring patterns (nth weekday, exclusions)
 * - Timezone-aware scheduling
 * - Efficient instance generation
 * - Exception handling for recurring series
 * - Integration with notification system
 */

// Recurrence frequency constants
export const RECURRENCE_FREQUENCY = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
};

// End type constants for recurring events
export const END_TYPE = {
  NEVER: 'NEVER',
  COUNT: 'COUNT',
  DATE: 'DATE',
};

// Weekday constants for recurrence rules (RFC 5545 standard)
export const WEEKDAYS = {
  MONDAY: 'MO',
  TUESDAY: 'TU',
  WEDNESDAY: 'WE',
  THURSDAY: 'TH',
  FRIDAY: 'FR',
  SATURDAY: 'SA',
  SUNDAY: 'SU',
};

/**
 * Create a recurrence rule for recurring events
 * @param {Object} ruleData - Recurrence rule configuration
 * @returns {Promise<Object>} Created recurrence rule
 */
export const createRecurrenceRule = async ruleData => {
  try {
    const {
      frequency,
      interval = 1,
      byDay = null,
      byMonthDay = null,
      byMonth = null,
      bySetPos = null,
      endType = END_TYPE.NEVER,
      endCount = null,
      endDate = null,
      exceptionDates = [],
    } = ruleData;

    // Validate required fields
    if (!Object.values(RECURRENCE_FREQUENCY).includes(frequency)) {
      throw new Error('Invalid recurrence frequency specified');
    }

    if (endType === END_TYPE.COUNT && (!endCount || endCount < 1)) {
      throw new Error('Occurrence count must be greater than 0');
    }

    if (endType === END_TYPE.DATE && !endDate) {
      throw new Error('End date is required when specifying date-based termination');
    }

    const { data, error } = await supabase
      .from('recurrence_rules')
      .insert({
        frequency,
        interval_value: interval,
        by_day: byDay,
        by_month_day: byMonthDay,
        by_month: byMonth,
        by_set_pos: bySetPos,
        end_type: endType,
        end_count: endCount,
        end_date: endDate,
        exception_dates: exceptionDates,
      })
      .select()
      .single();

    if (error) {
      Logger.error('Error creating recurrence rule:', error);
      throw new Error(`Unable to create recurrence rule: ${error.message}`);
    }

    return data;
  } catch (error) {
    Logger.error('Error in createRecurrenceRule:', error);
    throw error;
  }
};

/**
 * Create a recurring event with automatically generated instances
 * @param {Object} eventData - Base event data
 * @param {Object} recurrenceConfig - Recurrence configuration
 * @param {Object} options - Additional options for event creation
 * @returns {Promise<Object>} Created recurring event and instances
 */
export const createRecurringEvent = async (eventData, recurrenceConfig, options = {}) => {
  try {
    const { generateInstances = true, maxInstances = 100, reminderMinutes = null } = options;

    // Create the recurrence rule first
    const recurrenceRule = await createRecurrenceRule(recurrenceConfig);

    // Create the parent event with recurrence rule reference
    const parentEventData = {
      ...eventData,
      recurrence_rule_id: recurrenceRule.id,
      timezone: eventData.timezone || 'UTC',
    };

    const parentEvent = await createEvent(parentEventData);

    // Set up reminders and notifications for the parent event
    if (reminderMinutes) {
      await createEventReminders(parentEvent.id, reminderMinutes);
      await scheduleEventNotifications(parentEvent);
    }

    let instances = [];

    if (generateInstances) {
      // Generate recurring instances based on the rule
      instances = await generateRecurringInstances(parentEvent, recurrenceRule, { maxInstances });

      // Set up notifications for each generated instance
      for (const instance of instances) {
        if (reminderMinutes) {
          await createEventReminders(instance.id, reminderMinutes);
          await scheduleEventNotifications(instance);
        }
      }
    }

    return {
      parentEvent,
      recurrenceRule,
      instances,
      totalInstances: instances.length,
    };
  } catch (error) {
    Logger.error('Error in createRecurringEvent:', error);
    throw error;
  }
};

/**
 * Generate recurring event instances based on recurrence rule
 * @param {Object} parentEvent - Parent event object
 * @param {Object} recurrenceRule - Recurrence rule object
 * @param {Object} options - Generation options
 * @returns {Promise<Array>} Generated event instances
 */
export const generateRecurringInstances = async (parentEvent, recurrenceRule, options = {}) => {
  try {
    const { maxInstances = 100, startDate = null, endDate = null } = options;

    const instances = [];
    const baseDate = new Date(parentEvent.date);
    const timezone = parentEvent.timezone || 'UTC';

    // Calculate generation bounds
    const generationStart = startDate ? new Date(startDate) : new Date(baseDate);
    const generationEnd = endDate ? new Date(endDate) : null;

    let currentDate = new Date(generationStart);
    let instanceCount = 0;

    // Maximum safety limit to prevent infinite loops
    const safetyLimit = Math.min(maxInstances, 1000);

    while (instanceCount < safetyLimit) {
      // Check end conditions based on recurrence rule
      if (recurrenceRule.end_type === END_TYPE.COUNT && instanceCount >= recurrenceRule.end_count) {
        break;
      }

      if (
        recurrenceRule.end_type === END_TYPE.DATE &&
        currentDate > new Date(recurrenceRule.end_date)
      ) {
        break;
      }

      if (generationEnd && currentDate > generationEnd) {
        break;
      }

      // Skip if date is in exception list
      const dateString = currentDate.toISOString().split('T')[0];
      if (recurrenceRule.exception_dates && recurrenceRule.exception_dates.includes(dateString)) {
        currentDate = getNextRecurrenceDate(currentDate, recurrenceRule);
        continue;
      }

      // Skip the first occurrence if it's the same as the parent event date
      if (instanceCount === 0 && dateString === parentEvent.date) {
        currentDate = getNextRecurrenceDate(currentDate, recurrenceRule);
        instanceCount++;
        continue;
      }

      // Create instance data based on parent event
      const instanceData = {
        ...parentEvent,
        id: undefined, // Let database generate new ID
        parent_event_id: parentEvent.id,
        instance_date: dateString,
        date: dateString,
        title: `${parentEvent.title}`,
        recurrence_rule_id: null, // Instances don't have their own recurrence rules
      };

      // Remove fields that shouldn't be copied to instances
      delete instanceData.created_at;
      delete instanceData.updated_at;

      const instance = await createEvent(instanceData);
      instances.push(instance);

      instanceCount++;
      currentDate = getNextRecurrenceDate(currentDate, recurrenceRule);
    }

    return instances;
  } catch (error) {
    Logger.error('Error in generateRecurringInstances:', error);
    throw error;
  }
};

/**
 * Calculate the next occurrence date based on recurrence rule
 * @param {Date} currentDate - Current date
 * @param {Object} recurrenceRule - Recurrence rule
 * @returns {Date} Next occurrence date
 */
const getNextRecurrenceDate = (currentDate, recurrenceRule) => {
  const nextDate = new Date(currentDate);
  const interval = recurrenceRule.interval_value || 1;

  switch (recurrenceRule.frequency) {
    case RECURRENCE_FREQUENCY.DAILY:
      return calculateDailyRecurrence(nextDate, interval);

    case RECURRENCE_FREQUENCY.WEEKLY:
      return calculateWeeklyRecurrence(nextDate, interval, recurrenceRule.by_day);

    case RECURRENCE_FREQUENCY.MONTHLY:
      return calculateMonthlyRecurrence(nextDate, interval, recurrenceRule);

    case RECURRENCE_FREQUENCY.YEARLY:
      return calculateYearlyRecurrence(nextDate, interval, recurrenceRule);

    default:
      throw new Error('Unsupported recurrence frequency');
  }
};

/**
 * Calculate next daily recurrence
 * @param {Date} date - Current date
 * @param {number} interval - Day interval
 * @returns {Date} Next occurrence
 */
const calculateDailyRecurrence = (date, interval) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + interval);
  return nextDate;
};

/**
 * Calculate next weekly recurrence
 * @param {Date} date - Current date
 * @param {number} interval - Week interval
 * @param {Array} byDay - Specific weekdays for recurrence
 * @returns {Date} Next occurrence
 */
const calculateWeeklyRecurrence = (date, interval, byDay) => {
  if (!byDay || byDay.length === 0) {
    // Simple weekly recurrence - same day of week
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 7 * interval);
    return nextDate;
  }

  // Complex weekly recurrence with specific days
  const dayMapping = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
  };

  const targetDays = byDay.map(day => dayMapping[day]).sort((a, b) => a - b);
  const currentDayOfWeek = date.getDay();

  // Find next occurrence within current week
  for (const targetDay of targetDays) {
    if (targetDay > currentDayOfWeek) {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + (targetDay - currentDayOfWeek));
      return nextDate;
    }
  }

  // No more occurrences this week, move to next interval
  const nextDate = new Date(date);
  const daysUntilNextWeek = 7 - currentDayOfWeek + targetDays[0] + 7 * (interval - 1);
  nextDate.setDate(nextDate.getDate() + daysUntilNextWeek);
  return nextDate;
};

/**
 * Calculate next monthly recurrence
 * @param {Date} date - Current date
 * @param {number} interval - Month interval
 * @param {Object} rule - Recurrence rule with monthly options
 * @returns {Date} Next occurrence
 */
const calculateMonthlyRecurrence = (date, interval, rule) => {
  const nextDate = new Date(date);

  if (rule.by_month_day && rule.by_month_day.length > 0) {
    // Recurrence by specific days of month
    const currentDay = nextDate.getDate();
    const targetDays = rule.by_month_day.sort((a, b) => a - b);

    // Find next occurrence within current month
    for (const targetDay of targetDays) {
      if (targetDay > currentDay) {
        nextDate.setDate(targetDay);
        return nextDate;
      }
    }

    // Move to next interval month
    nextDate.setMonth(nextDate.getMonth() + interval);
    nextDate.setDate(targetDays[0]);
    return nextDate;
  }

  if (rule.by_day && rule.by_set_pos) {
    // Recurrence by nth weekday of month (e.g., 2nd Tuesday)
    return calculateNthWeekdayOfMonth(nextDate, interval, rule.by_day[0], rule.by_set_pos[0]);
  }

  // Simple monthly recurrence - same day of month
  nextDate.setMonth(nextDate.getMonth() + interval);
  return nextDate;
};

/**
 * Calculate next yearly recurrence
 * @param {Date} date - Current date
 * @param {number} interval - Year interval
 * @param {Object} rule - Recurrence rule with yearly options
 * @returns {Date} Next occurrence
 */
const calculateYearlyRecurrence = (date, interval, rule) => {
  const nextDate = new Date(date);

  if (rule.by_month && rule.by_month.length > 0) {
    // Recurrence in specific months
    const currentMonth = nextDate.getMonth() + 1;
    const targetMonths = rule.by_month.sort((a, b) => a - b);

    // Find next occurrence within current year
    for (const targetMonth of targetMonths) {
      if (targetMonth > currentMonth) {
        nextDate.setMonth(targetMonth - 1);
        return nextDate;
      }
    }

    // Move to next interval year
    nextDate.setFullYear(nextDate.getFullYear() + interval);
    nextDate.setMonth(targetMonths[0] - 1);
    return nextDate;
  }

  // Simple yearly recurrence - same date next year
  nextDate.setFullYear(nextDate.getFullYear() + interval);
  return nextDate;
};

/**
 * Calculate nth weekday of month (e.g., 2nd Tuesday, last Friday)
 * @param {Date} date - Current date
 * @param {number} interval - Month interval
 * @param {string} weekday - Target weekday (MO, TU, etc.)
 * @param {number} setPos - Position (-1 for last, 1 for first, etc.)
 * @returns {Date} Next occurrence
 */
const calculateNthWeekdayOfMonth = (date, interval, weekday, setPos) => {
  const dayMapping = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
  };

  const targetDayOfWeek = dayMapping[weekday];
  const nextDate = new Date(date);

  // Move to next interval month
  nextDate.setMonth(nextDate.getMonth() + interval);

  if (setPos === -1) {
    // Last occurrence of weekday in month
    nextDate.setMonth(nextDate.getMonth() + 1, 0); // Last day of month

    while (nextDate.getDay() !== targetDayOfWeek) {
      nextDate.setDate(nextDate.getDate() - 1);
    }
  } else {
    // Nth occurrence of weekday in month
    nextDate.setDate(1); // First day of month

    // Find first occurrence of target weekday
    while (nextDate.getDay() !== targetDayOfWeek) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    // Move to nth occurrence
    nextDate.setDate(nextDate.getDate() + 7 * (setPos - 1));
  }

  return nextDate;
};

/**
 * Update a recurring event and its instances
 * @param {string} eventId - Parent event ID
 * @param {Object} updates - Updates to apply
 * @param {Object} options - Update options
 * @returns {Promise<Object>} Update results
 */
export const updateRecurringEvent = async (eventId, updates, options = {}) => {
  try {
    const {
      updateInstances = true,
      regenerateInstances = false,
      updateFutureOnly = false,
    } = options;

    // Get the parent event with recurrence rule
    const { data: parentEvent, error: parentError } = await supabase
      .from('events')
      .select(
        `
        *,
        recurrence_rules (*)
      `,
      )
      .eq('id', eventId)
      .single();

    if (parentError) {
      Logger.error('Error fetching parent event:', parentError);
      throw new Error(`Unable to retrieve event: ${parentError.message}`);
    }

    if (!parentEvent.recurrence_rule_id) {
      throw new Error('This event is not a recurring event');
    }

    // Update parent event
    const { data: updatedParent, error: updateError } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      Logger.error('Error updating parent event:', updateError);
      throw new Error(`Unable to update event: ${updateError.message}`);
    }

    let updatedInstances = [];

    if (updateInstances) {
      if (regenerateInstances) {
        // Delete existing instances and regenerate
        await deleteRecurringInstances(eventId);
        updatedInstances = await generateRecurringInstances(
          updatedParent,
          parentEvent.recurrence_rules,
        );
      } else {
        // Update existing instances
        let query = supabase.from('events').update(updates).eq('parent_event_id', eventId);

        if (updateFutureOnly) {
          query = query.gte('date', new Date().toISOString().split('T')[0]);
        }

        const { data: instances, error: instanceError } = await query.select();

        if (instanceError) {
          Logger.error('Error updating instances:', instanceError);
          throw new Error(`Unable to update event instances: ${instanceError.message}`);
        }

        updatedInstances = instances || [];
      }
    }

    return {
      parentEvent: updatedParent,
      updatedInstances,
      totalUpdated: updatedInstances.length,
    };
  } catch (error) {
    Logger.error('Error in updateRecurringEvent:', error);
    throw error;
  }
};

/**
 * Delete recurring event instances
 * @param {string} parentEventId - Parent event ID
 * @param {Object} options - Deletion options
 * @returns {Promise<number>} Number of deleted instances
 */
export const deleteRecurringInstances = async (parentEventId, options = {}) => {
  try {
    const { futureOnly = false } = options;

    let query = supabase.from('events').delete().eq('parent_event_id', parentEventId);

    if (futureOnly) {
      query = query.gte('date', new Date().toISOString().split('T')[0]);
    }

    const { data, error } = await query.select('id');

    if (error) {
      Logger.error('Error deleting instances:', error);
      throw new Error(`Unable to delete event instances: ${error.message}`);
    }

    return data ? data.length : 0;
  } catch (error) {
    Logger.error('Error in deleteRecurringInstances:', error);
    throw error;
  }
};

/**
 * Add exception date to recurring event (exclude specific occurrence)
 * @param {string} eventId - Parent event ID
 * @param {string} exceptionDate - Date to exclude (YYYY-MM-DD)
 * @returns {Promise<Object>} Updated recurrence rule
 */
export const addExceptionDate = async (eventId, exceptionDate) => {
  try {
    // Get current recurrence rule
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('recurrence_rule_id, recurrence_rules!inner(*)')
      .eq('id', eventId)
      .single();

    if (eventError) {
      Logger.error('Error fetching event:', eventError);
      throw new Error(`Unable to retrieve event: ${eventError.message}`);
    }

    const currentExceptions = event.recurrence_rules.exception_dates || [];
    const updatedExceptions = [...currentExceptions, exceptionDate];

    // Update recurrence rule with new exception
    const { data, error } = await supabase
      .from('recurrence_rules')
      .update({ exception_dates: updatedExceptions })
      .eq('id', event.recurrence_rule_id)
      .select()
      .single();

    if (error) {
      Logger.error('Error updating recurrence rule:', error);
      throw new Error(`Unable to update recurrence rule: ${error.message}`);
    }

    // Delete the instance for this date if it exists
    await supabase
      .from('events')
      .delete()
      .eq('parent_event_id', eventId)
      .eq('instance_date', exceptionDate);

    return data;
  } catch (error) {
    Logger.error('Error in addExceptionDate:', error);
    throw error;
  }
};

/**
 * Get recurring event instances for a specific date range
 * @param {string} parentEventId - Parent event ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Event instances within the date range
 */
export const getRecurringInstances = async (parentEventId, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('parent_event_id', parentEventId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) {
      Logger.error('Error fetching instances:', error);
      throw new Error(`Unable to retrieve event instances: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    Logger.error('Error in getRecurringInstances:', error);
    throw error;
  }
};

/**
 * Get all events in a recurring series (parent + all instances)
 * @param {string} parentEventId - Parent event ID
 * @returns {Promise<Object>} Complete recurring event data
 */
export const getRecurringSeries = async parentEventId => {
  try {
    // Get parent event with recurrence rule
    const { data: parentEvent, error: parentError } = await supabase
      .from('events')
      .select(
        `
        *,
        recurrence_rules (*)
      `,
      )
      .eq('id', parentEventId)
      .single();

    if (parentError) {
      Logger.error('Error fetching parent event:', parentError);
      throw new Error(`Unable to retrieve event: ${parentError.message}`);
    }

    // Get all instances
    const { data: instances, error: instanceError } = await supabase
      .from('events')
      .select('*')
      .eq('parent_event_id', parentEventId)
      .order('date');

    if (instanceError) {
      Logger.error('Error fetching instances:', instanceError);
      throw new Error(`Unable to retrieve event instances: ${instanceError.message}`);
    }

    return {
      parentEvent,
      recurrenceRule: parentEvent.recurrence_rules,
      instances: instances || [],
      totalInstances: instances ? instances.length : 0,
    };
  } catch (error) {
    Logger.error('Error in getRecurringSeries:', error);
    throw error;
  }
};
