import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  EnvelopeIcon, 
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { documentAccessTrackingService } from '@/services/scanner';
import type { NotificationPreferences } from '@/services/scanner/types';
import { useTranslation } from '@/hooks/useTranslation';

interface DocumentNotificationSettingsProps {
  userId: string;
  onPreferencesUpdated?: (preferences: NotificationPreferences) => void;
}

const DocumentNotificationSettings: React.FC<DocumentNotificationSettingsProps> = ({
  userId,
  onPreferencesUpdated
}) => {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await documentAccessTrackingService.getNotificationPreferences(userId);
      
      if (result.success && result.preferences) {
        setPreferences(result.preferences);
      } else {
        setError(result.error || t('scanner.notifications.errors.loadPreferencesFailure'));
      }
    } catch (error) {
      setError(t('scanner.notifications.errors.loadPreferencesFailure'));
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences, ...updates };
    setPreferences(updatedPreferences);

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const result = await documentAccessTrackingService.updateNotificationPreferences(
        userId,
        updates
      );

      if (result.success) {
        setSaveStatus('success');
        onPreferencesUpdated?.(updatedPreferences);
        
        // Clear success status after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setError(result.error || t('scanner.notifications.errors.updatePreferencesFailure'));
        
        // Revert changes on error
        loadPreferences();
      }
    } catch (error) {
      setSaveStatus('error');
      setError(t('scanner.notifications.errors.updatePreferencesFailure'));
      
      // Revert changes on error
      loadPreferences();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
        <button
          onClick={loadPreferences}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BellIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">
            {t('scanner.notifications.title')}
          </h3>
        </div>
        
        {saveStatus === 'success' && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm">{t('scanner.notifications.saved')}</span>
          </div>
        )}
        
        {saveStatus === 'error' && (
          <div className="flex items-center space-x-2 text-red-600">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="text-sm">{t('scanner.notifications.saveError')}</span>
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        <div className="p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">
            {t('scanner.notifications.documentActivity.title')}
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('scanner.notifications.documentActivity.access')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('scanner.notifications.documentActivity.accessDescription')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.documentAccess}
                  onChange={(e) => handleToggle('documentAccess', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('scanner.notifications.documentActivity.download')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('scanner.notifications.documentActivity.downloadDescription')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.documentDownload}
                  onChange={(e) => handleToggle('documentDownload', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('scanner.notifications.documentActivity.share')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('scanner.notifications.documentActivity.shareDescription')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.documentShare}
                  onChange={(e) => handleToggle('documentShare', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">
            {t('scanner.notifications.digest.title')}
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('scanner.notifications.digest.daily')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('scanner.notifications.digest.dailyDescription')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.dailyDigest}
                  onChange={(e) => handleToggle('dailyDigest', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('scanner.notifications.digest.weekly')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('scanner.notifications.digest.weeklyDescription')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.weeklyReport}
                  onChange={(e) => handleToggle('weeklyReport', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">
            {t('scanner.notifications.delivery.title')}
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('scanner.notifications.delivery.email')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('scanner.notifications.delivery.emailDescription')}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => handleToggle('emailNotifications', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('scanner.notifications.delivery.inApp')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('scanner.notifications.delivery.inAppDescription')}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.inAppNotifications}
                  onChange={(e) => handleToggle('inAppNotifications', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          {t('scanner.notifications.helpText')}
        </p>
      </div>
    </div>
  );
};

export default DocumentNotificationSettings;