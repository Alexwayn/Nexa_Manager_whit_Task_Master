import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import Logger from '@/utils/Logger';

/**
 * Custom hook for managing KPI metrics
 * Handles fetching and calculating key performance indicators
 */
export const useKPIMetrics = (dateRange = null) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    revenue: {
      current: 0,
      previous: 0,
      change: 0,
      changePercent: 0
    },
    clients: {
      current: 0,
      previous: 0,
      change: 0,
      changePercent: 0
    },
    invoices: {
      current: 0,
      previous: 0,
      change: 0,
      changePercent: 0
    },
    quotes: {
      current: 0,
      previous: 0,
      change: 0,
      changePercent: 0
    },
    conversionRate: {
      current: 0,
      previous: 0,
      change: 0,
      changePercent: 0
    }
  });

  const calculateMetrics = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // This would typically call various services to get KPI data
      // For now, we'll create placeholder calculations
      const kpiData = {
        revenue: {
          current: 25000,
          previous: 22000,
          change: 3000,
          changePercent: 13.6
        },
        clients: {
          current: 45,
          previous: 42,
          change: 3,
          changePercent: 7.1
        },
        invoices: {
          current: 28,
          previous: 25,
          change: 3,
          changePercent: 12.0
        },
        quotes: {
          current: 15,
          previous: 18,
          change: -3,
          changePercent: -16.7
        },
        conversionRate: {
          current: 65.5,
          previous: 58.2,
          change: 7.3,
          changePercent: 12.5
        }
      };

      setMetrics(kpiData);
      Logger.info('KPI metrics calculated successfully');
    } catch (err) {
      Logger.error('Error calculating KPI metrics:', err);
      setError(err.message || 'Failed to calculate KPI metrics');
    } finally {
      setLoading(false);
    }
  }, [user?.id, dateRange]);

  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  const refreshMetrics = useCallback(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh: refreshMetrics
  };
};

export default useKPIMetrics;
