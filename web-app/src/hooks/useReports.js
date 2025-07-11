import { useState, useEffect, useMemo } from 'react';
import { useUserBypass as useUser } from '@hooks/useClerkBypass';
import reportingService from '@lib/reportingService';
import invoiceAnalyticsService from '@lib/invoiceAnalyticsService';
import Logger from '@utils/Logger';

/**
 * Custom hook for managing reports data and state
 * Handles fetching metrics, report generation, and report history
 */
export const useReports = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [generating, setGenerating] = useState(false);
  
  // reportingService is already imported as a singleton

  // Fetch dashboard metrics
  const fetchMetrics = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get current date range (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Fetch financial metrics
      const [revenueData, expenseData, profitLossData, clientData] = await Promise.all([
        reportingService.getRevenueSummary(user.id, { start: startDate, end: endDate }),
        reportingService.getExpenseSummary(user.id, { start: startDate, end: endDate }),
        reportingService.getProfitLoss(user.id, { start: startDate, end: endDate }),
        invoiceAnalyticsService.getClientAnalytics(startDate, endDate)
      ]);

      // Calculate metrics from real data
      const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.total_revenue || 0), 0) || 0;
      const totalExpenses = expenseData?.reduce((sum, item) => sum + (item.total_expenses || 0), 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
      
      const totalClients = clientData?.data?.totalClients || 0;
      const newClients = clientData?.data?.newClients || 0;
      const clientRetention = clientData?.data?.retentionRate || 0;
      const avgInvoiceValue = clientData?.data?.averageInvoiceValue || 0;

      // Structure metrics similar to original format but with real data
      const calculatedMetrics = {
        financial: [
          {
            title: 'Total Revenue',
            value: `€${totalRevenue.toLocaleString()}`,
            change: '+12.5%', // TODO: Calculate actual change
            trend: 'up',
            icon: 'CurrencyEuroIcon',
            color: 'green'
          },
          {
            title: 'Net Profit',
            value: `€${netProfit.toLocaleString()}`,
            change: netProfit >= 0 ? '+8.2%' : '-3.1%',
            trend: netProfit >= 0 ? 'up' : 'down',
            icon: 'TrendingUpIcon',
            color: netProfit >= 0 ? 'green' : 'red'
          },
          {
            title: 'Profit Margin',
            value: `${profitMargin.toFixed(1)}%`,
            change: '+2.1%', // TODO: Calculate actual change
            trend: 'up',
            icon: 'ChartBarIcon',
            color: 'blue'
          },
          {
            title: 'Total Expenses',
            value: `€${totalExpenses.toLocaleString()}`,
            change: '+5.3%', // TODO: Calculate actual change
            trend: 'up',
            icon: 'CreditCardIcon',
            color: 'orange'
          }
        ],
        client: [
          {
            title: 'Total Clients',
            value: totalClients.toString(),
            change: '+15.2%', // TODO: Calculate actual change
            trend: 'up',
            icon: 'UsersIcon',
            color: 'blue'
          },
          {
            title: 'New Clients',
            value: newClients.toString(),
            change: '+23.1%', // TODO: Calculate actual change
            trend: 'up',
            icon: 'UserPlusIcon',
            color: 'green'
          },
          {
            title: 'Client Retention',
            value: `${clientRetention.toFixed(1)}%`,
            change: '+1.8%', // TODO: Calculate actual change
            trend: 'up',
            icon: 'HeartIcon',
            color: 'purple'
          },
          {
            title: 'Avg Invoice Value',
            value: `€${avgInvoiceValue.toLocaleString()}`,
            change: '+7.4%', // TODO: Calculate actual change
            trend: 'up',
            icon: 'DocumentTextIcon',
            color: 'indigo'
          }
        ],
        custom: [
          {
            title: 'Total Reports',
            value: '0', // TODO: Implement report counting
            change: '0%',
            trend: 'neutral',
            icon: 'DocumentChartBarIcon',
            color: 'gray'
          },
          {
            title: 'Scheduled Reports',
            value: '0', // TODO: Implement scheduled reports
            change: '0%',
            trend: 'neutral',
            icon: 'ClockIcon',
            color: 'blue'
          },
          {
            title: 'Data Exports',
            value: '0', // TODO: Implement export tracking
            change: '0%',
            trend: 'neutral',
            icon: 'ArrowDownTrayIcon',
            color: 'green'
          },
          {
            title: 'Custom Dashboards',
            value: '0', // TODO: Implement custom dashboards
            change: '0%',
            trend: 'neutral',
            icon: 'Squares2X2Icon',
            color: 'purple'
          }
        ]
      };

      setMetrics(calculatedMetrics);
      
      // Set chart data
      const chartDataFormatted = {
        revenueVsExpenses: {
          revenue: revenueData?.map(item => item.total_revenue || 0) || [],
          expenses: expenseData?.map(item => item.total_expenses || 0) || [],
          months: revenueData?.map(item => {
            const date = new Date(item.month_start || item.period_start);
            return date.toLocaleDateString('en-US', { month: 'short' });
          }) || []
        },
        clientAcquisition: {
          newClients: [newClients], // TODO: Get historical data
          churn: [0], // TODO: Calculate churn
          months: [new Date().toLocaleDateString('en-US', { month: 'short' })]
        }
      };
      
      setChartData(chartDataFormatted);
      
    } catch (err) {
      Logger.error('Error fetching report metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent reports (placeholder for now)
  const fetchRecentReports = async () => {
    // TODO: Implement actual report history fetching
    setRecentReports([]);
  };

  // Generate report
  const generateReport = async (reportId, config = {}) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setGenerating(true);
      setError(null);

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let result;
      
      switch (reportId) {
        case 'revenue-analysis':
        case 'profit-loss':
        case 'cash-flow':
          result = await invoiceAnalyticsService.generateRevenueReport(
            startDate,
            endDate,
            config.format || 'pdf'
          );
          break;
          
        case 'client-analytics':
        case 'client-retention':
        case 'client-satisfaction':
          result = await invoiceAnalyticsService.generateClientReport(
            startDate,
            endDate,
            config.format || 'pdf'
          );
          break;
          
        case 'tax-summary':
        case 'vat-report':
          result = await reportingService.getIVASummary(user.id);
          break;
          
        default:
          throw new Error(`Unknown report type: ${reportId}`);
      }

      // Refresh recent reports after generation
      await fetchRecentReports();
      
      return result;
      
    } catch (err) {
      Logger.error('Error generating report:', err);
      setError(err.message);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    if (user?.id) {
      fetchMetrics();
      fetchRecentReports();
    }
  }, [user?.id]);

  return {
    // Data
    metrics,
    recentReports,
    chartData,
    
    // State
    loading,
    error,
    generating,
    
    // Actions
    generateReport,
    refreshMetrics: fetchMetrics,
    refreshReports: fetchRecentReports
  };
};

export default useReports;