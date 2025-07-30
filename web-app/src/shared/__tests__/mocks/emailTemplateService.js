// Mock for emailTemplateService
export default {
  getTemplates: jest.fn().mockResolvedValue([
    {
      id: 'template-1',
      name: 'Welcome Email',
      subject: 'Welcome!',
      content: '<p>Welcome to our service!</p>'
    }
  ]),
  
  getTemplate: jest.fn().mockResolvedValue({
    id: 'template-1',
    name: 'Welcome Email',
    subject: 'Welcome!',
    content: '<p>Welcome to our service!</p>'
  }),
  
  createTemplate: jest.fn().mockResolvedValue({
    id: 'new-template-id',
    name: 'New Template',
    subject: 'New Subject',
    content: '<p>New content</p>'
  }),
  
  updateTemplate: jest.fn().mockResolvedValue({
    id: 'template-1',
    name: 'Updated Template',
    subject: 'Updated Subject',
    content: '<p>Updated content</p>'
  }),
  
  deleteTemplate: jest.fn().mockResolvedValue(true),
  
  duplicateTemplate: jest.fn().mockResolvedValue({
    id: 'duplicated-template-id',
    name: 'Copy of Template',
    subject: 'Copy of Subject',
    content: '<p>Copy of content</p>'
  })
};