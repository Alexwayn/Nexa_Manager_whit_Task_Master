import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import Logger from '@utils/Logger';

/**
 * Custom hook for managing analytics data and state
 * Handles fetching analytics metrics, KPIs, and dashboard data
 */
export const useAnalytics = (options = {}) => {
  const { user } = useUser();
  const {
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
    dateRange = null,
    metrics = ['revenue', 'clients', 'invoices', 'quotes']
  } = options;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // This would typically call analytics services
      // For now, we'll create a placeholder structure
      const analyticsData = {
        kpis: {
          totalRevenue: 0,
          totalClients: 0,
          totalInvoices: 0,
          totalQuotes: 0,
          conversionRate: 0,
          averageInvoiceValue: 0
        },
        trends: {
          revenue: [],
          clients: [],
          invoices: [],
          quotes: []
        },
        charts: {
          revenueOverTime: null,
          clientDistribution: null,
          invoiceStatus: null
        }
      };

      setData(analyticsData);
      setLastUpdated(new Date());
      
      Logger.info('Analytics data fetched successfully');
    } catch (err) {
      Logger.error('Error fetching analytics data:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [user?.id, dateRange, metrics]);

  const refreshAnalytics = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAnalytics]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh: refreshAnalytics,
    refetch: fetchAnalytics
  };
};

export default useAnalytics;