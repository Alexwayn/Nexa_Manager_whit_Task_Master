// Mock for emailQueueService
export default {
  addToQueue: jest.fn().mockResolvedValue({
    id: 'queue-item-id',
    status: 'queued',
    scheduledAt: new Date().toISOString()
  }),
  
  getQueueStatus: jest.fn().mockResolvedValue({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  }),
  
  getQueueItems: jest.fn().mockResolvedValue([]),
  
  processQueue: jest.fn().mockResolvedValue(true),
  
  retryFailedItems: jest.fn().mockResolvedValue(true),
  
  clearQueue: jest.fn().mockResolvedValue(true),
  
  pauseQueue: jest.fn().mockResolvedValue(true),
  
  resumeQueue: jest.fn().mockResolvedValue(true),
  
  removeFromQueue: jest.fn().mockResolvedValue(true),
  
  getQueueMetrics: jest.fn().mockResolvedValue({
    totalProcessed: 0,
    successRate: 100,
    averageProcessingTime: 0
  })
};