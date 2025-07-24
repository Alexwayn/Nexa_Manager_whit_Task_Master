// Mock for emailTemplateService.js
const emailTemplateService = {
  getAvailableVariables: () => [
    { name: 'firstName', description: 'First name', placeholder: '{firstName}' },
    { name: 'lastName', description: 'Last name', placeholder: '{lastName}' },
    { name: 'email', description: 'Email address', placeholder: '{email}' },
    { name: 'companyName', description: 'Company name', placeholder: '{companyName}' }
  ],
  
  getTemplate: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'mock-template-id',
      name: 'Mock Template',
      subject: 'Mock Subject',
      htmlContent: '<p>Mock HTML content</p>',
      textContent: 'Mock text content',
    },
  }),
  
  applyTemplate: jest.fn().mockResolvedValue({
    success: true,
    data: {
      subject: 'Mock Subject',
      htmlContent: '<p>Mock HTML content</p>',
      textContent: 'Mock text content',
    },
  }),
  
  getTemplates: jest.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  saveTemplate: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'mock-template-id' },
  }),
  
  validateTemplate: jest.fn(() => ({ isValid: true, issues: [] })),
  
  renderTemplate: jest.fn((template, variables) => ({
    success: true,
    data: {
      subject: template.subject || 'Mock Subject',
      htmlContent: template.html_content || template.htmlContent || '<p>Mock HTML content</p>'
    }
  })),
  
  predefinedTemplates: {
    welcome: {
      name: 'Welcome Email',
      description: 'Welcome new customers',
      subject: 'Welcome to {companyName}!',
      html: '<p>Welcome {customerName}!</p>',
      variables: ['companyName', 'customerName']
    },
    invoice: {
      name: 'Invoice Template',
      description: 'Send invoices to customers',
      subject: 'Invoice #{invoiceNumber}',
      html: '<p>Dear {customerName}, your invoice is ready.</p>',
      variables: ['invoiceNumber', 'customerName']
    }
  },
  
  deleteTemplate: jest.fn().mockResolvedValue({ success: true }),
  duplicateTemplate: jest.fn().mockResolvedValue({ success: true }),
  exportTemplate: jest.fn().mockResolvedValue({ success: true }),
  importTemplate: jest.fn().mockResolvedValue({ success: true }),
  getTemplateHistory: jest.fn().mockResolvedValue([]),
  restoreTemplateVersion: jest.fn().mockResolvedValue({ success: true }),
  shareTemplate: jest.fn().mockResolvedValue({ success: true }),
  getSharedTemplates: jest.fn().mockResolvedValue([]),
  unshareTemplate: jest.fn().mockResolvedValue({ success: true }),
  searchTemplates: jest.fn().mockResolvedValue([]),
  getTemplateCategories: jest.fn().mockResolvedValue([]),
  createCategory: jest.fn().mockResolvedValue({ success: true }),
  updateCategory: jest.fn().mockResolvedValue({ success: true }),
  deleteCategory: jest.fn().mockResolvedValue({ success: true }),
  moveTemplateToCategory: jest.fn().mockResolvedValue({ success: true }),
  getTemplateUsageStats: jest.fn().mockResolvedValue({}),
  getTemplatePerformance: jest.fn().mockResolvedValue({}),
  scheduleTemplate: jest.fn().mockResolvedValue({ success: true }),
  getScheduledTemplates: jest.fn().mockResolvedValue([]),
  cancelScheduledTemplate: jest.fn().mockResolvedValue({ success: true }),
  testTemplate: jest.fn().mockResolvedValue({ success: true }),
  getTestResults: jest.fn().mockResolvedValue([]),
  createTemplateFromEmail: jest.fn().mockResolvedValue({ success: true }),
  getEmailTemplatePreview: jest.fn().mockResolvedValue(''),
  validateTemplateVariables: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
  getTemplateSize: jest.fn().mockResolvedValue(0),
  compressTemplate: jest.fn().mockResolvedValue({ success: true }),
  optimizeTemplate: jest.fn().mockResolvedValue({ success: true }),
  getTemplateComplexity: jest.fn().mockResolvedValue({ score: 1, factors: [] }),
  analyzeTemplate: jest.fn().mockResolvedValue({}),
  getTemplateSuggestions: jest.fn().mockResolvedValue([]),
  autoCompleteTemplate: jest.fn().mockResolvedValue(''),
  getTemplateInsights: jest.fn().mockResolvedValue({}),
  generateTemplateReport: jest.fn().mockResolvedValue({}),
  exportTemplateReport: jest.fn().mockResolvedValue({ success: true }),
  getTemplateMetrics: jest.fn().mockResolvedValue({}),
  trackTemplateUsage: jest.fn().mockResolvedValue({ success: true }),
  getTemplateAnalytics: jest.fn().mockResolvedValue({}),
  createTemplateBackup: jest.fn().mockResolvedValue({ success: true }),
  restoreTemplateBackup: jest.fn().mockResolvedValue({ success: true }),
  getTemplateBackups: jest.fn().mockResolvedValue([]),
  deleteTemplateBackup: jest.fn().mockResolvedValue({ success: true }),
  syncTemplateWithRemote: jest.fn().mockResolvedValue({ success: true }),
  getTemplateSyncStatus: jest.fn().mockResolvedValue({}),
  resolveTemplateSyncConflict: jest.fn().mockResolvedValue({ success: true }),
  getTemplateConflicts: jest.fn().mockResolvedValue([]),
  mergeTemplateVersions: jest.fn().mockResolvedValue({ success: true }),
  compareTemplateVersions: jest.fn().mockResolvedValue({}),
  getTemplateVersionDiff: jest.fn().mockResolvedValue(''),
  createTemplateSnapshot: jest.fn().mockResolvedValue({ success: true }),
  getTemplateSnapshots: jest.fn().mockResolvedValue([]),
  restoreTemplateSnapshot: jest.fn().mockResolvedValue({ success: true }),
  deleteTemplateSnapshot: jest.fn().mockResolvedValue({ success: true }),
};

export default emailTemplateService;