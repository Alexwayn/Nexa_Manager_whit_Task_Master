import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import Logger from '@/utils/Logger';

/**
 * Custom hook for managing chart analytics data
 * Handles fetching and formatting data for various chart types
 */
export const useChartAnalytics = (chartType = 'revenue', options = {}) => {
  const { user } = useUser();
  const {
    dateRange = null,
    groupBy = 'month',
    includeComparison = true
  } = options;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState(null);

  const fetchChartData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // This would typically call analytics services based on chartType
      // For now, we'll create placeholder data
      let chartData = {};

      switch (chartType) {
        case 'revenue':
          chartData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Revenue',
              data: [12000, 15000, 18000, 16000, 22000, 25000],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4
            }]
          };
          break;
        case 'clients':
          chartData = {
            labels: ['New', 'Active', 'Inactive', 'Churned'],
            datasets: [{
              data: [12, 28, 8, 3],
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)'
              ]
            }]
          };
          break;
        case 'invoices':
          chartData = {
            labels: ['Paid', 'Pending', 'Overdue', 'Draft'],
            datasets: [{
              data: [18, 6, 3, 1],
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(156, 163, 175, 0.8)'
              ]
            }]
          };
          break;
        default:
          chartData = { labels: [], datasets: [] };
      }

      setRawData(chartData);
      Logger.info(`Chart data fetched successfully for ${chartType}`);
    } catch (err) {
      Logger.error(`Error fetching chart data for ${chartType}:`, err);
      setError(err.message || `Failed to fetch ${chartType} chart data`);
    } finally {
      setLoading(false);
    }
  }, [user?.id, chartType, dateRange, groupBy]);

  // Memoized formatted data for Chart.js
  const chartData = useMemo(() => {
    if (!rawData) return null;

    return {
      ...rawData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Analytics`
          }
        },
        scales: chartType === 'revenue' ? {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '€' + value.toLocaleString();
              }
            }
          }
        } : {}
      }
    };
  }, [rawData, chartType]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const refreshChart = useCallback(() => {
    fetchChartData();
  }, [fetchChartData]);

  return {
    chartData,
    rawData,
    loading,
    error,
    refresh: refreshChart
  };
};

export default useChartAnalytics;
