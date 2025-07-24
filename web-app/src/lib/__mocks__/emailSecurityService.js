// Mock for emailSecurityService.js
const emailSecurityService = {
  initializeEncryption: jest.fn().mockResolvedValue({ success: true }),
  
  analyzeEmailSecurity: jest.fn().mockResolvedValue({
    riskScore: 10,
    threats: [],
    recommendations: [],
  }),
  
  logEmailSecurityEvent: jest.fn().mockResolvedValue({ success: true }),
  
  encryptEmailContent: jest.fn().mockResolvedValue('encrypted-content'),
  
  decryptEmailContent: jest.fn().mockResolvedValue('decrypted-content'),
  
  validateEmailSecurity: jest.fn().mockResolvedValue({
    isValid: true,
    warnings: [],
  }),
};

export default emailSecurityService;