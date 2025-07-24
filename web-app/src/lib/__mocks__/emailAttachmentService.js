const emailAttachmentService = {
  getConfig: jest.fn(() => ({
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxTotalSize: 50 * 1024 * 1024, // 50MB
    maxFileSizeFormatted: '10MB',
    maxTotalSizeFormatted: '50MB',
    allowedTypes: ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  })),

  uploadAttachments: jest.fn((files, existingAttachments = []) => {
    const mockAttachments = files.map((file, index) => ({
      id: `mock-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: `mock://attachment/${file.name}`,
    }));

    return Promise.resolve({
      success: true,
      data: mockAttachments,
      errors: [],
    });
  }),

  deleteAttachment: jest.fn((attachmentId) => {
    return Promise.resolve({
      success: true,
      data: { id: attachmentId },
    });
  }),

  getAttachment: jest.fn((attachmentId) => {
    return Promise.resolve({
      success: true,
      data: {
        id: attachmentId,
        name: 'mock-file.pdf',
        size: 1024,
        type: 'application/pdf',
        url: `mock://attachment/${attachmentId}`,
      },
    });
  }),

  validateFile: jest.fn((file) => {
    return {
      valid: true,
      errors: [],
    };
  }),

  previewAttachment: jest.fn((attachmentId) => {
    return Promise.resolve({
      success: true,
      data: {
        previewUrl: `mock://preview/${attachmentId}`,
      },
    });
  }),
};

export default emailAttachmentService;