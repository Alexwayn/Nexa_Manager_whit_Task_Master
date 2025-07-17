// Mock configuration and setup utilities
// This file provides centralized mock management and configuration

import { jest } from '@jest/globals';
import { setupGlobalMocks, cleanupMocks } from './index';
import { mockSupabase, createMockSupabaseClient } from './supabase';
import { mockLogger, createLoggerWithSpies } from './logger';
import { mockReactRouter, routerTestUtils } from './reactRouter';
import { mockServices } from './services';
import { externalLibraryMocks } from './externalLibraries';

// Mock configuration options
export const MOCK_CONFIG = {
  // Supabase configuration
  supabase: {
    autoMock: true,
    mockAuth: true,
    mockStorage: true,
    mockRealtime: true,
    mockDatabase: true,
    defaultUser: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    },
    defaultSession: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
    },
  },

  // Logger configuration
  logger: {
    autoMock: true,
    level: 'debug',
    enableConsole: false,
    enableFile: false,
    captureAll: true,
  },

  // React Router configuration
  router: {
    autoMock: true,
    defaultLocation: {
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    },
    enableHistory: true,
  },

  // Services configuration
  services: {
    autoMock: true,
    mockEmail: true,
    mockFinancial: true,
    mockTax: true,
    mockIncome: true,
    mockExpense: true,
  },

  // External libraries configuration
  externalLibs: {
    autoMock: true,
    mockPDF: true,
    mockChart: true,
    mockDate: true,
    mockValidation: true,
    mockCrypto: true,
    mockToast: true,
    mockFile: true,
  },

  // Global configuration
  global: {
    mockTimers: false,
    mockConsole: true,
    mockLocalStorage: true,
    mockSessionStorage: true,
    mockFetch: true,
    mockWebAPIs: true,
  },
};

// Mock state management
class MockStateManager {
  constructor() {
    this.mocks = new Map();
    this.config = { ...MOCK_CONFIG };
    this.isSetup = false;
  }

  // Configuration methods
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    return this;
  }

  getConfig(key) {
    return key ? this.config[key] : this.config;
  }

  // Mock registration
  registerMock(name, mockInstance) {
    this.mocks.set(name, mockInstance);
    return this;
  }

  getMock(name) {
    return this.mocks.get(name);
  }

  getAllMocks() {
    return Object.fromEntries(this.mocks);
  }

  // Setup methods
  async setupMocks(customConfig = {}) {
    if (this.isSetup) {
      console.warn('Mocks are already setup. Call cleanup() first.');
      return this;
    }

    // Merge custom configuration
    this.setConfig(customConfig);

    try {
      // Setup global mocks first
      if (this.config.global.mockTimers) {
        jest.useFakeTimers();
      }

      // Setup Supabase mocks
      if (this.config.supabase.autoMock) {
        const supabaseClient = createMockSupabaseClient(this.config.supabase);
        this.registerMock('supabase', supabaseClient);

        // Mock the Supabase module
        jest.doMock('@supabase/supabase-js', () => ({
          createClient: jest.fn(() => supabaseClient),
        }));
      }

      // Setup Logger mocks
      if (this.config.logger.autoMock) {
        const logger = createLoggerWithSpies(this.config.logger);
        this.registerMock('logger', logger);

        // Mock the Logger module
        jest.doMock('../../services/Logger', () => ({
          default: logger,
          Logger: logger,
        }));
      }

      // Setup React Router mocks
      if (this.config.router.autoMock) {
        this.registerMock('router', mockReactRouter);

        // Mock React Router modules
        jest.doMock('react-router-dom', () => mockReactRouter);
        jest.doMock('react-router', () => mockReactRouter);
      }

      // Setup Service mocks
      if (this.config.services.autoMock) {
        this.registerMock('services', mockServices);

        // Mock individual service modules
        if (this.config.services.mockEmail) {
          jest.doMock('../../services/EmailService', () => mockServices.EmailService);
        }
        if (this.config.services.mockFinancial) {
          jest.doMock('../../services/FinancialService', () => mockServices.FinancialService);
        }
        if (this.config.services.mockTax) {
          jest.doMock(
            '../../services/TaxCalculationService',
            () => mockServices.TaxCalculationService,
          );
        }
        if (this.config.services.mockIncome) {
          jest.doMock('../../services/IncomeService', () => mockServices.IncomeService);
        }
        if (this.config.services.mockExpense) {
          jest.doMock('../../services/ExpenseService', () => mockServices.ExpenseService);
        }
      }

      // Setup External Library mocks
      if (this.config.externalLibs.autoMock) {
        this.registerMock('externalLibs', externalLibraryMocks);

        // Mock external library modules
        if (this.config.externalLibs.mockPDF) {
          jest.doMock('jspdf', () => ({
            default: jest.fn(() => externalLibraryMocks.pdf),
            jsPDF: jest.fn(() => externalLibraryMocks.pdf),
          }));
        }

        if (this.config.externalLibs.mockChart) {
          jest.doMock('chart.js', () => ({
            Chart: jest.fn(() => externalLibraryMocks.chart),
            registerables: [],
          }));
          jest.doMock('react-chartjs-2', () => ({
            Line: jest.fn(({ data, options }) => null),
            Bar: jest.fn(({ data, options }) => null),
            Pie: jest.fn(({ data, options }) => null),
            Doughnut: jest.fn(({ data, options }) => null),
          }));
        }

        if (this.config.externalLibs.mockDate) {
          jest.doMock('date-fns', () => externalLibraryMocks.date);
          jest.doMock('moment', () => jest.fn(() => externalLibraryMocks.date));
          jest.doMock('dayjs', () => jest.fn(() => externalLibraryMocks.date));
        }

        if (this.config.externalLibs.mockValidation) {
          jest.doMock('yup', () => externalLibraryMocks.validation);
          jest.doMock('joi', () => externalLibraryMocks.validation);
          jest.doMock('zod', () => externalLibraryMocks.validation);
        }

        if (this.config.externalLibs.mockToast) {
          jest.doMock('react-hot-toast', () => ({
            default: externalLibraryMocks.toast,
            toast: externalLibraryMocks.toast,
          }));
          jest.doMock('react-toastify', () => ({
            toast: externalLibraryMocks.toast,
          }));
        }
      }

      // Setup global mocks
      setupGlobalMocks();

      this.isSetup = true;
      console.log('✅ All mocks setup successfully');
    } catch (error) {
      console.error('❌ Error setting up mocks:', error);
      throw error;
    }

    return this;
  }

  // Cleanup methods
  async cleanupMocks() {
    if (!this.isSetup) {
      return this;
    }

    try {
      // Cleanup global mocks
      cleanupMocks();

      // Restore timers
      if (this.config.global.mockTimers) {
        jest.useRealTimers();
      }

      // Clear all Jest mocks
      jest.clearAllMocks();
      jest.resetAllMocks();
      jest.restoreAllMocks();

      // Clear module mocks
      jest.dontMock('@supabase/supabase-js');
      jest.dontMock('../../services/Logger');
      jest.dontMock('react-router-dom');
      jest.dontMock('react-router');
      jest.dontMock('../../services/EmailService');
      jest.dontMock('../../services/FinancialService');
      jest.dontMock('../../services/TaxCalculationService');
      jest.dontMock('../../services/IncomeService');
      jest.dontMock('../../services/ExpenseService');
      jest.dontMock('jspdf');
      jest.dontMock('chart.js');
      jest.dontMock('react-chartjs-2');
      jest.dontMock('date-fns');
      jest.dontMock('moment');
      jest.dontMock('dayjs');
      jest.dontMock('yup');
      jest.dontMock('joi');
      jest.dontMock('zod');
      jest.dontMock('react-hot-toast');
      jest.dontMock('react-toastify');

      // Clear registered mocks
      this.mocks.clear();

      this.isSetup = false;
      console.log('✅ All mocks cleaned up successfully');
    } catch (error) {
      console.error('❌ Error cleaning up mocks:', error);
      throw error;
    }

    return this;
  }

  // Utility methods
  resetMocks() {
    this.mocks.forEach(mock => {
      if (mock && typeof mock.reset === 'function') {
        mock.reset();
      }
    });
    return this;
  }

  getMockStats() {
    const stats = {
      totalMocks: this.mocks.size,
      isSetup: this.isSetup,
      config: this.config,
      mocks: {},
    };

    this.mocks.forEach((mock, name) => {
      stats.mocks[name] = {
        type: typeof mock,
        hasReset: typeof mock.reset === 'function',
        hasClear: typeof mock.clear === 'function',
      };
    });

    return stats;
  }
}

// Global mock state manager instance
export const mockStateManager = new MockStateManager();

// Convenience functions
export const setupAllMocks = config => mockStateManager.setupMocks(config);
export const cleanupAllMocks = () => mockStateManager.cleanupMocks();
export const resetAllMocks = () => mockStateManager.resetMocks();
export const getMockStats = () => mockStateManager.getMockStats();

// Test environment setup helpers
export const createTestEnvironment = async (config = {}) => {
  await setupAllMocks(config);

  return {
    mocks: mockStateManager.getAllMocks(),
    cleanup: cleanupAllMocks,
    reset: resetAllMocks,
    stats: getMockStats,
  };
};

// Preset configurations
export const PRESET_CONFIGS = {
  // Minimal setup - only essential mocks
  minimal: {
    supabase: { autoMock: true },
    logger: { autoMock: true, enableConsole: false },
    router: { autoMock: false },
    services: { autoMock: false },
    externalLibs: { autoMock: false },
    global: { mockTimers: false, mockConsole: true },
  },

  // Unit testing - all mocks enabled
  unit: {
    supabase: { autoMock: true },
    logger: { autoMock: true, enableConsole: false },
    router: { autoMock: true },
    services: { autoMock: true },
    externalLibs: { autoMock: true },
    global: { mockTimers: false, mockConsole: true },
  },

  // Integration testing - selective mocking
  integration: {
    supabase: { autoMock: true },
    logger: { autoMock: true, enableConsole: true },
    router: { autoMock: false },
    services: { autoMock: false },
    externalLibs: { autoMock: true },
    global: { mockTimers: false, mockConsole: false },
  },

  // E2E testing - minimal mocking
  e2e: {
    supabase: { autoMock: false },
    logger: { autoMock: true, enableConsole: true },
    router: { autoMock: false },
    services: { autoMock: false },
    externalLibs: { autoMock: false },
    global: { mockTimers: false, mockConsole: false },
  },
};

// Export preset setup functions
export const setupMinimalMocks = () => setupAllMocks(PRESET_CONFIGS.minimal);
export const setupUnitTestMocks = () => setupAllMocks(PRESET_CONFIGS.unit);
export const setupIntegrationTestMocks = () => setupAllMocks(PRESET_CONFIGS.integration);
export const setupE2ETestMocks = () => setupAllMocks(PRESET_CONFIGS.e2e);

// Default export
export default {
  mockStateManager,
  setupAllMocks,
  cleanupAllMocks,
  resetAllMocks,
  getMockStats,
  createTestEnvironment,
  PRESET_CONFIGS,
  setupMinimalMocks,
  setupUnitTestMocks,
  setupIntegrationTestMocks,
  setupE2ETestMocks,
};
