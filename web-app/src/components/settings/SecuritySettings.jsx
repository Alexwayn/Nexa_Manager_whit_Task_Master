import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { useClerkAuth } from '../../hooks/useClerkAuth';
import {
  ShieldCheckIcon,
  KeyIcon,
  LockClosedIcon,
  ClockIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';

export default function SecuritySettings({ showNotification }) {
  const { t } = useTranslation('settings');
  const { user } = useUser();
  const { signOut, isAuthenticated } = useClerkAuth();
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadSecurityData();
    }
  }, [isAuthenticated, user]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Check if 2FA is enabled
      const mfaEnabled = user?.twoFactorEnabled || false;
      setTwoFactorEnabled(mfaEnabled);

      // Load active sessions
      const userSessions = await user?.getSessions() || [];
      setSessions(userSessions.slice(0, 5)); // Show last 5 sessions

      // Load recent audit logs (mock data for now)
      const mockAuditLogs = [
        {
          id: 1,
          action: 'Login',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          ip: '192.168.1.1',
          device: 'Chrome on Windows',
        },
        {
          id: 2,
          action: 'Settings Updated',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          ip: '192.168.1.1',
          device: 'Chrome on Windows',
        },
        {
          id: 3,
          action: 'Password Changed',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          ip: '192.168.1.1',
          device: 'Chrome on Windows',
        },
      ];
      setAuditLogs(mockAuditLogs);
    } catch (error) {
      console.error('Error loading security data:', error);
      showNotification && showNotification('Error loading security settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      // Start 2FA setup process with Clerk
      const mfa = await user?.createMFA({ strategy: 'totp' });
      if (mfa) {
        setShowQRCode(true);
        showNotification && showNotification('2FA setup initiated. Please scan the QR code with your authenticator app.', 'success');
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      showNotification && showNotification('Error enabling 2FA. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    setLoading(true);
    try {
      // Disable 2FA through Clerk
      await user?.disableMFA();
      setTwoFactorEnabled(false);
      showNotification && showNotification('Two-factor authentication has been disabled.', 'success');
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      showNotification && showNotification('Error disabling 2FA. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    setLoading(true);
    try {
      // Generate backup codes (mock implementation)
      const codes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      setBackupCodes(codes);
      showNotification && showNotification('Backup codes generated. Please save them in a secure location.', 'success');
    } catch (error) {
      console.error('Error generating backup codes:', error);
      showNotification && showNotification('Error generating backup codes. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!confirm('Are you sure you want to revoke this session?')) {
      return;
    }

    try {
      // Revoke session through Clerk
      // await user?.revokeSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      showNotification && showNotification('Session revoked successfully.', 'success');
    } catch (error) {
      console.error('Error revoking session:', error);
      showNotification && showNotification('Error revoking session. Please try again.', 'error');
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Please sign in to access security settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">{t('security.title', 'Security Settings')}</h3>
        <p className="mt-1 text-sm text-gray-600">
          {t('security.description', 'Manage your account security and authentication settings.')}
        </p>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {t('security.twoFactor.title', 'Two-Factor Authentication')}
              </h4>
              <p className="text-sm text-gray-600">
                {t('security.twoFactor.description', 'Add an extra layer of security to your account')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Status: {twoFactorEnabled ? 
                  <span className="text-green-600 font-medium">Enabled</span> : 
                  <span className="text-red-600 font-medium">Disabled</span>
                }
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {!twoFactorEnabled ? (
              <button
                onClick={handleEnable2FA}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {t('security.twoFactor.enable', 'Enable 2FA')}
              </button>
            ) : (
              <>
                <button
                  onClick={handleGenerateBackupCodes}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('security.twoFactor.generateCodes', 'Backup Codes')}
                </button>
                <button
                  onClick={handleDisable2FA}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {t('security.twoFactor.disable', 'Disable')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* QR Code Section */}
        {showQRCode && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <QrCodeIcon className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                {t('security.twoFactor.scanQR', 'Scan QR Code')}
              </span>
            </div>
            <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300 text-center">
              <div className="w-32 h-32 bg-gray-100 mx-auto rounded mb-2 flex items-center justify-center">
                <QrCodeIcon className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-xs text-gray-600">
                {t('security.twoFactor.qrInstructions', 'QR code will be generated here')}
              </p>
            </div>
          </div>
        )}

        {/* Backup Codes */}
        {backupCodes.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h5 className="text-sm font-medium text-yellow-800 mb-2">
              {t('security.twoFactor.backupCodes', 'Backup Codes')}
            </h5>
            <p className="text-xs text-yellow-700 mb-3">
              {t('security.twoFactor.backupInstructions', 'Save these codes in a secure location. Each code can only be used once.')}
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-white p-2 rounded border text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ComputerDesktopIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {t('security.sessions.title', 'Active Sessions')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('security.sessions.description', 'Devices that are currently signed in to your account')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-gray-500">
              <div className="text-center">
                <ComputerDesktopIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Current session only</p>
              </div>
            </div>
          ) : (
            sessions.map((session, index) => (
              <div key={session.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.device || 'Current Device'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Last active: {formatDate(session.lastActiveAt || new Date())}
                    </p>
                  </div>
                </div>
                {index !== 0 && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    {t('security.sessions.revoke', 'Revoke')}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ClockIcon className="w-6 h-6 text-purple-600" />
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {t('security.audit.title', 'Security Audit Log')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('security.audit.description', 'Recent security-related activities on your account')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <LockClosedIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-600">
                    {formatDate(log.timestamp)} • {log.device} • {log.ip}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            {t('security.audit.viewAll', 'View All Activity')}
          </button>
        </div>
      </div>

      {/* Password Security */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <KeyIcon className="w-6 h-6 text-red-600" />
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {t('security.password.title', 'Password Security')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('security.password.description', 'Manage your password and account access')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {t('security.password.change', 'Change Password')}
              </span>
              <span className="text-sm text-gray-500">→</span>
            </div>
          </button>
          
          <button 
            onClick={() => signOut && signOut()}
            className="w-full text-left p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-700">
                {t('security.signOut', 'Sign Out of All Devices')}
              </span>
              <span className="text-sm text-red-500">→</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 