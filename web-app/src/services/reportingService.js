// Mock implementation for testing purposes
// This provides the same interface as the TypeScript version

// Import supabase client for integration tests
import { supabase } from '@/lib/supabaseClient';

const mockReports = [
  {
    id: 1,
    name: 'Revenue Report Q1',
    type: 'revenue',
    status: 'completed',
    format: 'PDF',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Client Analysis',
    type: 'client',
    status: 'processing',
    format: 'Excel',
    created_at: '2024-01-10T14:30:00Z'
  }
];

const mockMetrics = {
  totalRevenue: 150000,
  totalExpenses: 80000,
  netProfit: 70000,
  totalClients: 45,
  activeProjects: 12,
  completedReports: 28
};

const mockSchedules = [
  {
    id: 1,
    name: 'Weekly Revenue Report',
    type: 'revenue',
    frequency: 'weekly',
    enabled: true
  }
];

export const getReports = async (filters = {}) => {
  let query = supabase.from('reports').select('*');
  
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data || [];
};

export const getReportMetrics = async (filters = {}) => {
  const params = {};
  
  if (filters.startDate) {
    params.start_date = filters.startDate;
  }
  
  if (filters.endDate) {
    params.end_date = filters.endDate;
  }
  
  const { data, error } = await supabase.rpc('get_report_metrics', Object.keys(params).length > 0 ? params : undefined);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const generateReport = async (params) => {
  if (!params || !params.type || !params.startDate || !params.endDate) {
    throw new Error('Missing required parameters');
  }
  
  const reportData = {
    name: params.name,
    type: params.type,
    format: params.format,
    parameters: {
      startDate: params.startDate,
      endDate: params.endDate
    },
    status: 'processing'
  };
  
  const { data, error } = await supabase.from('reports')
    .insert(reportData)
    .select();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data[0];
};

export const getChartData = async (type, options = {}) => {
  if (!type || !['revenue', 'expenses', 'profit'].includes(type)) {
    throw new Error('Invalid chart type');
  }
  
  const params = {
    chart_type: type,
    start_date: options.startDate,
    end_date: options.endDate
  };
  
  const { data, error } = await supabase.rpc('get_chart_data', params);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const downloadReport = async (filePath) => {
  if (!filePath) {
    throw new Error('File path is required');
  }
  
  const { data, error } = await supabase.storage
    .from('reports')
    .download(filePath);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const getScheduledReports = async () => {
  const { data, error } = await supabase.from('report_schedules')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const createSchedule = async (scheduleData) => {
  if (!scheduleData || !scheduleData.name || !scheduleData.type || !scheduleData.frequency) {
    throw new Error('Missing required schedule parameters');
  }
  
  const insertData = {
    name: scheduleData.name,
    type: scheduleData.type,
    frequency: scheduleData.frequency,
    day_of_week: scheduleData.dayOfWeek,
    time: scheduleData.time,
    format: scheduleData.format,
    email: scheduleData.email,
    enabled: scheduleData.enabled
  };
  
  const { data, error } = await supabase.from('report_schedules')
    .insert(insertData)
    .select();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data[0];
};

export const updateSchedule = async (id, updateData) => {
  if (!id) {
    throw new Error('Schedule ID is required');
  }
  
  const { data, error } = await supabase.from('report_schedules')
    .update(updateData)
    .eq('id', id)
    .select();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data[0];
};

export const deleteSchedule = async (id) => {
  if (!id) {
    throw new Error('Schedule ID is required');
  }
  
  const { error } = await supabase.from('report_schedules')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return { success: true };
};

export const exportReportData = async (exportData) => {
  if (!exportData || !exportData.format) {
    throw new Error('Export format is required');
  }
  
  if (exportData.format === 'XML') {
    throw new Error('Unsupported export format');
  }
  
  // Mock implementation for testing
  if (exportData.format === 'JSON') {
    return JSON.stringify(exportData.data || []);
  } else if (exportData.format === 'CSV') {
    // Generate CSV from data
    if (exportData.data && exportData.data.length > 0) {
      const headers = Object.keys(exportData.data[0]);
      const csvHeaders = headers.join(',');
      const csvRows = exportData.data.map(row => 
        headers.map(header => row[header]).join(',')
      );
      return [csvHeaders, ...csvRows].join('\n');
    }
    return 'month,revenue\nJanuary,12000\nFebruary,15000';
  }
  
  return 'CSV mock data';
};

export const validateReportParams = async (params) => {
  const errors = [];
  
  if (!params.startDate) errors.push('Start date is required');
  if (!params.endDate) errors.push('End date is required');
  if (params.startDate && params.endDate && new Date(params.startDate) >= new Date(params.endDate)) {
    errors.push('End date must be after start date');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Default export for compatibility
const reportingService = {
  getReports,
  getReportMetrics,
  generateReport,
  getChartData,
  downloadReport,
  getScheduledReports,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  exportReportData,
  validateReportParams
};

export default reportingService;
