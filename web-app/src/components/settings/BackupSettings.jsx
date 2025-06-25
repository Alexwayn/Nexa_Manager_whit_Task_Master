import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { useClerkAuth } from '../../hooks/useClerkAuth';
import { 
  CloudArrowDownIcon, 
  CloudArrowUpIcon, 
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CalendarIcon,
  ServerIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const BackupSettings = () => {
  const { t } = useTranslation(['settings']);
  const { user } = useUser();
  const { isAuthenticated } = useClerkAuth();
  
  // Backup configuration state
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    frequency: 'weekly',
    retention: '90',
    includeAttachments: true,
    encryptBackups: true,
    notifyOnComplete: true,
    notifyOnFailure: true,
    backupLocation: 'cloud'
  });

  // Export/import state
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);

  // Load backup settings and history
  useEffect(() => {
    if (isAuthenticated && user) {
      loadBackupSettings();
      loadBackupHistory();
    }
  }, [isAuthenticated, user]);

  const loadBackupSettings = () => {
    // Load from localStorage or API
    const saved = localStorage.getItem('backupSettings');
    if (saved) {
      setBackupSettings(JSON.parse(saved));
    }
    
    // Mock last backup date
    setLastBackup(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
  };

  const loadBackupHistory = () => {
    // Mock backup history
    const mockHistory = [
      {
        id: 1,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        type: 'automatic',
        status: 'completed',
        size: '245 MB',
        duration: '2m 34s'
      },
      {
        id: 2,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        type: 'manual',
        status: 'completed',
        size: '238 MB',
        duration: '2m 18s'
      },
      {
        id: 3,
        date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        type: 'automatic',
        status: 'failed',
        size: '0 MB',
        duration: '0s',
        error: 'Network timeout'
      }
    ];
    setBackupHistory(mockHistory);
  };

  const handleSettingChange = (setting, value) => {
    const newSettings = { ...backupSettings, [setting]: value };
    setBackupSettings(newSettings);
    localStorage.setItem('backupSettings', JSON.stringify(newSettings));
  };

  const handleManualBackup = async () => {
    setExportLoading(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add to history
      const newBackup = {
        id: Date.now(),
        date: new Date(),
        type: 'manual',
        status: 'completed',
        size: '247 MB',
        duration: '3m 2s'
      };
      setBackupHistory([newBackup, ...backupHistory]);
      setLastBackup(new Date());
      
      // Show success message
      alert(t('settings:backup.manualBackupSuccess'));
    } catch (error) {
      alert(t('settings:backup.manualBackupError'));
    } finally {
      setExportLoading(false);
    }
  };

  const handleDataExport = async (format) => {
    setExportLoading(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock download
      const data = {
        exportDate: new Date().toISOString(),
        format: format,
        data: {
          clients: [],
          invoices: [],
          quotes: [],
          expenses: [],
          settings: backupSettings
        }
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexa-export-${format}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(t('settings:backup.exportSuccess'));
    } catch (error) {
      alert(t('settings:backup.exportError'));
    } finally {
      setExportLoading(false);
    }
  };

  const handleDataImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate import data structure
      if (!data.data || !data.exportDate) {
        throw new Error('Invalid backup file format');
      }
      
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(t('settings:backup.importSuccess'));
    } catch (error) {
      alert(t('settings:backup.importError', { error: error.message }));
    } finally {
      setImportLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Please sign in to access backup settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          {t('settings:backup.title')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('settings:backup.description')}
        </p>
      </div>

      {/* Last Backup Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {t('settings:backup.lastBackup')}
            </p>
            <p className="text-sm text-blue-700">
              {lastBackup ? formatDate(lastBackup) : t('settings:backup.noBackup')}
            </p>
          </div>
        </div>
      </div>

      {/* Manual Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          {t('settings:backup.manualActions')}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Manual Backup */}
          <button
            onClick={handleManualBackup}
            disabled={exportLoading}
            className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            )}
            {t('settings:backup.createBackup')}
          </button>

          {/* Import Data */}
          <label className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleDataImport}
              className="hidden"
              disabled={importLoading}
            />
            {importLoading ? (
              <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <CloudArrowDownIcon className="h-4 w-4 mr-2" />
            )}
            {t('settings:backup.importData')}
          </label>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          {t('settings:backup.dataExport')}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleDataExport('complete')}
            disabled={exportLoading}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            {t('settings:backup.exportComplete')}
          </button>
          
          <button
            onClick={() => handleDataExport('clients')}
            disabled={exportLoading}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            {t('settings:backup.exportClients')}
          </button>
          
          <button
            onClick={() => handleDataExport('financial')}
            disabled={exportLoading}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            {t('settings:backup.exportFinancial')}
          </button>
        </div>
      </div>

      {/* Automatic Backup Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          {t('settings:backup.automaticSettings')}
        </h4>
        
        <div className="space-y-4">
          {/* Enable Auto Backup */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t('settings:backup.enableAutoBackup')}
              </label>
              <p className="text-sm text-gray-500">
                {t('settings:backup.enableAutoBackupDesc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={backupSettings.autoBackup}
                onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Backup Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings:backup.frequency')}
            </label>
            <select
              value={backupSettings.frequency}
              onChange={(e) => handleSettingChange('frequency', e.target.value)}
              disabled={!backupSettings.autoBackup}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="daily">{t('settings:backup.frequencyDaily')}</option>
              <option value="weekly">{t('settings:backup.frequencyWeekly')}</option>
              <option value="monthly">{t('settings:backup.frequencyMonthly')}</option>
            </select>
          </div>

          {/* Retention Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings:backup.retention')}
            </label>
            <select
              value={backupSettings.retention}
              onChange={(e) => handleSettingChange('retention', e.target.value)}
              disabled={!backupSettings.autoBackup}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="30">{t('settings:backup.retention30')}</option>
              <option value="90">{t('settings:backup.retention90')}</option>
              <option value="180">{t('settings:backup.retention180')}</option>
              <option value="365">{t('settings:backup.retention365')}</option>
            </select>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeAttachments"
                checked={backupSettings.includeAttachments}
                onChange={(e) => handleSettingChange('includeAttachments', e.target.checked)}
                disabled={!backupSettings.autoBackup}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="includeAttachments" className="ml-2 text-sm text-gray-700">
                {t('settings:backup.includeAttachments')}
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="encryptBackups"
                checked={backupSettings.encryptBackups}
                onChange={(e) => handleSettingChange('encryptBackups', e.target.checked)}
                disabled={!backupSettings.autoBackup}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="encryptBackups" className="ml-2 text-sm text-gray-700">
                {t('settings:backup.encryptBackups')}
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyOnComplete"
                checked={backupSettings.notifyOnComplete}
                onChange={(e) => handleSettingChange('notifyOnComplete', e.target.checked)}
                disabled={!backupSettings.autoBackup}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="notifyOnComplete" className="ml-2 text-sm text-gray-700">
                {t('settings:backup.notifyOnComplete')}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          {t('settings:backup.history')}
        </h4>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('settings:backup.historyDate')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('settings:backup.historyType')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('settings:backup.historyStatus')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('settings:backup.historySize')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('settings:backup.historyDuration')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backupHistory.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(backup.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      backup.type === 'automatic' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {t(`settings:backup.type${backup.type.charAt(0).toUpperCase() + backup.type.slice(1)}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      {getStatusIcon(backup.status)}
                      <span className="ml-2 capitalize">{backup.status}</span>
                      {backup.error && (
                        <span className="ml-2 text-red-600 text-xs">({backup.error})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup.duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BackupSettings; 