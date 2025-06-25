import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { useClerkAuth } from '../../hooks/useClerkAuth';
import { securityService, PERMISSIONS } from '../../lib/securityService';
import UserRoleManagement from './UserRoleManagement';
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
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function SecuritySettings({ showNotification }) {
  const { t } = useTranslation('settings');
  const { user } = useUser();
  const { signOut, isAuthenticated } = useClerkAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUserRole, setCurrentUserRole] = useState(null);
  
  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  
  // Sessions State
  const [sessions, setSessions] = useState([]);
  
  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditFilter, setAuditFilter] = useState({
    action: '',
    severity: '',
    startDate: '',
    endDate: ''
  });

  // Backup/Restore State
  const [backups, setBackups] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadSecurityData();
    }
  }, [isAuthenticated, user]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Load user role
      const role = await securityService.getUserRole(user.id);
      setCurrentUserRole(role);

      // Check if 2FA is enabled
      const mfaEnabled = user?.twoFactorEnabled || false;
      setTwoFactorEnabled(mfaEnabled);

      // Load active sessions
      const userSessions = await securityService.getUserSessions(user.id);
      setSessions(userSessions.slice(0, 10));

      // Load audit logs
      const logs = await securityService.getAuditLogs({
        userId: user.id,
        limit: 20
      });
      setAuditLogs(logs);

      // Load available backups (mock for now)
      const mockBackups = [
        {
          id: 1,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          type: 'automatic'
        },
        {
          id: 2,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          type: 'manual'
        }
      ];
      setBackups(mockBackups);

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
      // Generate secret and start 2FA setup
      const secret = 'JBSWY3DPEHPK3PXP'; // In real app, generate actual secret
      const result = await securityService.enable2FA(user.id, secret, '123456');
      
      if (result.success) {
        setTwoFactorEnabled(true);
        setBackupCodes(result.backupCodes);
        setShowQRCode(true);
        showNotification && showNotification('2FA enabled successfully', 'success');
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      showNotification && showNotification('Error enabling 2FA. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    setLoading(true);
    try {
      await securityService.disable2FA(user.id);
      setTwoFactorEnabled(false);
      setBackupCodes([]);
      showNotification && showNotification('Two-factor authentication has been disabled.', 'success');
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      showNotification && showNotification('Error disabling 2FA. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!confirm('Are you sure you want to revoke this session?')) {
      return;
    }

    try {
      await securityService.revokeSession(user.id, sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      showNotification && showNotification('Session revoked successfully.', 'success');
    } catch (error) {
      console.error('Error revoking session:', error);
      showNotification && showNotification('Error revoking session. Please try again.', 'error');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to sign out of all devices? You will need to sign in again.')) {
      return;
    }

    try {
      await securityService.revokeAllSessions(user.id);
      showNotification && showNotification('All sessions revoked successfully.', 'success');
      // Redirect to login or refresh
      window.location.reload();
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      showNotification && showNotification('Error revoking sessions. Please try again.', 'error');
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const result = await securityService.backupSecuritySettings(user.id);
      if (result.success) {
        await loadSecurityData(); // Reload to show new backup
        showNotification && showNotification('Security backup created successfully', 'success');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      showNotification && showNotification('Error creating backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId) => {
    if (!confirm('Are you sure you want to restore this backup? This will overwrite current settings.')) {
      return;
    }

    try {
      await securityService.restoreSecuritySettings(user.id, backupId);
      await loadSecurityData(); // Reload data after restore
      showNotification && showNotification('Security settings restored successfully', 'success');
    } catch (error) {
      console.error('Error restoring backup:', error);
      showNotification && showNotification('Error restoring backup', 'error');
    }
  };

  const handleExportAuditLogs = async () => {
    try {
      const logs = await securityService.getAuditLogs({
        userId: user.id,
        ...auditFilter
      });
      
      const csvContent = [
        ['Timestamp', 'Action', 'Severity', 'IP Address', 'Details'].join(','),
        ...logs.map(log => [
          log.timestamp,
          log.action,
          log.severity,
          log.ip_address || 'N/A',
          JSON.stringify(log.details || {})
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      showNotification && showNotification('Audit logs exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      showNotification && showNotification('Error exporting audit logs', 'error');
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  const canViewAuditLogs = currentUserRole && 
    securityService.hasPermission(currentUserRole, PERMISSIONS.VIEW_AUDIT_LOGS);

  const canBackupSettings = currentUserRole && 
    securityService.hasPermission(currentUserRole, PERMISSIONS.BACKUP_SETTINGS);

  const canManageUsers = currentUserRole && 
    securityService.hasPermission(currentUserRole, PERMISSIONS.MANAGE_USERS);

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

  if (loading && !currentUserRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Security Overview', icon: ShieldCheckIcon },
    { id: 'sessions', label: 'Active Sessions', icon: ComputerDesktopIcon },
    ...(canViewAuditLogs ? [{ id: 'audit', label: 'Audit Logs', icon: ClockIcon }] : []),
    ...(canBackupSettings ? [{ id: 'backup', label: 'Backup & Restore', icon: DocumentDuplicateIcon }] : []),
    ...(canManageUsers ? [{ id: 'users', label: 'User Management', icon: UserGroupIcon }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">{t('security.title', 'Security Settings')}</h3>
        <p className="mt-1 text-sm text-gray-600">
          {t('security.description', 'Manage your account security and authentication settings.')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
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
                  <button
                    onClick={handleDisable2FA}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {t('security.twoFactor.disable', 'Disable')}
                  </button>
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
                onClick={handleRevokeAllSessions}
                className="w-full text-left p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700">
                    {t('security.signOutAll', 'Sign Out of All Devices')}
                  </span>
                  <span className="text-sm text-red-500">→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
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
            <button
              onClick={handleRevokeAllSessions}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
            >
              Revoke All
            </button>
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
                        Last active: {formatDate(session.last_active || new Date())}
                      </p>
                      <p className="text-xs text-gray-500">
                        IP: {session.ip_address || 'Unknown'}
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
      )}

      {activeTab === 'audit' && canViewAuditLogs && (
        <div className="space-y-6">
          {/* Audit Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FunnelIcon className="w-5 h-5 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-900">Filter Audit Logs</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={auditFilter.action}
                onChange={(e) => setAuditFilter({...auditFilter, action: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="2FA_ENABLED">2FA Enabled</option>
                <option value="2FA_DISABLED">2FA Disabled</option>
                <option value="ROLE_UPDATED">Role Updated</option>
              </select>
              <select
                value={auditFilter.severity}
                onChange={(e) => setAuditFilter({...auditFilter, severity: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Severities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <input
                type="date"
                value={auditFilter.startDate}
                onChange={(e) => setAuditFilter({...auditFilter, startDate: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <button
                onClick={handleExportAuditLogs}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Audit Logs List */}
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
                        {formatDate(log.timestamp)} • {log.ip_address || 'Unknown IP'}
                      </p>
                      {log.severity && (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          log.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                          log.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.severity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'backup' && canBackupSettings && (
        <div className="space-y-6">
          {/* Backup Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <DocumentDuplicateIcon className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Security Backup & Restore</h4>
                  <p className="text-sm text-gray-600">Create and manage security settings backups</p>
                </div>
              </div>
              <button
                onClick={handleCreateBackup}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                <span>Create Backup</span>
              </button>
            </div>

            {/* Available Backups */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-900">Available Backups</h5>
              {backups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No backups available</p>
                </div>
              ) : (
                backups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Backup #{backup.id} ({backup.type})
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {formatDate(backup.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestoreBackup(backup.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && canManageUsers && (
        <UserRoleManagement showNotification={showNotification} />
      )}
    </div>
  );
} 