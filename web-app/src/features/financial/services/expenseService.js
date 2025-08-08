import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';
import { getUserIdForUuidTables, convertClerkIdToUuid } from '@shared/utils';

/**
 * Expense Service
 * Manages all operations related to expenses in the financial system
 */

class ExpenseService {
  constructor() {
    this.tableName = 'expenses';
    this.categoriesTableName = 'expense_categories';
  }

  /**
   * Get current user UUID for database queries
   * @returns {string|null} UUID formatted user ID
   */
  getCurrentUserUuid() {
    try {
      // In produzione, questo dovrebbe venire dal contesto Clerk
      // Per ora usiamo il Clerk ID reale dell'utente corrente
      if (window.Clerk && window.Clerk.user) {
        const user = window.Clerk.user;
        if (user && user.id) {
          const uuid = convertClerkIdToUuid(user.id);
          if (!uuid) {
            throw new Error(`Nessun mapping UUID trovato per Clerk ID: ${user.id}`);
          }
          return uuid;
        }
      }

      // Fallback per testing/development
      const fallbackClerkId = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR';
      console.warn('expenseService: Usando Clerk ID fallback per development:', fallbackClerkId);

      const uuid = convertClerkIdToUuid(fallbackClerkId);
      if (!uuid) {
        throw new Error(`Nessun mapping UUID trovato per Clerk ID fallback: ${fallbackClerkId}`);
      }

      return uuid;
    } catch (error) {
      Logger.error("Errore nell'ottenere UUID utente:", error);
      throw error;
    }
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Creates a new expense
   * @param {Object} expenseData - Expense data
   * @returns {Promise<Object>} Created expense
   */
  async createExpense(expenseData) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([
          {
            ...expenseData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('Error creating expense:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets all expenses with optional filters
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} List of expenses
   */
  async getExpenses(filters = {}) {
    try {
      const userUuid = this.getCurrentUserUuid();
      Logger.info('expenseService.getExpenses: Cercando spese per user_id:', userUuid);

      let query = supabase
        .from(this.tableName)
        .select(
          `
          *,
          expense_categories(name, color, icon, tax_deductible_default)
        `,
        )
        .eq('user_id', userUuid)
        .order('date', { ascending: false });

      // Applica filtri
      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.vendor) {
        query = query.ilike('vendor', `%${filters.vendor}%`);
      }
      if (filters.taxDeductible !== undefined) {
        query = query.eq('tax_deductible', filters.taxDeductible);
      }
      if (filters.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }
      if (filters.minAmount) {
        query = query.gte('amount', filters.minAmount);
      }
      if (filters.maxAmount) {
        query = query.lte('amount', filters.maxAmount);
      }

      const { data, error } = await query;

      if (error) {
        Logger.error('Errore nel recupero spese:', error);
        throw error;
      }

      Logger.info('expenseService.getExpenses: Spese trovate:', data?.length || 0);
      return data || [];
    } catch (error) {
      Logger.error('Errore nel servizio spese:', error);
      throw error;
    }
  }

  /**
   * Gets a single expense by ID
   * @param {string} id - Expense ID
   * @returns {Promise<Object>} Found expense
   */
  async getExpenseById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          expense_categories(name, color, icon, tax_deductible_default)
        `,
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching expense:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Updates an existing expense
   * @param {string} id - Expense ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated expense
   */
  async updateExpense(id, updateData) {
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
      Logger.error('Error updating expense:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deletes an expense
   * @param {string} id - Expense ID
   * @returns {Promise<Object>} Operation result
   */
  async deleteExpense(id) {
    try {
      const { error } = await supabase.from(this.tableName).delete().eq('id', id);

      if (error) throw error;
      return { success: true, message: 'Expense deleted successfully' };
    } catch (error) {
      Logger.error('Error deleting expense:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Gets expense statistics for a period
   * @param {string} period - Period (day, week, month, quarter, year)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Expense statistics
   */
  async getExpenseStats(period = 'month', startDate = null, endDate = null) {
    try {
      const userUuid = this.getCurrentUserUuid();
      Logger.info('expenseService.getExpenseStats: Calcolando statistiche per user_id:', userUuid);

      // Calculate dates if not provided or invalid
      if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
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
          default:
            // Default to current month if period is not recognized
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
        }
      }

      // Additional validation to ensure dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date range provided');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('amount, date, category, tax_deductible, vendor')
        .eq('user_id', userUuid)
        .gte('date', startDate.toISOString())
        .lt('date', endDate.toISOString());

      if (error) {
        Logger.error('Errore nel recupero statistiche spese:', error);
        throw error;
      }

      Logger.info('expenseService.getExpenseStats: Query results', {
        data,
        rowCount: data?.length,
        userUuid,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Handle null/undefined data
      const expenses = data || [];

      const stats = {
        totalAmount: expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0),
        totalCount: expenses.length,
        averageAmount:
          expenses.length > 0
            ? expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0) /
              expenses.length
            : 0,
        taxDeductibleAmount: expenses
          .filter(e => e.tax_deductible)
          .reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0),
        nonTaxDeductibleAmount: expenses
          .filter(e => !e.tax_deductible)
          .reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0),
        byCategory: {},
        byVendor: {},
        dailyTrend: [],
        period,
        startDate,
        endDate,
      };

      // Raggruppa per categoria
      expenses.forEach(expense => {
        const category = expense.category || 'Uncategorized';
        if (!stats.byCategory[category]) {
          stats.byCategory[category] = {
            amount: 0,
            count: 0,
            taxDeductible: 0,
            nonTaxDeductible: 0,
          };
        }
        stats.byCategory[category].amount += parseFloat(expense.amount || 0);
        stats.byCategory[category].count += 1;

        if (expense.tax_deductible) {
          stats.byCategory[category].taxDeductible += parseFloat(expense.amount || 0);
        } else {
          stats.byCategory[category].nonTaxDeductible += parseFloat(expense.amount || 0);
        }
      });

      // Raggruppa per fornitore
      expenses.forEach(expense => {
        const vendor = expense.vendor || 'Non specificato';
        if (!stats.byVendor[vendor]) {
          stats.byVendor[vendor] = { amount: 0, count: 0 };
        }
        stats.byVendor[vendor].amount += parseFloat(expense.amount || 0);
        stats.byVendor[vendor].count += 1;
      });

      // Trend giornaliero
      const dailyData = {};
      expenses.forEach(expense => {
        if (expense.date) {
          const date = new Date(expense.date).toISOString().split('T')[0];
          if (!dailyData[date]) {
            dailyData[date] = 0;
          }
          dailyData[date] += parseFloat(expense.amount || 0);
        }
      });

      stats.dailyTrend = Object.entries(dailyData)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      Logger.info('expenseService.getExpenseStats: Statistiche calcolate:', {
        total: stats.totalAmount,
        count: stats.totalCount,
        average: stats.averageAmount,
        categories: Object.keys(stats.byCategory).length,
      });

      return stats;
    } catch (error) {
      Logger.error('Errore nel calcolo statistiche spese:', error);
      throw error;
    }
  }

  /**
   * Gets expense trends for period comparison
   * @param {string} period - Current period
   * @param {string} comparison - Comparison period (previous, year_ago)
   * @returns {Promise<Object>} Trend and comparison data
   */
  async getExpenseTrend(period = 'month', comparison = 'previous') {
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
        this.getExpenseStats(period, currentStart, currentEnd),
        this.getExpenseStats(period, previousStart, previousEnd),
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
      Logger.error('Error getting expense trend:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== TAX DEDUCTION MANAGEMENT ====================

  /**
   * Gets tax deduction statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Tax deduction statistics
   */
  async getTaxDeductionStats(startDate = null, endDate = null) {
    try {
      let query = supabase.from(this.tableName).select('amount, tax_deductible, category, date');

      if (startDate) {
        query = query.gte('date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        totalExpenses: data.reduce((sum, expense) => sum + parseFloat(expense.amount), 0),
        taxDeductibleExpenses: data
          .filter(e => e.tax_deductible)
          .reduce((sum, expense) => sum + parseFloat(expense.amount), 0),
        nonTaxDeductibleExpenses: data
          .filter(e => !e.tax_deductible)
          .reduce((sum, expense) => sum + parseFloat(expense.amount), 0),
        taxDeductiblePercentage: 0,
        byCategory: {},
      };

      stats.taxDeductiblePercentage =
        stats.totalExpenses > 0 ? (stats.taxDeductibleExpenses / stats.totalExpenses) * 100 : 0;

      // Group by category
      data.forEach(expense => {
        if (!stats.byCategory[expense.category]) {
          stats.byCategory[expense.category] = {
            total: 0,
            taxDeductible: 0,
            nonTaxDeductible: 0,
          };
        }

        stats.byCategory[expense.category].total += parseFloat(expense.amount);

        if (expense.tax_deductible) {
          stats.byCategory[expense.category].taxDeductible += parseFloat(expense.amount);
        } else {
          stats.byCategory[expense.category].nonTaxDeductible += parseFloat(expense.amount);
        }
      });

      return { success: true, data: stats };
    } catch (error) {
      Logger.error('Error getting tax deduction stats:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== CATEGORY MANAGEMENT ====================

  /**
   * Gets all expense categories
   * @returns {Promise<Array>} List of categories
   */
  async getExpenseCategories() {
    try {
      const { data, error } = await supabase
        .from(this.categoriesTableName)
        .select('*')
        .order('name');

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('Error fetching expense categories:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Creates a new expense category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async createExpenseCategory(categoryData) {
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
      Logger.error('Error creating expense category:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Updates an expense category
   * @param {string} id - Category ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated category
   */
  async updateExpenseCategory(id, updateData) {
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
      Logger.error('Error updating expense category:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deletes an expense category
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Operation result
   */
  async deleteExpenseCategory(id) {
    try {
      // Check if there are expenses using this category
      const { data: expenses } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('category', id)
        .limit(1);

      if (expenses && expenses.length > 0) {
        return {
          success: false,
          error: 'Cannot delete category: it is being used by existing expense records',
        };
      }

      const { error } = await supabase.from(this.categoriesTableName).delete().eq('id', id);

      if (error) throw error;
      return { success: true, message: 'Category deleted successfully' };
    } catch (error) {
      Logger.error('Error deleting expense category:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== VENDOR MANAGEMENT ====================

  /**
   * Gets all unique vendors
   * @returns {Promise<Array>} List of vendors
   */
  async getVendors() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('vendor')
        .not('vendor', 'is', null)
        .not('vendor', 'eq', '');

      if (error) throw error;

      // Remove duplicates and sort
      const uniqueVendors = [...new Set(data.map(item => item.vendor))].sort();

      return { success: true, data: uniqueVendors };
    } catch (error) {
      Logger.error('Error fetching vendors:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets statistics by vendor
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Vendor statistics
   */
  async getVendorStats(startDate = null, endDate = null) {
    try {
      let query = supabase.from(this.tableName).select('vendor, amount, date');

      if (startDate) {
        query = query.gte('date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {};
      data.forEach(expense => {
        const vendor = expense.vendor || 'Not specified';
        if (!stats[vendor]) {
          stats[vendor] = { amount: 0, count: 0, lastExpense: null };
        }
        stats[vendor].amount += parseFloat(expense.amount);
        stats[vendor].count += 1;

        if (
          !stats[vendor].lastExpense ||
          new Date(expense.date) > new Date(stats[vendor].lastExpense)
        ) {
          stats[vendor].lastExpense = expense.date;
        }
      });

      return { success: true, data: stats };
    } catch (error) {
      Logger.error('Error getting vendor stats:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Formats an amount in currency
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
   * Validates expense data
   * @param {Object} expenseData - Data to validate
   * @returns {Object} Validation result
   */
  validateExpenseData(expenseData) {
    const errors = [];

    if (!expenseData.amount || parseFloat(expenseData.amount) <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!expenseData.date) {
      errors.push('Date is required');
    }

    if (!expenseData.description || expenseData.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!expenseData.category) {
      errors.push('Category is required');
    }

    if (!expenseData.vendor || expenseData.vendor.trim().length === 0) {
      errors.push('Vendor is required');
    }

    if (!expenseData.payment_method) {
      errors.push('Payment method is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ==================== DEFAULT CATEGORIES ====================

  /**
   * Creates default expense categories
   * @returns {Promise<Object>} Operation result
   */
  async createDefaultCategories() {
    const defaultCategories = [
      {
        name: 'Office and Materials',
        color: '#3B82F6',
        icon: 'building-office',
        tax_deductible_default: true,
        description: 'Office expenses, materials and supplies',
      },
      {
        name: 'Software and Technology',
        color: '#8B5CF6',
        icon: 'computer-desktop',
        tax_deductible_default: true,
        description: 'Software, hardware and technology services',
      },
      {
        name: 'Transportation and Fuel',
        color: '#10B981',
        icon: 'truck',
        tax_deductible_default: true,
        description: 'Transportation, fuel and travel expenses',
      },
      {
        name: 'Marketing and Advertising',
        color: '#F59E0B',
        icon: 'megaphone',
        tax_deductible_default: true,
        description: 'Marketing, advertising and promotion expenses',
      },
      {
        name: 'Training and Consulting',
        color: '#EF4444',
        icon: 'academic-cap',
        tax_deductible_default: true,
        description: 'Courses, training and professional consulting',
      },
      {
        name: 'Bills and Utilities',
        color: '#06B6D4',
        icon: 'bolt',
        tax_deductible_default: false,
        description: 'Bills, utilities and services',
      },
      {
        name: 'Insurance',
        color: '#84CC16',
        icon: 'shield-check',
        tax_deductible_default: true,
        description: 'Professional and business insurance',
      },
      {
        name: 'Legal and Administrative',
        color: '#A855F7',
        icon: 'scale',
        tax_deductible_default: true,
        description: 'Legal, notarial and administrative expenses',
      },
      {
        name: 'Other',
        color: '#6B7280',
        icon: 'ellipsis-horizontal',
        tax_deductible_default: false,
        description: 'Other uncategorized expenses',
      },
    ];

    try {
      const results = await Promise.all(
        defaultCategories.map(category => this.createExpenseCategory(category)),
      );

      const successful = results.filter(result => result.success).length;
      return {
        success: true,
        message: `Created ${successful} default expense categories`,
      };
    } catch (error) {
      Logger.error('Error creating default categories:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export a singleton instance of the service
const expenseService = new ExpenseService();
export default expenseService;
