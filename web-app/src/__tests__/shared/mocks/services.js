// Services mocks for comprehensive testing
// This file provides detailed mocks for all application services

import { jest } from '@jest/globals';

test('service mocks load', () => {
  expect(typeof jest.fn).toBe('function');
});

// Mock Email Service
export const createMockEmailService = () => {
  const mockEmailService = {
    // Email validation
    validateEmail: jest.fn(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }),

    // Template operations
    getTemplate: jest.fn(templateName => {
      const templates = {
        quote: {
          subject: 'Preventivo #{quoteNumber}',
          body: 'Gentile {clientName}, in allegato il preventivo richiesto.',
          attachments: ['quote.pdf'],
        },
        invoice: {
          subject: 'Fattura #{invoiceNumber}',
          body: 'Gentile {clientName}, in allegato la fattura.',
          attachments: ['invoice.pdf'],
        },
        reminder: {
          subject: 'Promemoria pagamento',
          body: 'Gentile {clientName}, le ricordiamo il pagamento della fattura #{invoiceNumber}.',
          attachments: [],
        },
      };
      return Promise.resolve(templates[templateName] || null);
    }),

    replaceTemplateVariables: jest.fn((template, variables) => {
      let result = template;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g');
        result = result.replace(regex, value || '');
      });
      return result;
    }),

    // Email sending
    sendEmail: jest.fn(emailData => {
      const { to, subject, body, attachments = [] } = emailData;

      // Simulate validation
      if (!to || !mockEmailService.validateEmail(to)) {
        return Promise.reject(new Error('Invalid email address'));
      }

      if (!subject || !body) {
        return Promise.reject(new Error('Subject and body are required'));
      }

      // Simulate sending
      return Promise.resolve({
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'sent',
        to,
        subject,
        sentAt: new Date().toISOString(),
      });
    }),

    sendQuoteEmail: jest.fn((quoteData, clientEmail) => {
      return mockEmailService.sendEmail({
        to: clientEmail,
        subject: `Preventivo #${quoteData.number}`,
        body: `Gentile ${quoteData.clientName}, in allegato il preventivo richiesto.`,
        attachments: [`quote-${quoteData.number}.pdf`],
      });
    }),

    sendInvoiceEmail: jest.fn((invoiceData, clientEmail) => {
      return mockEmailService.sendEmail({
        to: clientEmail,
        subject: `Fattura #${invoiceData.number}`,
        body: `Gentile ${invoiceData.clientName}, in allegato la fattura.`,
        attachments: [`invoice-${invoiceData.number}.pdf`],
      });
    }),

    // Configuration
    getConfiguration: jest.fn(() => {
      return Promise.resolve({
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpSecure: false,
        fromEmail: 'noreply@example.com',
        fromName: 'Nexa Manager',
      });
    }),

    testConfiguration: jest.fn(() => {
      return Promise.resolve({ success: true, message: 'Configuration is valid' });
    }),

    // Utility methods
    formatCurrency: jest.fn((amount, currency = 'EUR') => {
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency,
      }).format(amount);
    }),
  };

  return mockEmailService;
};

// Mock Financial Service
export const createMockFinancialService = () => {
  const mockFinancialService = {
    // Currency formatting
    formatCurrency: jest.fn((amount, currency = 'EUR') => {
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency,
      }).format(amount);
    }),

    formatPercentage: jest.fn((value, decimals = 2) => {
      return `${(value * 100).toFixed(decimals)}%`;
    }),

    // Financial calculations
    calculateTotal: jest.fn(items => {
      return items.reduce((total, item) => {
        const itemTotal = (item.quantity || 1) * (item.price || 0);
        return total + itemTotal;
      }, 0);
    }),

    calculateTax: jest.fn((amount, taxRate = 0.22) => {
      return amount * taxRate;
    }),

    calculateGrandTotal: jest.fn((subtotal, tax = 0, discount = 0) => {
      return subtotal + tax - discount;
    }),

    // Financial overview
    getFinancialOverview: jest.fn((period = 'month') => {
      const mockData = {
        month: {
          totalIncome: 15000,
          totalExpenses: 8000,
          netProfit: 7000,
          outstandingInvoices: 5000,
          paidInvoices: 10000,
          pendingQuotes: 3000,
        },
        quarter: {
          totalIncome: 45000,
          totalExpenses: 24000,
          netProfit: 21000,
          outstandingInvoices: 8000,
          paidInvoices: 37000,
          pendingQuotes: 9000,
        },
        year: {
          totalIncome: 180000,
          totalExpenses: 96000,
          netProfit: 84000,
          outstandingInvoices: 12000,
          paidInvoices: 168000,
          pendingQuotes: 15000,
        },
      };

      return Promise.resolve(mockData[period] || mockData.month);
    }),

    // Cash flow
    getCashFlow: jest.fn((startDate, endDate) => {
      const mockCashFlow = [
        { date: '2024-01-01', income: 5000, expenses: 2000, balance: 3000 },
        { date: '2024-01-02', income: 3000, expenses: 1500, balance: 4500 },
        { date: '2024-01-03', income: 7000, expenses: 2500, balance: 9000 },
      ];

      return Promise.resolve(mockCashFlow);
    }),

    // Profit and loss
    getProfitAndLoss: jest.fn((startDate, endDate) => {
      return Promise.resolve({
        revenue: {
          services: 120000,
          products: 60000,
          other: 5000,
          total: 185000,
        },
        expenses: {
          materials: 30000,
          labor: 45000,
          overhead: 25000,
          marketing: 8000,
          other: 7000,
          total: 115000,
        },
        grossProfit: 70000,
        netProfit: 70000,
        profitMargin: 0.378,
      });
    }),

    // Budget analysis
    getBudgetAnalysis: jest.fn(year => {
      return Promise.resolve({
        budgeted: {
          income: 200000,
          expenses: 120000,
          profit: 80000,
        },
        actual: {
          income: 185000,
          expenses: 115000,
          profit: 70000,
        },
        variance: {
          income: -15000,
          expenses: -5000,
          profit: -10000,
        },
        percentageVariance: {
          income: -7.5,
          expenses: -4.17,
          profit: -12.5,
        },
      });
    }),
  };

  return mockFinancialService;
};

// Mock Tax Calculation Service
export const createMockTaxCalculationService = () => {
  const mockTaxService = {
    // IVA calculations
    calculateStandardIVA: jest.fn(amount => {
      return amount * 0.22; // 22% standard rate
    }),

    calculateReducedIVA: jest.fn(amount => {
      return amount * 0.1; // 10% reduced rate
    }),

    calculateSuperReducedIVA: jest.fn(amount => {
      return amount * 0.04; // 4% super reduced rate
    }),

    calculateWithholdingIVA: jest.fn(amount => {
      return amount * 0.2; // 20% withholding tax
    }),

    // Tax exemptions
    isExemptTransaction: jest.fn((transactionType, clientType) => {
      const exemptCombinations = [
        { transaction: 'export', client: 'non-eu' },
        { transaction: 'intra-eu', client: 'eu-business' },
        { transaction: 'medical', client: 'any' },
      ];

      return exemptCombinations.some(
        combo =>
          combo.transaction === transactionType &&
          (combo.client === 'any' || combo.client === clientType),
      );
    }),

    // Reverse charge
    isReverseCharge: jest.fn((clientCountry, serviceType) => {
      const euCountries = ['IT', 'DE', 'FR', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'GR'];
      const reverseChargeServices = ['consulting', 'digital', 'professional'];

      return euCountries.includes(clientCountry) && reverseChargeServices.includes(serviceType);
    }),

    // Tax calculation with rules
    calculateTax: jest.fn((amount, taxType, clientInfo = {}) => {
      const { country = 'IT', type = 'individual', vatNumber = null } = clientInfo;

      // Check for exemptions
      if (mockTaxService.isExemptTransaction(taxType, type)) {
        return { amount: 0, rate: 0, exempt: true, reason: 'Exempt transaction' };
      }

      // Check for reverse charge
      if (mockTaxService.isReverseCharge(country, taxType)) {
        return { amount: 0, rate: 0, reverseCharge: true, reason: 'EU B2B reverse charge' };
      }

      // Standard calculations
      const rates = {
        standard: 0.22,
        reduced: 0.1,
        super_reduced: 0.04,
        withholding: 0.2,
      };

      const rate = rates[taxType] || rates.standard;
      const taxAmount = amount * rate;

      return {
        amount: taxAmount,
        rate,
        baseAmount: amount,
        totalAmount: amount + taxAmount,
      };
    }),

    // Tax summary
    getTaxSummary: jest.fn(transactions => {
      const summary = {
        totalBase: 0,
        totalTax: 0,
        byRate: {},
        exemptAmount: 0,
        reverseChargeAmount: 0,
      };

      transactions.forEach(transaction => {
        const taxCalc = mockTaxService.calculateTax(
          transaction.amount,
          transaction.taxType,
          transaction.clientInfo,
        );

        if (taxCalc.exempt) {
          summary.exemptAmount += transaction.amount;
        } else if (taxCalc.reverseCharge) {
          summary.reverseChargeAmount += transaction.amount;
        } else {
          summary.totalBase += transaction.amount;
          summary.totalTax += taxCalc.amount;

          const rateKey = `${(taxCalc.rate * 100).toFixed(0)}%`;
          if (!summary.byRate[rateKey]) {
            summary.byRate[rateKey] = { base: 0, tax: 0 };
          }
          summary.byRate[rateKey].base += transaction.amount;
          summary.byRate[rateKey].tax += taxCalc.amount;
        }
      });

      return Promise.resolve(summary);
    }),

    // Tax reporting
    generateTaxReport: jest.fn((period, year) => {
      return Promise.resolve({
        period,
        year,
        totalSales: 150000,
        totalPurchases: 80000,
        ivaToPayOrReceive: 15400,
        exemptSales: 5000,
        reverseChargeSales: 10000,
        deductibleIva: 8800,
        nonDeductibleIva: 2200,
        generatedAt: new Date().toISOString(),
      });
    }),
  };

  return mockTaxService;
};

// Mock Income Service
export const createMockIncomeService = () => {
  const mockIncomeService = {
    // CRUD operations
    getIncomes: jest.fn((filters = {}) => {
      const mockIncomes = [
        {
          id: 1,
          description: 'Consulting Services',
          amount: 5000,
          date: '2024-01-15',
          category: 'services',
          client: 'Client A',
          invoiceNumber: 'INV-001',
          status: 'paid',
        },
        {
          id: 2,
          description: 'Product Sales',
          amount: 3000,
          date: '2024-01-20',
          category: 'products',
          client: 'Client B',
          invoiceNumber: 'INV-002',
          status: 'pending',
        },
      ];

      let filteredIncomes = mockIncomes;

      if (filters.startDate || filters.endDate) {
        filteredIncomes = filteredIncomes.filter(income => {
          const incomeDate = new Date(income.date);
          if (filters.startDate && incomeDate < new Date(filters.startDate)) return false;
          if (filters.endDate && incomeDate > new Date(filters.endDate)) return false;
          return true;
        });
      }

      if (filters.category) {
        filteredIncomes = filteredIncomes.filter(income => income.category === filters.category);
      }

      if (filters.status) {
        filteredIncomes = filteredIncomes.filter(income => income.status === filters.status);
      }

      return Promise.resolve(filteredIncomes);
    }),

    getIncome: jest.fn(id => {
      const mockIncome = {
        id,
        description: 'Consulting Services',
        amount: 5000,
        date: '2024-01-15',
        category: 'services',
        client: 'Client A',
        invoiceNumber: 'INV-001',
        status: 'paid',
        notes: 'Monthly consulting retainer',
      };

      return Promise.resolve(mockIncome);
    }),

    createIncome: jest.fn(incomeData => {
      const newIncome = {
        id: Date.now(),
        ...incomeData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return Promise.resolve(newIncome);
    }),

    updateIncome: jest.fn((id, updates) => {
      const updatedIncome = {
        id,
        description: 'Updated Consulting Services',
        amount: 5500,
        date: '2024-01-15',
        category: 'services',
        client: 'Client A',
        invoiceNumber: 'INV-001',
        status: 'paid',
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return Promise.resolve(updatedIncome);
    }),

    deleteIncome: jest.fn(id => {
      return Promise.resolve({ success: true, deletedId: id });
    }),

    // Analytics
    getIncomeStats: jest.fn((period = 'month') => {
      const stats = {
        month: {
          total: 15000,
          count: 8,
          average: 1875,
          growth: 12.5,
        },
        quarter: {
          total: 45000,
          count: 24,
          average: 1875,
          growth: 8.3,
        },
        year: {
          total: 180000,
          count: 96,
          average: 1875,
          growth: 15.2,
        },
      };

      return Promise.resolve(stats[period] || stats.month);
    }),

    getIncomeByCategory: jest.fn(() => {
      return Promise.resolve([
        { category: 'services', amount: 120000, percentage: 66.7 },
        { category: 'products', amount: 45000, percentage: 25.0 },
        { category: 'other', amount: 15000, percentage: 8.3 },
      ]);
    }),
  };

  return mockIncomeService;
};

// Mock Expense Service
export const createMockExpenseService = () => {
  const mockExpenseService = {
    // CRUD operations
    getExpenses: jest.fn((filters = {}) => {
      const mockExpenses = [
        {
          id: 1,
          description: 'Office Supplies',
          amount: 250,
          date: '2024-01-10',
          category: 'office',
          vendor: 'Office Depot',
          receiptUrl: 'receipt-001.pdf',
          status: 'approved',
        },
        {
          id: 2,
          description: 'Software License',
          amount: 500,
          date: '2024-01-12',
          category: 'software',
          vendor: 'Adobe',
          receiptUrl: 'receipt-002.pdf',
          status: 'pending',
        },
      ];

      let filteredExpenses = mockExpenses;

      if (filters.startDate || filters.endDate) {
        filteredExpenses = filteredExpenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          if (filters.startDate && expenseDate < new Date(filters.startDate)) return false;
          if (filters.endDate && expenseDate > new Date(filters.endDate)) return false;
          return true;
        });
      }

      if (filters.category) {
        filteredExpenses = filteredExpenses.filter(
          expense => expense.category === filters.category,
        );
      }

      if (filters.status) {
        filteredExpenses = filteredExpenses.filter(expense => expense.status === filters.status);
      }

      return Promise.resolve(filteredExpenses);
    }),

    getExpense: jest.fn(id => {
      const mockExpense = {
        id,
        description: 'Office Supplies',
        amount: 250,
        date: '2024-01-10',
        category: 'office',
        vendor: 'Office Depot',
        receiptUrl: 'receipt-001.pdf',
        status: 'approved',
        notes: 'Monthly office supplies order',
      };

      return Promise.resolve(mockExpense);
    }),

    createExpense: jest.fn(expenseData => {
      const newExpense = {
        id: Date.now(),
        ...expenseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return Promise.resolve(newExpense);
    }),

    updateExpense: jest.fn((id, updates) => {
      const updatedExpense = {
        id,
        description: 'Updated Office Supplies',
        amount: 275,
        date: '2024-01-10',
        category: 'office',
        vendor: 'Office Depot',
        receiptUrl: 'receipt-001.pdf',
        status: 'approved',
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return Promise.resolve(updatedExpense);
    }),

    deleteExpense: jest.fn(id => {
      return Promise.resolve({ success: true, deletedId: id });
    }),

    // Analytics
    getExpenseStats: jest.fn((period = 'month') => {
      const stats = {
        month: {
          total: 8000,
          count: 15,
          average: 533.33,
          growth: -5.2,
        },
        quarter: {
          total: 24000,
          count: 45,
          average: 533.33,
          growth: -2.1,
        },
        year: {
          total: 96000,
          count: 180,
          average: 533.33,
          growth: 3.8,
        },
      };

      return Promise.resolve(stats[period] || stats.month);
    }),

    getExpenseByCategory: jest.fn(() => {
      return Promise.resolve([
        { category: 'office', amount: 30000, percentage: 31.25 },
        { category: 'software', amount: 25000, percentage: 26.04 },
        { category: 'travel', amount: 20000, percentage: 20.83 },
        { category: 'marketing', amount: 15000, percentage: 15.63 },
        { category: 'other', amount: 6000, percentage: 6.25 },
      ]);
    }),
  };

  return mockExpenseService;
};

// Export all service mocks
export const serviceMocks = {
  emailService: createMockEmailService(),
  financialService: createMockFinancialService(),
  taxCalculationService: createMockTaxCalculationService(),
  incomeService: createMockIncomeService(),
  expenseService: createMockExpenseService(),
};

// Default export
export default serviceMocks;
