import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, AlertTriangle, Key, FileText, Download } from 'lucide-react';
import { emailSecurityService } from '../lib/emailSecurityService';
import { useUser } from '@clerk/clerk-react';

const EmailSecuritySettings = () => {
  const { user } = useUser();
  const [settings, setSettings] = useState({
    autoEncryptConfidential: true,
    enableSpamDetection: true,
    enablePhishingDetection: true,
    logSecurityEvents: true,
    requireEncryptionForSensitive: false,
    autoDeleteTrashAfterDays: 30,
  });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    if (user) {
      loadSecuritySettings();
      loadSecurityLogs();
    }
  }, [user]);

  const loadSecuritySettings = async () => {
    try {
      // In a real implementation, you would load settings from the database
      // For now, we'll use default settings
      setSettings({
        autoEncryptConfidential: true,
        enableSpamDetection: true,
        enablePhishingDetection: true,
        logSecurityEvents: true,
        requireEncryptionForSensitive: false,
        autoDeleteTrashAfterDays: 30,
      });
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const loadSecurityLogs = async () => {
    try {
      setLoading(true);
      const result = await emailSecurityService.getSecurityLogs(user.id, { limit: 50 });
      if (result.success) {
        setSecurityLogs(result.data);
      }
    } catch (error) {
      console.error('Error loading security logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (setting, value) => {
    try {
      setSettings(prev => ({ ...prev, [setting]: value }));
      
      // Log the settings change
      await emailSecurityService.logEmailSecurityEvent({
        action: 'SECURITY_SETTINGS_CHANGED',
        userId: user.id,
        details: {
          setting,
          newValue: value,
          timestamp: new Date().toISOString()
        },
        severity: 'LOW'
      });
    } catch (error) {
      console.error('Error updating security setting:', error);
    }
  };

  const exportSecurityLogs = async () => {
    try {
      const result = await emailSecurityService.getSecurityLogs(user.id, { limit: 1000 });
      if (result.success) {
        const csvContent = [
          'Timestamp,Action,Severity,Details',
          ...result.data.map(log => 
            `${log.timestamp},${log.action},${log.severity},"${JSON.stringify(log.details).replace(/"/g, '""')}"`
          )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `email-security-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting security logs:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatLogAction = (action) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Email Security Settings</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Security Settings
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'logs'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Security Logs
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Encryption Settings */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Encryption Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Auto-encrypt confidential emails
                  </label>
                  <p className="text-xs text-gray-500">
                    Automatically encrypt emails marked as confidential
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoEncryptConfidential}
                  onChange={(e) => handleSettingChange('autoEncryptConfidential', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Require encryption for sensitive content
                  </label>
                  <p className="text-xs text-gray-500">
                    Force encryption for emails containing sensitive keywords
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireEncryptionForSensitive}
                  onChange={(e) => handleSettingChange('requireEncryptionForSensitive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Threat Detection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Threat Detection</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Enable spam detection
                  </label>
                  <p className="text-xs text-gray-500">
                    Automatically detect and flag spam emails
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableSpamDetection}
                  onChange={(e) => handleSettingChange('enableSpamDetection', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Enable phishing detection
                  </label>
                  <p className="text-xs text-gray-500">
                    Detect and warn about potential phishing attempts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enablePhishingDetection}
                  onChange={(e) => handleSettingChange('enablePhishingDetection', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Audit & Logging */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Audit & Logging</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Log security events
                  </label>
                  <p className="text-xs text-gray-500">
                    Keep detailed logs of all security-related activities
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.logSecurityEvents}
                  onChange={(e) => handleSettingChange('logSecurityEvents', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Auto-delete trash after (days)
                  </label>
                  <p className="text-xs text-gray-500">
                    Automatically permanently delete emails from trash
                  </p>
                </div>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.autoDeleteTrashAfterDays}
                  onChange={(e) => handleSettingChange('autoDeleteTrashAfterDays', parseInt(e.target.value))}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Security Activity Log</h3>
            <button
              onClick={exportSecurityLogs}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Logs
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading security logs...</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {securityLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No security logs found
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Severity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {securityLogs.map((log, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatLogAction(log.action)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {typeof log.details === 'object' 
                              ? Object.entries(log.details).map(([key, value]) => 
                                  `${key}: ${value}`
                                ).join(', ')
                              : log.details
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailSecuritySettings;