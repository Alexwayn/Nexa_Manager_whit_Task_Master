import React, { useState } from 'react';
import { 
  ClockIcon, 
  CalendarIcon, 
  PaperAirplaneIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useEmailScheduling } from '@features/email';
import { format, addMinutes, addHours, addDays } from 'date-fns';

const EmailScheduler = ({ 
  isOpen, 
  onClose, 
  emailData, 
  onScheduled 
}) => {
  const { scheduleEmail, loading } = useEmailScheduling();
  const [scheduleType, setScheduleType] = useState('custom');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [error, setError] = useState('');

  const quickScheduleOptions = [
    { label: 'In 1 hour', value: 'hour', getDate: () => addHours(new Date(), 1) },
    { label: 'Tomorrow 9 AM', value: 'tomorrow', getDate: () => {
      const tomorrow = addDays(new Date(), 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    }},
    { label: 'Next Monday 9 AM', value: 'monday', getDate: () => {
      const now = new Date();
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      const nextMonday = addDays(now, daysUntilMonday);
      nextMonday.setHours(9, 0, 0, 0);
      return nextMonday;
    }},
    { label: 'Custom date & time', value: 'custom', getDate: null }
  ];

  const handleSchedule = async () => {
    try {
      setError('');
      
      let scheduledDateTime;
      
      if (scheduleType === 'custom') {
        if (!scheduledDate || !scheduledTime) {
          setError('Please select both date and time');
          return;
        }
        
        scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      } else {
        const option = quickScheduleOptions.find(opt => opt.value === scheduleType);
        if (option && option.getDate) {
          scheduledDateTime = option.getDate();
        }
      }
      
      if (!scheduledDateTime || scheduledDateTime <= new Date()) {
        setError('Scheduled time must be in the future');
        return;
      }
      
      await scheduleEmail(emailData, scheduledDateTime);
      onScheduled?.(scheduledDateTime);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule email');
    }
  };

  const getScheduledTimeDisplay = () => {
    if (scheduleType === 'custom') {
      if (scheduledDate && scheduledTime) {
        const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        return format(dateTime, 'PPP p');
      }
      return 'Select date and time';
    } else {
      const option = quickScheduleOptions.find(opt => opt.value === scheduleType);
      if (option && option.getDate) {
        return format(option.getDate(), 'PPP p');
      }
    }
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Schedule Email</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Email Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Email to be scheduled:</div>
            <div className="font-medium text-gray-900 mb-1">
              To: {emailData?.to || 'No recipient'}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              Subject: {emailData?.subject || 'No subject'}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {emailData?.body ? 
                emailData.body.substring(0, 100) + (emailData.body.length > 100 ? '...' : '') :
                'No content'
              }
            </div>
          </div>

          {/* Schedule Options */}
          <div className="space-y-3 mb-6">
            <label className="text-sm font-medium text-gray-700">
              When to send:
            </label>
            
            {quickScheduleOptions.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="scheduleType"
                  value={option.value}
                  checked={scheduleType === option.value}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                {option.getDate && scheduleType === option.value && (
                  <span className="ml-auto text-xs text-gray-500">
                    {format(option.getDate(), 'MMM d, h:mm a')}
                  </span>
                )}
              </label>
            ))}
          </div>

          {/* Custom Date/Time Inputs */}
          {scheduleType === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <ClockIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Time Display */}
          {getScheduledTimeDisplay() && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Scheduled for: {getScheduledTimeDisplay()}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={loading || !emailData}
              className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Schedule Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailScheduler;
