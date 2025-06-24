import React, { useState, useEffect } from 'react';
import { CalendarIcon, CheckIcon, ChevronDownIcon, ClockIcon } from '@heroicons/react/24/outline';
import { it } from 'date-fns/locale/it';
import { enUS } from 'date-fns/locale/en-US';
import { useTranslation } from 'react-i18next';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const AdvancedTimePeriodSelector = ({
  selectedPeriod,
  onPeriodChange,
  dateRange,
  onDateRangeChange,
  compareMode = false,
  onCompareModeChange,
}) => {
  const { t, i18n } = useTranslation('analytics');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Provide default date range if not provided
  const defaultDateRange = {
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  };

  const safeDateRange = dateRange || defaultDateRange;

  const [customRange, setCustomRange] = useState([
    {
      startDate: new Date(safeDateRange.start),
      endDate: new Date(safeDateRange.end),
      key: 'selection',
    },
  ]);

  // Update customRange when dateRange prop changes
  useEffect(() => {
    if (dateRange && dateRange.start && dateRange.end) {
      setCustomRange([
        {
          startDate: new Date(dateRange.start),
          endDate: new Date(dateRange.end),
          key: 'selection',
        },
      ]);
    }
  }, [dateRange]);

  // Removed unused useEffect with undefined updatePeriodData

  // Period presets
  const periodPresets = [
    {
      id: 'today',
      label: t('timeSelector.presets.today'),
      icon: ClockIcon,
      getDates: () => {
        const today = new Date();
        return { start: today, end: today };
      },
    },
    {
      id: 'yesterday',
      label: t('timeSelector.presets.yesterday'),
      icon: ClockIcon,
      getDates: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: yesterday };
      },
    },
    {
      id: 'week',
      label: t('timeSelector.presets.thisWeek'),
      icon: CalendarIcon,
      getDates: () => {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        const endOfWeek = new Date(today.setDate(startOfWeek.getDate() + 6));
        return { start: startOfWeek, end: endOfWeek };
      },
    },
    {
      id: 'last-week',
      label: t('timeSelector.presets.lastWeek'),
      icon: CalendarIcon,
      getDates: () => {
        const today = new Date();
        const lastWeekStart = new Date(today.setDate(today.getDate() - today.getDay() - 6));
        const lastWeekEnd = new Date(today.setDate(lastWeekStart.getDate() + 6));
        return { start: lastWeekStart, end: lastWeekEnd };
      },
    },
    {
      id: 'month',
      label: t('timeSelector.presets.thisMonth'),
      icon: CalendarIcon,
      getDates: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { start, end };
      },
    },
    {
      id: 'last-month',
      label: t('timeSelector.presets.lastMonth'),
      icon: CalendarIcon,
      getDates: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start, end };
      },
    },
    {
      id: 'quarter',
      label: t('timeSelector.presets.thisQuarter'),
      icon: CalendarIcon,
      getDates: () => {
        const today = new Date();
        const quarterStart = Math.floor(today.getMonth() / 3) * 3;
        const start = new Date(today.getFullYear(), quarterStart, 1);
        const end = new Date(today.getFullYear(), quarterStart + 3, 0);
        return { start, end };
      },
    },
    {
      id: 'last-30',
      label: t('timeSelector.last30Days'),
      icon: ClockIcon,
      getDates: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { start, end };
      },
    },
    {
      id: 'last-90',
      label: t('timeSelector.last90Days'),
      icon: ClockIcon,
      getDates: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 90);
        return { start, end };
      },
    },
    {
      id: 'year',
      label: t('timeSelector.presets.thisYear'),
      icon: CalendarIcon,
      getDates: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear(), 11, 31);
        return { start, end };
      },
    },
    {
      id: 'ytd',
      label: t('timeSelector.presets.ytd'),
      icon: CalendarIcon,
      getDates: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 1);
        return { start, end: today };
      },
    },
    {
      id: 'custom',
      label: t('timeSelector.presets.customPeriod'),
      icon: CalendarIcon,
      getDates: () => ({ start: new Date(safeDateRange.start), end: new Date(safeDateRange.end) }),
    },
  ];

  // Handle preset selection
  const handlePresetSelect = presetId => {
    const preset = periodPresets.find(p => p.id === presetId);
    if (preset) {
      const { start, end } = preset.getDates();

      const newDateRange = {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };

      onPeriodChange(presetId);
      onDateRangeChange(newDateRange);

      // Update custom range for date picker
      setCustomRange([
        {
          startDate: start,
          endDate: end,
          key: 'selection',
        },
      ]);
    }

    setShowPresets(false);
  };

  // Handle custom date range selection
  const handleDateRangeSelect = ranges => {
    const range = ranges.selection;
    setCustomRange([range]);

    const newDateRange = {
      start: range.startDate.toISOString().split('T')[0],
      end: range.endDate.toISOString().split('T')[0],
    };

    onPeriodChange('custom');
    onDateRangeChange(newDateRange);
  };

  // Get current preset label
  const getCurrentPresetLabel = () => {
    const preset = periodPresets.find(p => p.id === selectedPeriod);
    return preset ? preset.label : t('timeSelector.presets.customPeriod');
  };

  // Format date range display
  const formatDateRange = () => {
    const start = new Date(safeDateRange.start);
    const end = new Date(safeDateRange.end);
    const locale = i18n.language;

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    return `${start.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    })} - ${end.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  };

  return (
    <div className='relative'>
      {/* Main selector button */}
      <div className='flex items-center space-x-3'>
        {/* Period preset selector */}
        <div className='relative'>
          <button
            onClick={() => setShowPresets(!showPresets)}
            className='flex items-center justify-between w-64 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            <div className='flex items-center'>
              <CalendarIcon className='w-5 h-5 mr-3 text-gray-400' />
              <div>
                <p className='text-sm font-semibold'>{getCurrentPresetLabel()}</p>
                <p className='text-xs text-gray-500'>{formatDateRange()}</p>
              </div>
            </div>
            <ChevronDownIcon className='w-5 h-5 ml-2 text-gray-400' />
          </button>

          {/* Presets dropdown */}
          {showPresets && (
            <div className='absolute z-10 w-64 mt-2 bg-white border border-gray-200 rounded-md shadow-lg'>
              <ul className='py-1'>
                {periodPresets.map(preset => (
                  <li
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className='flex items-center px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100'
                  >
                    <preset.icon className='w-5 h-5 mr-3 text-gray-400' />
                    <span>{preset.label}</span>
                    {selectedPeriod === preset.id && (
                      <CheckIcon className='w-5 h-5 ml-auto text-indigo-600' />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Compare mode toggle */}
        {compareMode !== undefined && (
          <div className='flex items-center'>
            <input
              type='checkbox'
              id='compare-mode'
              checked={compareMode}
              onChange={e => onCompareModeChange(e.target.checked)}
              className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
            />
            <label htmlFor='compare-mode' className='ml-2 text-sm text-gray-700'>
              {t('timeSelector.compare.comparePeriod')}
            </label>
          </div>
        )}

        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className='p-2 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none'
        >
          <CalendarIcon className='w-5 h-5' />
        </button>
      </div>

      {/* Custom date picker */}
      {showDatePicker && (
        <div className='absolute z-20 p-4 mt-2 bg-white border border-gray-200 rounded-md shadow-lg top-full'>
          <h3 className='mb-4 text-lg font-semibold'>{t('timeSelector.title')}</h3>
          <DateRange
            editableDateInputs={true}
            onChange={handleDateRangeSelect}
            moveRangeOnFirstSelection={false}
            ranges={customRange}
            locale={i18n.language === 'it' ? it : enUS}
          />
        </div>
      )}

      {/* Click outside to close */}
      {(showPresets || showDatePicker) && (
        <div
          className='fixed inset-0 z-40'
          onClick={() => {
            setShowPresets(false);
            setShowDatePicker(false);
          }}
        />
      )}
    </div>
  );
};

export default AdvancedTimePeriodSelector;
