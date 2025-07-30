// Mock implementation for testing purposes
// This provides the same interface as the TypeScript version

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
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let filteredReports = [...mockReports];
  
  if (filters.type) {
    filteredReports = filteredReports.filter(report => report.type === filters.type);
  }
  
  if (filters.status) {
    filteredReports = filteredReports.filter(report => report.status === filters.status);
  }
  
  return filteredReports;
};

export const getReportMetrics = async (dateRange = {}) => {
  // Mock implementation for testing
  return {
    totalRevenue: 150000,
    totalExpenses: 80000,
    netProfit: 70000,
    totalClients: 45,
    activeProjects: 12,
    completedReports: 28
  };
};

export const generateReport = async (params) => {
  if (!params || !params.type) {
    throw new Error('Missing required parameters');
  }
  
  // Mock implementation for testing
  return {
    id: Math.floor(Math.random() * 1000),
    name: `Generated ${params.type} Report`,
    type: params.type,
    status: 'completed',
    format: params.format || 'PDF',
    file_path: `/reports/generated_${Date.now()}.pdf`,
    created_at: new Date().toISOString()
  };
};

export const getChartData = async (type, options = {}) => {
  if (!type || !['revenue', 'expenses', 'profit'].includes(type)) {
    throw new Error('Invalid chart type');
  }
  
  // Mock implementation for testing
  return {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: type.charAt(0).toUpperCase() + type.slice(1),
      data: [12000, 15000, 18000, 14000, 16000, 20000]
    }]
  };
};

export const downloadReport = async (filePath) => {
  if (!filePath || filePath.includes('nonexistent')) {
    throw new Error('File not found');
  }
  
  // Mock implementation for testing
  return new Blob(['Mock PDF content'], { type: 'application/pdf' });
};

export const getScheduledReports = async () => {
  // Mock implementation for testing
  return [
    {
      id: 1,
      name: 'Weekly Revenue Report',
      type: 'revenue',
      frequency: 'weekly',
      enabled: true
    }
  ];
};

export const createSchedule = async (scheduleData) => {
  if (!scheduleData || !scheduleData.name) {
    throw new Error('Missing required schedule parameters');
  }
  
  // Mock implementation for testing
  return {
    id: Math.floor(Math.random() * 1000),
    ...scheduleData,
    created_at: new Date().toISOString()
  };
};

export const updateSchedule = async (id, updateData) => {
  if (!id) {
    throw new Error('Schedule ID is required');
  }
  
  // Mock implementation for testing
  return {
    id,
    ...updateData,
    updated_at: new Date().toISOString()
  };
};

export const deleteSchedule = async (id) => {
  if (!id) {
    throw new Error('Schedule ID is required');
  }
  
  // Mock implementation for testing
  return { success: true };
};

export const exportReportData = async (exportData) => {
  if (!exportData || !exportData.format) {
    throw new Error('Export format is required');
  }
  
  // Mock implementation for testing
  const content = exportData.format === 'json' 
    ? JSON.stringify({ data: 'mock data' })
    : 'CSV mock data';
    
  return new Blob([content], { 
    type: exportData.format === 'json' ? 'application/json' : 'text/csv' 
  });
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