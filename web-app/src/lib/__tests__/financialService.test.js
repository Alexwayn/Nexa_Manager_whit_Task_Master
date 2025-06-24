import financialService from '@lib/financialService';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

// Mock dependencies
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
  },
}));

jest.mock('../../utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

// Mock incomeService and expenseService
jest.mock('../incomeService', () => ({
  getIncomeStats: jest.fn(),
  getIncomeTrend: jest.fn(),
}));

jest.mock('../expenseService', () => ({
  getExpenseStats: jest.fn(),
  getExpenseTrend: jest.fn(),
}));

// Mock import.meta for Vite compatibility
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'test-key',
      },
    },
  },
});

describe('FinancialService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Currency Formatting', () => {
    test('should format positive amounts correctly', () => {
      expect(financialService.formatCurrency(1234.56)).toBe('€1,234.56');
      expect(financialService.formatCurrency(0)).toBe('€0.00');
      expect(financialService.formatCurrency(999.999)).toBe('€1,000.00');
    });

    test('should format negative amounts correctly', () => {
      expect(financialService.formatCurrency(-1234.56)).toBe('-€1,234.56');
      expect(financialService.formatCurrency(-0.01)).toBe('-€0.01');
    });

    test('should handle invalid inputs gracefully', () => {
      // The actual implementation uses Intl.NumberFormat which converts null to 0 and others to NaN
      expect(financialService.formatCurrency(null)).toBe('€0.00');
      expect(financialService.formatCurrency(undefined)).toBe('€NaN');
      expect(financialService.formatCurrency('invalid')).toBe('€NaN');
    });
  });

  describe('Percentage Formatting', () => {
    test('should format percentages correctly', () => {
      expect(financialService.formatPercentage(25)).toBe('25.0%');
      expect(financialService.formatPercentage(0)).toBe('0.0%');
      expect(financialService.formatPercentage(100)).toBe('100.0%');
      expect(financialService.formatPercentage(33.333)).toBe('33.3%');
    });

    test('should handle negative percentages', () => {
      expect(financialService.formatPercentage(-15.5)).toBe('-15.5%');
    });
  });

  describe('Financial Overview', () => {
    test('should get financial overview successfully', async () => {
      const mockIncomeStats = {
        success: true,
        data: {
          totalAmount: 10000,
          totalCount: 5,
          averageAmount: 2000,
          byCategory: { consulting: 6000, products: 4000 },
          dailyTrend: [
            { date: '2024-01-01', amount: 2000 },
            { date: '2024-01-02', amount: 3000 },
          ],
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      const mockExpenseStats = {
        success: true,
        data: {
          totalAmount: 3000,
          totalCount: 10,
          averageAmount: 300,
          taxDeductibleAmount: 2000,
          nonTaxDeductibleAmount: 1000,
          byCategory: { office: 1500, travel: 1500 },
          byVendor: { 'Vendor A': 1500, 'Vendor B': 1500 },
          dailyTrend: [
            { date: '2024-01-01', amount: 1000 },
            { date: '2024-01-02', amount: 2000 },
          ],
        },
      };

      financialService.incomeService.getIncomeStats = jest.fn().mockResolvedValue(mockIncomeStats);
      financialService.expenseService.getExpenseStats = jest
        .fn()
        .mockResolvedValue(mockExpenseStats);

      const result = await financialService.getFinancialOverview('month');

      expect(result.success).toBe(true);
      expect(result.data.income.total).toBe(10000);
      expect(result.data.expenses.total).toBe(3000);
      expect(result.data.netProfit).toBe(7000);
      expect(result.data.profitMargin).toBe(70);
      expect(result.data.expenseRatio).toBe(30);
    });

    test('should handle income service failure', async () => {
      const mockIncomeStats = {
        success: false,
        error: 'Income service error',
      };

      const mockExpenseStats = {
        success: true,
        data: { totalAmount: 3000, totalCount: 10 },
      };

      financialService.incomeService.getIncomeStats = jest.fn().mockResolvedValue(mockIncomeStats);
      financialService.expenseService.getExpenseStats = jest
        .fn()
        .mockResolvedValue(mockExpenseStats);

      const result = await financialService.getFinancialOverview('month');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch financial data');
      expect(Logger.error).toHaveBeenCalled();
    });
  });

  describe('Cash Flow Calculation', () => {
    test('should calculate cash flow correctly', () => {
      const incomeTrend = [
        { date: '2024-01-01', amount: 1000 },
        { date: '2024-01-02', amount: 2000 },
        { date: '2024-01-03', amount: 1500 },
      ];

      const expenseTrend = [
        { date: '2024-01-01', amount: 500 },
        { date: '2024-01-02', amount: 800 },
        { date: '2024-01-04', amount: 300 },
      ];

      const result = financialService.calculateCashFlow(incomeTrend, expenseTrend);

      expect(result).toHaveLength(4); // All unique dates
      expect(result[0]).toEqual({
        date: '2024-01-01',
        income: 1000,
        expense: 500,
        net: 500,
      });
      expect(result[1]).toEqual({
        date: '2024-01-02',
        income: 2000,
        expense: 800,
        net: 1200,
      });
      expect(result[2]).toEqual({
        date: '2024-01-03',
        income: 1500,
        expense: 0,
        net: 1500,
      });
      expect(result[3]).toEqual({
        date: '2024-01-04',
        income: 0,
        expense: 300,
        net: -300,
      });
    });

    test('should handle empty trends', () => {
      const result = financialService.calculateCashFlow([], []);
      expect(result).toEqual([]);
    });
  });

  describe('Financial Trend Analysis', () => {
    test('should get financial trend successfully', async () => {
      const mockIncomeTrend = {
        success: true,
        data: {
          current: 10000,
          previous: 8000,
          change: 2000,
          changePercent: 25,
        },
      };

      const mockExpenseTrend = {
        success: true,
        data: {
          current: 3000,
          previous: 2500,
          change: 500,
          changePercent: 20,
        },
      };

      financialService.incomeService.getIncomeTrend = jest.fn().mockResolvedValue(mockIncomeTrend);
      financialService.expenseService.getExpenseTrend = jest
        .fn()
        .mockResolvedValue(mockExpenseTrend);

      const result = await financialService.getFinancialTrend('month', 'previous');

      expect(result.success).toBe(true);
      expect(result.data.netProfit.current).toBe(7000);
      expect(result.data.netProfit.previous).toBe(5500);
      expect(result.data.netProfit.change).toBe(1500);
    });
  });

  describe('Budget Management', () => {
    test('should create budget successfully', async () => {
      const mockBudgetData = {
        id: 'budget-123',
        income_target: 10000,
        expense_limit: 5000,
        period: 'month',
      };

      const mockResponse = {
        data: { ...mockBudgetData, id: 'budget-123' },
        error: null,
      };

      // Mock the chained methods properly
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const result = await financialService.createBudget(mockBudgetData);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('budget-123');
    });

    test('should handle budget creation errors', async () => {
      const mockBudgetData = {
        income_target: 10000,
        expense_limit: 5000,
      };

      const mockResponse = {
        data: null,
        error: { message: 'Database error' },
      };

      // Mock the chained methods properly
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const result = await financialService.createBudget(mockBudgetData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(Logger.error).toHaveBeenCalled();
    });

    test('should get budget performance successfully', async () => {
      const mockBudget = {
        data: {
          id: 'budget-123',
          income_target: 10000,
          expense_limit: 5000,
        },
        error: null,
      };

      const mockFinancialOverview = {
        success: true,
        data: {
          income: { total: 8000 },
          expenses: { total: 4000 },
          netProfit: 4000,
        },
      };

      // Mock the chained methods properly
      const mockSingle2 = jest.fn().mockResolvedValue(mockBudget);
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle2 });
      const mockSelect2 = jest.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ select: mockSelect2 });

      // Mock getFinancialOverview method
      const originalGetFinancialOverview = financialService.getFinancialOverview;
      financialService.getFinancialOverview = jest.fn().mockResolvedValue(mockFinancialOverview);

      const result = await financialService.getBudgetPerformance('budget-123');

      expect(result.success).toBe(true);
      expect(result.data.budget.income).toBe(10000);
      expect(result.data.actual.income).toBe(8000);
      expect(result.data.variance.income).toBe(-2000);
      expect(result.data.performance.incomeAchievement).toBe(80);

      // Restore original method
      financialService.getFinancialOverview = originalGetFinancialOverview;
    });
  });

  describe('KPI Calculations', () => {
    test('should calculate KPIs correctly', () => {
      const mockFinancialData = {
        income: {
          total: 10000,
          count: 5,
        },
        expenses: {
          total: 3000,
          count: 15,
          taxDeductible: 2000,
        },
      };

      const result = financialService.calculateKPIs(mockFinancialData);

      expect(result.grossProfit).toBe(7000);
      expect(result.profitMargin).toBe(70);
      expect(result.expenseRatio).toBe(30);
      expect(result.averageTransactionIncome).toBe(2000);
      expect(result.averageTransactionExpense).toBe(200);
      expect(result.taxDeductibleRatio).toBeCloseTo(66.67, 2);
      expect(result.burnRate).toBe(100); // 3000 / 30
      expect(result.runwayDays).toBe(100); // 10000 / (3000 / 30)
    });

    test('should handle zero income scenarios', () => {
      const mockFinancialData = {
        income: { total: 0, count: 0 },
        expenses: { total: 3000, count: 15, taxDeductible: 2000 },
      };

      const result = financialService.calculateKPIs(mockFinancialData);

      expect(result.grossProfit).toBe(-3000);
      expect(result.profitMargin).toBe(0);
      expect(result.expenseRatio).toBe(0);
      expect(result.averageTransactionIncome).toBe(0);
    });
  });

  describe('Financial Forecasting', () => {
    test('should generate financial forecast successfully', async () => {
      const mockIncomeStats = {
        success: true,
        data: {
          totalAmount: 10000,
          dailyTrend: [
            { date: '2024-01-01', amount: 1000 },
            { date: '2024-01-02', amount: 2000 },
          ],
        },
      };

      const mockExpenseStats = {
        success: true,
        data: {
          totalAmount: 3000,
          dailyTrend: [
            { date: '2024-01-01', amount: 500 },
            { date: '2024-01-02', amount: 800 },
          ],
        },
      };

      financialService.incomeService.getIncomeStats = jest.fn().mockResolvedValue(mockIncomeStats);
      financialService.expenseService.getExpenseStats = jest
        .fn()
        .mockResolvedValue(mockExpenseStats);

      const result = await financialService.generateFinancialForecast(3, 'linear');

      expect(result.success).toBe(true);
      expect(result.data.forecast).toHaveLength(3);
      expect(result.data.method).toBe('linear');
      expect(result.data.summary).toBeDefined();
    });

    test('should handle forecasting errors', async () => {
      const mockIncomeStats = {
        success: false,
        error: 'Failed to fetch historical data',
      };

      financialService.incomeService.getIncomeStats = jest.fn().mockResolvedValue(mockIncomeStats);

      const result = await financialService.generateFinancialForecast(3, 'linear');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch historical data');
      expect(Logger.error).toHaveBeenCalled();
    });
  });
});
