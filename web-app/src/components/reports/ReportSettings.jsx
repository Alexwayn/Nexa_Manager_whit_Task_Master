import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ReportSettings = ({ onBack }) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    defaultExportFormat: 'pdf',
    emailNotifications: true,
    dataRetentionDays: 90,
  });

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <button onClick={onBack} className='flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6'>
        <ArrowLeftIcon className='h-4 w-4 mr-2' />
        Back to Reports Dashboard
      </button>

      <div className='mb-6'>
        <h2 className='text-2xl font-semibold text-gray-800'>Report Settings</h2>
        <p className='mt-1 text-gray-600'>Configure your default reporting options.</p>
      </div>

      <div className='space-y-6 max-w-lg'>
        {/* Default Export Format */}
        <div>
          <label htmlFor='defaultExportFormat' className='block text-sm font-medium text-gray-700'>Default Export Format</label>
          <select
            id='defaultExportFormat'
            name='defaultExportFormat'
            value={settings.defaultExportFormat}
            onChange={handleSettingChange}
            className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
          >
            <option value='pdf'>PDF</option>
            <option value='csv'>CSV</option>
            <option value='xlsx'>Excel (XLSX)</option>
          </select>
        </div>

        {/* Email Notifications */}
        <div className='flex items-center justify-between'>
          <span className='flex-grow flex flex-col'>
            <span className='text-sm font-medium text-gray-900'>Email Notifications</span>
            <span className='text-sm text-gray-500'>Receive an email when a scheduled report is ready.</span>
          </span>
          <label htmlFor='emailNotifications' className='inline-flex relative items-center cursor-pointer'>
            <input type='checkbox' id='emailNotifications' name='emailNotifications' className='sr-only peer' checked={settings.emailNotifications} onChange={handleSettingChange} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Data Retention Policy */}
        <div>
          <label htmlFor='dataRetentionDays' className='block text-sm font-medium text-gray-700'>Report Data Retention (in days)</label>
          <input
            type='number'
            id='dataRetentionDays'
            name='dataRetentionDays'
            value={settings.dataRetentionDays}
            onChange={handleSettingChange}
            className='mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
            min='30'
          />
        </div>

        <div className='pt-4'>
          <button className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportSettings;