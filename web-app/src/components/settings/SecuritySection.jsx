import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SettingsFormSection from '@components/settings/SettingsFormSection';
import SettingsTable from '@components/settings/SettingsTable';
import { useUserSessions } from '@hooks/useUserSessions';

const SecuritySection = ({ setNotification }) => {
  const { t } = useTranslation('settings');
  const {
    sessions,
    isLoading: loadingSessions,
    isUpdatingPassword,
    error,
    updatePassword,
    revokeSession,
    clearError,
  } = useUserSessions();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const success = await updatePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword,
      passwordForm.confirmPassword,
    );

    if (success) {
      setNotification({
        show: true,
        message: t('security.alerts.passwordUpdateSuccess'),
        type: 'success',
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (window.confirm(t('security.sessions.revokeConfirmation'))) {
      const success = await revokeSession(sessionId);
      if (success) {
        setNotification({
          show: true,
          message: t('security.alerts.sessionRevokeSuccess'),
          type: 'success',
        });
      }
    }
  };

  const sessionHeaders = [
    { label: t('security.sessions.table.device'), className: '' },
    { label: t('security.sessions.table.browser'), className: '' },
    { label: t('security.sessions.table.lastAccess'), className: '' },
    { label: '', className: 'relative' },
  ];

  const renderSessionRow = (session) => (
    <>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
        <div className="flex items-center">
          {session.is_current && (
            <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {t('security.sessions.current')}
            </span>
          )}
          {session.operating_system}
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{session.browser}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {new Date(session.last_active).toLocaleString()}
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
        {!session.is_current && (
          <button
            onClick={() => handleRevokeSession(session.id)}
            className="text-red-600 hover:text-red-900"
          >
            {t('security.sessions.revoke')}
          </button>
        )}
      </td>
    </>
  );

  return (
    <div className="space-y-8">
      {/* Password Update Form */}
      <SettingsFormSection
        title={t('security.password.title')}
        description={t('security.password.description')}
        onSubmit={handlePasswordSubmit}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('security.password.current')}
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              {t('security.password.new')}
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              required
              minLength="8"
            />
            <p className="mt-1 text-xs text-gray-500">{t('security.password.minLength')}</p>
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('security.password.confirm')}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUpdatingPassword ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t('buttons.updating')}
                </>
              ) : (
                t('security.password.button')
              )}
            </button>
          </div>
        </div>
      </SettingsFormSection>

      {/* Connected Devices */}
      <SettingsFormSection
        title={t('security.sessions.title')}
        description={t('security.sessions.description')}
      >
        <SettingsTable
          headers={sessionHeaders}
          data={sessions}
          renderRow={renderSessionRow}
          isLoading={loadingSessions}
          emptyMessage={t('security.sessions.none')}
        />
        <p className="mt-4 text-sm text-gray-500">{t('security.sessions.currentNote')}</p>
      </SettingsFormSection>
    </div>
  );
};

export default SecuritySection;
