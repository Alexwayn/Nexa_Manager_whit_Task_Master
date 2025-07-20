import { supabase } from '@lib/supabaseClient';
import emailService from '@lib/emailService';
import Logger from '@utils/Logger';

/**
 * Event Invitation Service - Handles invitations, RSVP, and attendee management
 *
 * Features:
 * - Send event invitations via email/SMS
 * - Track RSVP responses
 * - Manage attendee lists
 * - Handle event comments and attachments
 * - Generate secure RSVP links
 */

export class EventInvitationService {
  // ==================== INVITATION MANAGEMENT ====================

  /**
   * Create and send event invitations
   * @param {string} eventId - Event ID
   * @param {Array} invitees - Array of invitee objects
   * @param {Object} options - Invitation options
   * @returns {Promise<Object>}
   */
  static async sendInvitations(eventId, invitees, options = {}) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select(
          `
          *,
          clients (full_name, email, phone)
        `,
        )
        .eq('id', eventId)
        .eq('user_id', user.id)
        .single();

      if (eventError || !event) {
        throw new Error('Event not found');
      }

      const results = [];
      const errors = [];

      for (const invitee of invitees) {
        try {
          // Create invitation record
          const invitationData = {
            event_id: eventId,
            invitee_email: invitee.email,
            invitee_name: invitee.name,
            invitee_phone: invitee.phone,
            invitee_type: invitee.type || 'external',
            client_id: invitee.client_id || null,
            invitation_message: options.message || '',
            invitation_method: options.method || 'email',
            created_by: user.id,
          };

          const { data: invitation, error: invitationError } = await supabase
            .from('event_invitations')
            .insert([invitationData])
            .select()
            .single();

          if (invitationError) {
            throw new Error(`Failed to create invitation: ${invitationError.message}`);
          }

          // Send invitation based on method
          if (options.method === 'email') {
            await this.sendEmailInvitation(event, invitation, options);
          } else if (options.method === 'sms') {
            await this.sendSMSInvitation(event, invitation, options);
          }

          // Update invitation as sent
          await supabase
            .from('event_invitations')
            .update({
              invitation_sent_at: new Date().toISOString(),
            })
            .eq('id', invitation.id);

          results.push({
            success: true,
            invitation: invitation,
            invitee: invitee,
          });
        } catch (error) {
          Logger.error(`Error sending invitation to ${invitee.email}:`, String(error?.message || error || 'Unknown error'));
          errors.push({
            invitee: invitee,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        results: results,
        errors: errors,
        summary: {
          total: invitees.length,
          sent: results.length,
          failed: errors.length,
        },
      };
    } catch (error) {
      Logger.error('Error in sendInvitations:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send email invitation
   * @param {Object} event - Event data
   * @param {Object} invitation - Invitation data
   * @param {Object} options - Email options
   */
  static async sendEmailInvitation(event, invitation, options = {}) {
    const rsvpUrl = `${window.location.origin}/rsvp/${invitation.invitation_token}`;

    const emailData = {
      to: invitation.invitee_email,
      subject: `Invitation: ${event.title}`,
      html: this.generateInvitationEmailHTML(event, invitation, rsvpUrl, options),
      text: this.generateInvitationEmailText(event, invitation, rsvpUrl, options),
    };

    return await emailService.sendEmail(emailData);
  }

  /**
   * Generates the HTML email template for event invitations.
   * Creates a formatted, responsive email with event details and RSVP buttons.
   * @param {Object} event - The event object containing event details.
   * @param {string} event.title - The title of the event.
   * @param {string} event.start_date - The start date of the event.
   * @param {string} [event.start_time] - The start time of the event.
   * @param {string} [event.end_time] - The end time of the event.
   * @param {boolean} event.all_day - Whether the event is all day.
   * @param {string} [event.location] - The location of the event.
   * @param {string} [event.description] - The description of the event.
   * @param {Object} invitation - The invitation object containing invitee details.
   * @param {string} [invitation.invitee_name] - The name of the invitee.
   * @param {string} [invitation.invitation_message] - Personal message for the invitee.
   * @param {string} rsvpUrl - The URL for RSVP responses.
   * @param {Object} [options] - Additional options for email generation.
   * @returns {string} The complete HTML email template as a string.
   */
  static generateInvitationEmailHTML(event, invitation, rsvpUrl, options) {
    const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const eventTime = event.all_day
      ? 'All day'
      : `${event.start_time || '09:00'} - ${event.end_time || '10:00'}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Event Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .event-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .button.decline { background: #ef4444; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited!</h1>
          </div>
          
          <div class="content">
            <p>Hello ${invitation.invitee_name || 'guest'},</p>
            
            <p>You are cordially invited to the following event:</p>
            
            <div class="event-details">
              <h2>${event.title}</h2>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><strong>Time:</strong> ${eventTime}</p>
              ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
              ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
            </div>
            
            ${
              invitation.invitation_message
                ? `
              <div class="event-details">
                <h3>Personal message:</h3>
                <p>${invitation.invitation_message}</p>
              </div>
            `
                : ''
            }
            
            <p>Please confirm your attendance:</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${rsvpUrl}?response=accepted" class="button">✓ Accept</a>
              <a href="${rsvpUrl}?response=declined" class="button decline">✗ Decline</a>
              <a href="${rsvpUrl}?response=maybe" class="button" style="background: #f59e0b;">? Maybe</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              You can also visit <a href="${rsvpUrl}">this link</a> to respond and add comments.
            </p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent via Nexa Manager</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates the plain text email template for event invitations.
   * Creates a simple, text-based email with event details and RSVP link.
   * @param {Object} event - The event object containing event details.
   * @param {string} event.title - The title of the event.
   * @param {string} event.start_date - The start date of the event.
   * @param {string} [event.start_time] - The start time of the event.
   * @param {string} [event.end_time] - The end time of the event.
   * @param {boolean} event.all_day - Whether the event is all day.
   * @param {string} [event.location] - The location of the event.
   * @param {string} [event.description] - The description of the event.
   * @param {Object} invitation - The invitation object containing invitee details.
   * @param {string} [invitation.invitee_name] - The name of the invitee.
   * @param {string} [invitation.invitation_message] - Personal message for the invitee.
   * @param {string} rsvpUrl - The URL for RSVP responses.
   * @param {Object} [options] - Additional options for email generation.
   * @returns {string} The complete plain text email template as a string.
   */
  static generateInvitationEmailText(event, invitation, rsvpUrl, options) {
    const eventDate = new Date(event.start_date).toLocaleDateString('en-US');
    const eventTime = event.all_day
      ? 'All day'
      : `${event.start_time || '09:00'} - ${event.end_time || '10:00'}`;

    return `
EVENT INVITATION

Hello ${invitation.invitee_name || 'guest'},

You are cordially invited to the following event:

EVENT: ${event.title}
DATE: ${eventDate}
TIME: ${eventTime}
${event.location ? `LOCATION: ${event.location}` : ''}

${event.description ? `DESCRIPTION: ${event.description}` : ''}

${invitation.invitation_message ? `PERSONAL MESSAGE: ${invitation.invitation_message}` : ''}

To confirm your attendance, visit: ${rsvpUrl}

Thank you!

---
This invitation was sent via Nexa Manager
    `;
  }

  // ==================== RSVP MANAGEMENT ====================

  /**
   * Handle RSVP response
   * @param {string} token - Invitation token
   * @param {string} response - RSVP response (accepted, declined, maybe)
   * @param {Object} data - Additional RSVP data
   * @returns {Promise<Object>}
   */
  static async handleRSVP(token, response, data = {}) {
    try {
      // Find invitation by token
      const { data: invitation, error: invitationError } = await supabase
        .from('event_invitations')
        .select(
          `
          *,
          events (*)
        `,
        )
        .eq('invitation_token', token)
        .gte('token_expires_at', new Date().toISOString())
        .single();

      if (invitationError || !invitation) {
        throw new Error('Invitation not found or expired');
      }

      // Update RSVP status
      const updateData = {
        rsvp_status: response,
        rsvp_responded_at: new Date().toISOString(),
        rsvp_response_message: data.message || null,
        guest_count: data.guest_count || 1,
        dietary_restrictions: data.dietary_restrictions || null,
        special_requests: data.special_requests || null,
      };

      const { data: updatedInvitation, error: updateError } = await supabase
        .from('event_invitations')
        .update(updateData)
        .eq('id', invitation.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update RSVP: ${updateError.message}`);
      }

      // Send confirmation email to host
      await this.notifyHostOfRSVP(invitation.events, updatedInvitation);

      return {
        success: true,
        invitation: updatedInvitation,
        message: 'RSVP updated successfully',
      };
    } catch (error) {
      Logger.error('Error handling RSVP:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get RSVP details by token
   * @param {string} token - Invitation token
   * @returns {Promise<Object>}
   */
  static async getRSVPDetails(token) {
    try {
      const { data: invitation, error } = await supabase
        .from('event_invitations')
        .select(
          `
          *,
          events (
            *,
            clients (full_name, email, phone)
          )
        `,
        )
        .eq('invitation_token', token)
        .gte('token_expires_at', new Date().toISOString())
        .single();

      if (error || !invitation) {
        throw new Error('Invitation not found or expired');
      }

      return {
        success: true,
        invitation: invitation,
      };
    } catch (error) {
      Logger.error('Error getting RSVP details:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Notifies the event host via email when an invitee responds to an RSVP.
   * Sends a formatted email with the RSVP status and any additional details provided by the invitee.
   * @param {Object} event - The event object containing event details.
   * @param {string} event.title - The title of the event.
   * @param {string} event.start_date - The start date of the event.
   * @param {string} event.user_id - The ID of the event host/creator.
   * @param {Object} invitation - The invitation object containing RSVP details.
   * @param {string} invitation.invitee_name - The name of the person who responded.
   * @param {string} invitation.rsvp_status - The RSVP status (accepted, declined, maybe).
   * @param {string} [invitation.rsvp_response_message] - Optional message from the invitee.
   * @param {number} [invitation.guest_count] - Number of guests attending.
   * @param {string} [invitation.dietary_restrictions] - Any dietary restrictions.
   * @param {string} [invitation.special_requests] - Any special requests.
   * @returns {Promise<void>} A promise that resolves when the notification email is sent.
   */
  static async notifyHostOfRSVP(event, invitation) {
    try {
      // Get host user details
      const { data: host, error: hostError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', event.user_id)
        .single();

      if (hostError || !host) {
        Logger.warn('Could not find host details for notification');
        return;
      }

      const statusText = {
        accepted: 'has accepted',
        declined: 'has declined',
        maybe: 'has responded "maybe"',
      };

      const emailData = {
        to: host.email,
        subject: `RSVP: ${invitation.invitee_name} ${statusText[invitation.rsvp_status]} the invitation for "${event.title}"`,
        html: `
            <h2>RSVP Update</h2>
            <p><strong>${invitation.invitee_name}</strong> ${statusText[invitation.rsvp_status]} the invitation for the event:</p>
            <h3>${event.title}</h3>
            <p><strong>Date:</strong> ${new Date(event.start_date).toLocaleDateString('en-US')}</p>
            ${invitation.rsvp_response_message ? `<p><strong>Message:</strong> ${invitation.rsvp_response_message}</p>` : ''}
            ${invitation.guest_count > 1 ? `<p><strong>Guests:</strong> ${invitation.guest_count}</p>` : ''}
            ${invitation.dietary_restrictions ? `<p><strong>Dietary restrictions:</strong> ${invitation.dietary_restrictions}</p>` : ''}
            ${invitation.special_requests ? `<p><strong>Special requests:</strong> ${invitation.special_requests}</p>` : ''}
          `,
        text: `
RSVP UPDATE

${invitation.invitee_name} ${statusText[invitation.rsvp_status]} the invitation for the event:

EVENT: ${event.title}
DATE: ${new Date(event.start_date).toLocaleDateString('en-US')}

${invitation.rsvp_response_message ? `MESSAGE: ${invitation.rsvp_response_message}` : ''}
${invitation.guest_count > 1 ? `GUESTS: ${invitation.guest_count}` : ''}
${invitation.dietary_restrictions ? `DIETARY RESTRICTIONS: ${invitation.dietary_restrictions}` : ''}
${invitation.special_requests ? `SPECIAL REQUESTS: ${invitation.special_requests}` : ''}
        `,
      };

      await emailService.sendEmail(emailData);
    } catch (error) {
      Logger.error('Error notifying host of RSVP:', error);
    }
  }

  // ==================== ATTENDEE MANAGEMENT ====================

  /**
   * Get event attendees
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>}
   */
  static async getEventAttendees(eventId) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: attendees, error } = await supabase
        .from('event_attendees')
        .select(
          `
          *,
          event_invitations (
            invitee_email,
            rsvp_status,
            rsvp_responded_at,
            guest_count,
            dietary_restrictions,
            special_requests
          ),
          clients (full_name, email, phone)
        `,
        )
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch attendees: ${error.message}`);
      }

      return {
        success: true,
        attendees: attendees,
      };
    } catch (error) {
      Logger.error('Error getting event attendees:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get event invitations with RSVP status
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>}
   */
  static async getEventInvitations(eventId) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: invitations, error } = await supabase
        .from('event_invitations')
        .select(
          `
          *,
          clients (full_name, email, phone)
        `,
        )
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch invitations: ${error.message}`);
      }

      // Group by RSVP status
      const grouped = {
        pending: [],
        accepted: [],
        declined: [],
        maybe: [],
        no_response: [],
      };

      invitations.forEach(invitation => {
        grouped[invitation.rsvp_status].push(invitation);
      });

      return {
        success: true,
        invitations: invitations,
        grouped: grouped,
        summary: {
          total: invitations.length,
          pending: grouped.pending.length,
          accepted: grouped.accepted.length,
          declined: grouped.declined.length,
          maybe: grouped.maybe.length,
          no_response: grouped.no_response.length,
        },
      };
    } catch (error) {
      Logger.error('Error getting event invitations:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check in attendee
   * @param {string} attendeeId - Attendee ID
   * @returns {Promise<Object>}
   */
  static async checkInAttendee(attendeeId) {
    try {
      const { data: attendee, error } = await supabase
        .from('event_attendees')
        .update({
          attendance_status: 'checked_in',
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', attendeeId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to check in attendee: ${error.message}`);
      }

      return {
        success: true,
        attendee: attendee,
      };
    } catch (error) {
      Logger.error('Error checking in attendee:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== COMMENTS & ATTACHMENTS ====================

  /**
   * Add comment to event
   * @param {string} eventId - Event ID
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>}
   */
  static async addEventComment(eventId, commentData) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: comment, error } = await supabase
        .from('event_comments')
        .insert([
          {
            event_id: eventId,
            comment_text: commentData.text,
            comment_type: commentData.type || 'general',
            author_id: user.id,
            author_name: commentData.author_name || user.user_metadata?.full_name || 'User',
            author_email: user.email,
            is_public: commentData.is_public || false,
            parent_comment_id: commentData.parent_id || null,
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add comment: ${error.message}`);
      }

      return {
        success: true,
        comment: comment,
      };
    } catch (error) {
      Logger.error('Error adding event comment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get event comments
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>}
   */
  static async getEventComments(eventId) {
    try {
      const { data: comments, error } = await supabase
        .from('event_comments')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch comments: ${error.message}`);
      }

      return {
        success: true,
        comments: comments,
      };
    } catch (error) {
      Logger.error('Error getting event comments:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Generate RSVP statistics for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>}
   */
  static async getEventRSVPStats(eventId) {
    try {
      const invitationsResult = await this.getEventInvitations(eventId);

      if (!invitationsResult.success) {
        throw new Error(invitationsResult.error);
      }

      const { grouped, summary } = invitationsResult;

      const totalGuests = invitationsResult.invitations.reduce((sum, inv) => {
        return sum + (inv.rsvp_status === 'accepted' ? inv.guest_count : 0);
      }, 0);

      return {
        success: true,
        stats: {
          ...summary,
          total_guests: totalGuests,
          response_rate:
            summary.total > 0
              ? Math.round(
                  ((summary.accepted + summary.declined + summary.maybe) / summary.total) * 100,
                )
              : 0,
        },
      };
    } catch (error) {
      Logger.error('Error getting RSVP stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send reminder to pending RSVPs
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>}
   */
  static async sendRSVPReminders(eventId) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get pending invitations
      const { data: pendingInvitations, error } = await supabase
        .from('event_invitations')
        .select(
          `
          *,
          events (*)
        `,
        )
        .eq('event_id', eventId)
        .in('rsvp_status', ['pending', 'no_response'])
        .eq('send_reminders', true);

      if (error) {
        throw new Error(`Failed to fetch pending invitations: ${error.message}`);
      }

      const results = [];
      const errors = [];

      for (const invitation of pendingInvitations) {
        try {
          await this.sendEmailInvitation(invitation.events, invitation, {
            isReminder: true,
            message: 'Reminder: Please remember to confirm your attendance for the event.',
          });

          // Update reminder count
          await supabase
            .from('event_invitations')
            .update({
              reminder_sent_count: invitation.reminder_sent_count + 1,
              last_reminder_sent_at: new Date().toISOString(),
            })
            .eq('id', invitation.id);

          results.push(invitation);
        } catch (error) {
          Logger.error(`Error sending reminder to ${invitation.invitee_email}:`, String(error?.message || error || 'Unknown error'));
          errors.push({
            invitation: invitation,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        results: results,
        errors: errors,
        summary: {
          total: pendingInvitations.length,
          sent: results.length,
          failed: errors.length,
        },
      };
    } catch (error) {
      Logger.error('Error sending RSVP reminders:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default EventInvitationService;
