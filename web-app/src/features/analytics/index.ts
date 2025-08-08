// Analytics Feature - Public API

// Analytics feature exports
export { default as AnalyticsDashboard } from './components/AnalyticsDashboard';
export { default as AnalyticsCharts } from './components/InteractiveFinancialCharts';
export { default as AnalyticsMetrics } from './components/ComparativeAnalytics';
export { default as AnalyticsFilters } from './components/AnalyticsDashboard'; // Using AnalyticsDashboard as it contains filter functionality
export { default as AnalyticsReports } from './components/ReportsDashboard';
export { default as AdvancedVisualizations } from './components/AdvancedVisualizations';
export { default as AdvancedTimePeriodSelector } from './components/AdvancedTimePeriodSelector';
export { default as PerformanceAnalytics } from './components/AdvancedFinancialAnalytics';
export { default as EnhancedKPICard } from './components/EnhancedKPICard';
export { default as ClientAnalyticsWidgets } from './components/ClientAnalyticsWidgets';

// Hooks
export { useAnalytics } from './hooks/useAnalytics.js';
export { useKPIMetrics } from './hooks/useKPIMetrics.js';
export { useChartAnalytics } from './hooks/useChartAnalytics.js';

// Services (if any exist)
// export { default as analyticsService } from './services/analyticsService';

// Re-export types if any
// export type * from './services/analyticsService';
