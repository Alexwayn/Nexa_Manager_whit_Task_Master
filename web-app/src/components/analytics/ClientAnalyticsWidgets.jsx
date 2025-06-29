import React, { useState, useEffect, useCallback } from 'react';
import { useAuthBypass as useAuth, useUserBypass as useUser } from '@hooks/useClerkBypass';
import { useTranslation } from 'react-i18next';
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Filter,
  Download,
  Eye,
  ChevronRight,
  BarChart3,
  PieChart,
  Target,
  Activity,
  Award,
  UserCheck,
  UserX,
  UserPlus,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import clientService from '@lib/clientService';
import invoiceAnalyticsService from '@lib/invoiceAnalyticsService';
import Logger from '@utils/Logger';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const ClientAnalyticsWidgets = ({ dateRange, onDrillDown, className = "" }) => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { t } = useTranslation(['analytics', 'dashboard', 'common']);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownData, setDrillDownData] = useState(null);
  
  // Data states
  const [clientData, setClientData] = useState({
    overview: {},
    segmentation: {},
    topClients: [],
    paymentBehavior: {},
    growthTrends: [],
    healthScore: 0
  });

  // Load client analytics data
  const loadClientAnalytics = useCallback(async () => {
    if (!isSignedIn || !user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const startDate = dateRange?.start?.toISOString?.()?.split('T')[0] || 
                       new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const endDate = dateRange?.end?.toISOString?.()?.split('T')[0] || 
                     new Date().toISOString().split('T')[0];

      // Load data from multiple sources with user ID
      const [clientsResult, analyticsResult] = await Promise.all([
        clientService.getClients({ limit: null, userId: user.id }),
        invoiceAnalyticsService.getClientAnalytics(startDate, endDate)
      ]);

      if (clientsResult.error) throw new Error(clientsResult.error);
      if (!analyticsResult.success) throw new Error(analyticsResult.error);

      const clients = clientsResult.data || [];
      const analytics = analyticsResult.data || {};

      // Calculate client overview metrics
      const overview = calculateOverviewMetrics(clients, analytics);
      
      // Calculate client segmentation (RFM analysis)
      const segmentation = calculateClientSegmentation(clients, analytics);
      
      // Calculate growth trends
      const growthTrends = calculateGrowthTrends(clients);
      
      // Calculate business health score
      const healthScore = calculateBusinessHealthScore(overview, analytics);

      setClientData({
        overview,
        segmentation,
        topClients: analytics.topClients || [],
        paymentBehavior: analytics.paymentBehavior || {},
        growthTrends,
        healthScore
      });

    } catch (err) {
      Logger.error('Error loading client analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange, isSignedIn, user?.id]);

  useEffect(() => {
    loadClientAnalytics();
  }, [loadClientAnalytics]);

  // Helper functions for calculations
  const calculateOverviewMetrics = (clients, analytics) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const newThisMonth = clients.filter(client => 
      new Date(client.created_at) >= thisMonth
    ).length;
    
    const newLastMonth = clients.filter(client => {
      const createdAt = new Date(client.created_at);
      return createdAt >= lastMonth && createdAt < thisMonth;
    }).length;

    const growth = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth * 100) : 0;

    return {
      totalClients: clients.length,
      activeClients: analytics.totalClients || clients.length,
      newThisMonth,
      growth,
      retention: 92, // Mock retention rate - would need historical data
      avgRevenue: analytics.totalClients > 0 ? 
        Object.values(analytics.clientMetrics || {})
          .reduce((sum, client) => sum + client.totalRevenue, 0) / analytics.totalClients : 0
    };
  };

  const calculateClientSegmentation = (clients, analytics) => {
    const segments = {
      champions: 0,
      loyalCustomers: 0,
      potentialLoyalists: 0,
      newCustomers: 0,
      atRisk: 0,
      cantLoseThem: 0,
      hibernating: 0,
      lost: 0
    };

    // Mock segmentation based on client metrics
    const clientMetrics = analytics.clientMetrics || {};
    Object.values(clientMetrics).forEach(client => {
      const revenue = client.totalRevenue || 0;
      const recency = client.averagePaymentTime || 30;
      const frequency = client.invoiceCount || 0;

      if (revenue > 5000 && recency <= 30 && frequency >= 5) {
        segments.champions++;
      } else if (revenue > 3000 && recency <= 45 && frequency >= 3) {
        segments.loyalCustomers++;
      } else if (revenue > 1000 && recency <= 60) {
        segments.potentialLoyalists++;
      } else if (recency <= 30 && frequency <= 2) {
        segments.newCustomers++;
      } else if (revenue > 2000 && recency > 60) {
        segments.atRisk++;
      } else if (revenue > 5000 && recency > 90) {
        segments.cantLoseThem++;
      } else if (recency > 120) {
        segments.hibernating++;
      } else {
        segments.lost++;
      }
    });

    return segments;
  };

  const calculateGrowthTrends = (clients) => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const newClientsInMonth = clients.filter(client => {
        const createdAt = new Date(client.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      last6Months.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        newClients: newClientsInMonth,
        totalClients: clients.filter(client => 
          new Date(client.created_at) <= monthEnd
        ).length
      });
    }

    return last6Months;
  };

  const calculateBusinessHealthScore = (overview, analytics) => {
    let score = 0;
    
    // Client growth (30%)
    if (overview.growth > 10) score += 30;
    else if (overview.growth > 0) score += 20;
    else if (overview.growth > -10) score += 10;
    
    // Retention rate (25%)
    if (overview.retention > 90) score += 25;
    else if (overview.retention > 80) score += 20;
    else if (overview.retention > 70) score += 15;
    else if (overview.retention > 60) score += 10;
    
    // Payment behavior (25%)
    const paymentBehavior = analytics.paymentBehavior || {};
    const excellentPayments = paymentBehavior.excellent?.percentage || 0;
    if (excellentPayments > 80) score += 25;
    else if (excellentPayments > 60) score += 20;
    else if (excellentPayments > 40) score += 15;
    else if (excellentPayments > 20) score += 10;
    
    // Client diversity (20%)
    const topClientRevenue = analytics.topClients?.[0]?.totalRevenue || 0;
    const totalRevenue = Object.values(analytics.clientMetrics || {})
      .reduce((sum, client) => sum + client.totalRevenue, 0);
    const concentration = totalRevenue > 0 ? (topClientRevenue / totalRevenue) * 100 : 0;
    
    if (concentration < 20) score += 20;
    else if (concentration < 30) score += 15;
    else if (concentration < 40) score += 10;
    else if (concentration < 50) score += 5;
    
    return Math.min(score, 100);
  };

  // Handle drill-down functionality
  const handleDrillDown = (widgetType, segment = null) => {
    let data = null;
    
    switch (widgetType) {
      case 'segmentation':
        data = {
          type: 'segmentation',
          segment,
          details: clientData.segmentation,
          title: t('analytics:clientAnalytics.clientSegmentation')
        };
        break;
      case 'topClients':
        data = {
          type: 'topClients',
          details: clientData.topClients,
          title: t('analytics:clientAnalytics.topClients')
        };
        break;
      case 'paymentBehavior':
        data = {
          type: 'paymentBehavior',
          details: clientData.paymentBehavior,
          title: t('analytics:clientAnalytics.paymentBehavior')
        };
        break;
      default:
        return;
    }
    
    setDrillDownData(data);
    setShowDrillDown(true);
    setSelectedSegment(segment);
    
    if (onDrillDown) {
      onDrillDown(data);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center h-64`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('analytics:clientAnalytics.loading.loadingClientAnalytics')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6`}>
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-red-800 dark:text-red-400 font-medium">
              {t('analytics:clientAnalytics.errors.errorLoadingData')}
            </h3>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={loadClientAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {t('common:retry')}
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Client Overview Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('analytics:clientAnalytics.clientOverview')}
            </h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {clientData.overview.totalClients || 0}
              </div>
              <div className="text-sm text-gray-500">{t('analytics:clientAnalytics.totalClients')}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {clientData.overview.activeClients || 0}
              </div>
              <div className="text-sm text-gray-500">{t('analytics:clientAnalytics.activeClients')}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {clientData.overview.newThisMonth || 0}
              </div>
              <div className="text-sm text-gray-500">{t('analytics:clientAnalytics.newThisMonth')}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage(clientData.overview.retention)}
              </div>
              <div className="text-sm text-gray-500">{t('analytics:clientAnalytics.retention')}</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('analytics:clientAnalytics.clientGrowth')}
              </span>
              <div className="flex items-center space-x-1">
                {clientData.overview.growth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  clientData.overview.growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(clientData.overview.growth)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Health Score Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('analytics:clientAnalytics.businessHealthScore')}
            </h3>
            <Award className="w-5 h-5 text-purple-500" />
          </div>
          
          <div className="text-center">
            <div className="mb-4">
              {clientData.healthScore >= 80 ? (
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
              ) : clientData.healthScore >= 60 ? (
                <Target className="w-8 h-8 text-blue-600 mx-auto" />
              ) : clientData.healthScore >= 40 ? (
                <Activity className="w-8 h-8 text-yellow-600 mx-auto" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
              )}
            </div>
            <div className={`text-4xl font-bold mb-2 ${
              clientData.healthScore >= 80 ? 'text-green-600' :
              clientData.healthScore >= 60 ? 'text-blue-600' :
              clientData.healthScore >= 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {clientData.healthScore}/100
            </div>
                         <div className="text-lg font-medium text-gray-900 dark:text-white mb-4">
               {clientData.healthScore >= 80 ? t('analytics:clientAnalytics.healthLevels.excellent') :
                clientData.healthScore >= 60 ? t('analytics:clientAnalytics.healthLevels.good') :
                clientData.healthScore >= 40 ? t('analytics:clientAnalytics.healthLevels.fair') : t('analytics:clientAnalytics.healthLevels.needsAttention')}
             </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  clientData.healthScore >= 80 ? 'bg-green-500' :
                  clientData.healthScore >= 60 ? 'bg-blue-500' :
                  clientData.healthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${clientData.healthScore}%` }}
              />
            </div>
            
                         <div className="text-sm text-gray-600 dark:text-gray-400">
               {t('analytics:clientAnalytics.metrics.basedOnClientMetrics')}
             </div>
          </div>
        </div>

        {/* Top Clients Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('analytics:clientAnalytics.topClients')}
            </h3>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <button
                onClick={() => handleDrillDown('topClients')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {t('analytics:clientAnalytics.actions.viewAll')}
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {clientData.topClients.slice(0, 5).map((client, index) => (
              <div key={client.client?.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {client.rank || index + 1}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {client.client?.full_name || client.client?.name || `Client ${index + 1}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {client.invoiceCount || 0} {t('analytics:clientAnalytics.metrics.invoices')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(client.totalRevenue || 0)}
                  </div>
                                      <div className="text-sm text-gray-500">
                      {client.averagePaymentTime || 0} {t('analytics:clientAnalytics.metrics.avgDays')}
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Drill-down modal */}
      {showDrillDown && drillDownData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {drillDownData.title}
                </h2>
                <button
                  onClick={() => setShowDrillDown(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {drillDownData.type === 'topClients' && (
                <div className="space-y-4">
                  {drillDownData.details.map((client, index) => (
                    <div key={client.client?.id || index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">{t('analytics:clientAnalytics.metrics.client')}</div>
                          <div className="font-medium">{client.client?.full_name || client.client?.name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">{t('analytics:clientAnalytics.metrics.totalRevenue')}</div>
                          <div className="font-medium">{formatCurrency(client.totalRevenue)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">{t('analytics:clientAnalytics.metrics.invoiceCount')}</div>
                          <div className="font-medium">{client.invoiceCount}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">{t('analytics:clientAnalytics.metrics.avgPaymentTime')}</div>
                          <div className="font-medium">{client.averagePaymentTime} {t('analytics:clientAnalytics.metrics.days')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAnalyticsWidgets; 