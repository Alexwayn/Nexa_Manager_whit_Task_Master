/**
 * Report Scheduler Component
 * Manages automated report generation and delivery
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  Mail,
  Play,
  Pause,
  Trash2,
  Edit3,
  Plus,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Users,
  FileText,
  Settings,
  Bell,
  Download,
  Send
} from 'lucide-react';

const ReportScheduler = ({
  schedules = [],
  templates = [],
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onToggleSchedule,
  onTestSchedule,
  availableUsers = [],
  className = ''
}) => {
  const { t } = useTranslation('reports');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    description: '',
    templateId: '',
    frequency: 'daily',
    time: '09:00',
    timezone: 'UTC',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    weekdays: [1, 2, 3, 4, 5], // Monday to Friday
    monthDay: 1,
    recipients: [],
    deliveryMethod: 'email',
    formats: ['pdf'],
    filters: {},
    isActive: true,
    notifications: {
      onSuccess: true,
      onFailure: true,
      onStart: false
    },
    retryPolicy: {
      enabled: true,
      maxRetries: 3,
      retryInterval: 30 // minutes
    }
  });

  // Frequency options
  const frequencyOptions = [
    { value: 'hourly', label: t('scheduler.hourly') },
    { value: 'daily', label: t('scheduler.daily') },
    { value: 'weekly', label: t('scheduler.weekly') },
    { value: 'monthly', label: t('scheduler.monthly') },
    { value: 'quarterly', label: t('scheduler.quarterly') },
    { value: 'yearly', label: t('scheduler.yearly') }
  ];

  // Delivery methods
  const deliveryMethods = [
    { value: 'email', label: t('scheduler.email'), icon: Mail },
    { value: 'download', label: t('scheduler.download'), icon: Download },
    { value: 'webhook', label: t('scheduler.webhook'), icon: Send }
  ];

  // Export formats
  const exportFormats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' }
  ];

  // Weekday options
  const weekdays = [
    { value: 1, label: t('scheduler.monday'), short: 'Mon' },
    { value: 2, label: t('scheduler.tuesday'), short: 'Tue' },
    { value: 3, label: t('scheduler.wednesday'), short: 'Wed' },
    { value: 4, label: t('scheduler.thursday'), short: 'Thu' },
    { value: 5, label: t('scheduler.friday'), short: 'Fri' },
    { value: 6, label: t('scheduler.saturday'), short: 'Sat' },
    { value: 0, label: t('scheduler.sunday'), short: 'Sun' }
  ];

  // Filter schedules
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && schedule.isActive) ||
                         (statusFilter === 'inactive' && !schedule.isActive);
    return matchesSearch && matchesStatus;
  });

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    setScheduleForm({
      name: '',
      description: '',
      templateId: '',
      frequency: 'daily',
      time: '09:00',
      timezone: 'UTC',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      weekdays: [1, 2, 3, 4, 5],
      monthDay: 1,
      recipients: [],
      deliveryMethod: 'email',
      formats: ['pdf'],
      filters: {},
      isActive: true,
      notifications: {
        onSuccess: true,
        onFailure: true,
        onStart: false
      },
      retryPolicy: {
        enabled: true,
        maxRetries: 3,
        retryInterval: 30
      }
    });
  }, []);

  /**
   * Handle create schedule
   */
  const handleCreateSchedule = useCallback(() => {
    if (!scheduleForm.name.trim() || !scheduleForm.templateId) return;
    
    const newSchedule = {
      id: Date.now(),
      ...scheduleForm,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
      lastRun: null,
      nextRun: calculateNextRun(scheduleForm),
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      status: 'scheduled'
    };
    
    if (onCreateSchedule) {
      onCreateSchedule(newSchedule);
    }
    
    resetForm();
    setShowCreateDialog(false);
  }, [scheduleForm, onCreateSchedule, resetForm]);

  /**
   * Handle update schedule
   */
  const handleUpdateSchedule = useCallback(() => {
    if (!editingSchedule || !scheduleForm.name.trim()) return;
    
    const updatedSchedule = {
      ...editingSchedule,
      ...scheduleForm,
      updatedAt: new Date().toISOString(),
      nextRun: calculateNextRun(scheduleForm)
    };
    
    if (onUpdateSchedule) {
      onUpdateSchedule(updatedSchedule);
    }
    
    resetForm();
    setEditingSchedule(null);
  }, [editingSchedule, scheduleForm, onUpdateSchedule, resetForm]);

  /**
   * Start editing schedule
   */
  const startEditing = useCallback((schedule) => {
    setScheduleForm({ ...schedule });
    setEditingSchedule(schedule);
  }, []);

  /**
   * Calculate next run time
   */
  const calculateNextRun = useCallback((schedule) => {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, move to next occurrence
    if (nextRun <= now) {
      switch (schedule.frequency) {
        case 'hourly':
          nextRun.setHours(nextRun.getHours() + 1);
          break;
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
        case 'quarterly':
          nextRun.setMonth(nextRun.getMonth() + 3);
          break;
        case 'yearly':
          nextRun.setFullYear(nextRun.getFullYear() + 1);
          break;
      }
    }
    
    return nextRun.toISOString();
  }, []);
        /**
   * Handle recipient management
   */
  const addRecipient = useCallback((user) => {
    if (!scheduleForm.recipients.find(r => r.id === user.id)) {
      setScheduleForm(prev => ({
        ...prev,
        recipients: [...prev.recipients, user]
      }));
    }
  }, [scheduleForm.recipients]);

  const removeRecipient = useCallback((userId) => {
    setScheduleForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r.id !== userId)
    }));
  }, []);

  /**
   * Handle weekday selection
   */
  const toggleWeekday = useCallback((day) => {
    setScheduleForm(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter(d => d !== day)
        : [...prev.weekdays, day].sort()
    }));
  }, []);

  /**
   * Handle format selection
   */
  const toggleFormat = useCallback((format) => {
    setScheduleForm(prev => ({
      ...prev,
      formats: prev.formats.includes(format)
        ? prev.formats.filter(f => f !== format)
        : [...prev.formats, format]
    }));
  }, []);

  /**
   * Get status color
   */
  const getStatusColor = useCallback((schedule) => {
    if (!schedule.isActive) return 'text-gray-500';
    if (schedule.status === 'running') return 'text-blue-500';
    if (schedule.status === 'failed') return 'text-red-500';
    if (schedule.status === 'success') return 'text-green-500';
    return 'text-yellow-500';
  }, []);

  /**
   * Get status icon
   */
  const getStatusIcon = useCallback((schedule) => {
    if (!schedule.isActive) return Pause;
    if (schedule.status === 'running') return Play;
    if (schedule.status === 'failed') return AlertCircle;
    if (schedule.status === 'success') return CheckCircle;
    return Clock;
  }, []);

  /**
   * Render schedule card
   */
  const renderScheduleCard = useCallback((schedule) => {
    const template = templates.find(t => t.id === schedule.templateId);
    const StatusIcon = getStatusIcon(schedule);
    const statusColor = getStatusColor(schedule);
    
    return (
      <div key={schedule.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${schedule.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
              <StatusIcon className={`w-5 h-5 ${statusColor}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{schedule.name}</h3>
              <p className="text-sm text-gray-600">{schedule.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTestSchedule && onTestSchedule(schedule)}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              title={t('scheduler.test')}
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => startEditing(schedule)}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              title={t('scheduler.edit')}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleSchedule && onToggleSchedule(schedule.id, !schedule.isActive)}
              className={`p-1 rounded ${schedule.isActive ? 'text-yellow-500 hover:bg-yellow-100' : 'text-green-500 hover:bg-green-100'}`}
              title={schedule.isActive ? t('scheduler.pause') : t('scheduler.resume')}
            >
              {schedule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onDeleteSchedule && onDeleteSchedule(schedule.id)}
              className="p-1 text-red-500 hover:bg-red-100 rounded"
              title={t('scheduler.delete')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
          <div>
            <span className="font-medium">{t('scheduler.template')}:</span>
            <span className="ml-1">{template?.name || t('scheduler.unknownTemplate')}</span>
          </div>
          <div>
            <span className="font-medium">{t('scheduler.frequency')}:</span>
            <span className="ml-1">{frequencyOptions.find(f => f.value === schedule.frequency)?.label}</span>
          </div>
          <div>
            <span className="font-medium">{t('scheduler.nextRun')}:</span>
            <span className="ml-1">{new Date(schedule.nextRun).toLocaleString()}</span>
          </div>
          <div>
            <span className="font-medium">{t('scheduler.recipients')}:</span>
            <span className="ml-1">{schedule.recipients.length}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>{t('scheduler.runs')}: {schedule.runCount}</span>
            <span className="text-green-600">{t('scheduler.success')}: {schedule.successCount}</span>
            <span className="text-red-600">{t('scheduler.failed')}: {schedule.failureCount}</span>
          </div>
          <div className="flex items-center gap-2">
            {schedule.formats.map(format => (
              <span key={format} className="px-2 py-1 bg-gray-100 rounded">
                {format.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }, [templates, getStatusIcon, getStatusColor, frequencyOptions, onTestSchedule, startEditing, onToggleSchedule, onDeleteSchedule, t]);

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold">{t('reports.scheduler')}</h2>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          {t('scheduler.create')}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('scheduler.searchSchedules')}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">{t('scheduler.allStatuses')}</option>
          <option value="active">{t('scheduler.active')}</option>
          <option value="inactive">{t('scheduler.inactive')}</option>
        </select>
      </div>

      {/* Schedules Grid */}
      <div className="space-y-4">
        {filteredSchedules.map(renderScheduleCard)}
      </div>

      {filteredSchedules.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t('scheduler.noSchedules')}</p>
        </div>
      )}
    </div>
  );
};

export default ReportScheduler;