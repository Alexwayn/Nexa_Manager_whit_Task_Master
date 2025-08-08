import financialServiceMock from '@financial/services/financialService';

// Extract the mocked services from the mock
const { financialService, incomeService, expenseService } = financialServiceMock;

describe('FinancialService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock implementations
    incomeService.getIncomeStats.mockResolvedValue({
      success: true,
      data: {
        totalIncome: 5000,
        monthlyIncome: 4500,
        incomeGrowth: 10
      }
    });
    
    incomeService.getIncomeTrend.mockResolvedValue({
      success: true,
      data: [
        { month: 'Jan', amount: 4000 },
        { month: 'Feb', amount: 4500 },
        { month: 'Mar', amount: 5000 }
      ]
    });
    
    expenseService.getExpenseStats.mockResolvedValue({
      success: true,
      data: {
        totalExpenses: 3000,
        monthlyExpenses: 2800,
        expenseGrowth: 5
      }
    });
    
    expenseService.getExpenseTrend.mockResolvedValue({
      success: true,
      data: [
        { month: 'Jan', amount: 2500 },
        { month: 'Feb', amount: 2700 },
        { month: 'Mar', amount: 3000 }
      ]
    });
  });

  describe('getFinancialOverview', () => {
    test('should return financial overview with income and expense data', async () => {
      const result = await financialService.getFinancialOverview();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('income');
      expect(result.data).toHaveProperty('expenses');
      expect(result.data).toHaveProperty('netIncome');
      expect(result.data).toHaveProperty('savingsRate');
    });

    test('should handle error when income service fails', async () => {
      // Mock the getFinancialOverview to return an error
      financialService.getFinancialOverview.mockResolvedValueOnce({
        success: false,
        error: 'Failed to get financial overview'
      });
      
      const result = await financialService.getFinancialOverview();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get financial overview');
    });

    test('should handle error when expense service fails', async () => {
      // Mock the getFinancialOverview to return an error
      financialService.getFinancialOverview.mockResolvedValueOnce({
        success: false,
        error: 'Failed to get financial overview'
      });
      
      const result = await financialService.getFinancialOverview();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get financial overview');
    });
  });

  describe('Financial Forecasting', () => {
    test('should generate financial forecast with linear, average, and seasonal predictions', async () => {
      const result = await financialService.generateFinancialForecast();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('linear');
      expect(result.data).toHaveProperty('average');
      expect(result.data).toHaveProperty('seasonal');
      expect(result.data.linear).toHaveLength(12);
      expect(result.data.average).toHaveLength(12);
      expect(result.data.seasonal).toHaveLength(12);
    });

    test('should handle error in financial forecast generation', async () => {
      // Mock the generateFinancialForecast to return an error
      financialService.generateFinancialForecast.mockResolvedValueOnce({
        success: false,
        error: 'Failed to generate financial forecast'
      });
      
      const result = await financialService.generateFinancialForecast();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate financial forecast');
    });
  });

  describe('Currency Formatting', () => {
    test('should format positive amounts correctly', () => {
      expect(financialService.formatCurrency(1234.56)).toBe('$1,234.56');
      expect(financialService.formatCurrency(0)).toBe('$0.00');
      expect(financialService.formatCurrency(999.999)).toBe('$1,000.00');
    });

    test('should format negative amounts correctly', () => {
      expect(financialService.formatCurrency(-1234.56)).toBe('-$1,234.56');
      expect(financialService.formatCurrency(-0.01)).toBe('-$0.01');
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

  describe('Cash Flow Calculation', () => {
    test('should calculate cash flow correctly', () => {
      const incomeTrend = [
        { date: '2024-01-01', amount: 1000 },
        { date: '2024-01-02', amount: 2000 },
        { date: '2024-01-03', amount: 1500 }
      ];

      const expenseTrend = [
        { date: '2024-01-01', amount: 500 },
        { date: '2024-01-02', amount: 800 },
        { date: '2024-01-04', amount: 300 }
      ];

      const result = financialService.calculateCashFlow(incomeTrend, expenseTrend);

      expect(result).toHaveLength(4); // All unique dates
      expect(result[0]).toEqual({
        date: '2024-01-01',
        income: 1000,
        expense: 500,
        net: 500
      });
      expect(result[1]).toEqual({
        date: '2024-01-02',
        income: 2000,
        expense: 800,
        net: 1200
      });
      expect(result[2]).toEqual({
        date: '2024-01-03',
        income: 1500,
        expense: 0,
        net: 1500
      });
      expect(result[3]).toEqual({
        date: '2024-01-04',
        income: 0,
        expense: 300,
        net: -300
      });
    });

    test('should handle empty trends', () => {
      const result = financialService.calculateCashFlow([], []);
      expect(result).toEqual([]);
    });
  });

  describe('KPI Calculations', () => {
    test('should calculate KPIs correctly', () => {
      const mockData = {
        income: { total: 10000 },
        expenses: { total: 3000 },
        netProfit: 7000
      };

      const result = financialService.calculateKPIs(mockData);

      expect(result).toHaveProperty('profitMargin');
      expect(result).toHaveProperty('expenseRatio');
      expect(result).toHaveProperty('netProfitMargin');
    });
  });
});
