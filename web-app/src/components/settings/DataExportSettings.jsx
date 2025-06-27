import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { businessService } from '@lib/businessService';
import Logger from '@utils/Logger';
import { json2csv } from 'json-2-csv';

const DataExportSettings = ({ showNotification }) => {
  const { user } = useUser();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const { data, error } = await businessService.getBusinessProfileByUserId(user.id);
      if (error) throw error;

      let exportData;
      let mimeType;
      let fileExtension;

      if (exportFormat === 'csv') {
        exportData = await json2csv(data);
        mimeType = 'text/csv';
        fileExtension = 'csv';
      } else {
        exportData = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
      }

      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexa-manager-export-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification('Data exported successfully!', 'success');
    } catch (error) {
      Logger.error('Error exporting data:', error);
      showNotification('Failed to export data.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Data Export</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Export your company data to a JSON or CSV file.</p>
        </div>
        <div className="mt-5">
          <div className="flex items-center space-x-4">
            <select
              id="exportFormat"
              name="exportFormat"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExportSettings;