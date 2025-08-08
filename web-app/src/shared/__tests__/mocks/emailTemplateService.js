// Mock for emailTemplateService
console.log('🔧 Loading emailTemplateService mock');

const mockEmailTemplateService = {
  // Template management
  getTemplates: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        name: 'Welcome Email',
        subject: 'Welcome to our service!',
        content: '<p>Welcome {{name}}!</p>',
        variables: ['name'],
        category: 'onboarding'
      },
      {
        id: 2,
        name: 'Newsletter',
        subject: 'Monthly Newsletter',
        content: '<p>Here are this month\'s updates</p>',
        variables: [],
        category: 'marketing'
      }
    ]
  }),

  getTemplate: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 1,
      name: 'Welcome Email',
      subject: 'Welcome to our service!',
      content: '<p>Welcome {{name}}!</p>',
      variables: ['name'],
      category: 'onboarding'
    }
  }),

  saveTemplate: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 3,
      name: 'New Template',
      subject: 'New Subject',
      content: '<p>New content</p>'
    }
  }),

  updateTemplate: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 1,
      name: 'Updated Template',
      subject: 'Updated Subject',
      content: '<p>Updated content</p>'
    }
  }),

  deleteTemplate: jest.fn().mockResolvedValue({
    success: true
  }),

  // Template validation
  validateTemplate: jest.fn().mockResolvedValue({
    success: true,
    isValid: true,
    errors: []
  }),

  // Template rendering
  renderTemplate: jest.fn().mockResolvedValue({
    success: true,
    data: {
      html: '<p>Rendered template content</p>',
      text: 'Rendered template content'
    }
  }),

  previewTemplate: jest.fn().mockResolvedValue({
    success: true,
    data: {
      html: '<p>Preview of template</p>',
      subject: 'Preview Subject'
    }
  }),

  // Template categories
  getCategories: jest.fn().mockResolvedValue({
    success: true,
    data: ['onboarding', 'marketing', 'transactional', 'support']
  }),

  // Template variables
  extractVariables: jest.fn().mockReturnValue(['name', 'email', 'company']),

  // Template duplication
  duplicateTemplate: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 4,
      name: 'Copy of Template',
      subject: 'Copy of Subject',
      content: '<p>Copy of content</p>'
    }
  })
};

// Function to get the service instance (mimicking the actual service)
const getEmailTemplateService = () => mockEmailTemplateService;

// Named exports
export const emailTemplateService = mockEmailTemplateService;
export { getEmailTemplateService };

// Default export
export default getEmailTemplateService;