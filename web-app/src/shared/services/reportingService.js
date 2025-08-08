import { supabase } from '@/lib/supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { invoiceAnalyticsService } from '@features/financial';
import Logger from '@/utils/Logger';

/**
 * ReportingService - Comprehensive reporting and export functionality
 * Handles PDF, Excel, CSV exports and custom reports for financial analytics
 * Features: revenue reports, client analytics, tax reports, aging reports, and client statements
 */
class ReportingService {
  constructor() {
    this.reportTypes = {
      REVENUE: 'revenue',
      CLIENT: 'client',
      TAX: 'tax',
      AGING: 'aging',
      PERFORMANCE: 'performance',
      STATEMENT: 'statement',
    };
  }

  /**
   * Generate Revenue Report with multiple export formats
   * @param {string} startDate - Start date for report period
   * @param {string} endDate - End date for report period
   * @param {string} format - Export format (pdf, csv, excel)
   * @param {string} groupBy - Grouping method (monthly, weekly, daily)
   * @returns {Promise<Object>} Generated report data
   */
  async generateRevenueReport(startDate, endDate, format = 'pdf', groupBy = 'monthly') {
    try {
      const analytics = await invoiceAnalyticsService.getRevenueAnalytics(
        startDate,
        endDate,
        groupBy,
      );

      if (!analytics.success) {
        throw new Error(analytics.error);
      }

      const reportData = {
        title: 'Revenue Report',
        period: `${startDate} - ${endDate}`,
        data: analytics.data,
        generatedAt: new Date().toISOString(),
      };

      switch (format.toLowerCase()) {
        case 'pdf':
          return this._generateRevenuePDF(reportData);
        case 'csv':
          return this._generateRevenueCSV(reportData);
        case 'excel':
          return this._generateRevenueExcel(reportData);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      Logger.error('Error generating revenue report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate Client Analytics Report
   * @param {string} startDate - Start date for report period
   * @param {string} endDate - End date for report period
   * @param {string} format - Export format (pdf, csv)
   * @returns {Promise<Object>} Generated client report
   */
  async generateClientReport(startDate, endDate, format = 'pdf') {
    try {
      const analytics = await invoiceAnalyticsService.getClientAnalytics(startDate, endDate);

      if (!analytics.success) {
        throw new Error(analytics.error);
      }

      const reportData = {
        title: 'Client Analytics Report',
        period: `${startDate} - ${endDate}`,
        data: analytics.data,
        generatedAt: new Date().toISOString(),
      };

      switch (format.toLowerCase()) {
        case 'pdf':
          return this._generateClientPDF(reportData);
        case 'csv':
          return this._generateClientCSV(reportData);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      Logger.error('Error generating client report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate Tax Report for fiscal compliance
   * @param {string} startDate - Start date for report period
   * @param {string} endDate - End date for report period
   * @param {string} format - Export format (pdf, csv)
   * @returns {Promise<Object>} Generated tax report
   */
  async generateTaxReport(startDate, endDate, format = 'pdf') {
    try {
      const analytics = await invoiceAnalyticsService.getTaxAnalytics(startDate, endDate);

      if (!analytics.success) {
        throw new Error(analytics.error);
      }

      const reportData = {
        title: 'Tax Report',
        period: `${startDate} - ${endDate}`,
        data: analytics.data,
        generatedAt: new Date().toISOString(),
      };

      switch (format.toLowerCase()) {
        case 'pdf':
          return this._generateTaxPDF(reportData);
        case 'csv':
          return this._generateTaxCSV(reportData);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      Logger.error('Error generating tax report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate Aging Report for overdue invoice analysis
   * @param {string} format - Export format (pdf, csv)
   * @returns {Promise<Object>} Generated aging report
   */
  async generateAgingReport(format = 'pdf') {
    try {
      const analytics = await invoiceAnalyticsService.getAgingReport();

      if (!analytics.success) {
        throw new Error(analytics.error);
      }

      const reportData = {
        title: 'Aging Report',
        data: analytics.data,
        generatedAt: new Date().toISOString(),
      };

      switch (format.toLowerCase()) {
        case 'pdf':
          return this._generateAgingPDF(reportData);
        case 'csv':
          return this._generateAgingCSV(reportData);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      Logger.error('Error generating aging report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate Client Statement with invoice and payment history
   * @param {string} clientId - Client ID
   * @param {string} startDate - Start date for statement period
   * @param {string} endDate - End date for statement period
   * @param {string} format - Export format (pdf, csv)
   * @returns {Promise<Object>} Generated client statement
   */
  async generateClientStatement(clientId, startDate, endDate, format = 'pdf') {
    try {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .gte('issue_date', startDate)
        .lte('issue_date', endDate)
        .order('issue_date', { ascending: true });

      if (invoicesError) throw invoicesError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(
          `
          *,
          invoices!inner(client_id)
        `,
        )
        .eq('invoices.client_id', clientId)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate)
        .order('payment_date', { ascending: true });

      if (paymentsError) throw paymentsError;

      // Calculate totals and balance
      const totals = this._calculateStatementTotals(invoices, payments);

      const statementData = {
        title: 'Client Statement',
        client,
        period: `${startDate} - ${endDate}`,
        invoices,
        payments,
        totals,
        generatedAt: new Date().toISOString(),
      };

      switch (format.toLowerCase()) {
        case 'pdf':
          return this._generateStatementPDF(statementData);
        case 'csv':
          return this._generateStatementCSV(statementData);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      Logger.error('Error generating client statement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate Custom Report based on configuration
   * @param {Object} config - Report configuration
   * @returns {Promise<Object>} Generated custom report
   */
  async generateCustomReport(config) {
    try {
      const { type, filters, groupBy, format, includeCharts, customFields } = config;

      let reportData;

      switch (type) {
        case this.reportTypes.REVENUE: {
          const revenueAnalytics = await invoiceAnalyticsService.getRevenueAnalytics(
            filters.startDate,
            filters.endDate,
            groupBy,
          );
          reportData = revenueAnalytics.data;
          break;
        }

        case this.reportTypes.CLIENT: {
          const clientAnalytics = await invoiceAnalyticsService.getClientAnalytics(
            filters.startDate,
            filters.endDate,
          );
          reportData = clientAnalytics.data;
          break;
        }

        case this.reportTypes.TAX: {
          const taxAnalytics = await invoiceAnalyticsService.getTaxAnalytics(
            filters.startDate,
            filters.endDate,
          );
          reportData = taxAnalytics.data;
          break;
        }

        default:
          throw new Error(`Unsupported report type: ${type}`);
      }

      return this._generateCustomPDF(reportData, config);
    } catch (error) {
      Logger.error('Error generating custom report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get comprehensive financial analytics for dashboard
   * @returns {Promise<Object>} Financial analytics data
   */
  async getFinancialAnalytics() {
    try {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);

      // Get revenue analytics
      const revenueAnalytics = await invoiceAnalyticsService.getRevenueAnalytics(
        startOfYear.toISOString().split('T')[0],
        endOfYear.toISOString().split('T')[0],
        'monthly',
      );

      // Get client analytics
      const clientAnalytics = await invoiceAnalyticsService.getClientAnalytics(
        startOfYear.toISOString().split('T')[0],
        endOfYear.toISOString().split('T')[0],
      );

      // Get invoice performance
      const performanceAnalytics = await invoiceAnalyticsService.getInvoicePerformance(
        startOfYear.toISOString().split('T')[0],
        endOfYear.toISOString().split('T')[0],
      );

      return {
        success: true,
        data: {
          revenue: revenueAnalytics.data,
          clients: clientAnalytics.data,
          performance: performanceAnalytics.data,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      Logger.error('Error getting financial analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get forecast data for dashboard and planning
   * @returns {Promise<Object>} Forecast data with cash flow and trends
   */
  async getForecastData() {
    try {
      // Get cash flow forecast
      const cashFlowForecast = await invoiceAnalyticsService.getCashFlowForecast(6);

      // Get historical data for trends
      const today = new Date();
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 12);

      const revenueAnalytics = await invoiceAnalyticsService.getRevenueAnalytics(
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0],
        'monthly',
      );

      return {
        success: true,
        data: {
          cashFlowForecast: cashFlowForecast.data,
          historicalRevenue: revenueAnalytics.data,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      Logger.error('Error getting forecast data:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== PDF GENERATION METHODS ====================

  /**
   * Generate Revenue PDF Report
   * @param {Object} reportData - Report data to generate PDF from
   * @returns {Object} PDF generation result
   */
  _generateRevenuePDF(reportData) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(20);
    doc.text(reportData.title, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Period: ${reportData.period}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(
      `Generated on: ${new Date(reportData.generatedAt).toLocaleDateString('en-US')}`,
      pageWidth / 2,
      40,
      { align: 'center' },
    );

    // Summary Table
    const summaryData = [
      ['Total Revenue', `€ ${reportData.data.totals.totalRevenue.toFixed(2)}`],
      ['Total VAT', `€ ${reportData.data.totals.totalVAT.toFixed(2)}`],
      ['Total Net', `€ ${reportData.data.totals.totalNet.toFixed(2)}`],
      ['Paid Invoices', `€ ${reportData.data.totals.paidRevenue.toFixed(2)}`],
      ['Pending Invoices', `€ ${reportData.data.totals.pendingRevenue.toFixed(2)}`],
      ['Overdue Invoices', `€ ${reportData.data.totals.overdueRevenue.toFixed(2)}`],
      ['Invoice Count', reportData.data.invoiceCount.toString()],
      ['Average Invoice Value', `€ ${reportData.data.averageInvoiceValue.toFixed(2)}`],
    ];

    doc.autoTable({
      head: [['Metric', 'Value']],
      body: summaryData,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Revenue by Period Table
    if (reportData.data.revenueByPeriod.length > 0) {
      const periodData = reportData.data.revenueByPeriod.map(period => [
        period.period,
        period.invoiceCount.toString(),
        `€ ${period.revenue.toFixed(2)}`,
        `€ ${period.vatAmount.toFixed(2)}`,
        `€ ${period.netAmount.toFixed(2)}`,
      ]);

      doc.autoTable({
        head: [['Period', 'Invoice Count', 'Revenue', 'VAT', 'Net']],
        body: periodData,
        startY: doc.lastAutoTable.finalY + 20,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
      });
    }

    // Performance metrics and trends
    if (reportData.data.trends) {
      doc.setFontSize(14);
      doc.text('Performance Trends', 20, doc.lastAutoTable.finalY + 30);

      doc.setFontSize(10);
      const trendsText = [
        `Growth Rate: ${reportData.data.trends.growthRate || 'N/A'}%`,
        `Best Performing Period: ${reportData.data.trends.bestPeriod || 'N/A'}`,
        `Collection Efficiency: ${reportData.data.trends.collectionRate || 'N/A'}%`,
      ];

      trendsText.forEach((text, index) => {
        doc.text(text, 20, doc.lastAutoTable.finalY + 45 + index * 10);
      });
    }

    const pdfBlob = doc.output('blob');

    return {
      success: true,
      data: {
        blob: pdfBlob,
        filename: `revenue-report-${reportData.period.replace(/\s/g, '-')}.pdf`,
      },
    };
  }

  /**
   * Generate Revenue CSV Report
   * @param {Object} reportData - Report data to generate CSV from
   * @returns {Object} CSV generation result
   */
  _generateRevenueCSV(reportData) {
    const csvData = [];

    // Header
    csvData.push(['Revenue Report']);
    csvData.push([`Period: ${reportData.period}`]);
    csvData.push([`Generated on: ${new Date(reportData.generatedAt).toLocaleDateString('en-US')}`]);
    csvData.push([]);

    // Summary
    csvData.push(['Summary']);
    csvData.push(['Metric', 'Value']);
    csvData.push(['Total Revenue', reportData.data.totals.totalRevenue.toFixed(2)]);
    csvData.push(['Total VAT', reportData.data.totals.totalVAT.toFixed(2)]);
    csvData.push(['Total Net', reportData.data.totals.totalNet.toFixed(2)]);
    csvData.push(['Paid Invoices', reportData.data.totals.paidRevenue.toFixed(2)]);
    csvData.push(['Pending Invoices', reportData.data.totals.pendingRevenue.toFixed(2)]);
    csvData.push(['Overdue Invoices', reportData.data.totals.overdueRevenue.toFixed(2)]);
    csvData.push(['Invoice Count', reportData.data.invoiceCount]);
    csvData.push(['Average Invoice Value', reportData.data.averageInvoiceValue.toFixed(2)]);
    csvData.push([]);

    // Revenue by period
    if (reportData.data.revenueByPeriod.length > 0) {
      csvData.push(['Revenue by Period']);
      csvData.push(['Period', 'Invoice Count', 'Revenue', 'VAT', 'Net']);
      reportData.data.revenueByPeriod.forEach(period => {
        csvData.push([
          period.period,
          period.invoiceCount,
          period.revenue.toFixed(2),
          period.vatAmount.toFixed(2),
          period.netAmount.toFixed(2),
        ]);
      });
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    return {
      success: true,
      data: {
        blob,
        filename: `revenue-report-${reportData.period.replace(/\s/g, '-')}.csv`,
      },
    };
  }

  /**
   * Generate Client CSV Report
   * @param {Object} reportData - Report data to generate CSV from
   * @returns {Object} CSV generation result
   */
  _generateClientCSV(reportData) {
    const csvData = [];

    // Header
    csvData.push(['Client Analytics Report']);
    csvData.push([`Period: ${reportData.period}`]);
    csvData.push([`Generated on: ${new Date(reportData.generatedAt).toLocaleDateString('en-US')}`]);
    csvData.push([]);

    // Top clients
    if (reportData.data.topClients.length > 0) {
      csvData.push(['Top Clients']);
      csvData.push([
        'Rank',
        'Client',
        'Revenue',
        'Invoice Count',
        'Avg Payment Time',
        'Payment Rate',
      ]);
      reportData.data.topClients.forEach(client => {
        csvData.push([
          client.rank,
          client.client.name,
          client.totalRevenue.toFixed(2),
          client.invoiceCount,
          client.averagePaymentTime,
          Math.round((client.paidInvoices / client.invoiceCount) * 100),
        ]);
      });
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    return {
      success: true,
      data: {
        blob,
        filename: `client-report-${reportData.period.replace(/\s/g, '-')}.csv`,
      },
    };
  }

  /**
   * Generate Tax CSV Report
   * @param {Object} reportData - Report data to generate CSV from
   * @returns {Object} CSV generation result
   */
  _generateTaxCSV(reportData) {
    const csvData = [];

    // Header
    csvData.push(['Tax Report']);
    csvData.push([`Period: ${reportData.period}`]);
    csvData.push([`Generated on: ${new Date(reportData.generatedAt).toLocaleDateString('en-US')}`]);
    csvData.push([]);

    // VAT breakdown
    if (reportData.data.vatBreakdown) {
      csvData.push(['VAT Summary']);
      csvData.push(['Rate', 'Invoice Count', 'Taxable Base', 'VAT Amount']);
      Object.entries(reportData.data.vatBreakdown).forEach(([rate, data]) => {
        csvData.push([rate, data.count, data.taxableBase.toFixed(2), data.vatAmount.toFixed(2)]);
      });
      csvData.push([]);
    }

    // Withholding tax
    if (reportData.data.withholdingTaxSummary) {
      csvData.push(['Withholding Tax Summary']);
      csvData.push(['Rate', 'Invoice Count', 'Withholding Amount']);
      Object.entries(reportData.data.withholdingTaxSummary.byRate).forEach(([rate, data]) => {
        csvData.push([rate, data.count, data.amount.toFixed(2)]);
      });
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    return {
      success: true,
      data: {
        blob,
        filename: `tax-report-${reportData.period.replace(/\s/g, '-')}.csv`,
      },
    };
  }

  /**
   * Generate Aging CSV Report
   * @param {Object} reportData - Report data to generate CSV from
   * @returns {Object} CSV generation result
   */
  _generateAgingCSV(reportData) {
    const csvData = [];

    // Header
    csvData.push(['Aging Report']);
    csvData.push([`Generated on: ${new Date(reportData.generatedAt).toLocaleDateString('en-US')}`]);
    csvData.push([]);

    // Process each aging bucket
    Object.entries(reportData.data).forEach(([key, bucket]) => {
      if (bucket.invoices && bucket.invoices.length > 0) {
        csvData.push([`${bucket.label} - Total: € ${bucket.total.toFixed(2)}`]);
        csvData.push([
          'Invoice Number',
          'Client',
          'Issue Date',
          'Due Date',
          'Days Overdue',
          'Amount',
        ]);

        bucket.invoices.forEach(invoice => {
          csvData.push([
            invoice.invoice_number,
            invoice.clients.name,
            new Date(invoice.issue_date).toLocaleDateString('en-US'),
            new Date(invoice.due_date).toLocaleDateString('en-US'),
            invoice.daysOverdue,
            parseFloat(invoice.total_amount).toFixed(2),
          ]);
        });
        csvData.push([]);
      }
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    return {
      success: true,
      data: {
        blob,
        filename: `aging-report-${new Date().toISOString().split('T')[0]}.csv`,
      },
    };
  }

  /**
   * Generate Client Statement CSV
   * @param {Object} statementData - Statement data to generate CSV from
   * @returns {Object} CSV generation result
   */
  _generateStatementCSV(statementData) {
    const csvData = [];

    // Header
    csvData.push(['Client Statement']);
    csvData.push([`Client: ${statementData.client.name}`]);
    csvData.push([`Period: ${statementData.period}`]);
    csvData.push([
      `Generated on: ${new Date(statementData.generatedAt).toLocaleDateString('en-US')}`,
    ]);
    csvData.push([]);

    // Summary
    csvData.push(['Summary']);
    csvData.push(['Description', 'Amount']);
    csvData.push(['Total Invoiced', statementData.totals.totalInvoiced.toFixed(2)]);
    csvData.push(['Total Paid', statementData.totals.totalPaid.toFixed(2)]);
    csvData.push(['Balance', statementData.totals.balance.toFixed(2)]);
    csvData.push([]);

    // Invoices
    if (statementData.invoices.length > 0) {
      csvData.push(['Invoices']);
      csvData.push(['Invoice Number', 'Issue Date', 'Due Date', 'Status', 'Amount']);
      statementData.invoices.forEach(invoice => {
        csvData.push([
          invoice.invoice_number,
          new Date(invoice.issue_date).toLocaleDateString('en-US'),
          new Date(invoice.due_date).toLocaleDateString('en-US'),
          invoice.status === 'paid' ? 'Paid' : invoice.status === 'overdue' ? 'Overdue' : 'Sent',
          parseFloat(invoice.total_amount).toFixed(2),
        ]);
      });
      csvData.push([]);
    }

    // Payments
    if (statementData.payments.length > 0) {
      csvData.push(['Payments']);
      csvData.push(['Payment Date', 'Method', 'Reference', 'Amount']);
      statementData.payments.forEach(payment => {
        csvData.push([
          new Date(payment.payment_date).toLocaleDateString('en-US'),
          payment.payment_method || 'Not specified',
          payment.reference || '-',
          parseFloat(payment.amount).toFixed(2),
        ]);
      });
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    return {
      success: true,
      data: {
        blob,
        filename: `client-statement-${statementData.client.name.replace(/\s/g, '-')}-${statementData.period.replace(/\s/g, '-')}.csv`,
      },
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Calculate statement totals for client statements
   * @param {Array} invoices - Array of invoices
   * @param {Array} payments - Array of payments
   * @returns {Object} Calculated totals
   */
  _calculateStatementTotals(invoices, payments) {
    const totalInvoiced = invoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.total_amount || 0),
      0,
    );
    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

    return {
      totalInvoiced,
      totalPaid,
      balance: totalInvoiced - totalPaid,
    };
  }

  /**
   * Get revenue summary for dashboard metrics
   * @param {string} userId - User ID
   * @param {Object} dateRange - Date range with start and end
   * @param {string} groupBy - Grouping method (month, year)
   * @returns {Promise<Array>} Revenue summary data
   */
  async getRevenueSummary(userId, dateRange, groupBy = 'month') {
    try {
      let query = supabase.from('v_revenue_summary').select('*').eq('user_id', userId);

      if (dateRange) {
        query = query.gte('month_start', dateRange.start).lte('month_start', dateRange.end);
      }

      query = query.order(groupBy === 'month' ? 'month_start' : 'year_start', { ascending: false });

      const { data, error } = await query;

      if (error) {
        Logger.error('Error fetching revenue summary:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      Logger.error('getRevenueSummary failed:', error);
      return [];
    }
  }

  /**
   * Get expense summary for dashboard metrics
   * @param {string} userId - User ID
   * @param {Object} dateRange - Date range with start and end
   * @param {string} category - Optional category filter
   * @returns {Promise<Array>} Expense summary data
   */
  async getExpenseSummary(userId, dateRange, category) {
    try {
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
        Logger.error('Error fetching expense summary:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      Logger.error('getExpenseSummary failed:', error);
      return [];
    }
  }

  /**
   * Get profit and loss data for dashboard metrics
   * @param {string} userId - User ID
   * @param {Object} dateRange - Date range with start and end
   * @returns {Promise<Array>} Profit and loss data
   */
  async getProfitLoss(userId, dateRange) {
    try {
      let query = supabase.from('v_profit_loss').select('*').eq('user_id', userId);

      if (dateRange) {
        query = query.gte('period_start', dateRange.start).lte('period_start', dateRange.end);
      }

      query = query.order('period_start', { ascending: false });

      const { data, error } = await query;

      if (error) {
        Logger.error('Error fetching profit/loss data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      Logger.error('getProfitLoss failed:', error);
      return [];
    }
  }

  /**
   * Schedule a report for automatic generation
   * @param {Object} config - Report configuration
   * @param {string} config.reportType - Type of report
   * @param {string} config.format - Export format
   * @param {string} config.frequency - Schedule frequency (daily, weekly, monthly)
   * @param {string} config.email - Email to send report to
   * @returns {Promise<Object>} Scheduled report info
   */
  async scheduleReport(config) {
    try {
      const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In a real implementation, this would save to database
      const scheduledReport = {
        id: scheduleId,
        ...config,
        createdAt: new Date().toISOString(),
        status: 'active',
        nextRun: this.calculateNextRun(config.frequency)
      };
      
      Logger.info('Report scheduled:', scheduledReport);
      return scheduledReport;
    } catch (error) {
      Logger.error('Error scheduling report:', error);
      throw error;
    }
  }

  /**
   * Get list of scheduled reports
   * @returns {Promise<Array>} List of scheduled reports
   */
  async getScheduledReports() {
    try {
      // In a real implementation, this would fetch from database
      return [
        {
          id: 'schedule_1',
          reportType: 'revenue-summary',
          format: 'pdf',
          frequency: 'monthly',
          email: 'admin@company.com',
          status: 'active',
          nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    } catch (error) {
      Logger.error('Error getting scheduled reports:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled report
   * @param {string} scheduleId - ID of scheduled report
   * @returns {Promise<boolean>} Success status
   */
  async cancelScheduledReport(scheduleId) {
    try {
      Logger.info(`Cancelling scheduled report: ${scheduleId}`);
      // In a real implementation, this would update database
      return true;
    } catch (error) {
      Logger.error('Error cancelling scheduled report:', error);
      throw error;
    }
  }

  /**
   * Calculate next run time based on frequency
   * @param {string} frequency - Schedule frequency
   * @returns {string} Next run time (ISO string)
   */
  calculateNextRun(frequency) {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth.toISOString();
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Download file helper for browser downloads
   * @param {Blob} blob - File blob to download
   * @param {string} filename - Filename for download
   */
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default new ReportingService();
