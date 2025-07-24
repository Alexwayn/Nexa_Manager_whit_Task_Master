// Mock for emailOfflineService.js
const emailOfflineService = {
  isOnline: true,
  
  queueOfflineOperation: jest.fn().mockResolvedValue({
    success: true,
    queued: true,
    operationId: 'mock-operation-id',
  }),
  
  processOfflineQueue: jest.fn().mockResolvedValue({ success: true }),
  
  getOfflineQueue: jest.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  clearOfflineQueue: jest.fn().mockResolvedValue({ success: true }),
};

export default emailOfflineService;