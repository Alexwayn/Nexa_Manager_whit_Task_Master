import React, { useState } from 'react';
import {
  BellIcon,
  PlusIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useFollowUpReminders } from '@hooks/useEmailAutomation';
import { format, isAfter, isBefore, addDays } from 'date-fns';

const FollowUpReminders = ({ selectedEmailId = null }) => {
  const { 
    reminders, 
    loading, 
    createReminder, 
    completeReminder, 
    getOverdueReminders, 
    getPendingReminders 
  } = useFollowUpReminders();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, overdue, completed
  const [formData, setFormData] = useState({
    emailId: selectedEmailId || '',
    title: '',
    description: '',
    reminderDate: ''
  });

  const overdueReminders = getOverdueReminders();
  const pendingReminders = getPendingReminders();

  const filteredReminders = reminders.filter(reminder => {
    switch (filter) {
      case 'pending':
        return !reminder.is_completed;
      case 'overdue':
        return !reminder.is_completed && new Date(reminder.reminder_date) < new Date();
      case 'completed':
        return reminder.is_completed;
      default:
        return true;
    }
  });

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      await createReminder({
        emailId: formData.emailId,
        title: formData.title,
        description: formData.description,
        reminderDate: new Date(formData.reminderDate).toISOString()
      });
      
      setFormData({
        emailId: selectedEmailId || '',
        title: '',
        description: '',
        reminderDate: ''
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create reminder:', error);
    }
  };

  const handleCompleteReminder = async (reminderId) => {
    try {
      await completeReminder(reminderId);
    } catch (error) {
      console.error('Failed to complete reminder:', error);
    }
  };

  const getReminderStatus = (reminder) => {
    if (reminder.is_completed) {
      return { status: 'completed', color: 'green', icon: CheckIcon };
    }
    
    const now = new Date();
    const reminderDate = new Date(reminder.reminder_date);
    
    if (isBefore(reminderDate, now)) {
      return { status: 'overdue', color: 'red', icon: ExclamationTriangleIcon };
    }
    
    return { status: 'pending', color: 'yellow', icon: ClockIcon };
  };

  const getQuickReminderOptions = () => [
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: 'In 3 days', date: addDays(new Date(), 3) },
    { label: 'Next week', date: addDays(new Date(), 7) },
    { label: 'In 2 weeks', date: addDays(new Date(), 14) }
  ];

  if (loading && reminders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BellIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Follow-up Reminders</h2>
          {overdueReminders.length > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {overdueReminders.length} overdue
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BellIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Reminders</p>
              <p className="text-2xl font-semibold text-gray-900">{reminders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingReminders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{overdueReminders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reminders.filter(r => r.is_completed).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All', count: reminders.length },
            { key: 'pending', label: 'Pending', count: pendingReminders.length },
            { key: 'overdue', label: 'Overdue', count: overdueReminders.length },
            { key: 'completed', label: 'Completed', count: reminders.filter(r => r.is_completed).length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  filter === tab.key
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {filteredReminders.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'Create your first follow-up reminder to stay on top of important emails.'
                : `No ${filter} reminders found.`
              }
            </p>
            {filter === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Reminder
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredReminders.map((reminder) => {
            const { status, color, icon: StatusIcon } = getReminderStatus(reminder);
            
            return (
              <div
                key={reminder.id}
                className={`border rounded-lg p-4 ${
                  status === 'overdue' 
                    ? 'border-red-200 bg-red-50' 
                    : status === 'completed'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <StatusIcon className={`h-5 w-5 mt-0.5 text-${color}-600`} />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{reminder.title}</h3>
                      {reminder.description && (
                        <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>
                            Due: {format(new Date(reminder.reminder_date), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        
                        {reminder.emails && (
                          <div className="flex items-center space-x-1">
                            <EnvelopeIcon className="h-3 w-3" />
                            <span>
                              {reminder.emails.subject || 'Email reminder'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      status === 'overdue' 
                        ? 'bg-red-100 text-red-800'
                        : status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    
                    {!reminder.is_completed && (
                      <button
                        onClick={() => handleCompleteReminder(reminder.id)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Mark as completed"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Reminder Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <form onSubmit={handleCreateReminder}>
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">Create Follow-up Reminder</h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Follow up on proposal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details about this reminder..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email ID (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.emailId}
                    onChange={(e) => setFormData(prev => ({ ...prev, emailId: e.target.value }))}
                    placeholder="Link to specific email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reminder Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.reminderDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminderDate: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Quick Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Options:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {getQuickReminderOptions().map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => {
                          const dateTime = option.date.toISOString().slice(0, 16);
                          setFormData(prev => ({ ...prev, reminderDate: dateTime }));
                        }}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpReminders;