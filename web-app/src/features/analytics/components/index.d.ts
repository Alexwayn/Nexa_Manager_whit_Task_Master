// Analytics Components Type Declarations
import { ComponentType } from 'react';

// Main Analytics Components
declare const AnalyticsDashboard: ComponentType<any>;
declare const InteractiveFinancialCharts: ComponentType<any>;
declare const ComparativeAnalytics: ComponentType<any>;
declare const ReportsDashboard: ComponentType<any>;
declare const AdvancedFinancialAnalytics: ComponentType<any>;

// Additional Analytics Components
declare const AdvancedTimePeriodSelector: ComponentType<any>;
declare const AdvancedVisualizations: ComponentType<any>;
declare const ClientAnalyticsWidgets: ComponentType<any>;
declare const EnhancedKPICard: ComponentType<any>;
declare const FinancialForecast: ComponentType<any>;

// Module declarations for individual components
declare module './AnalyticsDashboard' {
  const AnalyticsDashboard: ComponentType<any>;
  export default AnalyticsDashboard;
}

declare module './InteractiveFinancialCharts' {
  const InteractiveFinancialCharts: ComponentType<any>;
  export default InteractiveFinancialCharts;
}

declare module './ComparativeAnalytics' {
  const ComparativeAnalytics: ComponentType<any>;
  export default ComparativeAnalytics;
}

declare module './ReportsDashboard' {
  const ReportsDashboard: ComponentType<any>;
  export default ReportsDashboard;
}

declare module './AdvancedFinancialAnalytics' {
  const AdvancedFinancialAnalytics: ComponentType<any>;
  export default AdvancedFinancialAnalytics;
}

declare module './AdvancedTimePeriodSelector' {
  const AdvancedTimePeriodSelector: ComponentType<any>;
  export default AdvancedTimePeriodSelector;
}

declare module './AdvancedVisualizations' {
  const AdvancedVisualizations: ComponentType<any>;
  export default AdvancedVisualizations;
}

declare module './ClientAnalyticsWidgets' {
  const ClientAnalyticsWidgets: ComponentType<any>;
  export default ClientAnalyticsWidgets;
}

declare module './EnhancedKPICard' {
  const EnhancedKPICard: ComponentType<any>;
  export default EnhancedKPICard;
}

declare module './FinancialForecast' {
  const FinancialForecast: ComponentType<any>;
  export default FinancialForecast;
}

export {
  AnalyticsDashboard,
  InteractiveFinancialCharts,
  ComparativeAnalytics,
  ReportsDashboard,
  AdvancedFinancialAnalytics,
  AdvancedTimePeriodSelector,
  AdvancedVisualizations,
  ClientAnalyticsWidgets,
  EnhancedKPICard,
  FinancialForecast,
};