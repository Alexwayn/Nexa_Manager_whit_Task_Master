// Debug test to check mocking

// Define mocks after jest.mock to avoid hoisting issues
jest.mock('../../features/financial/services/financialService');

jest.mock('../../features/financial/services/incomeService', () => ({
  __esModule: true,
  default: {
    getIncomeStats: jest.fn(),
    getIncomeTrend: jest.fn(),
  },
}));

jest.mock('../../features/financial/services/expenseService', () => ({
  __esModule: true,
  default: {
    getExpenseStats: jest.fn(),
    getExpenseTrend: jest.fn(),
  },
}));

import financialServiceMock from '../../features/financial/services/financialService';

describe('Debug FinancialService', () => {
  it('should have methods defined', () => {
    console.log('financialServiceMock:', financialServiceMock);
    console.log('financialServiceMock.financialService:', financialServiceMock.financialService);
    console.log('financialServiceMock.incomeService:', financialServiceMock.incomeService);
    console.log('financialServiceMock.expenseService:', financialServiceMock.expenseService);
    
    const { financialService, incomeService, expenseService } = financialServiceMock;
    
    console.log('financialService.getFinancialOverview:', typeof financialService.getFinancialOverview);
    console.log('incomeService.getIncomeStats:', typeof incomeService.getIncomeStats);
    console.log('expenseService.getExpenseStats:', typeof expenseService.getExpenseStats);
    
    expect(financialService).toBeDefined();
    expect(typeof financialService.getFinancialOverview).toBe('function');
    expect(typeof incomeService.getIncomeStats).toBe('function');
    expect(typeof expenseService.getExpenseStats).toBe('function');
  });
});