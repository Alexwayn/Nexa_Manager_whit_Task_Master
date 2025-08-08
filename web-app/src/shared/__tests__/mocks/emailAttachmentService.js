// Mock for emailAttachmentService
console.log('🔧 Loading emailAttachmentService mock');

const emailAttachmentService = {
  // Configuration methods
  getConfig: jest.fn().mockReturnValue({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxTotalSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 5,
    allowedTypes: ['image/*', 'application/pdf', 'text/*', '.doc', '.docx']
  }),

  // Upload methods
  uploadAttachment: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'attachment_123',
      filename: 'test-file.pdf',
      size: 1024,
      url: '/uploads/attachment_123.pdf'
    }
  }),

  uploadMultiple: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 'attachment_123',
        filename: 'file1.pdf',
        size: 1024,
        url: '/uploads/attachment_123.pdf'
      }
    ]
  }),

  // Management methods
  deleteAttachment: jest.fn().mockResolvedValue({
    success: true
  }),

  getAttachment: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'attachment_123',
      filename: 'test-file.pdf',
      size: 1024,
      url: '/uploads/attachment_123.pdf'
    }
  }),

  // Validation methods
  validateFile: jest.fn().mockReturnValue({
    isValid: true,
    errors: []
  }),

  validateSize: jest.fn().mockReturnValue({
    isValid: true,
    totalSize: 1024
  }),

  // Preview methods
  generatePreview: jest.fn().mockResolvedValue({
    success: true,
    data: {
      previewUrl: '/previews/attachment_123.jpg',
      type: 'image'
    }
  })
};

// Export as both named and default export to handle different import styles
module.exports = emailAttachmentService;
module.exports.emailAttachmentService = emailAttachmentService;
module.exports.default = emailAttachmentService;