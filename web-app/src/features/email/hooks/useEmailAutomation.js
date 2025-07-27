import { useState, useEffect, useCallback } from 'react';
import { emailAutomationService } from '@features/email';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';

/**
 * Hook for managing email scheduling
 */
export function useEmailScheduling() {
  const { userId } = useAuth();
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadScheduledEmails = useCallback(async (filters = {}) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const emails = await emailAutomationService.getScheduledEmails(userId, filters);
      setScheduledEmails(emails);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load scheduled emails');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const scheduleEmail = useCallback(async (emailData, scheduledTime) => {
    if (!userId) return null;

    try {
      setLoading(true);
      setError(null);
      const result = await emailAutomationService.scheduleEmail(emailData, scheduledTime, userId);
      await loadScheduledEmails();
      toast.success('Email scheduled successfully');
      return result;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to schedule email');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadScheduledEmails]);

  const cancelScheduledEmail = useCallback(async (emailId) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      await emailAutomationService.cancelScheduledEmail(emailId, userId);
      await loadScheduledEmails();
      toast.success('Scheduled email cancelled');
    } catch (err) {
      setError(err.message);
      toast.error('Failed to cancel scheduled email');
    } finally {
      setLoading(false);
    }
  }, [userId, loadScheduledEmails]);

  useEffect(() => {
    loadScheduledEmails();
  }, [loadScheduledEmails]);

  return {
    scheduledEmails,
    loading,
    error,
    scheduleEmail,
    cancelScheduledEmail,
    loadScheduledEmails
  };
}

/**
 * Hook for managing automation rules
 */
export function useEmailAutomation() {
  const { userId } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRules = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const automationRules = await emailAutomationService.getAutomationRules(userId);
      setRules(automationRules);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load automation rules');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createRule = useCallback(async (ruleData) => {
    if (!userId) return null;

    try {
      setLoading(true);
      setError(null);
      const result = await emailAutomationService.createAutomationRule(ruleData, userId);
      await loadRules();
      toast.success('Automation rule created');
      return result;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to create automation rule');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadRules]);

  const updateRule = useCallback(async (ruleId, updates) => {
    if (!userId) return null;

    try {
      setLoading(true);
      setError(null);
      const result = await emailAutomationService.updateAutomationRule(ruleId, updates, userId);
      await loadRules();
      toast.success('Automation rule updated');
      return result;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to update automation rule');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadRules]);

  const deleteRule = useCallback(async (ruleId) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      await emailAutomationService.deleteAutomationRule(ruleId, userId);
      await loadRules();
      toast.success('Automation rule deleted');
    } catch (err) {
      setError(err.message);
      toast.error('Failed to delete automation rule');
    } finally {
      setLoading(false);
    }
  }, [userId, loadRules]);

  const toggleRule = useCallback(async (ruleId, isActive) => {
    await updateRule(ruleId, { is_active: isActive });
  }, [updateRule]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  return {
    rules,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    loadRules
  };
}

/**
 * Hook for managing follow-up reminders
 */
export function useFollowUpReminders() {
  const { userId } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadReminders = useCallback(async (filters = {}) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const followUpReminders = await emailAutomationService.getFollowUpReminders(userId, filters);
      setReminders(followUpReminders);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load follow-up reminders');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createReminder = useCallback(async (reminderData) => {
    if (!userId) return null;

    try {
      setLoading(true);
      setError(null);
      const result = await emailAutomationService.createFollowUpReminder(reminderData, userId);
      await loadReminders();
      toast.success('Follow-up reminder created');
      return result;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to create follow-up reminder');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadReminders]);

  const completeReminder = useCallback(async (reminderId) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      await emailAutomationService.completeFollowUpReminder(reminderId, userId);
      await loadReminders();
      toast.success('Reminder marked as completed');
    } catch (err) {
      setError(err.message);
      toast.error('Failed to complete reminder');
    } finally {
      setLoading(false);
    }
  }, [userId, loadReminders]);

  const getOverdueReminders = useCallback(() => {
    return reminders.filter(reminder => 
      !reminder.is_completed && 
      new Date(reminder.reminder_date) < new Date()
    );
  }, [reminders]);

  const getPendingReminders = useCallback(() => {
    return reminders.filter(reminder => !reminder.is_completed);
  }, [reminders]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  return {
    reminders,
    loading,
    error,
    createReminder,
    completeReminder,
    loadReminders,
    getOverdueReminders,
    getPendingReminders
  };
}

/**
 * Hook for managing email campaigns
 */
export function useEmailCampaigns() {
  const { userId } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCampaigns = useCallback(async (filters = {}) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const emailCampaigns = await emailAutomationService.getEmailCampaigns(userId, filters);
      setCampaigns(emailCampaigns);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load email campaigns');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createCampaign = useCallback(async (campaignData) => {
    if (!userId) return null;

    try {
      setLoading(true);
      setError(null);
      const result = await emailAutomationService.createEmailCampaign(campaignData, userId);
      await loadCampaigns();
      toast.success('Email campaign created');
      return result;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to create email campaign');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadCampaigns]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  return {
    campaigns,
    loading,
    error,
    createCampaign,
    loadCampaigns
  };
}

/**
 * Hook for automation statistics and overview
 */
export function useAutomationStats() {
  const { userId } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const automationStats = await emailAutomationService.getAutomationStats(userId);
      setStats(automationStats);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load automation statistics');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats
  };
}