import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Layout from '@components/dashboard/Layout';
import Calendar from '@components/calendar/Calendar';
import EventModal from '@components/calendar/EventModal';
import { getEvents, deleteEvent, EVENT_TYPES, EVENT_PRIORITIES } from '@lib/eventService';
import Logger from '@utils/Logger';
import ErrorBoundary from '@components/common/ErrorBoundary';

/**
 * CalendarPage Component - Main calendar page with event management
 *
 * Features:
 * - Calendar with multiple views
 * - Event creation, editing, and deletion
 * - Event search and filtering
 * - Integration with clients, quotes, and invoices
 * - Real-time event updates
 */

const CalendarPage = () => {
  const { t } = useTranslation('calendar');
  // State management
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [defaultEventDate, setDefaultEventDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load initial events
  useEffect(() => {
    loadEvents();
  }, []);

  // Load events
  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await getEvents({
        search: searchTerm,
        type: filterType === 'all' ? null : filterType,
        priority: filterPriority === 'all' ? null : filterPriority,
      });
      setEvents(response.data);
    } catch (error) {
      Logger.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reload events when filters change
  useEffect(() => {
    const timeoutId = setTimeout(loadEvents, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterType, filterPriority]);

  // Handle event creation
  const handleEventCreate = date => {
    setSelectedEvent(null);
    setDefaultEventDate(date);
    setIsEventModalOpen(true);
  };

  // Handle event click
  const handleEventClick = event => {
    setSelectedEvent(event);
    setDefaultEventDate(null);
    setIsEventModalOpen(true);
  };

  // Handle date click
  const handleDateClick = date => {
    handleEventCreate(date);
  };

  // Handle event saved
  const handleEventSaved = savedEvent => {
    loadEvents(); // Reload all events to get updated data
  };

  // Handle event deletion
  const handleEventDelete = async eventId => {
    if (window.confirm(t('deleteConfirmation'))) {
      try {
        await deleteEvent(eventId);
        loadEvents();
      } catch (error) {
        Logger.error('Error deleting event:', error);
        alert(t('deleteError'));
      }
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterPriority('all');
  };

  // Get filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (filterType !== 'all') count++;
    if (filterPriority !== 'all') count++;
    return count;
  };

  return (
    <ErrorBoundary>
      <Layout>
        <div className='space-y-6'>
          {/* Header */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>{t('title')}</h1>
              <p className='text-gray-600 dark:text-gray-400 mt-1'>{t('pageDescription')}</p>
            </div>

            <div className='flex items-center space-x-3'>
              <button
                onClick={() => handleEventCreate(new Date())}
                className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
              >
                <PlusIcon className='w-5 h-5' />
                <span>{t('newEvent')}</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4'>
            <div className='flex flex-col lg:flex-row lg:items-center gap-4'>
              {/* Search */}
              <div className='flex-1'>
                <div className='relative'>
                  <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <input
                    type='text'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors relative
                ${
                  showFilters
                    ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }
              `}
              >
                <FunnelIcon className='w-5 h-5' />
                <span>{t('filters')}</span>
                {getActiveFilterCount() > 0 && (
                  <span className='absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                  {/* Event Type Filter */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      {t('eventType')}
                    </label>
                    <select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                    >
                      <option value='all'>{t('allTypes')}</option>
                      <option value={EVENT_TYPES.APPOINTMENT}>{t('types.appointment')}</option>
                      <option value={EVENT_TYPES.QUOTE}>{t('types.quote')}</option>
                      <option value={EVENT_TYPES.INVOICE}>{t('types.invoice')}</option>
                      <option value={EVENT_TYPES.INCOME}>{t('types.income')}</option>
                      <option value={EVENT_TYPES.EXPENSE}>{t('types.expense')}</option>
                      <option value={EVENT_TYPES.REMINDER}>{t('types.reminder')}</option>
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      {t('eventModal.priorityLabel')}
                    </label>
                    <select
                      value={filterPriority}
                      onChange={e => setFilterPriority(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                    >
                      <option value='all'>{t('allPriorities')}</option>
                      <option value={EVENT_PRIORITIES.HIGH}>{t('priorities.high')}</option>
                      <option value={EVENT_PRIORITIES.MEDIUM}>{t('priorities.medium')}</option>
                      <option value={EVENT_PRIORITIES.LOW}>{t('priorities.low')}</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className='flex items-end'>
                    <button
                      onClick={clearFilters}
                      className='w-full px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                      disabled={getActiveFilterCount() === 0}
                    >
                      {t('clearFilters')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Calendar */}
          <Calendar
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            onEventCreate={handleEventCreate}
            className='bg-white dark:bg-gray-800'
          />

          {/* Event Modal */}
          <EventModal
            isOpen={isEventModalOpen}
            onClose={() => {
              setIsEventModalOpen(false);
              setSelectedEvent(null);
              setDefaultEventDate(null);
            }}
            event={selectedEvent}
            defaultDate={defaultEventDate}
            onEventSaved={handleEventSaved}
          />

          {/* Loading State */}
          {loading && (
            <div className='fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40'>
              <div className='bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl'>
                <div className='flex items-center space-x-3'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
                  <span className='text-gray-700 dark:text-gray-300'>Caricamento eventi...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ErrorBoundary>
  );
};

export default CalendarPage;
