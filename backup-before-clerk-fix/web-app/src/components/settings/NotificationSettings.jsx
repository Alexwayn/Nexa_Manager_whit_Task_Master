import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserBypass as useUser } from '@hooks/useClerkBypass';
import { useClerkAuth } from '../../hooks/useClerkAuth';
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function NotificationSettings({ showNotification }) {
  const { t } = useTranslation('settings');
  const { user } = useUser();
  const { isAuthenticated } = useClerkAuth();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    email: {
      invoices: true,
      payments: true,
      quotes: true,
      clients: false,
      reports: true,
      security: true,
      marketing: false,
      systemUpdates: true,
    },
    sms: {
      invoices: false,
      payments: true,
      quotes: false,
      clients: false,
      reports: false,
      security: true,
      marketing: false,
      systemUpdates: false,
    },
    push: {
      invoices: true,
      payments: true,
      quotes: true,
      clients: true,
      reports: false,
      security: true,
      marketing: false,
      systemUpdates: true,
    },
    frequency: {
      digest: 'daily', // daily, weekly, monthly, never
      reminders: 'enabled', // enabled, disabled
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
      },
    },
  });

  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotificationPreferences();
    }
  }, [isAuthenticated, user]);

  const loadNotificationPreferences = async () => {
    setLoading(true);
    try {
      // Load user's email and phone from Clerk
      if (user) {
        setEmailAddress(user.primaryEmailAddress?.emailAddress || '');
        setPhoneNumber(user.primaryPhoneNumber?.phoneNumber || '');
      }

      // Load notification preferences from localStorage or API
      const savedPreferences = localStorage.getItem('notificationPreferences');
      if (savedPreferences) {
        setPreferences(prev => ({ ...prev, ...JSON.parse(savedPreferences) }));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      showNotification('Error loading notification preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (category, type, value) => {
    const newPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [type]: value,
      },
    };

    setPreferences(newPreferences);

    try {
      // Save to localStorage (replace with API call)
      localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
      showNotification('Notification preferences updated', 'success');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showNotification('Error saving preferences', 'error');
    }
  };

  const updateFrequencyPreference = async (type, value) => {
    const newPreferences = {
      ...preferences,
      frequency: {
        ...preferences.frequency,
        [type]: value,
      },
    };

    setPreferences(newPreferences);

    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
      showNotification('Frequency preferences updated', 'success');
    } catch (error) {
      console.error('Error saving frequency preferences:', error);
      showNotification('Error saving preferences', 'error');
    }
  };

  const updateQuietHours = async (field, value) => {
    const newPreferences = {
      ...preferences,
      frequency: {
        ...preferences.frequency,
        quietHours: {
          ...preferences.frequency.quietHours,
          [field]: value,
        },
      },
    };

    setPreferences(newPreferences);

    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
      showNotification('Quiet hours updated', 'success');
    } catch (error) {
      console.error('Error saving quiet hours:', error);
      showNotification('Error saving preferences', 'error');
    }
  };

  const sendTestNotification = async channel => {
    setLoading(true);
    try {
      // Mock sending test notification
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification(`Test ${channel} notification sent successfully`, 'success');
    } catch (error) {
      console.error('Error sending test notification:', error);
      showNotification('Error sending test notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = [
    {
      key: 'invoices',
      name: t('notifications.types.invoices', 'Invoices'),
      description: t(
        'notifications.types.invoicesDesc',
        'New invoices, payment confirmations, overdue notices',
      ),
    },
    {
      key: 'payments',
      name: t('notifications.types.payments', 'Payments'),
      description: t(
        'notifications.types.paymentsDesc',
        'Payment received, failed payments, refunds',
      ),
    },
    {
      key: 'quotes',
      name: t('notifications.types.quotes', 'Quotes'),
      description: t('notifications.types.quotesDesc', 'Quote requests, approvals, expirations'),
    },
    {
      key: 'clients',
      name: t('notifications.types.clients', 'Clients'),
      description: t(
        'notifications.types.clientsDesc',
        'New client registrations, profile updates',
      ),
    },
    {
      key: 'reports',
      name: t('notifications.types.reports', 'Reports'),
      description: t('notifications.types.reportsDesc', 'Weekly summaries, financial reports'),
    },
    {
      key: 'security',
      name: t('notifications.types.security', 'Security'),
      description: t(
        'notifications.types.securityDesc',
        'Login alerts, security updates, suspicious activity',
      ),
    },
    {
      key: 'marketing',
      name: t('notifications.types.marketing', 'Marketing'),
      description: t(
        'notifications.types.marketingDesc',
        'Product updates, newsletters, promotional offers',
      ),
    },
    {
      key: 'systemUpdates',
      name: t('notifications.types.system', 'System Updates'),
      description: t(
        'notifications.types.systemDesc',
        'Maintenance notices, feature announcements',
      ),
    },
  ];

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <p className='text-gray-500'>Please sign in to access notification settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h3 className='text-lg font-medium text-gray-900'>
          {t('notifications.title', 'Notification Settings')}
        </h3>
        <p className='mt-1 text-sm text-gray-600'>
          {t('notifications.description', 'Choose how and when you want to receive notifications.')}
        </p>
      </div>

      {/* Contact Information */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h4 className='text-sm font-medium text-gray-900 mb-4'>
          {t('notifications.contact.title', 'Contact Information')}
        </h4>
        <div className='space-y-4'>
          <div className='flex items-center space-x-3'>
            <EnvelopeIcon className='w-5 h-5 text-gray-400' />
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700'>
                {t('notifications.contact.email', 'Email Address')}
              </label>
              <p className='text-sm text-gray-600'>{emailAddress || 'No email address'}</p>
            </div>
            <button
              onClick={() => sendTestNotification('email')}
              className='text-sm text-blue-600 hover:text-blue-700 font-medium'
            >
              {t('notifications.contact.testEmail', 'Test Email')}
            </button>
          </div>

          <div className='flex items-center space-x-3'>
            <DevicePhoneMobileIcon className='w-5 h-5 text-gray-400' />
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700'>
                {t('notifications.contact.phone', 'Phone Number')}
              </label>
              <p className='text-sm text-gray-600'>{phoneNumber || 'No phone number'}</p>
            </div>
            <button
              onClick={() => sendTestNotification('SMS')}
              className='text-sm text-blue-600 hover:text-blue-700 font-medium'
            >
              {t('notifications.contact.testSMS', 'Test SMS')}
            </button>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h4 className='text-sm font-medium text-gray-900 mb-4'>
          {t('notifications.preferences.title', 'Notification Preferences')}
        </h4>

        <div className='overflow-x-auto'>
          <table className='min-w-full'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='text-left py-3 pr-4 text-sm font-medium text-gray-900'>
                  {t('notifications.preferences.type', 'Notification Type')}
                </th>
                <th className='text-center py-3 px-2 text-sm font-medium text-gray-900'>
                  <EnvelopeIcon className='w-5 h-5 mx-auto' />
                  <span className='sr-only'>Email</span>
                </th>
                <th className='text-center py-3 px-2 text-sm font-medium text-gray-900'>
                  <DevicePhoneMobileIcon className='w-5 h-5 mx-auto' />
                  <span className='sr-only'>SMS</span>
                </th>
                <th className='text-center py-3 px-2 text-sm font-medium text-gray-900'>
                  <BellIcon className='w-5 h-5 mx-auto' />
                  <span className='sr-only'>Push</span>
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {notificationTypes.map(type => (
                <tr key={type.key} className='hover:bg-gray-50'>
                  <td className='py-4 pr-4'>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>{type.name}</p>
                      <p className='text-xs text-gray-600'>{type.description}</p>
                    </div>
                  </td>
                  <td className='text-center py-4 px-2'>
                    <button
                      onClick={() =>
                        updatePreference('email', type.key, !preferences.email[type.key])
                      }
                      className='text-gray-400 hover:text-gray-600'
                    >
                      {preferences.email[type.key] ? (
                        <CheckCircleIcon className='w-5 h-5 text-green-600' />
                      ) : (
                        <XCircleIcon className='w-5 h-5 text-gray-300' />
                      )}
                    </button>
                  </td>
                  <td className='text-center py-4 px-2'>
                    <button
                      onClick={() => updatePreference('sms', type.key, !preferences.sms[type.key])}
                      className='text-gray-400 hover:text-gray-600'
                    >
                      {preferences.sms[type.key] ? (
                        <CheckCircleIcon className='w-5 h-5 text-green-600' />
                      ) : (
                        <XCircleIcon className='w-5 h-5 text-gray-300' />
                      )}
                    </button>
                  </td>
                  <td className='text-center py-4 px-2'>
                    <button
                      onClick={() =>
                        updatePreference('push', type.key, !preferences.push[type.key])
                      }
                      className='text-gray-400 hover:text-gray-600'
                    >
                      {preferences.push[type.key] ? (
                        <CheckCircleIcon className='w-5 h-5 text-green-600' />
                      ) : (
                        <XCircleIcon className='w-5 h-5 text-gray-300' />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequency Settings */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <div className='flex items-center space-x-3 mb-4'>
          <CogIcon className='w-6 h-6 text-blue-600' />
          <h4 className='text-sm font-medium text-gray-900'>
            {t('notifications.frequency.title', 'Frequency Settings')}
          </h4>
        </div>

        <div className='space-y-6'>
          {/* Digest Frequency */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('notifications.frequency.digest', 'Email Digest Frequency')}
            </label>
            <select
              value={preferences.frequency.digest}
              onChange={e => updateFrequencyPreference('digest', e.target.value)}
              className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
            >
              <option value='never'>{t('notifications.frequency.never', 'Never')}</option>
              <option value='daily'>{t('notifications.frequency.daily', 'Daily')}</option>
              <option value='weekly'>{t('notifications.frequency.weekly', 'Weekly')}</option>
              <option value='monthly'>{t('notifications.frequency.monthly', 'Monthly')}</option>
            </select>
          </div>

          {/* Reminders */}
          <div className='flex items-center justify-between'>
            <div>
              <label className='text-sm font-medium text-gray-700'>
                {t('notifications.frequency.reminders', 'Payment Reminders')}
              </label>
              <p className='text-xs text-gray-600'>
                {t('notifications.frequency.remindersDesc', 'Send reminders for overdue invoices')}
              </p>
            </div>
            <button
              onClick={() =>
                updateFrequencyPreference(
                  'reminders',
                  preferences.frequency.reminders === 'enabled' ? 'disabled' : 'enabled',
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                preferences.frequency.reminders === 'enabled' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.frequency.reminders === 'enabled' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Quiet Hours */}
          <div>
            <div className='flex items-center justify-between mb-3'>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  {t('notifications.frequency.quietHours', 'Quiet Hours')}
                </label>
                <p className='text-xs text-gray-600'>
                  {t(
                    'notifications.frequency.quietHoursDesc',
                    'Disable notifications during these hours',
                  )}
                </p>
              </div>
              <button
                onClick={() =>
                  updateQuietHours('enabled', !preferences.frequency.quietHours.enabled)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  preferences.frequency.quietHours.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.frequency.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {preferences.frequency.quietHours.enabled && (
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    {t('notifications.frequency.startTime', 'Start Time')}
                  </label>
                  <input
                    type='time'
                    value={preferences.frequency.quietHours.start}
                    onChange={e => updateQuietHours('start', e.target.value)}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    {t('notifications.frequency.endTime', 'End Time')}
                  </label>
                  <input
                    type='time'
                    value={preferences.frequency.quietHours.end}
                    onChange={e => updateQuietHours('end', e.target.value)}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
