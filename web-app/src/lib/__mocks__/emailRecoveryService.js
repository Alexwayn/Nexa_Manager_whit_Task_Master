// Mock for emailRecoveryService.js
const emailRecoveryService = {
  backupEmails: jest.fn().mockResolvedValue({ success: true }),
  
  restoreEmails: jest.fn().mockResolvedValue({
    success: true,
    restored: 0,
  }),
  
  getBackupHistory: jest.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  createRecoveryPoint: jest.fn().mockResolvedValue({
    success: true,
    recoveryPointId: 'mock-recovery-point',
  }),
};

export default emailRecoveryService;
