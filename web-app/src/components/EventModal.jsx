import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  DocumentTextIcon,
  UserIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { createEvent, updateEvent, EVENT_TYPES, EVENT_PRIORITIES } from '@lib/eventService.js';
import clientService from '@lib/clientService.js';
import Logger from '@utils/Logger';

const EventModal = ({ isOpen, onClose, event, defaultDate, onEventSaved }) => {
  const { t } = useTranslation('calendar');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    type: EVENT_TYPES.APPOINTMENT,
    priority: EVENT_PRIORITIES.MEDIUM,
    client_id: '',
    note: '',
  });

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load clients when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editing existing event
        setFormData({
          title: event.title || '',
          description: event.description || '',
          date: event.date || '',
          start_time: event.start_time || '',
          end_time: event.end_time || '',
          location: event.location || '',
          type: event.type || EVENT_TYPES.APPOINTMENT,
          priority: event.priority || EVENT_PRIORITIES.MEDIUM,
          client_id: event.client_id || '',
          note: event.note || '',
        });
      } else {
        // Creating new event
        const defaultEventDate = defaultDate
          ? defaultDate instanceof Date
            ? defaultDate.toISOString().split('T')[0]
            : defaultDate
          : new Date().toISOString().split('T')[0];

        setFormData({
          title: '',
          description: '',
          date: defaultEventDate,
          start_time: '',
          end_time: '',
          location: '',
          type: EVENT_TYPES.APPOINTMENT,
          priority: EVENT_PRIORITIES.MEDIUM,
          client_id: '',
          note: '',
        });
      }
      setError('');
    }
  }, [isOpen, event, defaultDate]);

  const loadClients = async () => {
    try {
      const response = await clientService.getClients();
      setClients(response.data || []);
    } catch (error) {
      Logger.error('Error loading clients:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError(t('eventModal.titleRequired'));
      return false;
    }

    if (!formData.date) {
      setError(t('eventModal.dateRequired'));
      return false;
    }

    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      setError(t('eventModal.endTimeAfterStartTime'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      let savedEvent;

      if (event) {
        // Update existing event
        savedEvent = await updateEvent(event.id, formData);
      } else {
        // Create new event
        savedEvent = await createEvent(formData);
      }

      onEventSaved(savedEvent);
      onClose();
    } catch (error) {
      Logger.error('Error saving event:', error);
      setError(error.message || t('eventModal.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {event ? t('editEvent') : t('newEvent')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('eventModal.titleLabel')}
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder={t('eventTitlePlaceholder')}
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('eventModal.dateLabel')}
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('eventModal.startTimeLabel')}
              </label>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('eventModal.endTimeLabel')}
              </label>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('eventModal.locationLabel')}
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('eventModal.locationPlaceholder')}
              />
            </div>
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('eventModal.typeLabel')}
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {Object.values(EVENT_TYPES).map((type) => (
                  <option key={type} value={type}>
                    {t(`eventTypes.${type}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('eventModal.priorityLabel')}
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {Object.values(EVENT_PRIORITIES).map((priority) => (
                  <option key={priority} value={priority}>
                    {t(`eventPriorities.${priority}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('eventModal.clientLabel')}
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">{t('eventModal.selectClient')}</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.surname}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('eventModal.notesLabel')}
            </label>
            <div className="relative">
              <DocumentTextIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows="3"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('eventModal.notesPlaceholder')}
              ></textarea>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              {t('eventModal.cancelButton')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {loading ? t('eventModal.savingButton') : t('eventModal.saveButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
