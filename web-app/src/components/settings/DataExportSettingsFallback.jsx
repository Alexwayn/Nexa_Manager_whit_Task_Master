import React, { useState } from 'react';
import { 
  ArrowDownTrayIcon, 
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function DataExportSettingsFallback({ showNotification }) {
  console.log('📤 DataExportSettingsFallback: Component mounted - Demo Mode');

  const [exportSettings, setExportSettings] = useState({
    format: 'csv',
    includeHeaders: true,
    dateRange: 'last_30_days',
    includeDeletedRecords: false,
    compression: false
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (dataType) => {
    console.log('📤 DataExportSettingsFallback: Exporting data (Demo Mode)', { dataType, settings: exportSettings });
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      showNotification && showNotification(`${dataType} data exported successfully (Demo Mode)`, 'success');
    }, 2000);
  };

  const exportOptions = [
    {
      id: 'clients',
      name: 'Client Data',
      description: 'Export all client information and contact details',
      icon: TableCellsIcon,
      estimatedSize: '2.3 MB'
    },
    {
      id: 'invoices',
      name: 'Invoice Data',
      description: 'Export invoices, payments, and billing information',
      icon: DocumentTextIcon,
      estimatedSize: '5.7 MB'
    },
    {
      id: 'transactions',
      name: 'Transaction History',
      description: 'Export all financial transactions and records',
      icon: DocumentArrowDownIcon,
      estimatedSize: '1.8 MB'
    },
    {
      id: 'analytics',
      name: 'Analytics Data',
      description: 'Export reports and analytics data',
      icon: ArrowDownTrayIcon,
      estimatedSize: '800 KB'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2" />
          <p className="text-blue-800 font-medium">Demo Mode - Data Export Settings</p>
        </div>
        <p className="text-blue-700 text-sm mt-1">
          This is a simplified version without database dependencies. Export functions are simulated.
        </p>
      </div>

      {/* Export Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={exportSettings.format}
              onChange={(e) => setExportSettings({ ...exportSettings, format: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="csv">CSV (Comma Separated Values)</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="json">JSON</option>
              <option value="pdf">PDF Report</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={exportSettings.dateRange}
              onChange={(e) => setExportSettings({ ...exportSettings, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="last_year">Last Year</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center">
            <input
              id="include-headers"
              type="checkbox"
              checked={exportSettings.includeHeaders}
              onChange={(e) => setExportSettings({ ...exportSettings, includeHeaders: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="include-headers" className="ml-2 block text-sm text-gray-700">
              Include column headers
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="include-deleted"
              type="checkbox"
              checked={exportSettings.includeDeletedRecords}
              onChange={(e) => setExportSettings({ ...exportSettings, includeDeletedRecords: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="include-deleted" className="ml-2 block text-sm text-gray-700">
              Include deleted records
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="compression"
              type="checkbox"
              checked={exportSettings.compression}
              onChange={(e) => setExportSettings({ ...exportSettings, compression: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="compression" className="ml-2 block text-sm text-gray-700">
              Compress files (ZIP)
            </label>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Exports</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportOptions.map((option) => (
            <div key={option.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <option.icon className="h-6 w-6 text-gray-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900">{option.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                    <p className="text-xs text-gray-400 mt-2">Estimated size: {option.estimatedSize}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(option.name)}
                  disabled={isExporting}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Exports</h2>
        
        <div className="space-y-3">
          {[
            { name: 'Client Data Export', date: '2024-01-15', size: '2.3 MB', status: 'completed' },
            { name: 'Invoice Report', date: '2024-01-14', size: '5.7 MB', status: 'completed' },
            { name: 'Analytics Data', date: '2024-01-13', size: '800 KB', status: 'completed' }
          ].map((export_item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">{export_item.name}</p>
                <p className="text-sm text-gray-500">{export_item.date} • {export_item.size}</p>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 capitalize">{export_item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 