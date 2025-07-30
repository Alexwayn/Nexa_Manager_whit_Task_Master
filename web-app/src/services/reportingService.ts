// Reports and Insights Service
// Task 71.2: Data Architecture Implementation

import { supabase } from '../lib/supabaseClient';
import { DateRange } from '../types/reports';

/**
 * Service for accessing reporting views and generating business intelligence
 */
export class ReportingService {
  // =====================================================
  // FINANCIAL REPORTING METHODS
  // =====================================================

  /**
   * Get revenue summary for a user with optional date filtering
   */
  async getRevenueSummary(
    userId: string,
    dateRange?: DateRange,
    groupBy: 'month' | 'year' = 'month',
  ) {
    let query = supabase.from('v_revenue_summary').select('*').eq('user_id', userId);

    if (dateRange) {
      query = query.gte('month_start', dateRange.start).lte('month_start', dateRange.end);
    }

    query = query.order(groupBy === 'month' ? 'month_start' : 'year_start', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching revenue summary:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get expense summary with category breakdown
   */
  async getExpenseSummary(userId: string, dateRange?: DateRange, category?: string) {
    let query = supabase.from('v_expense_summary').select('*').eq('user_id', userId);

    if (dateRange) {
      query = query.gte('month_start', dateRange.start).lte('month_start', dateRange.end);
    }

    if (category) {
      query = query.eq('category', category);
    }

    query = query.order('month_start', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching expense summary:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get comprehensive profit and loss data
   */
  async getProfitLoss(userId: string, dateRange?: DateRange) {
    let query = supabase.from('v_profit_loss').select('*').eq('user_id', userId);

    if (dateRange) {
      query = query.gte('period_start', dateRange.start).lte('period_start', dateRange.end);
    }

    query = query.order('period_start', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching profit/loss data:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get Italian VAT (IVA) summary for tax compliance
   */
  async getIVASummary(userId: string, taxYear?: number, taxQuarter?: number) {
    let query = supabase.from('v_iva_summary').select('*').eq('user_id', userId);

    if (taxYear) {
      query = query.eq('tax_year', taxYear);
    }

    if (taxQuarter) {
      query = query.eq('tax_quarter', taxQuarter);
    }

    query = query.order('quarter_start', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching IVA summary:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get tax deductible expenses summary
   */
  async getTaxDeductibleSummary(userId: string, taxYear?: number, category?: string) {
    let query = supabase.from('v_tax_deductible_summary').select('*').eq('user_id', userId);

    if (taxYear) {
      query = query.eq('tax_year', taxYear);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tax deductible summary:', error);
      throw error;
    }

    return data;
  }

  // =====================================================
  // CLIENT ANALYTICS METHODS
  // =====================================================

  /**
   * Get individual client revenue and analytics
   */
  async getClientRevenue(userId: string, clientId?: string) {
    let query = supabase.from('v_client_revenue').select('*').eq('user_id', userId);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    query = query.order('total_revenue', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching client revenue:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get high-level client portfolio analytics
   */
  async getClientPortfolio(userId: string) {
    const { data, error } = await supabase
      .from('v_client_portfolio')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching client portfolio:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get top clients by revenue
   */
  async getTopClients(
    userId: string,
    limit: number = 10,
    status?: 'active' | 'inactive' | 'dormant',
  ) {
    let query = supabase.from('v_client_revenue').select('*').eq('user_id', userId);

    if (status) {
      query = query.eq('client_status', status);
    }

    query = query.order('total_revenue', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching top clients:', error);
      throw error;
    }

    return data;
  }

  // =====================================================
  // BUSINESS PERFORMANCE METHODS
  // =====================================================

  /**
   * Get monthly business performance with growth metrics
   */
  async getMonthlyPerformance(userId: string, dateRange?: DateRange) {
    let query = supabase.from('v_monthly_performance').select('*').eq('user_id', userId);

    if (dateRange) {
      query = query.gte('period_start', dateRange.start).lte('period_start', dateRange.end);
    }

    query = query.order('period_start', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching monthly performance:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get comprehensive business health score and metrics
   */
  async getBusinessHealth(userId: string) {
    const { data, error } = await supabase
      .from('v_business_health')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching business health:', error);
      throw error;
    }

    return data;
  }

  // =====================================================
  // KEY PERFORMANCE INDICATORS (KPIs)
  // =====================================================

  /**
   * Calculate real-time KPIs for dashboard
   */
  async getRealtimeKPIs(userId: string): Promise<Record<string, any>> {
    try {
      // Get latest business health data
      const businessHealth = await this.getBusinessHealth(userId);

      // Get current month performance
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const currentPerformance = await this.getMonthlyPerformance(userId, {
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0],
      });

      // Get client portfolio data
      const clientPortfolio = await this.getClientPortfolio(userId);

      // Calculate KPIs
      const kpis = {
        // Financial KPIs
        businessHealthScore: businessHealth?.business_health_score || 0,
        monthlyRevenue: currentPerformance?.[0]?.total_revenue || 0,
        monthlyProfit: currentPerformance?.[0]?.net_profit || 0,
        profitMargin: currentPerformance?.[0]?.net_profit_margin_percent || 0,
        revenueGrowth: currentPerformance?.[0]?.revenue_growth_percent || 0,
        outstandingAmount: businessHealth?.current_outstanding || 0,

        // Client KPIs
        totalClients: clientPortfolio?.total_clients || 0,
        activeClients: clientPortfolio?.active_clients || 0,
        clientRetentionRate:
          clientPortfolio?.active_clients && clientPortfolio?.total_clients
            ? (clientPortfolio.active_clients / clientPortfolio.total_clients) * 100
            : 0,
        avgClientValue: clientPortfolio?.avg_client_revenue || 0,
        avgPaymentDelay: clientPortfolio?.portfolio_avg_payment_delay || 0,

        // Operational KPIs
        invoiceCount: currentPerformance?.[0]?.invoice_count || 0,
        avgInvoiceAmount: currentPerformance?.[0]?.avg_invoice_amount || 0,
        costPerInvoice: currentPerformance?.[0]?.cost_per_invoice || 0,
        paidInvoices: currentPerformance?.[0]?.paid_invoices || 0,

        // Metadata
        calculatedAt: new Date().toISOString(),
        period: {
          start: monthStart.toISOString(),
          end: monthEnd.toISOString(),
        },
      };

      return kpis;
    } catch (error) {
      console.error('Error calculating realtime KPIs:', error);
      throw error;
    }
  }

  /**
   * Get trend data for charts and analytics
   */
  async getTrendData(
    userId: string,
    metric: 'revenue' | 'profit' | 'clients' | 'invoices',
    dateRange: DateRange,
    _interval: 'daily' | 'weekly' | 'monthly' = 'monthly',
  ) {
    try {
      let data;

      switch (metric) {
        case 'revenue':
          data = await this.getRevenueSummary(userId, dateRange, 'month');
          return (
            data?.map(d => ({
              date: d.month_start,
              value: d.total_revenue,
              label: 'Revenue',
            })) || []
          );

        case 'profit':
          data = await this.getProfitLoss(userId, dateRange);
          return (
            data?.map(d => ({
              date: d.period_start,
              value: d.net_profit,
              label: 'Net Profit',
            })) || []
          );

        case 'clients':
          // This would require a more complex query across time periods
          // For now, return empty array as placeholder
          return [];

        case 'invoices':
          data = await this.getRevenueSummary(userId, dateRange, 'month');
          return (
            data?.map(d => ({
              date: d.month_start,
              value: d.invoice_count,
              label: 'Invoices',
            })) || []
          );

        default:
          return [];
      }
    } catch (error) {
      console.error('Error fetching trend data:', error);
      throw error;
    }
  }

  // =====================================================
  // DATA AGGREGATION HELPERS
  // =====================================================

  /**
   * Get expense categories with totals
   */
  async getExpenseCategories(userId: string, dateRange?: DateRange) {
    let query = supabase
      .from('v_expense_summary')
      .select('category, total_expenses, deductible_amount')
      .eq('user_id', userId);

    if (dateRange) {
      query = query.gte('month_start', dateRange.start).lte('month_start', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching expense categories:', error);
      throw error;
    }

    // Aggregate by category
    const categoryTotals = data?.reduce(
      (acc, item) => {
        const category = item.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = {
            category,
            total_expenses: 0,
            deductible_amount: 0,
          };
        }
        acc[category].total_expenses += item.total_expenses || 0;
        acc[category].deductible_amount += item.deductible_amount || 0;
        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(categoryTotals || {});
  }

  /**
   * Get revenue by client for pie charts
   */
  async getRevenueByClient(userId: string, limit: number = 10, includeOthers: boolean = true) {
    const clients = await this.getTopClients(userId, limit);

    if (!clients) return [];

    let result = clients.map(client => ({
      name: client.client_name,
      value: client.total_revenue,
      percentage: 0, // Will be calculated below
    }));

    // Calculate percentages
    const totalRevenue = result.reduce((sum, item) => sum + item.value, 0);
    result = result.map(item => ({
      ...item,
      percentage: totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0,
    }));

    // Add "Others" category if requested and there are more clients
    if (includeOthers) {
      const allClients = await this.getClientRevenue(userId);
      const topClientsRevenue = result.reduce((sum, item) => sum + item.value, 0);
      const totalAllRevenue =
        allClients?.reduce((sum, client) => sum + client.total_revenue, 0) || 0;
      const othersRevenue = totalAllRevenue - topClientsRevenue;

      if (othersRevenue > 0) {
        result.push({
          name: 'Others',
          value: othersRevenue,
          percentage: totalAllRevenue > 0 ? (othersRevenue / totalAllRevenue) * 100 : 0,
        });
      }
    }

    return result;
  }

  /**
   * Compare periods for growth analysis
   */
  async comparePeriods(userId: string, currentPeriod: DateRange, previousPeriod: DateRange) {
    try {
      const [currentData, previousData] = await Promise.all([
        this.getProfitLoss(userId, currentPeriod),
        this.getProfitLoss(userId, previousPeriod),
      ]);

      const currentTotals = this.aggregatePeriodData(currentData);
      const previousTotals = this.aggregatePeriodData(previousData);

      return {
        current: currentTotals,
        previous: previousTotals,
        growth: {
          revenue: this.calculateGrowthRate(currentTotals.revenue, previousTotals.revenue),
          profit: this.calculateGrowthRate(currentTotals.profit, previousTotals.profit),
          expenses: this.calculateGrowthRate(currentTotals.expenses, previousTotals.expenses),
        },
      };
    } catch (error) {
      console.error('Error comparing periods:', error);
      throw error;
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Aggregate period data for comparisons
   */
  private aggregatePeriodData(data: any[]) {
    return (
      data?.reduce(
        (acc, item) => ({
          revenue: acc.revenue + (item.total_revenue || 0),
          profit: acc.profit + (item.net_profit || 0),
          expenses: acc.expenses + (item.total_expenses || 0),
        }),
        { revenue: 0, profit: 0, expenses: 0 },
      ) || { revenue: 0, profit: 0, expenses: 0 }
    );
  }

  /**
   * Calculate growth rate percentage
   */
  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Get date range presets
   */
  static getDateRangePresets(): Record<string, DateRange> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return {
      this_month: {
        start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
        end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
        preset: 'this_month',
      },
      last_month: {
        start: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
        end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
        preset: 'last_month',
      },
      this_quarter: {
        start: new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1)
          .toISOString()
          .split('T')[0],
        end: new Date(currentYear, Math.floor(currentMonth / 3) * 3 + 3, 0)
          .toISOString()
          .split('T')[0],
        preset: 'this_quarter',
      },
      this_year: {
        start: new Date(currentYear, 0, 1).toISOString().split('T')[0],
        end: new Date(currentYear, 11, 31).toISOString().split('T')[0],
        preset: 'this_year',
      },
      last_year: {
        start: new Date(currentYear - 1, 0, 1).toISOString().split('T')[0],
        end: new Date(currentYear - 1, 11, 31).toISOString().split('T')[0],
        preset: 'last_year',
      },
    };
  }

  /**
   * Get available report types
   */
  async getReportTypes() {
    return [
      { value: 'revenue', label: 'Report Entrate', description: 'Analisi delle entrate per periodo' },
      { value: 'expenses', label: 'Report Spese', description: 'Analisi delle spese per categoria' },
      { value: 'client', label: 'Report Clienti', description: 'Analisi dei clienti e progetti' },
      { value: 'project', label: 'Report Progetti', description: 'Stato e performance dei progetti' }
    ];
  }

  /**
   * Generate a report based on parameters
   */
  async generateReport(params: {
    type: string;
    startDate: string;
    endDate: string;
    format: string;
    name?: string;
  }) {
    // Simulate report generation
    const reportId = `report_${Date.now()}`;
    const reportName = params.name || `${params.type}_report_${new Date().toISOString().split('T')[0]}`;
    
    return {
      id: reportId,
      name: reportName,
      type: params.type,
      format: params.format,
      status: 'completed',
      downloadUrl: `/api/reports/download/${reportId}.${params.format.toLowerCase()}`,
      createdAt: new Date().toISOString(),
      size: '2.5 MB'
    };
  }

  /**
   * Validate report parameters
   */
  async validateReportParams(params: {
    type: string;
    startDate: string;
    endDate: string;
    format: string;
  }) {
    const validTypes = ['revenue', 'expenses', 'client', 'project'];
    const validFormats = ['PDF', 'Excel', 'CSV'];
    
    if (!validTypes.includes(params.type)) {
      return { valid: false, error: 'Invalid report type' };
    }
    
    if (!validFormats.includes(params.format)) {
      return { valid: false, error: 'Invalid format' };
    }
    
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);
    
    if (startDate >= endDate) {
      return { valid: false, error: 'Start date must be before end date' };
    }
    
    return { valid: true };
  }

  /**
   * Refresh reporting cache (future implementation)
   */
  async refreshCache(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('refresh_reporting_cache');

      if (error) {
        console.error('Error refreshing cache:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error refreshing reporting cache:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const reportingService = new ReportingService();
