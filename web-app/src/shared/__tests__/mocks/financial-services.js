// Mock for financial services
export const useReports = jest.fn(() => ({
  reports: [],
  loading: false,
  error: null,
  generateReport: jest.fn(),
  downloadReport: jest.fn(),
  deleteReport: jest.fn()
}));

export const useFinancialData = jest.fn(() => ({
  data: {},
  loading: false,
  error: null,
  refresh: jest.fn()
}));

export const financialService = {
  getReports: jest.fn(() => Promise.resolve([])),
  generateReport: jest.fn(() => Promise.resolve({})),
  downloadReport: jest.fn(() => Promise.resolve()),
  deleteReport: jest.fn(() => Promise.resolve()),
  
  // Add the methods we need for testing
  getFinancialOverview: jest.fn(() => Promise.resolve({ 
    success: true, 
    data: {
      income: { total: 5000 },
      expenses: { total: 3000 },
      netIncome: 2000,
      savingsRate: 40
    }
  })),
  calculateCashFlow: jest.fn((incomeTrend = [], expenseTrend = []) => {
    // Combine all unique dates from both trends
    const allDates = [...new Set([
      ...incomeTrend.map(item => item.date),
      ...expenseTrend.map(item => item.date)
    ])].sort();

    return allDates.map(date => {
      const incomeItem = incomeTrend.find(item => item.date === date);
      const expenseItem = expenseTrend.find(item => item.date === date);
      
      const income = incomeItem ? incomeItem.amount : 0;
      const expense = expenseItem ? expenseItem.amount : 0;
      
      return {
        date,
        income,
        expense,
        net: income - expense
      };
    });
  }),
  getFinancialTrend: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  generateFinancialForecast: jest.fn(() => Promise.resolve({ 
    success: true, 
    data: {
      linear: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 1000 + (i * 100) })),
      average: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 1200 })),
      seasonal: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 1000 + (i * 50) }))
    }
  })),
  createBudget: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  getBudgetPerformance: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  formatCurrency: jest.fn((amount) => {
    if (amount == null) return '$0.00';
    if (isNaN(amount)) return '$NaN';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }),
  formatPercentage: jest.fn((percentage) => {
    if (percentage == null || isNaN(percentage)) return '0.0%';
    return `${percentage.toFixed(1)}%`;
  }),
  calculateKPIs: jest.fn((data) => {
    if (!data) return {};
    return {
      profitMargin: data.income?.total ? ((data.netProfit || 0) / data.income.total) * 100 : 0,
      expenseRatio: data.income?.total ? ((data.expenses?.total || 0) / data.income.total) * 100 : 0,
      netProfitMargin: data.income?.total ? ((data.netProfit || 0) / data.income.total) * 100 : 0
    };
  })
};

// Mock for incomeService
export const incomeService = {
  getIncomeStats: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  getIncomeTrend: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  getIncomes: jest.fn(() => Promise.resolve({ success: true, data: [] })),
  createIncome: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  updateIncome: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  deleteIncome: jest.fn(() => Promise.resolve({ success: true }))
};

// Mock for expenseService
export const expenseService = {
  getExpenseStats: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  getExpenseTrend: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  getExpenses: jest.fn(() => Promise.resolve({ success: true, data: [] })),
  createExpense: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  updateExpense: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  deleteExpense: jest.fn(() => Promise.resolve({ success: true }))
};

export default {
  useReports,
  useFinancialData,
  financialService,
  incomeService,
  expenseService
};
