import { useState, useEffect } from 'react';
import {
  EnvelopeIcon,
  PencilIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  PlayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { useClerkAuth } from '../../hooks/useClerkAuth';
import Logger from '@utils/Logger';
import EmailSettingsService from '@lib/emailSettingsService';

export default function EmailSettings({ showNotification }) {
  const { t } = useTranslation('settings');
  const { user } = useUser();
  const { isAuthenticated } = useClerkAuth();

  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');

  // Email settings state
  const [emailSettings, setEmailSettings] = useState(null);
  const [notificationPreferences, setNotificationPreferences] = useState(null);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [emailActivity, setEmailActivity] = useState([]);
  const [emailStats, setEmailStats] = useState(null);

  // UI state
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [newTemplateModal, setNewTemplateModal] = useState(false);
  const [testEmailModal, setTestEmailModal] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form state
  const [testEmail, setTestEmail] = useState(user?.emailAddresses?.[0]?.emailAddress || '');
  const [smtpTestEmail, setSmtpTestEmail] = useState(user?.emailAddresses?.[0]?.emailAddress || '');

  useEffect(() => {
    if (isAuthenticated && user) {
      loadEmailData();
    }
  }, [isAuthenticated, user]);

  const loadEmailData = async () => {
    try {
      setIsLoading(true);

      const [settings, preferences, templates, activity, stats] = await Promise.all([
        EmailSettingsService.getEmailSettings(),
        EmailSettingsService.getNotificationPreferences(),
        EmailSettingsService.getEmailTemplates(),
        EmailSettingsService.getEmailActivity({ limit: 50 }),
        EmailSettingsService.getEmailStats('30d'),
      ]);

      setEmailSettings(settings);
      setNotificationPreferences(preferences);
      setEmailTemplates(templates);
      setEmailActivity(activity);
      setEmailStats(stats);

      Logger.info('Email data loaded successfully');
    } catch (error) {
      Logger.error('Error loading email data:', error);
      showNotification?.('Error loading email settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    try {
      setIsSaving(true);

      const validation = EmailSettingsService.validateSmtpSettings(emailSettings);
      if (!validation.isValid) {
        showNotification?.(validation.errors[0], 'error');
        return;
      }

      await EmailSettingsService.saveEmailSettings(emailSettings);
      showNotification?.('Email settings saved successfully', 'success');
      Logger.info('Email settings saved');
    } catch (error) {
      Logger.error('Error saving email settings:', error);
      showNotification?.('Error saving email settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotificationPreferences = async () => {
    try {
      setIsSaving(true);
      await EmailSettingsService.saveNotificationPreferences(notificationPreferences);
      showNotification?.('Notification preferences saved successfully', 'success');
      Logger.info('Notification preferences saved');
    } catch (error) {
      Logger.error('Error saving notification preferences:', error);
      showNotification?.('Error saving notification preferences', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmailConfiguration = async () => {
    try {
      setIsSaving(true);
      const result = await EmailSettingsService.testEmailConfiguration(
        smtpTestEmail,
        emailSettings,
      );

      if (result.success) {
        showNotification?.('Test email sent successfully! Check your inbox.', 'success');
      } else {
        showNotification?.(result.error || 'Test email failed', 'error');
      }
    } catch (error) {
      Logger.error('Error testing email configuration:', error);
      showNotification?.('Error testing email configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTemplate = async templateData => {
    try {
      setIsSaving(true);

      const validation = EmailSettingsService.validateEmailTemplate(templateData);
      if (!validation.isValid) {
        showNotification?.(validation.errors[0], 'error');
        return;
      }

      await EmailSettingsService.saveEmailTemplate(templateData);
      await loadEmailData(); // Reload to get updated templates

      showNotification?.('Email template saved successfully', 'success');
      setEditingTemplate(null);
      setNewTemplateModal(false);
    } catch (error) {
      Logger.error('Error saving email template:', error);
      showNotification?.('Error saving email template', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async templateKey => {
    try {
      if (!window.confirm('Are you sure you want to delete this template?')) {
        return;
      }

      await EmailSettingsService.deleteEmailTemplate(templateKey);
      await loadEmailData(); // Reload to get updated templates

      showNotification?.('Email template deleted successfully', 'success');
    } catch (error) {
      Logger.error('Error deleting email template:', error);
      showNotification?.('Error deleting email template', 'error');
    }
  };

  const handlePreviewTemplate = async templateKey => {
    try {
      const preview = await EmailSettingsService.previewEmailTemplate(templateKey);
      setPreviewTemplate(preview);
    } catch (error) {
      Logger.error('Error previewing email template:', error);
      showNotification?.('Error previewing email template', 'error');
    }
  };

  const handleSendTestEmail = async templateKey => {
    try {
      setIsSaving(true);
      const result = await EmailSettingsService.sendTestEmail(templateKey, testEmail);

      if (result.success) {
        showNotification?.('Test email sent successfully!', 'success');
        setTestEmailModal(null);
        await loadEmailData(); // Reload activity
      } else {
        showNotification?.('Error sending test email', 'error');
      }
    } catch (error) {
      Logger.error('Error sending test email:', error);
      showNotification?.('Error sending test email', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Render providers configuration tab
  const renderProvidersTab = () => (
    <div className='space-y-6'>
      <div>
        <h4 className='text-lg font-medium text-gray-900 mb-4'>
          {t('email.providers.title', 'Email Provider Configuration')}
        </h4>
        <p className='text-sm text-gray-600 mb-6'>
          {t(
            'email.providers.description',
            'Configure your email service provider for sending emails.',
          )}
        </p>
      </div>

      {/* Provider Selection */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h5 className='text-md font-medium text-gray-900 mb-4'>Email Provider</h5>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Object.entries(EmailSettingsService.providers).map(([key, provider]) => (
            <div
              key={key}
              onClick={() => setEmailSettings({ ...emailSettings, provider: key })}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                emailSettings?.provider === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className='text-2xl mb-2'>{provider.icon}</div>
              <div className='font-medium text-gray-900'>{provider.name}</div>
              <div className='text-sm text-gray-600'>{provider.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Configuration */}
      {emailSettings?.provider === 'smtp' && (
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <h5 className='text-md font-medium text-gray-900 mb-4'>SMTP Configuration</h5>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>SMTP Host</label>
              <input
                type='text'
                value={emailSettings.smtp_host || ''}
                onChange={e => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='smtp.gmail.com'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>SMTP Port</label>
              <input
                type='number'
                value={emailSettings.smtp_port || 587}
                onChange={e =>
                  setEmailSettings({ ...emailSettings, smtp_port: parseInt(e.target.value) })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Username</label>
              <input
                type='text'
                value={emailSettings.smtp_username || ''}
                onChange={e =>
                  setEmailSettings({ ...emailSettings, smtp_username: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='your-email@gmail.com'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Password</label>
              <input
                type='password'
                value={emailSettings.smtp_password || ''}
                onChange={e =>
                  setEmailSettings({ ...emailSettings, smtp_password: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='your-app-password'
              />
            </div>
          </div>

          <div className='mt-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Encryption</label>
            <select
              value={emailSettings.smtp_encryption || 'tls'}
              onChange={e =>
                setEmailSettings({ ...emailSettings, smtp_encryption: e.target.value })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='tls'>TLS</option>
              <option value='ssl'>SSL</option>
              <option value='none'>None</option>
            </select>
          </div>
        </div>
      )}

      {/* From Address Configuration */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h5 className='text-md font-medium text-gray-900 mb-4'>From Address</h5>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>From Email</label>
            <input
              type='email'
              value={emailSettings?.from_email || ''}
              onChange={e => setEmailSettings({ ...emailSettings, from_email: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='noreply@yourcompany.com'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>From Name</label>
            <input
              type='text'
              value={emailSettings?.from_name || ''}
              onChange={e => setEmailSettings({ ...emailSettings, from_name: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Your Company'
            />
          </div>
        </div>
      </div>

      {/* Test Configuration */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h5 className='text-md font-medium text-gray-900 mb-4'>Test Configuration</h5>
        <div className='flex items-center space-x-4'>
          <div className='flex-1'>
            <input
              type='email'
              value={smtpTestEmail}
              onChange={e => setSmtpTestEmail(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='test@example.com'
            />
          </div>
          <button
            onClick={handleTestEmailConfiguration}
            disabled={isSaving || !smtpTestEmail}
            className='bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center space-x-2'
          >
            <PlayIcon className='h-4 w-4' />
            <span>{isSaving ? 'Testing...' : 'Send Test'}</span>
          </button>
        </div>
      </div>

      <div className='flex justify-end'>
        <button
          onClick={handleSaveEmailSettings}
          disabled={isSaving}
          className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
        >
          {isSaving ? 'Saving...' : 'Save Email Settings'}
        </button>
      </div>
    </div>
  );

  // Render notifications preferences tab
  const renderNotificationSettings = () => (
    <div className='space-y-6'>
      <div>
        <h4 className='text-lg font-medium text-gray-900 mb-4'>
          {t('email.notifications.title', 'Email Notifications')}
        </h4>
        <p className='text-sm text-gray-600 mb-6'>
          {t(
            'email.notifications.description',
            'Choose which email notifications you want to receive.',
          )}
        </p>
      </div>

      {/* Invoice Notifications */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h5 className='text-md font-medium text-gray-900 mb-4 flex items-center'>
          <span className='mr-2'>🧾</span> Invoice Notifications
        </h5>
        <div className='space-y-4'>
          {[
            {
              key: 'invoice_sent',
              label: 'Invoice Sent',
              desc: 'When an invoice is sent to a client',
            },
            {
              key: 'invoice_viewed',
              label: 'Invoice Viewed',
              desc: 'When a client views an invoice',
            },
            {
              key: 'invoice_paid',
              label: 'Invoice Paid',
              desc: 'When an invoice is marked as paid',
            },
            {
              key: 'invoice_overdue',
              label: 'Invoice Overdue',
              desc: 'When an invoice becomes overdue',
            },
            {
              key: 'invoice_cancelled',
              label: 'Invoice Cancelled',
              desc: 'When an invoice is cancelled',
            },
          ].map(({ key, label, desc }) => (
            <div key={key} className='flex items-center justify-between'>
              <div>
                <label className='text-sm font-medium text-gray-700'>{label}</label>
                <p className='text-xs text-gray-500'>{desc}</p>
              </div>
              <input
                type='checkbox'
                checked={notificationPreferences?.[key] || false}
                onChange={e =>
                  setNotificationPreferences({
                    ...notificationPreferences,
                    [key]: e.target.checked,
                  })
                }
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
            </div>
          ))}
        </div>
      </div>

      {/* Payment Notifications */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h5 className='text-md font-medium text-gray-900 mb-4 flex items-center'>
          <span className='mr-2'>💰</span> Payment Notifications
        </h5>
        <div className='space-y-4'>
          {[
            {
              key: 'payment_received',
              label: 'Payment Received',
              desc: 'When a payment is received',
            },
            {
              key: 'payment_failed',
              label: 'Payment Failed',
              desc: 'When a payment attempt fails',
            },
            {
              key: 'payment_refunded',
              label: 'Payment Refunded',
              desc: 'When a payment is refunded',
            },
            {
              key: 'payment_reminder_sent',
              label: 'Reminder Sent',
              desc: 'When payment reminders are sent',
            },
          ].map(({ key, label, desc }) => (
            <div key={key} className='flex items-center justify-between'>
              <div>
                <label className='text-sm font-medium text-gray-700'>{label}</label>
                <p className='text-xs text-gray-500'>{desc}</p>
              </div>
              <input
                type='checkbox'
                checked={notificationPreferences?.[key] || false}
                onChange={e =>
                  setNotificationPreferences({
                    ...notificationPreferences,
                    [key]: e.target.checked,
                  })
                }
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quote Notifications */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h5 className='text-md font-medium text-gray-900 mb-4 flex items-center'>
          <span className='mr-2'>📝</span> Quote Notifications
        </h5>
        <div className='space-y-4'>
          {[
            { key: 'quote_sent', label: 'Quote Sent', desc: 'When a quote is sent to a client' },
            {
              key: 'quote_accepted',
              label: 'Quote Accepted',
              desc: 'When a client accepts a quote',
            },
            {
              key: 'quote_declined',
              label: 'Quote Declined',
              desc: 'When a client declines a quote',
            },
            { key: 'quote_expired', label: 'Quote Expired', desc: 'When a quote expires' },
          ].map(({ key, label, desc }) => (
            <div key={key} className='flex items-center justify-between'>
              <div>
                <label className='text-sm font-medium text-gray-700'>{label}</label>
                <p className='text-xs text-gray-500'>{desc}</p>
              </div>
              <input
                type='checkbox'
                checked={notificationPreferences?.[key] || false}
                onChange={e =>
                  setNotificationPreferences({
                    ...notificationPreferences,
                    [key]: e.target.checked,
                  })
                }
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
            </div>
          ))}
        </div>
      </div>

      {/* System Notifications */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h5 className='text-md font-medium text-gray-900 mb-4 flex items-center'>
          <span className='mr-2'>⚙️</span> System Notifications
        </h5>
        <div className='space-y-4'>
          {[
            {
              key: 'system_backup',
              label: 'System Backup',
              desc: 'Backup completion notifications',
            },
            { key: 'system_maintenance', label: 'Maintenance', desc: 'System maintenance updates' },
            {
              key: 'system_security',
              label: 'Security Alerts',
              desc: 'Security-related notifications',
            },
            { key: 'system_updates', label: 'Feature Updates', desc: 'New feature announcements' },
          ].map(({ key, label, desc }) => (
            <div key={key} className='flex items-center justify-between'>
              <div>
                <label className='text-sm font-medium text-gray-700'>{label}</label>
                <p className='text-xs text-gray-500'>{desc}</p>
              </div>
              <input
                type='checkbox'
                checked={notificationPreferences?.[key] || false}
                onChange={e =>
                  setNotificationPreferences({
                    ...notificationPreferences,
                    [key]: e.target.checked,
                  })
                }
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
            </div>
          ))}
        </div>
      </div>

      <div className='flex justify-end'>
        <button
          onClick={handleSaveNotificationPreferences}
          disabled={isSaving}
          className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
        >
          {isSaving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  );

  // Render email templates tab
  const renderEmailTemplates = () => {
    const filteredTemplates = selectedCategory
      ? emailTemplates.filter(t => t.category === selectedCategory)
      : emailTemplates;

    return (
      <div className='space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h4 className='text-lg font-medium text-gray-900'>
              {t('email.templates.title', 'Email Templates')}
            </h4>
            <p className='text-sm text-gray-600'>
              {t(
                'email.templates.description',
                'Customize your email templates for different types of communications.',
              )}
            </p>
          </div>
          <button
            onClick={() => setNewTemplateModal(true)}
            className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2'
          >
            <PlusIcon className='h-4 w-4' />
            <span>New Template</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-sm ${
              !selectedCategory
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {Object.entries(EmailSettingsService.templateCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 ${
                selectedCategory === key
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        <div className='grid gap-6'>
          {filteredTemplates.map(template => (
            <div key={template.id} className='bg-white border border-gray-200 rounded-lg p-6'>
              <div className='flex justify-between items-start mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <span>{EmailSettingsService.templateCategories[template.category]?.icon}</span>
                    <h5 className='text-md font-medium text-gray-900'>{template.name}</h5>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        EmailSettingsService.templateCategories[template.category]?.color === 'blue'
                          ? 'bg-blue-100 text-blue-800'
                          : EmailSettingsService.templateCategories[template.category]?.color ===
                              'green'
                            ? 'bg-green-100 text-green-800'
                            : EmailSettingsService.templateCategories[template.category]?.color ===
                                'purple'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {EmailSettingsService.templateCategories[template.category]?.name}
                    </span>
                  </div>
                  <p className='text-sm text-gray-600'>{template.subject}</p>
                  {template.description && (
                    <p className='text-xs text-gray-500 mt-1'>{template.description}</p>
                  )}
                </div>
                <div className='flex space-x-2 ml-4'>
                  <button
                    onClick={() => handlePreviewTemplate(template.template_key)}
                    className='text-gray-400 hover:text-gray-600'
                    title='Preview'
                  >
                    <EyeIcon className='h-5 w-5' />
                  </button>
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className='text-gray-400 hover:text-gray-600'
                    title='Edit'
                  >
                    <PencilIcon className='h-5 w-5' />
                  </button>
                  <button
                    onClick={() => setTestEmailModal(template.template_key)}
                    className='text-blue-600 hover:text-blue-800'
                    title='Send Test'
                  >
                    <EnvelopeIcon className='h-5 w-5' />
                  </button>
                  {!template.is_default && (
                    <button
                      onClick={() => handleDeleteTemplate(template.template_key)}
                      className='text-red-600 hover:text-red-800'
                      title='Delete'
                    >
                      <TrashIcon className='h-5 w-5' />
                    </button>
                  )}
                </div>
              </div>

              <div className='text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto'>
                {template.body_text.substring(0, 200)}...
              </div>

              {template.variables && template.variables.length > 0 && (
                <div className='mt-3 flex flex-wrap gap-2'>
                  {template.variables.map(variable => (
                    <span
                      key={variable}
                      className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
                    >
                      {'{' + variable + '}'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render email activity tab
  const renderEmailActivity = () => (
    <div className='space-y-6'>
      <div>
        <h4 className='text-lg font-medium text-gray-900 mb-4'>Email Activity & Statistics</h4>
        <p className='text-sm text-gray-600 mb-6'>
          View email delivery history and performance statistics.
        </p>
      </div>

      {/* Email Statistics */}
      {emailStats && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-white border border-gray-200 rounded-lg p-4'>
            <div className='text-2xl font-bold text-gray-900'>{emailStats.total}</div>
            <div className='text-sm text-gray-600'>Total Emails</div>
          </div>
          <div className='bg-white border border-gray-200 rounded-lg p-4'>
            <div className='text-2xl font-bold text-green-600'>{emailStats.sent}</div>
            <div className='text-sm text-gray-600'>Sent Successfully</div>
          </div>
          <div className='bg-white border border-gray-200 rounded-lg p-4'>
            <div className='text-2xl font-bold text-red-600'>{emailStats.failed}</div>
            <div className='text-sm text-gray-600'>Failed</div>
          </div>
          <div className='bg-white border border-gray-200 rounded-lg p-4'>
            <div className='text-2xl font-bold text-blue-600'>{emailStats.successRate}%</div>
            <div className='text-sm text-gray-600'>Success Rate</div>
          </div>
        </div>
      )}

      {/* Email Activity History */}
      <div className='bg-white border border-gray-200 rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h5 className='text-md font-medium text-gray-900'>Recent Email Activity</h5>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Recipient
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Subject
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Template
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Sent
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {emailActivity.map(activity => (
                <tr key={activity.id}>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {activity.recipient_email}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {activity.subject}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                    {activity.template_key}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : activity.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {activity.status}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                    {activity.sent_at ? new Date(activity.sent_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <p className='text-gray-500'>Please sign in to access email settings.</p>
        </div>
      </div>
    );
  }

  // Main component render
  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg leading-6 font-medium text-gray-900'>
          {t('email.title', 'Email Settings')}
        </h3>
        <p className='mt-1 text-sm text-gray-500'>
          {t('email.description', 'Manage your email provider, notifications, and templates.')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8'>
          {[
            { key: 'providers', label: 'Configuration', icon: Cog6ToothIcon },
            { key: 'notifications', label: 'Notifications', icon: EnvelopeIcon },
            { key: 'templates', label: 'Templates', icon: PencilIcon },
            { key: 'activity', label: 'Activity', icon: ChartBarIcon },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className='h-4 w-4' />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'providers' && renderProvidersTab()}
      {activeTab === 'notifications' && renderNotificationSettings()}
      {activeTab === 'templates' && renderEmailTemplates()}
      {activeTab === 'activity' && renderEmailActivity()}

      {/* Test Email Modal */}
      {testEmailModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Send Test Email</h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Test Email Address
                </label>
                <input
                  type='email'
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='test@example.com'
                />
              </div>
            </div>
            <div className='flex justify-end space-x-3 mt-6'>
              <button
                onClick={() => setTestEmailModal(null)}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendTestEmail(testEmailModal)}
                disabled={isSaving || !testEmail}
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50'
              >
                {isSaving ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-medium text-gray-900'>Template Preview</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className='text-gray-400 hover:text-gray-600'
              >
                <XMarkIcon className='h-6 w-6' />
              </button>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Subject</label>
                <div className='p-3 bg-gray-50 rounded-md'>{previewTemplate.subject}</div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Email Body</label>
                <div className='p-3 bg-gray-50 rounded-md whitespace-pre-wrap max-h-96 overflow-y-auto'>
                  {previewTemplate.body}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
