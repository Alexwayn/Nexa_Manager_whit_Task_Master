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
  const [errors, setErrors] = useState({});
  const [createError, setCreateError] = useState('');

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
   * Validate email
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};
    
    if (!scheduleForm.name.trim()) {
      newErrors.name = t('scheduler.nomeRichiesto');
    }
    
    if (!scheduleForm.templateId) {
      newErrors.templateId = t('scheduler.tipoRichiesto');
    }
    
    if (scheduleForm.recipients.length === 0) {
      newErrors.recipients = t('scheduler.emailRichiesta');
    }
    
    if (scheduleForm.recipients.some(r => !isValidEmail(r.email))) {
      newErrors.recipients = t('scheduler.emailNonValida');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    setErrors({});
    setCreateError('');
  }, []);

  /**
   * Handle create schedule
   */
  const handleCreateSchedule = useCallback(async () => {
    if (!validateForm()) return;
    
    try {
      setCreateError('');
      
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
        await onCreateSchedule(newSchedule);
      }
      
      resetForm();
      setShowCreateDialog(false);
    } catch (error) {
      setCreateError(t('scheduler.createError'));
    }
  }, [scheduleForm, onCreateSchedule, resetForm, t, validateForm]);

  /**
   * Handle update schedule
   */
  const handleUpdateSchedule = useCallback(() => {
    if (!editingSchedule || !validateForm()) return;
    
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
  }, [editingSchedule, scheduleForm, onUpdateSchedule, resetForm, validateForm]);

  /**
   * Start editing schedule
   */
  const startEditing = useCallback((schedule) => {
    setScheduleForm({ ...schedule });
    setEditingSchedule(schedule);
    setShowCreateDialog(true);
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
  const addRecipient = useCallback((email) => {
    if (!email.trim() || !isValidEmail(email)) return;
    
    if (!scheduleForm.recipients.find(r => r.email === email)) {
      setScheduleForm(prev => ({
        ...prev,
        recipients: [...prev.recipients, { id: Date.now(), email }]
      }));
    }
  }, [scheduleForm.recipients]);

  const removeRecipient = useCallback((recipientId) => {
    setScheduleForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r.id !== recipientId)
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
   * Handle delete schedule
   */
  const handleDeleteSchedule = useCallback((scheduleId) => {
    if (global.confirm && global.confirm(t('scheduler.deleteConfirm'))) {
      if (onDeleteSchedule) {
        onDeleteSchedule(scheduleId);
      }
    }
  }, [onDeleteSchedule, t]);

  /**
   * Format next run time
   */
  const formatNextRun = useCallback((schedule) => {
    if (!schedule.isActive || !schedule.nextRun) return '';
    
    const nextRun = new Date(schedule.nextRun);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = nextRun.toDateString() === today.toDateString();
    const isTomorrow = nextRun.toDateString() === tomorrow.toDateString();
    
    if (isToday) {
      return `${t('scheduler.prossEsecuzione')} ${nextRun.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `${t('scheduler.prossEsecuzione')} domani ${t('scheduler.nextRunAt')} ${nextRun.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (schedule.frequency === 'weekly') {
      return `${t('scheduler.prossEsecuzione')} ${t('scheduler.onMonday')} ${t('scheduler.nextRunAt')} ${nextRun.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (schedule.frequency === 'monthly') {
      return `${t('scheduler.prossEsecuzione')} ${t('scheduler.monthDay1')} ${t('scheduler.nextRunAt')} ${nextRun.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return `${t('scheduler.prossEsecuzione')} ${nextRun.toLocaleDateString('it-IT')} ${t('scheduler.nextRunAt')} ${nextRun.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
  }, [t]);

  /**
   * Render schedule card
   */
  const renderScheduleCard = useCallback((schedule) => {
    const template = templates.find(t => t.id === schedule.templateId);
    const StatusIcon = getStatusIcon(schedule);
    const statusColor = getStatusColor(schedule);
    
    return (
      <div key={schedule.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`schedule-${schedule.id}`}>
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
              data-testid={`test-schedule-${schedule.id}`}
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => startEditing(schedule)}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              title={t('scheduler.edit')}
              data-testid={`edit-schedule-${schedule.id}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleSchedule && onToggleSchedule(schedule.id, !schedule.isActive)}
              className={`p-1 rounded ${schedule.isActive ? 'text-yellow-500 hover:bg-yellow-100' : 'text-green-500 hover:bg-green-100'}`}
              title={schedule.isActive ? t('scheduler.pause') : t('scheduler.resume')}
              data-testid={`toggle-schedule-${schedule.id}`}
            >
              {schedule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleDeleteSchedule(schedule.id)}
              className="p-1 text-red-500 hover:bg-red-100 rounded"
              title={t('scheduler.delete')}
              data-testid={`delete-schedule-${schedule.id}`}
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
          {schedule.isActive && schedule.nextRun && (
            <div className="col-span-2">
              <span className="text-blue-600 font-medium">{formatNextRun(schedule)}</span>
            </div>
          )}
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
  }, [templates, getStatusIcon, getStatusColor, frequencyOptions, onTestSchedule, startEditing, onToggleSchedule, handleDeleteSchedule, formatNextRun, t]);

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold">{t('scheduler.title')}</h2>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          data-testid="create-schedule-button"
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
            data-testid="search-schedules"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
          data-testid="filter-schedules"
        >
          <option value="all">{t('scheduler.allStatuses')}</option>
          <option value="active">{t('scheduler.soloActive')}</option>
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

      {/* Create/Edit Schedule Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="schedule-dialog">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                {editingSchedule ? t('scheduler.modify') : t('scheduler.createNew')}
              </h3>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                {createError}
              </div>
            )}

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              {/* Schedule Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('scheduler.nome')}
                </label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : ''}`}
                  data-testid="schedule-name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('scheduler.tipo')}
                </label>
                <select
                  value={scheduleForm.templateId}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, templateId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md ${errors.templateId ? 'border-red-500' : ''}`}
                  data-testid="report-type"
                >
                  <option value="">Seleziona tipo report</option>
                  <option value="revenue">{t('scheduler.reportTypes.revenue')}</option>
                  <option value="expense">{t('scheduler.reportTypes.expense')}</option>
                  <option value="client">{t('scheduler.reportTypes.client')}</option>
                </select>
                {errors.templateId && <p className="text-red-500 text-sm mt-1">{errors.templateId}</p>}
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('scheduler.frequency')}
                </label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  data-testid="frequency"
                >
                  {frequencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('scheduler.ora')}
                </label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  data-testid="time"
                />
              </div>

              {/* Weekly frequency options */}
              {scheduleForm.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scheduler.giornoDellaSett')}
                  </label>
                  <select
                    value={scheduleForm.weekdays[0] || 1}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, weekdays: [parseInt(e.target.value)] }))}
                    className="w-full px-3 py-2 border rounded-md"
                    data-testid="day-of-week"
                  >
                    {weekdays.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Monthly frequency options */}
              {scheduleForm.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scheduler.giornoDelMese')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={scheduleForm.monthDay}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, monthDay: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-md"
                    data-testid="day-of-month"
                  />
                </div>
              )}

              {/* Email Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('scheduler.email')}
                </label>
                <div className="space-y-2">
                  {scheduleForm.recipients.map(recipient => (
                    <div key={recipient.id} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={recipient.email}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded-md bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => removeRecipient(recipient.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <input
                    type="email"
                    placeholder="Aggiungi email destinatario"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRecipient(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value) {
                        addRecipient(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md ${errors.recipients ? 'border-red-500' : ''}`}
                    data-testid="email-input"
                  />
                </div>
                {errors.recipients && <p className="text-red-500 text-sm mt-1">{errors.recipients}</p>}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingSchedule(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  data-testid="cancel-button"
                >
                  {t('scheduler.cancel')}
                </button>
                <button
                  type="button"
                  onClick={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  data-testid="save-button"
                >
                  {t('scheduler.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportScheduler;
