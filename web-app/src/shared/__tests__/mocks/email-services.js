// Mock for email services
export const emailService = {
  sendEmail: jest.fn(() => Promise.resolve({ success: true })),
  getEmails: jest.fn(() => Promise.resolve([])),
  deleteEmail: jest.fn(() => Promise.resolve()),
  markAsRead: jest.fn(() => Promise.resolve()),
  markAsUnread: jest.fn(() => Promise.resolve()),
  createDraft: jest.fn(() => Promise.resolve({})),
  saveDraft: jest.fn(() => Promise.resolve()),
  getDrafts: jest.fn(() => Promise.resolve([]))
};

export const useEmailComposer = jest.fn(() => ({
  isComposing: false,
  startComposing: jest.fn(),
  stopComposing: jest.fn(),
  sendEmail: jest.fn(),
  saveDraft: jest.fn(),
  attachFile: jest.fn(),
  removeAttachment: jest.fn(),
  attachments: []
}));

export const useEmailManager = jest.fn(() => ({
  emails: [],
  loading: false,
  error: null,
  refresh: jest.fn(),
  deleteEmail: jest.fn(),
  markAsRead: jest.fn()
}));

export default {
  emailService,
  useEmailComposer,
  useEmailManager
};