import React, { useState } from 'react';
import { BellIcon, DevicePhoneMobileIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const NotificationSettingsFallback = ({ settings, onSettingsChange, showNotification }) => {
  const [localSettings, setLocalSettings] = useState(
    settings || {
      email: true,
      push: true,
      sms: false,
      invoiceReminders: true,
      paymentConfirmations: true,
      quoteUpdates: true,
      systemUpdates: false,
    },
  );

  const handleToggle = key => {
    const newSettings = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(newSettings);
    onSettingsChange && onSettingsChange(newSettings);
    console.log('🔔 Notification setting changed:', key, '→', newSettings[key]);
  };

  const handleSave = () => {
    console.log('💾 Notification settings saved (demo mode):', localSettings);
    showNotification &&
      showNotification('Notification settings saved successfully (demo mode)', 'success');
  };

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-gray-900'>Notification Settings</h2>
        <p className='mt-1 text-sm text-gray-600'>
          Manage how you receive notifications and updates
        </p>
        <div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <p className='text-sm text-blue-700'>
            🧪 <strong>Demo Mode:</strong> This is a simplified version. Changes are not saved to
            the database.
          </p>
        </div>
      </div>

      {/* General Notifications */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
          <BellIcon className='h-5 w-5 mr-2' />
          General Notifications
        </h3>
        <p className='text-sm text-gray-600 mb-6'>Choose how you want to receive notifications</p>

        <div className='space-y-4'>
          {/* Email Notifications */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <EnvelopeIcon className='h-5 w-5 text-gray-400 mr-3' />
              <div>
                <p className='text-sm font-medium text-gray-900'>Email Notifications</p>
                <p className='text-sm text-gray-500'>Receive notifications via email</p>
              </div>
            </div>
            <button
              type='button'
              onClick={() => handleToggle('email')}
              className={`${
                localSettings.email ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  localSettings.email ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          {/* Push Notifications */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <DevicePhoneMobileIcon className='h-5 w-5 text-gray-400 mr-3' />
              <div>
                <p className='text-sm font-medium text-gray-900'>Push Notifications</p>
                <p className='text-sm text-gray-500'>Receive push notifications on your device</p>
              </div>
            </div>
            <button
              type='button'
              onClick={() => handleToggle('push')}
              className={`${
                localSettings.push ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  localSettings.push ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          {/* SMS Notifications */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <BellIcon className='h-5 w-5 text-gray-400 mr-3' />
              <div>
                <p className='text-sm font-medium text-gray-900'>SMS Notifications</p>
                <p className='text-sm text-gray-500'>Receive notifications via SMS</p>
              </div>
            </div>
            <button
              type='button'
              onClick={() => handleToggle('sms')}
              className={`${
                localSettings.sms ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  localSettings.sms ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Business Notifications */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Business Notifications</h3>
        <p className='text-sm text-gray-600 mb-6'>Configure notifications for business events</p>

        <div className='space-y-4'>
          {/* Invoice Reminders */}
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-900'>Invoice Reminders</p>
              <p className='text-sm text-gray-500'>Get notified about overdue invoices</p>
            </div>
            <button
              type='button'
              onClick={() => handleToggle('invoiceReminders')}
              className={`${
                localSettings.invoiceReminders ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  localSettings.invoiceReminders ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          {/* Payment Confirmations */}
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-900'>Payment Confirmations</p>
              <p className='text-sm text-gray-500'>Get notified when payments are received</p>
            </div>
            <button
              type='button'
              onClick={() => handleToggle('paymentConfirmations')}
              className={`${
                localSettings.paymentConfirmations ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  localSettings.paymentConfirmations ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          {/* Quote Updates */}
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-900'>Quote Updates</p>
              <p className='text-sm text-gray-500'>Get notified about quote status changes</p>
            </div>
            <button
              type='button'
              onClick={() => handleToggle('quoteUpdates')}
              className={`${
                localSettings.quoteUpdates ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  localSettings.quoteUpdates ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className='flex justify-end'>
        <button
          onClick={handleSave}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        >
          Save Notification Settings
        </button>
      </div>
    </div>
  );
};

export default NotificationSettingsFallback;
