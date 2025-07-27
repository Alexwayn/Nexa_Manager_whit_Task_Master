/**
 * Common mock services for scanner tests
 */

export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

export const mockCanvas = {
  width: 800,
  height: 600,
  getContext: jest.fn()
};

export const mockContext = {
  drawImage: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn()
};

export const mockImageData = {
  data: new Uint8ClampedArray(800 * 600 * 4),
  width: 800,
  height: 600
};

export const mockEnvVars = {
  VITE_OPENAI_API_KEY: 'test-openai-key',
  VITE_QWEN_API_KEY: 'test-qwen-key',
  VITE_AZURE_VISION_KEY: 'test-azure-key'
};

export const createMockEnv = () => ({
  getEnvVar: jest.fn((key: string, defaultValue = '') => {
    return mockEnvVars[key as keyof typeof mockEnvVars] || defaultValue;
  }),
  isDevelopment: jest.fn(() => false),
  isProduction: jest.fn(() => true)
});

export const setupMockCanvas = () => {
  mockCanvas.getContext.mockReturnValue(mockContext);
  mockContext.getImageData.mockReturnValue(mockImageData);
  
  // Mock HTML5 Canvas API
  global.HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
  global.HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock');
};

export const setupMockLocalStorage = () => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });
};