import React from 'react';
import { useTranslation } from 'react-i18next';
import SettingsFormSection from '@components/settings/SettingsFormSection';
import { useNotifications } from '@hooks/useNotifications';

const NotificationsSection = ({ setNotification }) => {
  const { t } = useTranslation('settings');
  const {
    notifications,
    isSaving,
    error,
    saveNotifications,
    handleNotificationChange,
    resetToDefaults,
  } = useNotifications();

  const handleSubmit = async e => {
    e.preventDefault();
    const success = await saveNotifications();
    if (success) {
      setNotification({
        show: true,
        message: t('notifications.alerts.saveSuccess'),
        type: 'success',
      });
    }
  };

  const handleReset = () => {
    if (window.confirm(t('notifications.alerts.resetConfirmation'))) {
      resetToDefaults();
    }
  };

  return (
    <SettingsFormSection
      title={t('notifications.title')}
      description={t('notifications.email.description')}
      onSubmit={handleSubmit}
    >
      <fieldset className='mb-6'>
        <legend className='text-base font-medium text-gray-900 mb-4'>
          {t('notifications.email.title')}
        </legend>
        <div className='space-y-4'>
          <div className='flex items-start'>
            <div className='flex items-center h-5'>
              <input
                id='emailNotifications'
                name='emailNotifications'
                type='checkbox'
                checked={notifications.emailNotifications}
                onChange={handleNotificationChange}
                className='focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded'
              />
            </div>
            <div className='ml-3 text-sm'>
              <label htmlFor='emailNotifications' className='font-medium text-gray-700'>
                {t('notifications.email.title')}
              </label>
              <p className='text-gray-500'>{t('notifications.email.description')}</p>
            </div>
          </div>

          <div className='flex items-start'>
            <div className='flex items-center h-5'>
              <input
                id='promotionalEmails'
                name='promotionalEmails'
                type='checkbox'
                checked={notifications.promotionalEmails}
                onChange={handleNotificationChange}
                className='focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded'
              />
            </div>
            <div className='ml-3 text-sm'>
              <label htmlFor='promotionalEmails' className='font-medium text-gray-700'>
                {t('notifications.promotional.title')}
              </label>
              <p className='text-gray-500'>{t('notifications.promotional.description')}</p>
            </div>
          </div>

          <div className='flex items-start'>
            <div className='flex items-center h-5'>
              <input
                id='weeklyDigest'
                name='weeklyDigest'
                type='checkbox'
                checked={notifications.weeklyDigest}
                onChange={handleNotificationChange}
                className='focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded'
              />
            </div>
            <div className='ml-3 text-sm'>
              <label htmlFor='weeklyDigest' className='font-medium text-gray-700'>
                {t('notifications.weekly.title')}
              </label>
              <p className='text-gray-500'>{t('notifications.weekly.description')}</p>
            </div>
          </div>

          <div className='flex items-start'>
            <div className='flex items-center h-5'>
              <input
                id='monthlyReport'
                name='monthlyReport'
                type='checkbox'
                checked={notifications.monthlyReport}
                onChange={handleNotificationChange}
                className='focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded'
              />
            </div>
            <div className='ml-3 text-sm'>
              <label htmlFor='monthlyReport' className='font-medium text-gray-700'>
                {t('notifications.monthly.title')}
              </label>
              <p className='text-gray-500'>{t('notifications.monthly.description')}</p>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className='mb-6'>
        <legend className='text-base font-medium text-gray-900 mb-4'>
          {t('notifications.devices.title')}
        </legend>
        <div className='space-y-4'>
          <div className='flex items-start'>
            <div className='flex items-center h-5'>
              <input
                id='smsNotifications'
                name='smsNotifications'
                type='checkbox'
                checked={notifications.smsNotifications}
                onChange={handleNotificationChange}
                className='focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded'
              />
            </div>
            <div className='ml-3 text-sm'>
              <label htmlFor='smsNotifications' className='font-medium text-gray-700'>
                {t('notifications.sms.title')}
              </label>
              <p className='text-gray-500'>{t('notifications.sms.description')}</p>
            </div>
          </div>

          <div className='flex items-start'>
            <div className='flex items-center h-5'>
              <input
                id='securityAlerts'
                name='securityAlerts'
                type='checkbox'
                checked={notifications.securityAlerts}
                onChange={handleNotificationChange}
                className='focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded'
              />
            </div>
            <div className='ml-3 text-sm'>
              <label htmlFor='securityAlerts' className='font-medium text-gray-700'>
                {t('notifications.security.title')}
              </label>
              <p className='text-gray-500'>{t('notifications.security.description')}</p>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Error Display */}
      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex justify-end space-x-3 pt-5 mt-8 border-t border-gray-200'>
        <button
          type='button'
          onClick={handleReset}
          className='bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          {t('notifications.button.restore')}
        </button>
        <button
          type='submit'
          disabled={isSaving}
          className='inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70'
        >
          {isSaving ? (
            <>
              <svg
                className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              {t('buttons.saving')}
            </>
          ) : (
            t('notifications.button.save')
          )}
        </button>
      </div>
    </SettingsFormSection>
  );
};

export default NotificationsSection;
