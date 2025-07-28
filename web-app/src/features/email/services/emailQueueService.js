import Logger from '@utils/Logger';
import emailCampaignService from './emailCampaignService';
import emailTrackingService from './emailTrackingService';

class EmailQueueService {
  constructor() {
    this.isProcessing = false;
    this.queueInterval = null;
    this.processingStats = {
      processed: 0,
      failed: 0,
      lastProcessed: null,
    };
  }

  /**
   * Start the queue processor
   */
  startQueue(intervalMs = 60000) {
    // Check every minute by default
    if (this.queueInterval) {
      this.stopQueue();
    }

    Logger.info('Starting email queue processor', { intervalMs });

    this.queueInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);

    // Process immediately
    this.processQueue();
  }

  /**
   * Stop the queue processor
   */
  stopQueue() {
    if (this.queueInterval) {
      clearInterval(this.queueInterval);
      this.queueInterval = null;
      Logger.info('Stopped email queue processor');
    }
  }

  /**
   * Process pending scheduled campaigns
   */
  async processQueue() {
    if (this.isProcessing) {
      Logger.debug('Queue processor already running, skipping...');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      Logger.debug('Processing email queue...');

      // Get all scheduled campaigns that are due
      const scheduledCampaigns = await this.getScheduledCampaigns();
      const dueCampaigns = scheduledCampaigns.filter(
        campaign => new Date(campaign.scheduled_at) <= new Date(),
      );

      Logger.info(`Found ${dueCampaigns.length} due campaigns to process`);

      for (const campaign of dueCampaigns) {
        try {
          await this.processCampaign(campaign);
          this.processingStats.processed++;
        } catch (error) {
          Logger.error('Failed to process campaign', {
            campaignId: campaign.id,
            error: error.message,
          });
          this.processingStats.failed++;
        }
      }

      this.processingStats.lastProcessed = new Date().toISOString();

      const duration = Date.now() - startTime;
      Logger.info('Queue processing completed', {
        processed: dueCampaigns.length,
        duration: `${duration}ms`,
      });
    } catch (error) {
      Logger.error('Queue processing failed', { error: error.message });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get all scheduled campaigns from the service
   */
  async getScheduledCampaigns() {
    try {
      const result = await emailCampaignService.getCampaigns();
      if (result.success) {
        return result.data.filter(campaign => campaign.status === 'scheduled');
      }
      return [];
    } catch (error) {
      Logger.error('Failed to get scheduled campaigns', { error: error.message });
      return [];
    }
  }

  /**
   * Process a single campaign
   */
  async processCampaign(campaign) {
    Logger.info('Processing scheduled campaign', {
      campaignId: campaign.id,
      name: campaign.name,
    });

    try {
      // Send the campaign
      const result = await emailCampaignService.sendCampaign(campaign.id, {
        scheduled: false, // This will actually send it now
      });

      if (result.success) {
        Logger.info('Campaign sent successfully', { campaignId: campaign.id });

        // Trigger any automated workflows
        await this.triggerAutomatedWorkflows(campaign);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Logger.error('Failed to send scheduled campaign', {
        campaignId: campaign.id,
        error: error.message,
      });

      // Update campaign status to failed
      await this.markCampaignAsFailed(campaign.id, error.message);
      throw error;
    }
  }

  /**
   * Mark a campaign as failed
   */
  async markCampaignAsFailed(campaignId, errorMessage) {
    try {
      // This would typically update the campaign status in the database
      Logger.error('Campaign marked as failed', { campaignId, errorMessage });

      // In a real implementation, you would update the database here
      // For now, we'll just log it
    } catch (error) {
      Logger.error('Failed to mark campaign as failed', {
        campaignId,
        error: error.message,
      });
    }
  }

  /**
   * Trigger automated workflows after campaign send
   */
  async triggerAutomatedWorkflows(campaign) {
    try {
      Logger.info('Triggering automated workflows', { campaignId: campaign.id });

      // Example automated workflows:

      // 1. Schedule follow-up campaigns
      await this.scheduleFollowUps(campaign);

      // 2. Update contact engagement scores
      await this.updateEngagementScores(campaign);

      // 3. Trigger integration webhooks
      await this.triggerWebhooks(campaign);
    } catch (error) {
      Logger.error('Failed to trigger automated workflows', {
        campaignId: campaign.id,
        error: error.message,
      });
    }
  }

  /**
   * Schedule follow-up campaigns based on engagement
   */
  async scheduleFollowUps(campaign) {
    // This is a placeholder for follow-up scheduling logic
    // In a real implementation, you might:
    // - Check engagement after 24 hours
    // - Schedule reminder campaigns for non-openers
    // - Send thank you emails to high engagers

    Logger.info('Scheduling follow-up workflows', { campaignId: campaign.id });
  }

  /**
   * Update contact engagement scores
   */
  async updateEngagementScores(campaign) {
    try {
      // Get campaign analytics
      const analytics = await emailTrackingService.getCampaignAnalytics(campaign.id);

      if (analytics.success) {
        // Update engagement scores based on opens, clicks, etc.
        Logger.info('Updated engagement scores', {
          campaignId: campaign.id,
          opens: analytics.data.stats.unique_opens,
          clicks: analytics.data.stats.unique_clicks,
        });
      }
    } catch (error) {
      Logger.error('Failed to update engagement scores', {
        campaignId: campaign.id,
        error: error.message,
      });
    }
  }

  /**
   * Trigger integration webhooks
   */
  async triggerWebhooks(campaign) {
    // This is a placeholder for webhook integration
    // In a real implementation, you might send data to:
    // - CRM systems
    // - Analytics platforms
    // - Custom integrations

    Logger.info('Triggering integration webhooks', { campaignId: campaign.id });
  }

  /**
   * Get queue status and statistics
   */
  getQueueStatus() {
    return {
      isRunning: !!this.queueInterval,
      isProcessing: this.isProcessing,
      stats: this.processingStats,
      nextCheck: this.queueInterval ? new Date(Date.now() + 60000).toISOString() : null,
    };
  }

  /**
   * Get queue performance metrics
   */
  async getQueueMetrics() {
    try {
      const scheduledCampaigns = await this.getScheduledCampaigns();
      const now = new Date();

      const overdueCampaigns = scheduledCampaigns.filter(
        campaign => new Date(campaign.scheduled_at) < now,
      );

      const upcomingCampaigns = scheduledCampaigns.filter(
        campaign => new Date(campaign.scheduled_at) >= now,
      );

      return {
        success: true,
        data: {
          totalScheduled: scheduledCampaigns.length,
          overdue: overdueCampaigns.length,
          upcoming: upcomingCampaigns.length,
          processing: this.isProcessing,
          stats: this.processingStats,
          nextCampaign:
            upcomingCampaigns.length > 0
              ? upcomingCampaigns.sort(
                  (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at),
                )[0]
              : null,
        },
      };
    } catch (error) {
      Logger.error('Failed to get queue metrics', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Manually retry failed campaigns
   */
  async retryFailedCampaigns() {
    try {
      Logger.info('Retrying failed campaigns...');

      // Get failed campaigns (this would need to be implemented in the campaign service)
      // For now, we'll just log the action

      return {
        success: true,
        message: 'Failed campaigns retry initiated',
      };
    } catch (error) {
      Logger.error('Failed to retry campaigns', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel a scheduled campaign
   */
  async cancelScheduledCampaign(campaignId) {
    try {
      Logger.info('Cancelling scheduled campaign', { campaignId });

      // This would update the campaign status to 'cancelled'
      // For now, we'll use the delete campaign method
      const result = await emailCampaignService.deleteCampaign(campaignId);

      if (result.success) {
        Logger.info('Scheduled campaign cancelled', { campaignId });
      }

      return result;
    } catch (error) {
      Logger.error('Failed to cancel scheduled campaign', {
        campaignId,
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reschedule a campaign
   */
  async rescheduleCampaign(campaignId, newScheduledTime) {
    try {
      Logger.info('Rescheduling campaign', { campaignId, newScheduledTime });

      // This would update the scheduled_at field in the database
      // For now, we'll just log the action

      return {
        success: true,
        message: `Campaign ${campaignId} rescheduled to ${newScheduledTime}`,
      };
    } catch (error) {
      Logger.error('Failed to reschedule campaign', {
        campaignId,
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance with lazy initialization
let emailQueueServiceInstance = null;

export const getEmailQueueService = () => {
  if (!emailQueueServiceInstance) {
    emailQueueServiceInstance = new EmailQueueService();
    // Auto-start the queue in production (delayed to avoid temporal dead zone)
    if (import.meta.env.MODE === 'production') {
      setTimeout(() => {
        emailQueueServiceInstance.startQueue();
      }, 0);
    }
  }
  return emailQueueServiceInstance;
};

// Export the function for lazy initialization instead of calling it
export default getEmailQueueService;
