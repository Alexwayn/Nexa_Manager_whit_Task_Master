import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthBypass as useAuth, useUserBypass as useUser } from '@hooks/useClerkBypass';
import { realtimeService } from '@lib/realtimeService';
import financialService from '@lib/financialService';
import clientService from '@lib/clientService';
import Logger from '@utils/Logger';
import { supabase } from '../lib/supabaseClient';
import { getUserIdForUuidTables } from '../utils/userIdConverter';

/**
 * Custom hook for real-time dashboard data updates
 * Manages subscriptions to database changes and updates dashboard data accordingly
 * @param {Object} dateRange - Current date range for data filtering
 * @param {boolean} enabled - Whether real-time updates are enabled
 * @returns {Object} Dashboard data and real-time status
 */
export const useRealtimeDashboard = (dateRange, enabled = true) => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use refs to track subscriptions and prevent memory leaks
  const subscriptionsRef = useRef([]);
  const dataRefreshTimeoutRef = useRef(null);
  const refreshDataRef = useRef(null);

  // Debounced data refresh to prevent excessive API calls
  const debouncedRefresh = useCallback((delay = 1000) => {
    if (dataRefreshTimeoutRef.current) {
      clearTimeout(dataRefreshTimeoutRef.current);
    }

    dataRefreshTimeoutRef.current = setTimeout(() => {
      if (refreshDataRef.current) {
        refreshDataRef.current();
      }
    }, delay);
  }, []);

  // Transform financial data for dashboard display
  const transformFinancialData = useCallback((financialData, clientData) => {
    if (!financialData || !financialData.success) {
      return {};
    }

    const data = financialData.data;

    // Calculate trends (mock for now - these should come from comparing periods)
    const incomeTrend = data.income?.total > 0 ? 12.5 : 0; // Mock 12.5% increase
    const expensesTrend = data.expenses?.total > 0 ? -5.2 : 0; // Mock 5.2% decrease
    const profitTrend = data.netProfit > 0 ? 18.7 : 0; // Mock 18.7% increase
    const clientsTrend = clientData?.newThisMonth > 0 ? 8.3 : 0; // Mock 8.3% increase

    return {
      kpis: {
        totalRevenue: data.income?.total || 0,
        totalExpenses: data.expenses?.total || 0,
        revenueTrend: incomeTrend,
        expensesTrend: expensesTrend,
        profitTrend: profitTrend,
        healthScore: 85,
      },
      revenue: {
        labels:
          data.income?.dailyTrend?.map(d =>
            new Date(d.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
          ) || [],
        data: data.income?.dailyTrend?.map(d => d.amount) || [],
      },
      expenses: {
        labels: Object.keys(data.expenses?.byCategory || {}),
        data: Object.values(data.expenses?.byCategory || {}),
      },
      clients: {
        total: clientData?.total || 0,
        active: clientData?.active || 0,
        newThisMonth: clientData?.newThisMonth || 0,
        trend: clientsTrend,
      },
      trends: {
        revenue: incomeTrend,
        expenses: expensesTrend,
        profit: profitTrend,
      },
      lastUpdated: new Date().toISOString(),
    };
  }, []);

  // Refresh all dashboard data
  const refreshDashboardData = useCallback(async () => {
    if (!isSignedIn || !user || !dateRange) {
      Logger.info('Skipping data refresh: user not authenticated or date range not set');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Ensure dateRange has valid dates
      const startDate =
        dateRange.start instanceof Date ? dateRange.start : new Date(dateRange.start);
      const endDate = dateRange.end instanceof Date ? dateRange.end : new Date(dateRange.end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date range provided');
      }

      Logger.info('useRealtimeDashboard: Chiamando financialService.getFinancialOverview');

      const [financialData, clientMetrics] = await Promise.all([
        financialService.getFinancialOverview('month', startDate, endDate),
        clientService.getClientMetrics
          ? clientService.getClientMetrics(startDate, endDate)
          : Promise.resolve({ success: true, data: { total: 38, active: 35, newThisMonth: 3 } }),
      ]);

      Logger.info('useRealtimeDashboard: Dati ricevuti', {
        financialData,
        clientMetrics,
      });

      // Transform data for dashboard display
      const transformedData = transformFinancialData(financialData, clientMetrics.data);
      setDashboardData(transformedData);

      Logger.info('Dashboard data refreshed successfully');
    } catch (err) {
      Logger.error('Error refreshing dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user, dateRange, transformFinancialData]);

  // Update ref with current refresh function
  useEffect(() => {
    refreshDataRef.current = refreshDashboardData;
  }, [refreshDashboardData]);

  // Handle real-time data changes
  const handleRealtimeChange = useCallback(
    change => {
      Logger.info('Real-time change detected:', change);

      // Debounce data refresh to handle multiple rapid changes
      debouncedRefresh(500);
    },
    [debouncedRefresh],
  );

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!isSignedIn || !user || !enabled) {
      Logger.info('Skipping real-time setup: user not authenticated or real-time disabled');
      return;
    }

    try {
      // Clean up existing subscriptions
      subscriptionsRef.current.forEach(subscription => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
      subscriptionsRef.current = [];

      // Ottieni l'UUID corretto per le tabelle che lo richiedono
      const dbUserId = getUserIdForUuidTables(user.id);
      console.log('🔍 useRealtimeDashboard: Setup per user_id UUID:', dbUserId);

      // Setup delle subscription real-time
      console.log('🔄 useRealtimeDashboard: Setup subscription real-time per UUID:', dbUserId);

      // Subscription per income
      const incomeSubscription = supabase
        .channel('income_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'income',
            filter: `user_id=eq.${dbUserId}`,
          },
          payload => {
            Logger.info('Income change detected:', payload);
            handleRealtimeChange(payload);
          },
        )
        .subscribe();

      // Subscription per expenses
      const expensesSubscription = supabase
        .channel('expenses_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'expenses',
            filter: `user_id=eq.${dbUserId}`,
          },
          payload => {
            Logger.info('Expenses change detected:', payload);
            handleRealtimeChange(payload);
          },
        )
        .subscribe();

      subscriptionsRef.current = [incomeSubscription, expensesSubscription];
      setIsConnected(true);

      Logger.info(
        `Set up ${subscriptionsRef.current.length} real-time subscriptions for user ${user.id}`,
      );
    } catch (error) {
      Logger.error('Error setting up real-time subscriptions:', error);
      setIsConnected(false);
      setError(error.message);
    }
  }, [isSignedIn, user, enabled, handleRealtimeChange]);

  // Setup subscriptions when conditions are met
  useEffect(() => {
    if (isSignedIn && user && enabled) {
      setupRealtimeSubscriptions();
    }

    return () => {
      // Cleanup subscriptions on unmount or when conditions change
      subscriptionsRef.current.forEach(subscription => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
      subscriptionsRef.current = [];
      setIsConnected(false);
      Logger.info('Cleaned up real-time subscriptions');
    };
  }, [isSignedIn, user, enabled, setupRealtimeSubscriptions]);

  // Initial data load
  useEffect(() => {
    if (isSignedIn && user && dateRange) {
      refreshDashboardData();
    }
  }, [isSignedIn, user, dateRange, refreshDashboardData]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (dataRefreshTimeoutRef.current) {
        clearTimeout(dataRefreshTimeoutRef.current);
      }
    };
  }, []);

  // Force refresh function
  const forceRefresh = useCallback(() => {
    refreshDashboardData();
  }, [refreshDashboardData]);

  // Toggle real-time updates
  const toggleRealtime = useCallback(() => {
    const newState = !enabled;

    if (newState) {
      setupRealtimeSubscriptions();
    } else {
      subscriptionsRef.current.forEach(subscription => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
      subscriptionsRef.current = [];
      setIsConnected(false);
    }

    return newState;
  }, [enabled, setupRealtimeSubscriptions]);

  return {
    dashboardData,
    isConnected,
    loading,
    error,
    forceRefresh,
    toggleRealtime,
    lastUpdated: dashboardData.lastUpdated,
  };
};

export default useRealtimeDashboard;
