import { supabase } from '@lib/supabaseClient';
import { InvoiceService, INVOICE_STATUS } from '@lib/invoiceService';
import emailService from '@lib/emailService';
import Logger from '@utils/Logger';

/**
 * Invoice Lifecycle Service - Automated invoice lifecycle management
 *
 * Features:
 * - Automatic status transitions based on due dates
 * - Overdue invoice detection and notifications
 * - Payment reminder system
 * - Lifecycle event tracking
 * - Integration with notification service
 */

export class InvoiceLifecycleService {
  // ==================== AUTOMATIC STATUS MANAGEMENT ====================

  /**
   * Process all invoices for automatic status updates
   * This should be called regularly (e.g., daily via cron job)
   * @param {string} userId - Optional: process for specific user
   * @returns {Promise<Object>} Processing results with counts and errors
   */
  static async processInvoiceLifecycle(userId = null) {
    try {
      Logger.log('Starting invoice lifecycle processing...');

      const results = {
        processed: 0,
        updated: 0,
        overdue: 0,
        reminders: 0,
        errors: [],
      };

      // Get all active invoices that need processing
      let query = supabase
        .from('invoices')
        .select(
          `
          *,
          clients(id, name, email, phone),
          payments(amount, payment_date)
        `,
        )
        .in('status', [INVOICE_STATUS.ISSUED, INVOICE_STATUS.SENT, INVOICE_STATUS.PARTIALLY_PAID]);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: invoices, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      Logger.log(`Processing ${invoices.length} invoices...`);

      // Process each invoice for status updates
      for (const invoice of invoices) {
        try {
          results.processed++;

          const updateResult = await this.processInvoiceStatus(invoice);

          if (updateResult.statusChanged) {
            results.updated++;
          }

          if (updateResult.isOverdue) {
            results.overdue++;
          }

          if (updateResult.reminderSent) {
            results.reminders++;
          }
        } catch (error) {
          Logger.error(`Error processing invoice ${invoice.id}:`, error);
          results.errors.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            error: error.message,
          });
        }
      }

      Logger.log('Invoice lifecycle processing completed:', results);
      return results;
    } catch (error) {
      Logger.error('InvoiceLifecycleService.processInvoiceLifecycle error:', error);
      throw error;
    }
  }

  /**
   * Process a single invoice for status updates based on payments and due dates
   * @param {Object} invoice - Invoice with payments and client data
   * @returns {Promise<Object>} Processing result with status changes and actions taken
   */
  static async processInvoiceStatus(invoice) {
    const result = {
      statusChanged: false,
      isOverdue: false,
      reminderSent: false,
      newStatus: invoice.status,
    };

    try {
      const today = new Date();
      const dueDate = new Date(invoice.due_date);
      const isOverdue = dueDate < today;

      // Calculate payment status
      const totalPaid = (invoice.payments || []).reduce(
        (sum, payment) => sum + parseFloat(payment.amount || 0),
        0,
      );
      const totalAmount = parseFloat(invoice.total_amount || 0);
      const isPaid = totalPaid >= totalAmount;
      const isPartiallyPaid = totalPaid > 0 && totalPaid < totalAmount;

      let newStatus = invoice.status;

      // Determine new status based on payment and due date
      if (isPaid) {
        newStatus = INVOICE_STATUS.PAID;
      } else if (isOverdue && invoice.status !== INVOICE_STATUS.OVERDUE) {
        newStatus = INVOICE_STATUS.OVERDUE;
        result.isOverdue = true;
      } else if (isPartiallyPaid && invoice.status !== INVOICE_STATUS.PARTIALLY_PAID) {
        newStatus = INVOICE_STATUS.PARTIALLY_PAID;
      }

      // Update status if changed
      if (newStatus !== invoice.status) {
        await this.updateInvoiceStatus(invoice.id, newStatus, {
          paid_amount: totalPaid,
          balance: totalAmount - totalPaid,
        });

        result.statusChanged = true;
        result.newStatus = newStatus;

        Logger.log(
          `Invoice ${invoice.invoice_number} status updated: ${invoice.status} → ${newStatus}`,
        );

        // Send status change notification
        await this.sendStatusChangeNotification(invoice, newStatus);
      }

      // Handle overdue reminders
      if (isOverdue && !isPaid) {
        const reminderResult = await this.handleOverdueReminders(invoice);
        result.reminderSent = reminderResult.sent;
      }

      return result;
    } catch (error) {
      Logger.error(`Error processing invoice status for ${invoice.id}:`, error);
      throw error;
    }
  }

  /**
   * Update invoice status and related fields in the database
   * @param {string} invoiceId - Invoice ID
   * @param {string} newStatus - New status to set
   * @param {Object} additionalFields - Additional fields to update
   * @returns {Promise<Object>} Updated invoice data
   */
  static async updateInvoiceStatus(invoiceId, newStatus, additionalFields = {}) {
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...additionalFields,
      };

      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update invoice status: ${error.message}`);
      }

      // Update calendar event if exists
      if (data.event_id) {
        await InvoiceService.updateCalendarEvent(data);
      }

      return data;
    } catch (error) {
      Logger.error('InvoiceLifecycleService.updateInvoiceStatus error:', error);
      throw error;
    }
  }

  // ==================== OVERDUE MANAGEMENT ====================

  /**
   * Handle overdue invoice reminders based on days overdue
   * @param {Object} invoice - Invoice data with client information
   * @returns {Promise<Object>} Reminder result with sent status and days overdue
   */
  static async handleOverdueReminders(invoice) {
    try {
      const today = new Date();
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

      // Check if reminder should be sent based on days overdue
      const shouldSendReminder = this.shouldSendOverdueReminder(daysOverdue, invoice);

      if (shouldSendReminder) {
        await this.sendOverdueReminder(invoice, daysOverdue);

        // Log reminder sent
        await this.logLifecycleEvent(invoice.id, 'overdue_reminder_sent', {
          days_overdue: daysOverdue,
          reminder_type: this.getReminderType(daysOverdue),
        });

        return { sent: true, daysOverdue };
      }

      return { sent: false, daysOverdue };
    } catch (error) {
      Logger.error('Error handling overdue reminders:', error);
      return { sent: false, error: error.message };
    }
  }

  /**
   * Determine if overdue reminder should be sent based on configured intervals
   * @param {number} daysOverdue - Days past due date
   * @param {Object} invoice - Invoice data
   * @returns {boolean} Should send reminder
   */
  static shouldSendOverdueReminder(daysOverdue, invoice) {
    // Send reminders at specific intervals: 1, 7, 15, 30, 60 days
    const reminderDays = [1, 7, 15, 30, 60];

    if (!reminderDays.includes(daysOverdue)) {
      return false;
    }

    // Check if reminder was already sent today
    const today = new Date().toISOString().split('T')[0];
    // In a real implementation, you'd check a reminders log table
    // For now, we'll assume we can send the reminder

    return true;
  }

  /**
   * Get reminder type based on days overdue
   * @param {number} daysOverdue - Days overdue
   * @returns {string} Reminder type (gentle, firm, final)
   */
  static getReminderType(daysOverdue) {
    if (daysOverdue <= 7) return 'gentle';
    if (daysOverdue <= 30) return 'firm';
    return 'final';
  }

  /**
   * Send overdue reminder notification via email
   * @param {Object} invoice - Invoice data with client information
   * @param {number} daysOverdue - Days overdue
   * @returns {Promise<void>}
   */
  static async sendOverdueReminder(invoice, daysOverdue) {
    try {
      if (!invoice.clients?.email) {
        Logger.log(`No email for client of invoice ${invoice.invoice_number}`);
        return;
      }

      const reminderType = this.getReminderType(daysOverdue);
      const subject = this.getOverdueReminderSubject(
        reminderType,
        invoice.invoice_number,
        daysOverdue,
      );
      const message = this.getOverdueReminderMessage(reminderType, invoice, daysOverdue);

      // Send email reminder
      await emailService.sendEmail({
        to: invoice.clients.email,
        subject,
        html: message,
        metadata: {
          type: 'overdue_reminder',
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          days_overdue: daysOverdue,
          reminder_type: reminderType,
        },
      });

      Logger.log(
        `Overdue reminder sent for invoice ${invoice.invoice_number} (${daysOverdue} days overdue)`,
      );
    } catch (error) {
      Logger.error('Error sending overdue reminder:', error);
      throw error;
    }
  }

  /**
   * Get overdue reminder email subject based on reminder type
   * @param {string} reminderType - Type of reminder (gentle, firm, final)
   * @param {string} invoiceNumber - Invoice number
   * @param {number} daysOverdue - Days overdue
   * @returns {string} Email subject
   */
  static getOverdueReminderSubject(reminderType, invoiceNumber, daysOverdue) {
    switch (reminderType) {
      case 'gentle':
        return `Payment Reminder - Invoice ${invoiceNumber}`;
      case 'firm':
        return `Payment Notice - Invoice ${invoiceNumber} (${daysOverdue} days overdue)`;
      case 'final':
        return `FINAL NOTICE - Invoice ${invoiceNumber} (${daysOverdue} days overdue)`;
      default:
        return `Payment Reminder - Invoice ${invoiceNumber}`;
    }
  }

  /**
   * Get overdue reminder email message based on reminder type
   * @param {string} reminderType - Type of reminder (gentle, firm, final)
   * @param {Object} invoice - Invoice data with client information
   * @param {number} daysOverdue - Days overdue
   * @returns {string} HTML email message
   */
  static getOverdueReminderMessage(reminderType, invoice, daysOverdue) {
    const clientName = invoice.clients?.name || 'Dear Customer';
    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(invoice.balance || invoice.total_amount);

    const baseMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Reminder</h2>
        
        <p>Dear ${clientName},</p>
        
        <p>Invoice <strong>${invoice.invoice_number}</strong> dated ${new Date(invoice.issue_date).toLocaleDateString('en-US')} 
        is now overdue by <strong>${daysOverdue} days</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Invoice Details</h3>
          <p><strong>Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Issue Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString('en-US')}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-US')}</p>
          <p><strong>Amount Due:</strong> ${amount}</p>
        </div>
    `;

    switch (reminderType) {
      case 'gentle':
        return (
          baseMessage +
          `
          <p>We kindly request that you arrange payment as soon as possible.</p>
          <p>If you have already made this payment, please disregard this message.</p>
          <p>Best regards</p>
        </div>`
        );

      case 'firm':
        return (
          baseMessage +
          `
          <p style="color: #dc3545;"><strong>This invoice is ${daysOverdue} days overdue.</strong></p>
          <p>Please arrange payment within the next 7 days to avoid further collection action.</p>
          <p>If you have already made this payment, please contact us for confirmation.</p>
          <p>Best regards</p>
        </div>`
        );

      case 'final':
        return (
          baseMessage +
          `
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #721c24; margin-top: 0;">FINAL NOTICE</h4>
            <p style="color: #721c24; margin-bottom: 0;">
              This invoice is <strong>${daysOverdue} days overdue</strong>. 
              If payment is not received within 7 days, we will proceed with legal action.
            </p>
          </div>
          <p>Please contact us immediately to resolve this matter.</p>
          <p>Best regards</p>
        </div>`
        );

      default:
        return (
          baseMessage +
          `
          <p>We kindly request that you arrange payment.</p>
          <p>Best regards</p>
        </div>`
        );
    }
  }

  // ==================== NOTIFICATION MANAGEMENT ====================

  /**
   * Send status change notification based on new invoice status
   * @param {Object} invoice - Invoice data with client information
   * @param {string} newStatus - New status that was set
   * @returns {Promise<void>}
   */
  static async sendStatusChangeNotification(invoice, newStatus) {
    try {
      // Log the status change
      await this.logLifecycleEvent(invoice.id, 'status_changed', {
        old_status: invoice.status,
        new_status: newStatus,
      });

      // Send notification based on status
      switch (newStatus) {
        case INVOICE_STATUS.OVERDUE:
          // Overdue notification is handled separately
          break;

        case INVOICE_STATUS.PAID:
          await this.sendPaymentConfirmationNotification(invoice);
          break;

        case INVOICE_STATUS.PARTIALLY_PAID:
          await this.sendPartialPaymentNotification(invoice);
          break;
      }
    } catch (error) {
      Logger.error('Error sending status change notification:', error);
    }
  }

  /**
   * Send payment confirmation notification when invoice is fully paid
   * @param {Object} invoice - Invoice data with client information
   * @returns {Promise<void>}
   */
  static async sendPaymentConfirmationNotification(invoice) {
    try {
      if (!invoice.clients?.email) return;

      const subject = `Payment Received - Invoice ${invoice.invoice_number}`;
      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Payment Received</h2>
          
          <p>Dear ${invoice.clients?.name || 'Customer'},</p>
          
          <p>We confirm that we have received payment for invoice <strong>${invoice.invoice_number}</strong>.</p>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #155724;">Payment Details</h3>
            <p><strong>Invoice:</strong> ${invoice.invoice_number}</p>
            <p><strong>Amount:</strong> ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
            }).format(invoice.total_amount)}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US')}</p>
          </div>
          
          <p>Thank you for your prompt payment.</p>
          <p>Best regards</p>
        </div>
      `;

      await emailService.sendEmail({
        to: invoice.clients.email,
        subject,
        html: message,
        metadata: {
          type: 'payment_confirmation',
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
        },
      });
    } catch (error) {
      Logger.error('Error sending payment confirmation:', error);
    }
  }

  /**
   * Send partial payment notification when invoice is partially paid
   * @param {Object} invoice - Invoice data with client information
   * @returns {Promise<void>}
   */
  static async sendPartialPaymentNotification(invoice) {
    try {
      if (!invoice.clients?.email) return;

      const paidAmount = invoice.paid_amount || 0;
      const remainingAmount = (invoice.total_amount || 0) - paidAmount;

      const subject = `Partial Payment Received - Invoice ${invoice.invoice_number}`;
      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ffc107;">Partial Payment Received</h2>
          
          <p>Dear ${invoice.clients?.name || 'Customer'},</p>
          
          <p>We confirm that we have received a partial payment for invoice <strong>${invoice.invoice_number}</strong>.</p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">Payment Summary</h3>
            <p><strong>Amount Received:</strong> ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
            }).format(paidAmount)}</p>
            <p><strong>Remaining Balance:</strong> ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
            }).format(remainingAmount)}</p>
          </div>
          
          <p>Please note that the remaining balance is still due by the due date.</p>
          <p>Best regards</p>
        </div>
      `;

      await emailService.sendEmail({
        to: invoice.clients.email,
        subject,
        html: message,
        metadata: {
          type: 'partial_payment_notification',
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          paid_amount: paidAmount,
          remaining_amount: remainingAmount,
        },
      });
    } catch (error) {
      Logger.error('Error sending partial payment notification:', error);
    }
  }

  // ==================== LIFECYCLE TRACKING ====================

  /**
   * Log lifecycle event for audit trail and monitoring
   * @param {string} invoiceId - Invoice ID
   * @param {string} eventType - Event type (status_changed, reminder_sent, etc.)
   * @param {Object} metadata - Event metadata
   * @returns {Promise<void>}
   */
  static async logLifecycleEvent(invoiceId, eventType, metadata = {}) {
    try {
      // In a real implementation, you'd store this in a lifecycle_events table
      Logger.log(`Lifecycle event: ${eventType} for invoice ${invoiceId}`, metadata);

      // For now, we'll just log to console
      // Future: Store in database for audit trail
    } catch (error) {
      Logger.error('Error logging lifecycle event:', error);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get invoices requiring attention (overdue, due soon, etc.)
   * @param {string} userId - User ID to filter invoices
   * @returns {Promise<Object>} Invoices categorized by urgency
   */
  static async getInvoicesRequiringAttention(userId) {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      const [overdue, dueTomorrow, dueSoon] = await Promise.all([
        // Overdue invoices
        InvoiceService.getOverdueInvoices(userId),

        // Due tomorrow
        supabase
          .from('invoices')
          .select('*, clients(name, email)')
          .eq('user_id', userId)
          .eq('due_date', tomorrow.toISOString().split('T')[0])
          .neq('status', INVOICE_STATUS.PAID)
          .neq('status', INVOICE_STATUS.CANCELLED),

        // Due within a week
        supabase
          .from('invoices')
          .select('*, clients(name, email)')
          .eq('user_id', userId)
          .gte('due_date', today.toISOString().split('T')[0])
          .lte('due_date', weekFromNow.toISOString().split('T')[0])
          .neq('status', INVOICE_STATUS.PAID)
          .neq('status', INVOICE_STATUS.CANCELLED),
      ]);

      return {
        overdue: overdue || [],
        dueTomorrow: dueTomorrow.data || [],
        dueSoon: dueSoon.data || [],
      };
    } catch (error) {
      Logger.error('Error getting invoices requiring attention:', error);
      throw error;
    }
  }
}

export default InvoiceLifecycleService;
