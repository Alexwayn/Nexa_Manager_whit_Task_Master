import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon } from '@heroicons/react/24/outline';

const DateRangeFilter = ({ dateRange, onDateRangeChange, presets = true, className = '' }) => {
  const { t } = useTranslation('reports');

  const handlePresetChange = (preset) => {
    const endDate = new Date().toISOString().split('T')[0];
    let startDate;

    switch (preset) {
      case 'last7days':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last30days':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last3months':
        startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)
          .toISOString()
          .split('T')[0];
        break;
      case 'last6months':
        startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
          .toISOString()
          .split('T')[0];
        break;
      case 'lastYear':
        startDate = new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        break;
      case 'thisMonth':
        startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split('T')[0];
        break;
      case 'thisYear':
        startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        return;
    }

    onDateRangeChange('startDate', startDate);
    onDateRangeChange('endDate', endDate);
  };

  const presetOptions = [
    { value: 'last7days', label: t('dateFilter.options.last7days') },
    { value: 'last30days', label: t('dateFilter.options.last30days') },
    { value: 'last3months', label: t('dateFilter.options.last3months') },
    { value: 'last6months', label: t('dateFilter.options.last6months') },
    { value: 'thisMonth', label: t('dateFilter.options.thisMonth') },
    { value: 'thisYear', label: t('dateFilter.options.thisYear') },
    { value: 'lastYear', label: t('dateFilter.options.lastYear') },
  ];

  return (
    <div
      className={`bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="flex items-center space-x-4">
        <CalendarIcon className="h-5 w-5 text-gray-400" />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('dateFilter.startDate')}
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => onDateRangeChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('dateFilter.endDate')}
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => onDateRangeChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {presets && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('dateFilter.presets')}
          </label>
          <div className="flex flex-wrap gap-2">
            {presetOptions.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetChange(preset.value)}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors duration-200"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
