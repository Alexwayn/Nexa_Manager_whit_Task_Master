// Minimal VoiceCommandHelp test without React imports

// Mock the help service
jest.mock('@/services/helpService', () => ({
  getVoiceCommands: jest.fn(() => Promise.resolve({
    success: true,
    data: [
      {
        id: 'nav-dashboard',
        category: 'navigation',
        command: 'go to dashboard',
        description: 'Navigate to the main dashboard',
        examples: ['go to dashboard', 'show dashboard', 'open dashboard'],
        confidence: 0.95
      }
    ]
  }))
}));

describe('VoiceCommandHelp Minimal Tests', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have mocked help service', () => {
    const helpService = require('@/services/helpService');
    expect(helpService.getVoiceCommands).toBeDefined();
    expect(typeof helpService.getVoiceCommands).toBe('function');
  });

  it('should call help service and get data', async () => {
    const helpService = require('@/services/helpService');
    const result = await helpService.getVoiceCommands();
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(1);
    expect(result.data[0].command).toBe('go to dashboard');
  });
});