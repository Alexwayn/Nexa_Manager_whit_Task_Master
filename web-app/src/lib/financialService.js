import { supabase } from '@lib/supabaseClient';
import incomeService from '@lib/incomeService';
import expenseService from '@lib/expenseService';
import Logger from '@utils/Logger';

/**
 * Financial Service
 * Main service for financial management that combines income and expenses
 * Provides advanced analytics, reporting and financial forecasting
 */

class FinancialService {
  constructor() {
    this.incomeService = incomeService;
    this.expenseService = expenseService;
  }

  // ==================== COMBINED ANALYTICS ====================

  /**
   * Gets a complete financial overview
   * @param {string} period - Period (day, week, month, quarter, year)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Financial overview
   */
  async getFinancialOverview(period = 'month', startDate = null, endDate = null) {
    try {
      Logger.info('financialService.getFinancialOverview: Inizio recupero dati finanziari');
      
      // Get statistics for income and expenses in parallel
      const [incomeResult, expenseResult] = await Promise.all([
        this.incomeService.getIncomeStats(),
        this.expenseService.getExpenseStats(),
      ]);

      Logger.info('financialService.getFinancialOverview: Dati ricevuti', {
        income: incomeResult,
        expense: expenseResult
      });

      // I servizi ora restituiscono direttamente i dati, non più wrapped in { success, data }
      const income = incomeResult;
      const expense = expenseResult;

      const overview = {
        period,
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate || new Date(),
        income: {
          total: income?.totalAmount || 0,
          count: income?.totalCount || 0,
          average: income?.averageAmount || 0,
          byCategory: income?.byCategory || {},
          dailyTrend: income?.dailyTrend || [],
        },
        expenses: {
          total: expense?.totalAmount || 0,
          count: expense?.totalCount || 0,
          average: expense?.averageAmount || 0,
          taxDeductible: expense?.taxDeductibleAmount || 0,
          nonTaxDeductible: expense?.nonTaxDeductibleAmount || 0,
          byCategory: expense?.byCategory || {},
          byVendor: expense?.byVendor || {},
          dailyTrend: expense?.dailyTrend || [],
        },
        netProfit: (income?.totalAmount || 0) - (expense?.totalAmount || 0),
        profitMargin:
          (income?.totalAmount || 0) > 0
            ? (((income?.totalAmount || 0) - (expense?.totalAmount || 0)) / (income?.totalAmount || 0)) * 100
            : 0,
        expenseRatio: (income?.totalAmount || 0) > 0 ? ((expense?.totalAmount || 0) / (income?.totalAmount || 0)) * 100 : 0,
        cashFlow: [],
      };

      Logger.info('financialService.getFinancialOverview: Overview calcolato', overview);

      return { success: true, data: overview };
    } catch (error) {
      Logger.error('Error getting financial overview:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculates cash flow by combining income and expenses
   * @param {Array} incomeTrend - Income trend data
   * @param {Array} expenseTrend - Expense trend data
   * @returns {Array} Daily cash flow
   */
  calculateCashFlow(incomeTrend, expenseTrend) {
    const cashFlow = [];
    const allDates = new Set([
      ...incomeTrend.map(item => item.date),
      ...expenseTrend.map(item => item.date),
    ]);

    allDates.forEach(date => {
      const incomeAmount = incomeTrend.find(item => item.date === date)?.amount || 0;
      const expenseAmount = expenseTrend.find(item => item.date === date)?.amount || 0;

      cashFlow.push({
        date,
        income: incomeAmount,
        expense: expenseAmount,
        net: incomeAmount - expenseAmount,
      });
    });

    return cashFlow.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Gets financial trend with comparison
   * @param {string} period - Current period
   * @param {string} comparison - Comparison period
   * @returns {Promise<Object>} Financial trend
   */
  async getFinancialTrend(period = 'month', comparison = 'previous') {
    try {
      const [incomeTrendResult, expenseTrendResult] = await Promise.all([
        this.incomeService.getIncomeTrend(period, comparison),
        this.expenseService.getExpenseTrend(period, comparison),
      ]);

      if (!incomeTrendResult.success || !expenseTrendResult.success) {
        throw new Error('Failed to fetch trend data');
      }

      const incomeTrend = incomeTrendResult.data;
      const expenseTrend = expenseTrendResult.data;

      const financialTrend = {
        period,
        comparison,
        income: incomeTrend,
        expenses: expenseTrend,
        netProfit: {
          current: incomeTrend.current - expenseTrend.current,
          previous: incomeTrend.previous - expenseTrend.previous,
          change:
            incomeTrend.current -
            expenseTrend.current -
            (incomeTrend.previous - expenseTrend.previous),
          changePercent: 0,
        },
      };

      // Calculate net profit change percentage
      const previousNetProfit = financialTrend.netProfit.previous;
      if (previousNetProfit !== 0) {
        financialTrend.netProfit.changePercent =
          (financialTrend.netProfit.change / Math.abs(previousNetProfit)) * 100;
      }

      return { success: true, data: financialTrend };
    } catch (error) {
      Logger.error('Error getting financial trend:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== FINANCIAL FORECASTING ====================

  /**
   * Generates financial forecasts based on historical data
   * @param {number} months - Number of months to forecast
   * @param {string} method - Forecasting method (linear, average, seasonal)
   * @returns {Promise<Object>} Financial forecasts
   */
  async generateFinancialForecast(months = 6, method = 'linear') {
    try {
      // Get historical data from the last 12 months
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      const [incomeResult, expenseResult] = await Promise.all([
        this.incomeService.getIncomeStats('year', startDate, endDate),
        this.expenseService.getExpenseStats('year', startDate, endDate),
      ]);

      if (!incomeResult.success || !expenseResult.success) {
        throw new Error('Failed to fetch historical data');
      }

      const incomeData = incomeResult.data;
      const expenseData = expenseResult.data;

      let forecast = [];

      switch (method) {
        case 'linear':
          forecast = this.linearForecast(incomeData, expenseData, months);
          break;
        case 'average':
          forecast = this.averageForecast(incomeData, expenseData, months);
          break;
        case 'seasonal':
          forecast = this.seasonalForecast(incomeData, expenseData, months);
          break;
        default:
          forecast = this.linearForecast(incomeData, expenseData, months);
      }

      return {
        success: true,
        data: {
          method,
          months,
          forecast,
          confidence: this.calculateConfidence(incomeData, expenseData),
          summary: this.generateForecastSummary(forecast),
        },
      };
    } catch (error) {
      Logger.error('Error generating financial forecast:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Linear forecast based on trends
   * @param {Object} incomeData - Historical income data
   * @param {Object} expenseData - Historical expense data
   * @param {number} months - Number of months to forecast
   * @returns {Array} Linear forecast data
   */
  linearForecast(incomeData, expenseData, months) {
    const forecast = [];
    const currentDate = new Date();

    // Calculate average monthly trend
    const monthlyIncomeAvg = incomeData.totalAmount / 12;
    const monthlyExpenseAvg = expenseData.totalAmount / 12;

    // Calculate trend (simplified)
    const incomeTrend = monthlyIncomeAvg * 0.02; // 2% monthly growth
    const expenseTrend = monthlyExpenseAvg * 0.01; // 1% monthly growth

    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      const projectedIncome = monthlyIncomeAvg + incomeTrend * i;
      const projectedExpense = monthlyExpenseAvg + expenseTrend * i;

      forecast.push({
        month: forecastDate.toISOString().slice(0, 7),
        income: projectedIncome,
        expense: projectedExpense,
        netProfit: projectedIncome - projectedExpense,
        cumulativeProfit:
          forecast.reduce((sum, f) => sum + f.netProfit, 0) + (projectedIncome - projectedExpense),
      });
    }

    return forecast;
  }

  /**
   * Forecast based on historical average
   * @param {Object} incomeData - Historical income data
   * @param {Object} expenseData - Historical expense data
   * @param {number} months - Number of months to forecast
   * @returns {Array} Average-based forecast data
   */
  averageForecast(incomeData, expenseData, months) {
    const forecast = [];
    const currentDate = new Date();

    const monthlyIncomeAvg = incomeData.totalAmount / 12;
    const monthlyExpenseAvg = expenseData.totalAmount / 12;

    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      forecast.push({
        month: forecastDate.toISOString().slice(0, 7),
        income: monthlyIncomeAvg,
        expense: monthlyExpenseAvg,
        netProfit: monthlyIncomeAvg - monthlyExpenseAvg,
        cumulativeProfit:
          forecast.reduce((sum, f) => sum + f.netProfit, 0) +
          (monthlyIncomeAvg - monthlyExpenseAvg),
      });
    }

    return forecast;
  }

  /**
   * Seasonal forecast (simplified)
   * @param {Object} incomeData - Historical income data
   * @param {Object} expenseData - Historical expense data
   * @param {number} months - Number of months to forecast
   * @returns {Array} Seasonal forecast data
   */
  seasonalForecast(incomeData, expenseData, months) {
    const forecast = [];
    const currentDate = new Date();

    const monthlyIncomeAvg = incomeData.totalAmount / 12;
    const monthlyExpenseAvg = expenseData.totalAmount / 12;

    // Simplified seasonal factors (to be customized based on business)
    const seasonalFactors = [1.0, 0.9, 1.1, 1.2, 1.1, 1.0, 0.8, 0.7, 1.0, 1.1, 1.2, 1.3];

    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      const monthIndex = forecastDate.getMonth();
      const seasonalFactor = seasonalFactors[monthIndex];

      const projectedIncome = monthlyIncomeAvg * seasonalFactor;
      const projectedExpense = monthlyExpenseAvg * (seasonalFactor * 0.8); // Expenses vary less

      forecast.push({
        month: forecastDate.toISOString().slice(0, 7),
        income: projectedIncome,
        expense: projectedExpense,
        netProfit: projectedIncome - projectedExpense,
        cumulativeProfit:
          forecast.reduce((sum, f) => sum + f.netProfit, 0) + (projectedIncome - projectedExpense),
        seasonalFactor,
      });
    }

    return forecast;
  }

  /**
   * Calculates forecast confidence level
   * @param {Object} incomeData - Historical income data
   * @param {Object} expenseData - Historical expense data
   * @returns {Object} Confidence level and description
   */
  calculateConfidence(incomeData, expenseData) {
    // Simplified: based on data consistency
    const incomeVariability = this.calculateVariability(incomeData.dailyTrend);
    const expenseVariability = this.calculateVariability(expenseData.dailyTrend);

    const avgVariability = (incomeVariability + expenseVariability) / 2;
    const confidence = Math.max(0.3, Math.min(0.95, 1 - avgVariability));

    return {
      level: confidence,
      description: confidence > 0.8 ? 'High' : confidence > 0.6 ? 'Medium' : 'Low',
    };
  }

  /**
   * Calculates data variability
   * @param {Array} trend - Trend data array
   * @returns {number} Variability coefficient
   */
  calculateVariability(trend) {
    if (trend.length < 2) return 0.5;

    const amounts = trend.map(t => t.amount);
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);

    return mean > 0 ? standardDeviation / mean : 0.5;
  }

  /**
   * Generates a forecast summary
   * @param {Array} forecast - Forecast data array
   * @returns {Object} Forecast summary with key metrics
   */
  generateForecastSummary(forecast) {
    const totalProjectedIncome = forecast.reduce((sum, f) => sum + f.income, 0);
    const totalProjectedExpense = forecast.reduce((sum, f) => sum + f.expense, 0);
    const totalProjectedProfit = totalProjectedIncome - totalProjectedExpense;

    const bestMonth = forecast.reduce((best, current) =>
      current.netProfit > best.netProfit ? current : best,
    );

    const worstMonth = forecast.reduce((worst, current) =>
      current.netProfit < worst.netProfit ? current : worst,
    );

    return {
      totalProjectedIncome,
      totalProjectedExpense,
      totalProjectedProfit,
      averageMonthlyProfit: totalProjectedProfit / forecast.length,
      bestMonth: {
        month: bestMonth.month,
        profit: bestMonth.netProfit,
      },
      worstMonth: {
        month: worstMonth.month,
        profit: worstMonth.netProfit,
      },
      profitGrowthTrend: this.calculateGrowthTrend(forecast),
    };
  }

  /**
   * Calculates profit growth trend
   * @param {Array} forecast - Forecast data array
   * @returns {number} Growth trend percentage
   */
  calculateGrowthTrend(forecast) {
    if (forecast.length < 2) return 0;

    const firstMonth = forecast[0].netProfit;
    const lastMonth = forecast[forecast.length - 1].netProfit;

    return firstMonth !== 0 ? ((lastMonth - firstMonth) / Math.abs(firstMonth)) * 100 : 0;
  }

  // ==================== BUDGET MANAGEMENT ====================

  /**
   * Creates or updates a budget
   * @param {Object} budgetData - Budget data object
   * @returns {Promise<Object>} Created/updated budget
   */
  async createBudget(budgetData) {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([
          {
            ...budgetData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('Error creating budget:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets budget performance
   * @param {string} budgetId - Budget ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Budget performance data
   */
  async getBudgetPerformance(budgetId, startDate = null, endDate = null) {
    try {
      // Get the budget
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budgetId)
        .single();

      if (budgetError) throw budgetError;

      // Get actual financial data
      const actualData = await this.getFinancialOverview('month', startDate, endDate);

      if (!actualData.success) {
        throw new Error('Failed to fetch actual financial data');
      }

      const actual = actualData.data;

      const performance = {
        budget: {
          income: budget.income_target,
          expense: budget.expense_limit,
          netProfit: budget.income_target - budget.expense_limit,
        },
        actual: {
          income: actual.income.total,
          expense: actual.expenses.total,
          netProfit: actual.netProfit,
        },
        variance: {
          income: actual.income.total - budget.income_target,
          expense: actual.expenses.total - budget.expense_limit,
          netProfit: actual.netProfit - (budget.income_target - budget.expense_limit),
        },
        performance: {
          incomeAchievement:
            budget.income_target > 0 ? (actual.income.total / budget.income_target) * 100 : 0,
          expenseControl:
            budget.expense_limit > 0 ? (actual.expenses.total / budget.expense_limit) * 100 : 0,
          overallScore: 0,
        },
      };

      // Calculate overall score
      const incomeScore = Math.min(100, performance.performance.incomeAchievement);
      const expenseScore = Math.max(
        0,
        100 - Math.max(0, performance.performance.expenseControl - 100),
      );
      performance.performance.overallScore = (incomeScore + expenseScore) / 2;

      return { success: true, data: performance };
    } catch (error) {
      Logger.error('Error getting budget performance:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Formats an amount in currency using English locale
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Formats a percentage
   * @param {number} percentage - Percentage to format
   * @returns {string} Formatted percentage
   */
  formatPercentage(percentage) {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(percentage / 100);
  }

  /**
   * Calculates financial KPIs
   * @param {Object} financialData - Financial data object
   * @returns {Object} Calculated KPIs
   */
  calculateKPIs(financialData) {
    const { income, expenses } = financialData;

    return {
      grossProfit: income.total - expenses.total,
      profitMargin: income.total > 0 ? ((income.total - expenses.total) / income.total) * 100 : 0,
      expenseRatio: income.total > 0 ? (expenses.total / income.total) * 100 : 0,
      averageTransactionIncome: income.count > 0 ? income.total / income.count : 0,
      averageTransactionExpense: expenses.count > 0 ? expenses.total / expenses.count : 0,
      taxDeductibleRatio: expenses.total > 0 ? (expenses.taxDeductible / expenses.total) * 100 : 0,
      burnRate: expenses.total / 30, // Average daily spending
      runwayDays: expenses.total > 0 ? income.total / (expenses.total / 30) : 0,
    };
  }
}

// Export a singleton instance of the service
const financialService = new FinancialService();
export default financialService;
