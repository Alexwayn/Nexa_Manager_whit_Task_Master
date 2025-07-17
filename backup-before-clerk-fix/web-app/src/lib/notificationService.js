import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * Notification Service - Comprehensive notification system for calendar events
 *
 * Features:
 * - Multi-channel notifications (email, push, in-app, SMS)
 * - Template-based message formatting
 * - Delivery status tracking and retry logic
 * - User preference management
 * - Timezone-aware scheduling
 * - Batch processing capabilities
 */

// Notification type constants
export const NOTIFICATION_TYPES = {
  EMAIL: 'EMAIL',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP',
  SMS: 'SMS',
};

// Delivery status constants
export const DELIVERY_STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  BOUNCED: 'BOUNCED',
};

// Queue status constants
export const QUEUE_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

/**
 * Get user notification preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User notification preferences
 */
export const getUserNotificationPreferences = async (userId = null) => {
  try {
    let query = supabase.from('user_notification_preferences').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      // Not found error
      Logger.error('Error fetching notification preferences:', error);
      throw new Error(`Error retrieving preferences: ${error.message}`);
    }

    // Return default preferences if none found
    return (
      data || {
        default_reminder_minutes: [15, 60],
        email_enabled: true,
        push_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        timezone: 'UTC',
      }
    );
  } catch (error) {
    Logger.error('Error in getUserNotificationPreferences:', error);
    throw error;
  }
};

/**
 * Update user notification preferences
 * @param {Object} preferences - Updated preferences
 * @returns {Promise<Object>} Updated preferences
 */
export const updateUserNotificationPreferences = async preferences => {
  try {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .upsert(preferences, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      Logger.error('Error updating notification preferences:', error);
      throw new Error(`Error updating preferences: ${error.message}`);
    }

    return data;
  } catch (error) {
    Logger.error('Error in updateUserNotificationPreferences:', error);
    throw error;
  }
};

/**
 * Create event reminders based on user preferences and event settings
 * @param {string} eventId - Event ID
 * @param {Array} customReminders - Custom reminder configurations
 * @returns {Promise<Array>} Created reminders
 */
export const createEventReminders = async (eventId, customReminders = null) => {
  try {
    // Get user preferences
    const preferences = await getUserNotificationPreferences();

    // Use custom reminders or fall back to user defaults
    const reminderMinutes = customReminders || preferences.default_reminder_minutes || [15, 60];

    const reminders = [];

    for (const minutes of reminderMinutes) {
      // Create reminders for each enabled notification type
      const notificationTypes = [];

      if (preferences.email_enabled) notificationTypes.push(NOTIFICATION_TYPES.EMAIL);
      if (preferences.push_enabled) notificationTypes.push(NOTIFICATION_TYPES.PUSH);
      if (preferences.in_app_enabled) notificationTypes.push(NOTIFICATION_TYPES.IN_APP);
      if (preferences.sms_enabled) notificationTypes.push(NOTIFICATION_TYPES.SMS);

      for (const type of notificationTypes) {
        const { data, error } = await supabase
          .from('event_reminders')
          .insert({
            event_id: eventId,
            reminder_minutes: minutes,
            notification_type: type,
          })
          .select()
          .single();

        if (error) {
          Logger.error('Error creating reminder:', error);
          continue; // Continue with other reminders even if one fails
        }

        reminders.push(data);
      }
    }

    return reminders;
  } catch (error) {
    Logger.error('Error in createEventReminders:', error);
    throw error;
  }
};

/**
 * Schedule notifications for an event
 * @param {Object} event - Event object
 * @param {Array} reminders - Event reminders
 * @returns {Promise<Array>} Scheduled notifications
 */
export const scheduleEventNotifications = async (event, reminders = null) => {
  try {
    // Get reminders if not provided
    if (!reminders) {
      const { data, error } = await supabase
        .from('event_reminders')
        .select('*')
        .eq('event_id', event.id);

      if (error) {
        Logger.error('Error fetching reminders:', error);
        throw new Error(`Error retrieving reminders: ${error.message}`);
      }

      reminders = data || [];
    }

    const notifications = [];

    for (const reminder of reminders) {
      const notification = await scheduleNotification(event, reminder);
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  } catch (error) {
    Logger.error('Error in scheduleEventNotifications:', error);
    throw error;
  }
};

/**
 * Schedule a single notification
 * @param {Object} event - Event object
 * @param {Object} reminder - Reminder object
 * @returns {Promise<Object>} Scheduled notification
 */
export const scheduleNotification = async (event, reminder) => {
  try {
    // Calculate when to send the notification
    const eventDateTime = new Date(`${event.date}T${event.start_time || '00:00'}`);
    const scheduledFor = new Date(eventDateTime.getTime() - reminder.reminder_minutes * 60 * 1000);

    // Don't schedule notifications for past events
    if (scheduledFor < new Date()) {
      return null;
    }

    // Get user preferences for contact info
    const preferences = await getUserNotificationPreferences();

    let recipient;
    switch (reminder.notification_type) {
      case NOTIFICATION_TYPES.EMAIL:
        recipient = preferences.notification_email || 'user@example.com';
        break;
      case NOTIFICATION_TYPES.SMS:
        recipient = preferences.phone_number || '';
        break;
      case NOTIFICATION_TYPES.PUSH:
      case NOTIFICATION_TYPES.IN_APP:
        recipient = event.user_id;
        break;
      default:
        recipient = event.user_id;
    }

    // Generate notification content
    const { subject, message } = generateNotificationContent(event, reminder);

    const { data, error } = await supabase
      .from('notification_queue')
      .insert({
        user_id: event.user_id,
        event_id: event.id,
        reminder_id: reminder.id,
        notification_type: reminder.notification_type,
        recipient,
        subject,
        message,
        scheduled_for: scheduledFor.toISOString(),
      })
      .select()
      .single();

    if (error) {
      Logger.error('Error scheduling notification:', error);
      throw new Error(`Error scheduling notification: ${error.message}`);
    }

    return data;
  } catch (error) {
    Logger.error('Error in scheduleNotification:', error);
    throw error;
  }
};

/**
 * Generate notification content based on event and reminder
 * @param {Object} event - Event object
 * @param {Object} reminder - Reminder object
 * @returns {Object} Generated subject and message
 */
export const generateNotificationContent = (event, reminder) => {
  const eventTime = event.start_time ? ` at ${event.start_time}` : '';
  const reminderText = getReminderText(reminder.reminder_minutes);

  let subject, message;

  switch (reminder.notification_type) {
    case NOTIFICATION_TYPES.EMAIL:
      subject = `Reminder: ${event.title}`;
      message = `
        Hello!
        
        This is a reminder for your event:
        
        📅 ${event.title}
        📍 ${event.location || 'No location specified'}
        🕐 ${event.date}${eventTime}
        
        ${event.note ? `Notes: ${event.note}` : ''}
        
        ${reminder.custom_message || ''}
        
        Best regards,
        Your Management System
      `.trim();
      break;

    case NOTIFICATION_TYPES.SMS:
      subject = `Reminder: ${event.title}`;
      message = `Reminder: ${event.title} on ${event.date}${eventTime}${event.location ? ` at ${event.location}` : ''}`;
      break;

    case NOTIFICATION_TYPES.PUSH:
      subject = `Reminder: ${event.title}`;
      message = `${reminderText}: ${event.title}${eventTime}`;
      break;

    case NOTIFICATION_TYPES.IN_APP:
      subject = event.title;
      message = `${reminderText} for "${event.title}"${eventTime}`;
      break;

    default:
      subject = event.title;
      message = `Reminder for ${event.title}`;
  }

  return { subject, message };
};

/**
 * Get human-readable reminder text
 * @param {number} minutes - Minutes before event
 * @returns {string} Human-readable text
 */
const getReminderText = minutes => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    const days = Math.floor(minutes / 1440);
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
};

/**
 * Process pending notifications (would typically be called by a background job)
 * @param {number} limit - Maximum number of notifications to process
 * @returns {Promise<Object>} Processing results
 */
export const processPendingNotifications = async (limit = 50) => {
  try {
    // Get pending notifications that are ready to be sent
    const { data: notifications, error } = await supabase
      .from('notification_queue')
      .select(
        `
        *,
        events (
          title,
          date,
          start_time,
          location,
          note
        )
      `,
      )
      .eq('status', QUEUE_STATUS.PENDING)
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for')
      .limit(limit);

    if (error) {
      Logger.error('Error fetching pending notifications:', error);
      throw error;
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const notification of notifications) {
      try {
        // Mark as processing
        await updateNotificationStatus(notification.id, QUEUE_STATUS.PROCESSING);

        // Send the notification
        const success = await sendNotification(notification);

        if (success) {
          await updateNotificationStatus(notification.id, QUEUE_STATUS.SENT);
          results.successful++;
        } else {
          await handleNotificationFailure(notification);
          results.failed++;
        }

        results.processed++;
      } catch (error) {
        Logger.error('Error processing notification:', error);
        await handleNotificationFailure(notification, error.message);
        results.failed++;
        results.errors.push({
          notificationId: notification.id,
          error: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    Logger.error('Error in processPendingNotifications:', error);
    throw error;
  }
};

/**
 * Send a notification based on its type
 * @param {Object} notification - Notification object
 * @returns {Promise<boolean>} Success status
 */
const sendNotification = async notification => {
  switch (notification.notification_type) {
    case NOTIFICATION_TYPES.EMAIL:
      return await sendEmailNotification(notification);
    case NOTIFICATION_TYPES.SMS:
      return await sendSMSNotification(notification);
    case NOTIFICATION_TYPES.PUSH:
      return await sendPushNotification(notification);
    case NOTIFICATION_TYPES.IN_APP:
      return await sendInAppNotification(notification);
    default:
      Logger.error('Unknown notification type:', notification.notification_type);
      return false;
  }
};

/**
 * Send email notification
 * @param {Object} notification - Notification object
 * @returns {Promise<boolean>} Success status
 */
const sendEmailNotification = async notification => {
  try {
    // In a real implementation, this would integrate with an email service
    // like SendGrid, AWS SES, or Supabase's built-in email functionality

    Logger.info('Sending email notification:', {
      to: notification.recipient,
      subject: notification.subject,
      message: notification.message,
    });

    // For now, we'll simulate successful email sending
    // In production, you would integrate with your email provider here

    return true;
  } catch (error) {
    Logger.error('Error sending email notification:', error);
    return false;
  }
};

/**
 * Send SMS notification
 * @param {Object} notification - Notification object
 * @returns {Promise<boolean>} Success status
 */
const sendSMSNotification = async notification => {
  try {
    // In a real implementation, this would integrate with an SMS service
    // like Twilio, AWS SNS, or similar

    Logger.info('Sending SMS notification:', {
      to: notification.recipient,
      message: notification.message,
    });

    // For now, we'll simulate successful SMS sending
    // In production, you would integrate with your SMS provider here

    return true;
  } catch (error) {
    Logger.error('Error sending SMS notification:', error);
    return false;
  }
};

/**
 * Send push notification
 * @param {Object} notification - Notification object
 * @returns {Promise<boolean>} Success status
 */
const sendPushNotification = async notification => {
  try {
    // In a real implementation, this would integrate with a push service
    // like Firebase Cloud Messaging, Apple Push Notification service, etc.

    Logger.info('Sending push notification:', {
      to: notification.recipient,
      title: notification.subject,
      body: notification.message,
    });

    // For now, we'll simulate successful push notification sending
    // In production, you would integrate with your push notification provider here

    return true;
  } catch (error) {
    Logger.error('Error sending push notification:', error);
    return false;
  }
};

/**
 * Send in-app notification
 * @param {Object} notification - Notification object
 * @returns {Promise<boolean>} Success status
 */
const sendInAppNotification = async notification => {
  try {
    // For in-app notifications, we'll store them in a separate table
    // that the frontend can query for displaying notifications

    const { error } = await supabase.from('in_app_notifications').insert({
      user_id: notification.user_id,
      title: notification.subject,
      message: notification.message,
      event_id: notification.event_id,
      read: false,
    });

    if (error) {
      Logger.error('Error storing in-app notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    Logger.error('Error sending in-app notification:', error);
    return false;
  }
};

/**
 * Update notification status
 * @param {string} notificationId - Notification ID
 * @param {string} status - New status
 * @param {string} errorMessage - Optional error message
 * @returns {Promise<Object>} Updated notification
 */
const updateNotificationStatus = async (notificationId, status, errorMessage = null) => {
  try {
    const updates = {
      status,
      last_attempt_at: new Date().toISOString(),
    };

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    const { data, error } = await supabase
      .from('notification_queue')
      .update(updates)
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      Logger.error('Error updating notification status:', error);
      throw error;
    }

    return data;
  } catch (error) {
    Logger.error('Error in updateNotificationStatus:', error);
    throw error;
  }
};

/**
 * Handle notification failure and retry logic
 * @param {Object} notification - Failed notification
 * @param {string} errorMessage - Error message
 * @returns {Promise<void>}
 */
const handleNotificationFailure = async (notification, errorMessage = null) => {
  try {
    const attempts = (notification.attempts || 0) + 1;
    const maxAttempts = notification.max_attempts || 3;

    if (attempts >= maxAttempts) {
      // Max attempts reached, mark as failed
      await updateNotificationStatus(notification.id, QUEUE_STATUS.FAILED, errorMessage);
    } else {
      // Schedule for retry
      const retryDelay = Math.pow(2, attempts) * 60; // Exponential backoff in minutes
      const scheduledFor = new Date(Date.now() + retryDelay * 60 * 1000);

      await supabase
        .from('notification_queue')
        .update({
          status: QUEUE_STATUS.PENDING,
          attempts,
          scheduled_for: scheduledFor.toISOString(),
          error_message: errorMessage,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', notification.id);
    }
  } catch (error) {
    Logger.error('Error handling notification failure:', error);
  }
};

/**
 * Cancel scheduled notifications for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<number>} Number of cancelled notifications
 */
export const cancelEventNotifications = async eventId => {
  try {
    const { data, error } = await supabase
      .from('notification_queue')
      .update({ status: QUEUE_STATUS.CANCELLED })
      .eq('event_id', eventId)
      .in('status', [QUEUE_STATUS.PENDING, QUEUE_STATUS.PROCESSING])
      .select('id');

    if (error) {
      Logger.error('Error cancelling notifications:', error);
      throw error;
    }

    return data ? data.length : 0;
  } catch (error) {
    Logger.error('Error in cancelEventNotifications:', error);
    throw error;
  }
};

/**
 * Get notification statistics for a user
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise<Object>} Notification statistics
 */
export const getNotificationStatistics = async (userId = null) => {
  try {
    let query = supabase.from('notification_queue').select('status, notification_type, created_at');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      Logger.error('Error fetching notification statistics:', error);
      throw error;
    }

    const stats = {
      total: data.length,
      byStatus: {},
      byType: {},
      recent: data.filter(
        n => new Date(n.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      ).length,
    };

    data.forEach(notification => {
      stats.byStatus[notification.status] = (stats.byStatus[notification.status] || 0) + 1;
      stats.byType[notification.notification_type] =
        (stats.byType[notification.notification_type] || 0) + 1;
    });

    return stats;
  } catch (error) {
    Logger.error('Error in getNotificationStatistics:', error);
    throw error;
  }
};
