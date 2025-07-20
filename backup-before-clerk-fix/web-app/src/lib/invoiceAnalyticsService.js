import { supabase } from '@lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import Logger from '@utils/Logger';

// Create a service role client for bypassing RLS
const supabaseServiceRole = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
    },
  },
);

/**
 * Invoice Analytics Service - Advanced analytics and reporting for invoice data
 * Provides comprehensive business intelligence for invoice management including
 * revenue analytics, client performance metrics, tax reporting, and cash flow forecasting
 */
class InvoiceAnalyticsService {
  constructor() {
    this.dateFormats = {
      daily: 'YYYY-MM-DD',
      weekly: 'YYYY-WW',
      monthly: 'YYYY-MM',
      quarterly: 'YYYY-Q',
      yearly: 'YYYY',
    };
  }

  /**
   * Get comprehensive revenue analytics with trend analysis
   * @param {string} userId - User ID to filter invoices
   * @param {string} startDate - Start date for the analysis period
   * @param {string} endDate - End date for the analysis period
   * @param {string} groupBy - Grouping period (daily, weekly, monthly, quarterly, yearly)
   * @returns {Promise<Object>} Revenue analytics data with trends and totals
   */
  async getRevenueAnalytics(userId, startDate, endDate, groupBy = 'monthly') {
    try {
      const { data: invoices, error } = await supabaseServiceRole
        .from('invoices')
        .select(
          `
          id,
          invoice_number,
          total_amount,
          vat_amount,
          net_amount,
          status,
          issue_date,
          due_date,
          paid_date,
          client_id
        `,
        )
        .eq('user_id', userId)
        .gte('issue_date', startDate)
        .lte('issue_date', endDate)
        .order('issue_date', { ascending: true });

      if (error) throw error;

      // Group revenue by time period
      const revenueByPeriod = this._groupByTimePeriod(invoices, groupBy);

      // Calculate trends
      const trends = this._calculateTrends(revenueByPeriod);

      // Calculate totals
      const totals = this._calculateRevenueTotals(invoices);

      return {
        success: true,
        data: {
          revenueByPeriod,
          trends,
          totals,
          invoiceCount: invoices.length,
          averageInvoiceValue: totals.totalRevenue / invoices.length || 0,
        },
      };
    } catch (error) {
      Logger.error('Error getting revenue analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get client analytics and performance metrics
   * @param {string} userId - User ID to filter invoices
   * @param {string} startDate - Start date for the analysis period
   * @param {string} endDate - End date for the analysis period
   * @returns {Promise<Object>} Client analytics including payment behavior and top clients
   */
  async getClientAnalytics(userId, startDate, endDate) {
    try {
      const { data: invoices, error } = await supabaseServiceRole
        .from('invoices')
        .select(
          `
          id,
          total_amount,
          vat_amount,
          status,
          issue_date,
          due_date,
          paid_date,
          client_id
        `,
        )
        .eq('user_id', userId)
        .gte('issue_date', startDate)
        .lte('issue_date', endDate);

      if (error) throw error;

      // Group by client
      const clientMetrics = this._calculateClientMetrics(invoices);

      // Calculate payment behavior
      const paymentBehavior = this._analyzePaymentBehavior(invoices);

      // Top clients analysis
      const topClients = this._getTopClients(clientMetrics, 10);

      return {
        success: true,
        data: {
          clientMetrics,
          paymentBehavior,
          topClients,
          totalClients: Object.keys(clientMetrics).length,
        },
      };
    } catch (error) {
      Logger.error('Error getting client analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get invoice performance metrics including payment times and collection efficiency
   * @param {string} userId - User ID to filter invoices
   * @param {string} startDate - Start date for the analysis period
   * @param {string} endDate - End date for the analysis period
   * @returns {Promise<Object>} Performance metrics and analysis
   */
  async getInvoicePerformance(userId, startDate, endDate) {
    try {
      const { data: invoices, error } = await supabaseServiceRole
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .gte('issue_date', startDate)
        .lte('issue_date', endDate);

      if (error) throw error;

      const performance = {
        averagePaymentTime: this._calculateAveragePaymentTime(invoices),
        overdueAnalysis: this._analyzeOverdueInvoices(invoices),
        statusDistribution: this._calculateStatusDistribution(invoices),
        paymentPatterns: this._analyzePaymentPatterns(invoices),
        collectionEfficiency: this._calculateCollectionEfficiency(invoices),
      };

      return {
        success: true,
        data: performance,
      };
    } catch (error) {
      Logger.error('Error getting invoice performance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get tax reporting analytics including VAT breakdown and withholding tax summary
   * @param {string} startDate - Start date for the analysis period
   * @param {string} endDate - End date for the analysis period
   * @returns {Promise<Object>} Tax analytics data
   */
  async getTaxAnalytics(startDate, endDate) {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .gte('issue_date', startDate)
        .lte('issue_date', endDate)
        .eq('status', 'paid');

      if (error) throw error;

      const taxAnalytics = {
        vatBreakdown: this._calculateVATBreakdown(invoices),
        withholdingTaxSummary: this._calculateWithholdingTaxSummary(invoices),
        reverseChargeAnalysis: this._analyzeReverseCharge(invoices),
        taxableBaseByRate: this._calculateTaxableBaseByRate(invoices),
        monthlyTaxSummary: this._calculateMonthlyTaxSummary(invoices),
      };

      return {
        success: true,
        data: taxAnalytics,
      };
    } catch (error) {
      Logger.error('Error getting tax analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cash flow forecasting based on unpaid invoices and historical payment patterns
   * @param {string} userId - User ID to filter invoices
   * @param {number} months - Number of months to forecast (default: 6)
   * @returns {Promise<Object>} Cash flow forecast data
   */
  async getCashFlowForecast(userId, months = 6) {
    try {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setMonth(futureDate.getMonth() + months);

      // Get unpaid invoices
      const { data: unpaidInvoices, error: unpaidError } = await supabaseServiceRole
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['sent', 'overdue'])
        .lte('due_date', futureDate.toISOString().split('T')[0]);

      if (unpaidError) throw unpaidError;

      // Get historical payment patterns
      const { data: historicalInvoices, error: historicalError } = await supabase
        .from('invoices')
        .select('*')
        .eq('status', 'paid')
        .gte(
          'paid_date',
          new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        );

      if (historicalError) throw historicalError;

      const forecast = this._generateCashFlowForecast(unpaidInvoices, historicalInvoices, months);

      return {
        success: true,
        data: forecast,
      };
    } catch (error) {
      Logger.error('Error generating cash flow forecast:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get aging report for outstanding invoices categorized by days overdue
   * @param {string} userId - User ID to filter invoices
   * @returns {Promise<Object>} Aging report with invoices grouped by age brackets
   */
  async getAgingReport(userId) {
    try {
      const { data: invoices, error } = await supabaseServiceRole
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['sent', 'overdue']);

      if (error) throw error;

      const today = new Date();
      const agingBuckets = {
        current: { label: 'Current (0-30 days)', invoices: [], total: 0 },
        days30: { label: '30-60 days', invoices: [], total: 0 },
        days60: { label: '60-90 days', invoices: [], total: 0 },
        days90: { label: 'Over 90 days', invoices: [], total: 0 },
      };

      invoices.forEach(invoice => {
        const daysOverdue = Math.floor(
          (today - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24),
        );
        const amount = parseFloat(invoice.total_amount);

        if (daysOverdue <= 30) {
          agingBuckets.current.invoices.push({ ...invoice, daysOverdue });
          agingBuckets.current.total += amount;
        } else if (daysOverdue <= 60) {
          agingBuckets.days30.invoices.push({ ...invoice, daysOverdue });
          agingBuckets.days30.total += amount;
        } else if (daysOverdue <= 90) {
          agingBuckets.days60.invoices.push({ ...invoice, daysOverdue });
          agingBuckets.days60.total += amount;
        } else {
          agingBuckets.days90.invoices.push({ ...invoice, daysOverdue });
          agingBuckets.days90.total += amount;
        }
      });

      return {
        success: true,
        data: agingBuckets,
      };
    } catch (error) {
      Logger.error('Error generating aging report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get comprehensive invoice analytics for dashboard display
   * @param {string} userId - User ID to filter invoices
   * @returns {Promise<Object>} Complete invoice analytics for the current year
   */
  async getInvoiceAnalytics(userId) {
    try {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);

      // Get all invoices for this year for the specific user
      const { data: invoices, error } = await supabaseServiceRole
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .gte('issue_date', startOfYear.toISOString().split('T')[0])
        .lte('issue_date', endOfYear.toISOString().split('T')[0])
        .order('issue_date', { ascending: true });

      if (error) throw error;

      // Calculate various analytics
      const statusDistribution = this._calculateStatusDistribution(invoices);
      const revenueAnalytics = this._calculateRevenueTotals(invoices);
      const agingAnalysis = this._analyzeOverdueInvoices(invoices);
      const performanceMetrics = {
        averagePaymentTime: this._calculateAveragePaymentTime(invoices),
        collectionEfficiency: this._calculateCollectionEfficiency(invoices),
      };

      return {
        success: true,
        data: {
          statusDistribution,
          revenueAnalytics,
          agingAnalysis,
          performanceMetrics,
          totalInvoices: invoices.length,
          invoices,
        },
      };
    } catch (error) {
      Logger.error('Error getting invoice analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Groups invoices by specified time period
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @param {string} groupBy - Time period to group by
   * @returns {Array} Grouped revenue data by time period
   */
  _groupByTimePeriod(invoices, groupBy) {
    const groups = {};

    invoices.forEach(invoice => {
      const date = new Date(invoice.issue_date);
      let key;

      switch (groupBy) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        }
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly': {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        }
        case 'yearly':
          key = date.getFullYear().toString();
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groups[key]) {
        groups[key] = {
          period: key,
          revenue: 0,
          vatAmount: 0,
          netAmount: 0,
          invoiceCount: 0,
          paidCount: 0,
          overdueCount: 0,
        };
      }

      groups[key].revenue += parseFloat(invoice.total_amount || 0);
      groups[key].vatAmount += parseFloat(invoice.vat_amount || 0);
      groups[key].netAmount += parseFloat(invoice.net_amount || 0);
      groups[key].invoiceCount++;

      if (invoice.status === 'paid') groups[key].paidCount++;
      if (invoice.status === 'overdue') groups[key].overdueCount++;
    });

    return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Calculates revenue trends between periods
   * @private
   * @param {Array} revenueByPeriod - Revenue data grouped by period
   * @returns {Object} Trend percentages for revenue and invoice count
   */
  _calculateTrends(revenueByPeriod) {
    if (revenueByPeriod.length < 2) return { revenue: 0, invoiceCount: 0 };

    const current = revenueByPeriod[revenueByPeriod.length - 1];
    const previous = revenueByPeriod[revenueByPeriod.length - 2];

    const revenueTrend = previous.revenue
      ? ((current.revenue - previous.revenue) / previous.revenue) * 100
      : 0;
    const countTrend = previous.invoiceCount
      ? ((current.invoiceCount - previous.invoiceCount) / previous.invoiceCount) * 100
      : 0;

    return {
      revenue: Math.round(revenueTrend * 100) / 100,
      invoiceCount: Math.round(countTrend * 100) / 100,
    };
  }

  /**
   * Calculates total revenue metrics by status
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {Object} Revenue totals broken down by status
   */
  _calculateRevenueTotals(invoices) {
    return invoices.reduce(
      (totals, invoice) => {
        const amount = parseFloat(invoice.total_amount || 0);
        const vat = parseFloat(invoice.vat_amount || 0);
        const net = parseFloat(invoice.net_amount || 0);

        totals.totalRevenue += amount;
        totals.totalVAT += vat;
        totals.totalNet += net;

        if (invoice.status === 'paid') {
          totals.paidRevenue += amount;
        } else if (invoice.status === 'overdue') {
          totals.overdueRevenue += amount;
        } else {
          totals.pendingRevenue += amount;
        }

        return totals;
      },
      {
        totalRevenue: 0,
        totalVAT: 0,
        totalNet: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
        overdueRevenue: 0,
      },
    );
  }

  /**
   * Calculates metrics for each client
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {Object} Client metrics including revenue and payment behavior
   */
  _calculateClientMetrics(invoices) {
    const clientMetrics = {};

    invoices.forEach(invoice => {
      const clientId = invoice.client_id;
      const client = invoice.clients;

      if (!clientMetrics[clientId]) {
        clientMetrics[clientId] = {
          client,
          totalRevenue: 0,
          invoiceCount: 0,
          paidInvoices: 0,
          overdueInvoices: 0,
          averagePaymentTime: 0,
          totalPaymentTime: 0,
          lastInvoiceDate: null,
        };
      }

      const metrics = clientMetrics[clientId];
      metrics.totalRevenue += parseFloat(invoice.total_amount || 0);
      metrics.invoiceCount++;

      if (invoice.status === 'paid') {
        metrics.paidInvoices++;
        if (invoice.paid_date && invoice.issue_date) {
          const paymentTime = Math.floor(
            (new Date(invoice.paid_date) - new Date(invoice.issue_date)) / (1000 * 60 * 60 * 24),
          );
          metrics.totalPaymentTime += paymentTime;
        }
      } else if (invoice.status === 'overdue') {
        metrics.overdueInvoices++;
      }

      if (
        !metrics.lastInvoiceDate ||
        new Date(invoice.issue_date) > new Date(metrics.lastInvoiceDate)
      ) {
        metrics.lastInvoiceDate = invoice.issue_date;
      }
    });

    // Calculate average payment time for each client
    Object.values(clientMetrics).forEach(metrics => {
      if (metrics.paidInvoices > 0) {
        metrics.averagePaymentTime = Math.round(metrics.totalPaymentTime / metrics.paidInvoices);
      }
    });

    return clientMetrics;
  }

  /**
   * Analyzes payment behavior patterns across all clients
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {Object} Payment behavior categorized by timeliness
   */
  _analyzePaymentBehavior(invoices) {
    const behavior = {
      excellent: { count: 0, percentage: 0 }, // Paid within terms
      good: { count: 0, percentage: 0 }, // Paid within 15 days late
      fair: { count: 0, percentage: 0 }, // Paid within 30 days late
      poor: { count: 0, percentage: 0 }, // Paid over 30 days late or still overdue
    };

    const paidInvoices = invoices.filter(
      inv => inv.status === 'paid' && inv.paid_date && inv.due_date,
    );

    paidInvoices.forEach(invoice => {
      const daysLate = Math.floor(
        (new Date(invoice.paid_date) - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24),
      );

      if (daysLate <= 0) behavior.excellent.count++;
      else if (daysLate <= 15) behavior.good.count++;
      else if (daysLate <= 30) behavior.fair.count++;
      else behavior.poor.count++;
    });

    // Add overdue invoices to poor category
    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
    behavior.poor.count += overdueCount;

    const totalInvoices = paidInvoices.length + overdueCount;

    if (totalInvoices > 0) {
      Object.keys(behavior).forEach(key => {
        behavior[key].percentage = Math.round((behavior[key].count / totalInvoices) * 100);
      });
    }

    return behavior;
  }

  /**
   * Gets top clients by revenue
   * @private
   * @param {Object} clientMetrics - Client metrics object
   * @param {number} limit - Number of top clients to return
   * @returns {Array} Top clients ranked by revenue
   */
  _getTopClients(clientMetrics, limit = 10) {
    return Object.values(clientMetrics)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit)
      .map((metrics, index) => ({
        rank: index + 1,
        ...metrics,
      }));
  }

  /**
   * Calculates average payment time across all paid invoices
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {number} Average payment time in days
   */
  _calculateAveragePaymentTime(invoices) {
    const paidInvoices = invoices.filter(
      inv => inv.status === 'paid' && inv.paid_date && inv.issue_date,
    );

    if (paidInvoices.length === 0) return 0;

    const totalDays = paidInvoices.reduce((total, invoice) => {
      const days = Math.floor(
        (new Date(invoice.paid_date) - new Date(invoice.issue_date)) / (1000 * 60 * 60 * 24),
      );
      return total + days;
    }, 0);

    return Math.round(totalDays / paidInvoices.length);
  }

  /**
   * Analyzes overdue invoices by age brackets
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {Object} Overdue analysis with age bracket breakdown
   */
  _analyzeOverdueInvoices(invoices) {
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
    const today = new Date();

    const analysis = {
      count: overdueInvoices.length,
      totalAmount: overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
      averageDaysOverdue: 0,
      byAgeBracket: {
        '1-30': { count: 0, amount: 0 },
        '31-60': { count: 0, amount: 0 },
        '61-90': { count: 0, amount: 0 },
        '90+': { count: 0, amount: 0 },
      },
    };

    if (overdueInvoices.length > 0) {
      const totalDaysOverdue = overdueInvoices.reduce((total, invoice) => {
        const daysOverdue = Math.floor(
          (today - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24),
        );
        const amount = parseFloat(invoice.total_amount || 0);

        if (daysOverdue <= 30) {
          analysis.byAgeBracket['1-30'].count++;
          analysis.byAgeBracket['1-30'].amount += amount;
        } else if (daysOverdue <= 60) {
          analysis.byAgeBracket['31-60'].count++;
          analysis.byAgeBracket['31-60'].amount += amount;
        } else if (daysOverdue <= 90) {
          analysis.byAgeBracket['61-90'].count++;
          analysis.byAgeBracket['61-90'].amount += amount;
        } else {
          analysis.byAgeBracket['90+'].count++;
          analysis.byAgeBracket['90+'].amount += amount;
        }

        return total + daysOverdue;
      }, 0);

      analysis.averageDaysOverdue = Math.round(totalDaysOverdue / overdueInvoices.length);
    }

    return analysis;
  }

  /**
   * Calculates invoice status distribution
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {Object} Distribution of invoices by status
   */
  _calculateStatusDistribution(invoices) {
    const distribution = {};

    invoices.forEach(invoice => {
      const status = invoice.status || 'draft';
      if (!distribution[status]) {
        distribution[status] = { count: 0, amount: 0 };
      }
      distribution[status].count++;
      distribution[status].amount += parseFloat(invoice.total_amount || 0);
    });

    return distribution;
  }

  /**
   * Analyzes payment patterns by day of week and month
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {Object} Payment patterns analysis
   */
  _analyzePaymentPatterns(invoices) {
    const patterns = {
      byDayOfWeek: {},
      byMonth: {},
      byPaymentMethod: {},
    };

    const paidInvoices = invoices.filter(inv => inv.status === 'paid' && inv.paid_date);

    paidInvoices.forEach(invoice => {
      const paidDate = new Date(invoice.paid_date);
      const dayOfWeek = paidDate.toLocaleDateString('en-US', { weekday: 'long' });
      const month = paidDate.toLocaleDateString('en-US', { month: 'long' });

      // Day of week pattern
      if (!patterns.byDayOfWeek[dayOfWeek]) patterns.byDayOfWeek[dayOfWeek] = 0;
      patterns.byDayOfWeek[dayOfWeek]++;

      // Month pattern
      if (!patterns.byMonth[month]) patterns.byMonth[month] = 0;
      patterns.byMonth[month]++;
    });

    return patterns;
  }

  /**
   * Calculates collection efficiency metrics
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {Object} Collection efficiency statistics
   */
  _calculateCollectionEfficiency(invoices) {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

    const efficiency = {
      collectionRate: totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0,
      overdueRate: totalInvoices > 0 ? Math.round((overdueInvoices / totalInvoices) * 100) : 0,
      totalInvoices,
      paidInvoices,
      overdueInvoices,
    };

    return efficiency;
  }

  /**
   * Calculates VAT breakdown by rate
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {Object} VAT breakdown by tax rate
   */
  _calculateVATBreakdown(invoices) {
    const vatBreakdown = {
      '22%': { count: 0, taxableBase: 0, vatAmount: 0 },
      '10%': { count: 0, taxableBase: 0, vatAmount: 0 },
      '4%': { count: 0, taxableBase: 0, vatAmount: 0 },
      '0%': { count: 0, taxableBase: 0, vatAmount: 0 },
    };

    invoices.forEach(invoice => {
      const vatRate = invoice.vat_rate || 22;
      const key = `${vatRate}%`;
      const vatAmount = parseFloat(invoice.vat_amount || 0);
      const taxableBase = parseFloat(invoice.subtotal || 0);

      if (vatBreakdown[key]) {
        vatBreakdown[key].count++;
        vatBreakdown[key].taxableBase += taxableBase;
        vatBreakdown[key].vatAmount += vatAmount;
      }
    });

    return vatBreakdown;
  }

  /**
   * Calculates withholding tax summary
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {Object} Withholding tax summary by rate
   */
  _calculateWithholdingTaxSummary(invoices) {
    const summary = {
      totalWithheld: 0,
      count: 0,
      byRate: {},
    };

    invoices.forEach(invoice => {
      const withholdingTax = parseFloat(invoice.withholding_tax || 0);
      if (withholdingTax > 0) {
        summary.totalWithheld += withholdingTax;
        summary.count++;

        const rate = invoice.withholding_rate || 20;
        const key = `${rate}%`;
        if (!summary.byRate[key]) {
          summary.byRate[key] = { count: 0, amount: 0 };
        }
        summary.byRate[key].count++;
        summary.byRate[key].amount += withholdingTax;
      }
    });

    return summary;
  }

  /**
   * Analyzes reverse charge invoices
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {Object} Reverse charge analysis
   */
  _analyzeReverseCharge(invoices) {
    const reverseChargeInvoices = invoices.filter(inv => inv.reverse_charge === true);

    return {
      count: reverseChargeInvoices.length,
      totalAmount: reverseChargeInvoices.reduce(
        (sum, inv) => sum + parseFloat(inv.total_amount || 0),
        0,
      ),
      percentage:
        invoices.length > 0
          ? Math.round((reverseChargeInvoices.length / invoices.length) * 100)
          : 0,
    };
  }

  /**
   * Calculates taxable base by VAT rate
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {Object} Taxable base amounts grouped by VAT rate
   */
  _calculateTaxableBaseByRate(invoices) {
    const baseByRate = {};

    invoices.forEach(invoice => {
      const vatRate = invoice.vat_rate || 22;
      const key = `${vatRate}%`;
      const taxableBase = parseFloat(invoice.subtotal || 0);

      if (!baseByRate[key]) baseByRate[key] = 0;
      baseByRate[key] += taxableBase;
    });

    return baseByRate;
  }

  /**
   * Calculates monthly tax summary
   * @private
   * @param {Array} invoices - Array of invoice objects
   * @returns {Array} Monthly tax summary data
   */
  _calculateMonthlyTaxSummary(invoices) {
    const monthlySummary = {};

    invoices.forEach(invoice => {
      const date = new Date(invoice.issue_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlySummary[monthKey]) {
        monthlySummary[monthKey] = {
          month: monthKey,
          vatCollected: 0,
          withholdingTax: 0,
          reverseChargeAmount: 0,
          taxableBase: 0,
        };
      }

      const summary = monthlySummary[monthKey];
      summary.vatCollected += parseFloat(invoice.vat_amount || 0);
      summary.withholdingTax += parseFloat(invoice.withholding_tax || 0);
      summary.taxableBase += parseFloat(invoice.subtotal || 0);

      if (invoice.reverse_charge) {
        summary.reverseChargeAmount += parseFloat(invoice.total_amount || 0);
      }
    });

    return Object.values(monthlySummary).sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Generates cash flow forecast based on unpaid invoices and historical data
   * @private
   * @param {Array} unpaidInvoices - Array of unpaid invoice objects
   * @param {Array} historicalInvoices - Array of historical paid invoice objects
   * @param {number} months - Number of months to forecast
   * @returns {Object} Cash flow forecast data
   */
  _generateCashFlowForecast(unpaidInvoices, historicalInvoices, months) {
    const today = new Date();
    const forecast = [];

    // Calculate historical payment probability
    const paymentProbability = this._calculatePaymentProbability(historicalInvoices);

    for (let i = 0; i < months; i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;

      const monthForecast = {
        month: monthKey,
        expectedIncome: 0,
        pessimisticIncome: 0,
        optimisticIncome: 0,
        invoicesDue: 0,
      };

      // Calculate expected income from unpaid invoices due this month
      unpaidInvoices.forEach(invoice => {
        const dueDate = new Date(invoice.due_date);
        if (
          dueDate.getFullYear() === forecastDate.getFullYear() &&
          dueDate.getMonth() === forecastDate.getMonth()
        ) {
          const amount = parseFloat(invoice.total_amount || 0);
          const probability = paymentProbability.onTime;

          monthForecast.expectedIncome += amount * probability;
          monthForecast.pessimisticIncome += amount * (probability * 0.7);
          monthForecast.optimisticIncome += amount * Math.min(probability * 1.3, 1);
          monthForecast.invoicesDue++;
        }
      });

      forecast.push(monthForecast);
    }

    return {
      forecast,
      paymentProbability,
      totalUnpaidAmount: unpaidInvoices.reduce(
        (sum, inv) => sum + parseFloat(inv.total_amount || 0),
        0,
      ),
    };
  }

  /**
   * Calculates payment probability based on historical data
   * @private
   * @param {Array} historicalInvoices - Array of historical paid invoice objects
   * @returns {Object} Payment probability percentages
   */
  _calculatePaymentProbability(historicalInvoices) {
    if (historicalInvoices.length === 0) {
      return { onTime: 0.8, late: 0.15, veryLate: 0.05 };
    }

    let onTime = 0;
    let late = 0;
    let veryLate = 0;

    historicalInvoices.forEach(invoice => {
      if (!invoice.paid_date || !invoice.due_date) return;

      const daysLate = Math.floor(
        (new Date(invoice.paid_date) - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24),
      );

      if (daysLate <= 0) onTime++;
      else if (daysLate <= 30) late++;
      else veryLate++;
    });

    const total = onTime + late + veryLate;

    return {
      onTime: total > 0 ? onTime / total : 0.8,
      late: total > 0 ? late / total : 0.15,
      veryLate: total > 0 ? veryLate / total : 0.05,
    };
  }
}

export default new InvoiceAnalyticsService();
