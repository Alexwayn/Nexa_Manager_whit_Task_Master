// Jest manual mock for financial services used by tests
import { jest } from '@jest/globals';

const financialService = {
  getFinancialOverview: jest.fn(async () => ({
    success: true,
    data: {
      income: { total: 5000, count: 5 },
      expenses: { total: 3000, count: 3 },
      netIncome: 2000,
      savingsRate: 40,
    },
  })),
  generateFinancialForecast: jest.fn(async () => ({
    success: true,
    data: {
      linear: new Array(12).fill(0),
      average: new Array(12).fill(0),
      seasonal: new Array(12).fill(0),
    },
  })),
  formatCurrency: jest.fn((amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)),
  formatPercentage: jest.fn((value) => `${value.toFixed(1)}%`),
  calculateCashFlow: jest.fn((incomeTrend, expenseTrend) => {
    const cashFlow = [];
    const allDates = new Set([
      ...incomeTrend.map((item) => item.date),
      ...expenseTrend.map((item) => item.date),
    ]);

    allDates.forEach((date) => {
      const incomeAmount = incomeTrend.find((item) => item.date === date)?.amount || 0;
      const expenseAmount = expenseTrend.find((item) => item.date === date)?.amount || 0;

      cashFlow.push({
        date,
        income: incomeAmount,
        expense: expenseAmount,
        net: incomeAmount - expenseAmount,
      });
    });

    return cashFlow.sort((a, b) => new Date(a.date) - new Date(b.date));
  }),
  calculateKPIs: jest.fn((data) => ({ profitMargin: 0, expenseRatio: 0, netProfitMargin: 0 })),
};

// Expose income and expense services with jest.fn methods used by tests
export const incomeService = {
  getIncomeStats: jest.fn(async () => ({
    success: true,
    data: { totalIncome: 5000, monthlyIncome: 4500, incomeGrowth: 10 },
  })),
  getIncomeTrend: jest.fn(async () => ({
    success: true,
    data: [
      { month: 'Jan', amount: 4000 },
      { month: 'Feb', amount: 4500 },
      { month: 'Mar', amount: 5000 },
    ],
  })),
};

export const expenseService = {
  getExpenseStats: jest.fn(async () => ({
    success: true,
    data: { totalExpenses: 3000, monthlyExpenses: 2800, expenseGrowth: 5 },
  })),
  getExpenseTrend: jest.fn(async () => ({
    success: true,
    data: [
      { month: 'Jan', amount: 2500 },
      { month: 'Feb', amount: 2700 },
      { month: 'Mar', amount: 3000 },
    ],
  })),
};

export default { financialService, incomeService, expenseService };


