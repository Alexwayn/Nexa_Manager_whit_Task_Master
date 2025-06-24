import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * Income Service
 * Manages all operations related to income in the financial system
 */

class IncomeService {
  constructor() {
    this.tableName = 'income';
    this.categoriesTableName = 'income_categories';
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Creates a new income entry
   * @param {Object} incomeData - Income data object
   * @returns {Promise<Object>} Created income entry
   */
  async createIncome(incomeData) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([
          {
            ...incomeData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('Error creating income:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets all income entries with optional filters
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} List of income entries
   */
  async getIncomes(filters = {}) {
    try {
      let query = supabase.from(this.tableName).select('*').order('date', { ascending: false });

      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('Error fetching incomes:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets a single income entry by ID
   * @param {string} id - Income ID
   * @returns {Promise<Object>} Found income entry
   */
  async getIncomeById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          income_categories(name, color, icon),
          clients(name, email),
          invoices(number, total)
        `,
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching income:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Updates an existing income entry
   * @param {string} id - Income ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated income entry
   */
  async updateIncome(id, updateData) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('Error updating income:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deletes an income entry
   * @param {string} id - Income ID
   * @returns {Promise<Object>} Operation result
   */
  async deleteIncome(id) {
    try {
      const { error } = await supabase.from(this.tableName).delete().eq('id', id);

      if (error) throw error;
      return { success: true, message: 'Income deleted successfully' };
    } catch (error) {
      Logger.error('Error deleting income:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Gets income statistics for a period
   * @param {string} period - Period (day, week, month, quarter, year)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Income statistics
   */
  async getIncomeStats(period = 'month', startDate = null, endDate = null) {
    try {
      // Calculate dates if not provided
      if (!startDate || !endDate) {
        const now = new Date();
        switch (period) {
          case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case 'week': {
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            startDate = new Date(
              weekStart.getFullYear(),
              weekStart.getMonth(),
              weekStart.getDate(),
            );
            endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          }
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
          case 'quarter': {
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
            break;
          }
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
            break;
        }
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('amount, date, category')
        .gte('date', startDate.toISOString())
        .lt('date', endDate.toISOString());

      if (error) throw error;

      const stats = {
        totalAmount: data.reduce((sum, income) => sum + parseFloat(income.amount), 0),
        totalCount: data.length,
        averageAmount:
          data.length > 0
            ? data.reduce((sum, income) => sum + parseFloat(income.amount), 0) / data.length
            : 0,
        byCategory: {},
        dailyTrend: [],
        period,
        startDate,
        endDate,
      };

      // Group by category
      data.forEach((income) => {
        if (!stats.byCategory[income.category]) {
          stats.byCategory[income.category] = { amount: 0, count: 0 };
        }
        stats.byCategory[income.category].amount += parseFloat(income.amount);
        stats.byCategory[income.category].count += 1;
      });

      // Daily trend
      const dailyData = {};
      data.forEach((income) => {
        const date = new Date(income.date).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = 0;
        }
        dailyData[date] += parseFloat(income.amount);
      });

      stats.dailyTrend = Object.entries(dailyData)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      return { success: true, data: stats };
    } catch (error) {
      Logger.error('Error getting income stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets income trend for period comparison
   * @param {string} period - Current period
   * @param {string} comparison - Comparison period (previous, year_ago)
   * @returns {Promise<Object>} Trend and comparison data
   */
  async getIncomeTrend(period = 'month', comparison = 'previous') {
    try {
      const now = new Date();
      let currentStart, currentEnd, previousStart, previousEnd;

      switch (period) {
        case 'month':
          currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
          currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

          if (comparison === 'previous') {
            previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            previousEnd = new Date(now.getFullYear(), now.getMonth(), 1);
          } else {
            previousStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
            previousEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
          }
          break;

        case 'quarter': {
          const quarter = Math.floor(now.getMonth() / 3);
          currentStart = new Date(now.getFullYear(), quarter * 3, 1);
          currentEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 1);

          if (comparison === 'previous') {
            previousStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
            previousEnd = new Date(now.getFullYear(), quarter * 3, 1);
          } else {
            previousStart = new Date(now.getFullYear() - 1, quarter * 3, 1);
            previousEnd = new Date(now.getFullYear() - 1, (quarter + 1) * 3, 1);
          }
          break;
        }
      }

      // Get data for both periods
      const [currentResult, previousResult] = await Promise.all([
        this.getIncomeStats(period, currentStart, currentEnd),
        this.getIncomeStats(period, previousStart, previousEnd),
      ]);

      if (!currentResult.success || !previousResult.success) {
        throw new Error('Failed to fetch trend data');
      }

      const current = currentResult.data;
      const previous = previousResult.data;

      const trend = {
        current: current.totalAmount,
        previous: previous.totalAmount,
        change: current.totalAmount - previous.totalAmount,
        changePercent:
          previous.totalAmount > 0
            ? ((current.totalAmount - previous.totalAmount) / previous.totalAmount) * 100
            : 0,
        period,
        comparison,
      };

      return { success: true, data: trend };
    } catch (error) {
      Logger.error('Error getting income trend:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== CATEGORY MANAGEMENT ====================

  /**
   * Gets all income categories
   * @returns {Promise<Array>} List of categories
   */
  async getIncomeCategories() {
    try {
      const { data, error } = await supabase
        .from(this.categoriesTableName)
        .select('*')
        .order('name');

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('Error fetching income categories:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Creates a new income category
   * @param {Object} categoryData - Category data object
   * @returns {Promise<Object>} Created category
   */
  async createIncomeCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from(this.categoriesTableName)
        .insert([
          {
            ...categoryData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('Error creating income category:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Updates an income category
   * @param {string} id - Category ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated category
   */
  async updateIncomeCategory(id, updateData) {
    try {
      const { data, error } = await supabase
        .from(this.categoriesTableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('Error updating income category:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deletes an income category
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Operation result
   */
  async deleteIncomeCategory(id) {
    try {
      // Check if there are income entries using this category
      const { data: incomes } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('category', id)
        .limit(1);

      if (incomes && incomes.length > 0) {
        return {
          success: false,
          error: 'Cannot delete category: it is being used by existing income records',
        };
      }

      const { error } = await supabase.from(this.categoriesTableName).delete().eq('id', id);

      if (error) throw error;
      return { success: true, message: 'Category deleted successfully' };
    } catch (error) {
      Logger.error('Error deleting income category:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== PAYMENT METHOD TRACKING ====================

  /**
   * Gets statistics by payment method
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Payment method statistics
   */
  async getPaymentMethodStats(startDate = null, endDate = null) {
    try {
      let query = supabase.from(this.tableName).select('payment_method, amount');

      if (startDate) {
        query = query.gte('date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {};
      data.forEach((income) => {
        const method = income.payment_method || 'Not specified';
        if (!stats[method]) {
          stats[method] = { amount: 0, count: 0 };
        }
        stats[method].amount += parseFloat(income.amount);
        stats[method].count += 1;
      });

      return { success: true, data: stats };
    } catch (error) {
      Logger.error('Error getting payment method stats:', error);
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
   * Validates income data
   * @param {Object} incomeData - Data to validate
   * @returns {Object} Validation result
   */
  validateIncomeData(incomeData) {
    const errors = [];

    if (!incomeData.amount || parseFloat(incomeData.amount) <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!incomeData.date) {
      errors.push('Date is required');
    }

    if (!incomeData.description || incomeData.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!incomeData.category) {
      errors.push('Category is required');
    }

    if (!incomeData.payment_method) {
      errors.push('Payment method is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ==================== DEFAULT CATEGORIES ====================

  /**
   * Creates default income categories
   * @returns {Promise<Object>} Operation result
   */
  async createDefaultCategories() {
    const defaultCategories = [
      {
        name: 'Professional Services',
        color: '#3B82F6',
        icon: 'briefcase',
        description: 'Income from professional services and consulting',
      },
      {
        name: 'Product Sales',
        color: '#10B981',
        icon: 'shopping-bag',
        description: 'Income from product sales',
      },
      {
        name: 'Freelance',
        color: '#8B5CF6',
        icon: 'computer-desktop',
        description: 'Income from freelance work',
      },
      {
        name: 'Investments',
        color: '#F59E0B',
        icon: 'chart-bar',
        description: 'Income from investments and dividends',
      },
      {
        name: 'Royalties',
        color: '#EF4444',
        icon: 'star',
        description: 'Income from royalties and licenses',
      },
      {
        name: 'Other',
        color: '#6B7280',
        icon: 'ellipsis-horizontal',
        description: 'Other uncategorized income',
      },
    ];

    try {
      const results = await Promise.all(
        defaultCategories.map((category) => this.createIncomeCategory(category)),
      );

      const successful = results.filter((result) => result.success).length;
      return {
        success: true,
        message: `Created ${successful} default income categories`,
      };
    } catch (error) {
      Logger.error('Error creating default categories:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export a singleton instance of the service
const incomeService = new IncomeService();
export default incomeService;
