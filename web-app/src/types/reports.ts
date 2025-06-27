// Reports and Insights Module Type Definitions
// Task 71: Develop Reports and Insights Module

import { BaseEntity } from './api';

/**
 * Report Categories and Types
 */
export type ReportCategory = 'financial' | 'client' | 'tax' | 'audit' | 'operational' | 'analytics';
export type ReportType = 'summary' | 'detailed' | 'comparative' | 'trend' | 'forecast' | 'custom';
export type ReportFormat = 'table' | 'chart' | 'mixed' | 'dashboard';
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

/**
 * Report Frequency for Scheduling
 */
export type ReportFrequency = 'one-time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

/**
 * Report Status Lifecycle
 */
export type ReportStatus = 'draft' | 'generating' | 'completed' | 'scheduled' | 'failed' | 'cancelled';

/**
 * Chart Types for Data Visualization
 */
export type ChartType = 
  | 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' 
  | 'radar' | 'polar' | 'histogram' | 'heatmap' | 'gauge' | 'treemap';

/**
 * Date Range Configuration
 */
export interface DateRange {
  start: string; // ISO date
  end: string; // ISO date
  preset?: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' 
          | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom';
}

/**
 * Filter Configuration for Reports
 */
export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' 
          | 'less_than' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value: any;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
}

/**
 * Sort Configuration
 */
export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Data Source Configuration
 */
export interface DataSource {
  table: string;
  joins?: Array<{
    table: string;
    on: string;
    type: 'inner' | 'left' | 'right' | 'full';
  }>;
  fields: string[];
  groupBy?: string[];
  aggregations?: Array<{
    field: string;
    function: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'distinct_count';
    alias?: string;
  }>;
}

/**
 * Chart Configuration
 */
export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis: {
    field: string;
    label: string;
    type: 'category' | 'time' | 'numeric';
  };
  yAxis: {
    field: string;
    label: string;
    type: 'numeric';
    format?: 'currency' | 'percentage' | 'number';
  };
  series?: Array<{
    field: string;
    label: string;
    color?: string;
  }>;
  options?: {
    showLegend?: boolean;
    showTooltip?: boolean;
    showGrid?: boolean;
    theme?: 'light' | 'dark';
    responsive?: boolean;
  };
}

/**
 * Report Template Definition
 */
export interface ReportTemplate extends BaseEntity {
  name: string;
  description: string;
  category: ReportCategory;
  type: ReportType;
  format: ReportFormat;
  
  // Data Configuration
  dataSource: DataSource;
  filters: ReportFilter[];
  sorts: ReportSort[];
  dateRange?: DateRange;
  
  // Visualization
  charts?: ChartConfig[];
  
  // Layout and Styling
  layout: {
    header?: {
      title: string;
      subtitle?: string;
      logo?: boolean;
      companyInfo?: boolean;
    };
    sections: Array<{
      id: string;
      title: string;
      type: 'table' | 'chart' | 'kpi' | 'text';
      config: any;
      order: number;
    }>;
    footer?: {
      pageNumbers?: boolean;
      timestamp?: boolean;
      disclaimer?: string;
    };
  };
  
  // Metadata
  tags: string[];
  is_public: boolean;
  is_favorite: boolean;
  usage_count: number;
  last_used?: string;
  
  // Access Control
  permissions: {
    can_view: string[];
    can_edit: string[];
    can_delete: string[];
  };
}

/**
 * Report Instance (Generated Report)
 */
export interface ReportInstance extends BaseEntity {
  template_id: string;
  name: string;
  description?: string;
  
  // Generation Info
  status: ReportStatus;
  generated_by: string;
  generated_at?: string;
  completed_at?: string;
  error_message?: string;
  
  // Parameters Used
  parameters: {
    dateRange: DateRange;
    filters: ReportFilter[];
    customFields?: Record<string, any>;
  };
  
  // Results
  data?: any[];
  summary?: Record<string, any>;
  charts?: Array<{
    id: string;
    config: ChartConfig;
    data: any[];
  }>;
  
  // Export Info
  file_url?: string;
  file_format?: ExportFormat;
  file_size?: number;
  
  // Metadata
  row_count?: number;
  execution_time?: number; // milliseconds
  cache_key?: string;
  expires_at?: string;
}

/**
 * Report Schedule for Automation
 */
export interface ReportSchedule extends BaseEntity {
  template_id: string;
  name: string;
  description?: string;
  
  // Schedule Configuration
  frequency: ReportFrequency;
  cron_expression?: string; // For custom frequencies
  timezone: string;
  
  // Schedule Settings
  is_active: boolean;
  start_date: string;
  end_date?: string;
  
  // Parameters
  parameters: {
    dateRange?: Partial<DateRange>; // Can use relative dates
    filters?: ReportFilter[];
    export_format?: ExportFormat;
  };
  
  // Delivery Configuration
  delivery: {
    method: 'email' | 'webhook' | 'file_storage' | 'dashboard';
    recipients?: string[];
    webhook_url?: string;
    storage_path?: string;
    subject_template?: string;
    body_template?: string;
  };
  
  // Execution History
  last_run_at?: string;
  next_run_at?: string;
  run_count: number;
  success_count: number;
  failure_count: number;
  
  // Notifications
  notify_on_success: boolean;
  notify_on_failure: boolean;
  notification_emails: string[];
}

/**
 * Saved Report (User's Custom Report)
 */
export interface SavedReport extends BaseEntity {
  name: string;
  description?: string;
  template_id?: string;
  
  // Configuration
  config: {
    dataSource: DataSource;
    filters: ReportFilter[];
    sorts: ReportSort[];
    dateRange?: DateRange;
    charts?: ChartConfig[];
    layout: any;
  };
  
  // Metadata
  category: ReportCategory;
  tags: string[];
  is_favorite: boolean;
  is_shared: boolean;
  
  // Sharing
  shared_with: string[];
  share_permissions: {
    can_view: boolean;
    can_edit: boolean;
    can_export: boolean;
  };
  
  // Usage Statistics
  access_count: number;
  last_accessed?: string;
}

/**
 * Report Analytics and Insights
 */
export interface ReportAnalytics {
  report_id: string;
  period: DateRange;
  
  metrics: {
    generation_time_avg: number;
    generation_time_max: number;
    success_rate: number;
    error_rate: number;
    usage_count: number;
    unique_users: number;
    export_count: Record<ExportFormat, number>;
  };
  
  performance: {
    query_performance: number;
    data_volume: number;
    cache_hit_rate: number;
    resource_usage: number;
  };
  
  user_engagement: {
    view_count: number;
    export_count: number;
    share_count: number;
    favorite_count: number;
    average_session_time: number;
  };
}

/**
 * Report Builder Field Definition
 */
export interface ReportField {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
  table: string;
  is_dimension: boolean; // Can be grouped by
  is_measure: boolean; // Can be aggregated
  aggregation_functions?: Array<'sum' | 'count' | 'avg' | 'min' | 'max' | 'distinct_count'>;
  format?: {
    decimal_places?: number;
    currency_symbol?: string;
    date_format?: string;
    percentage_symbol?: boolean;
  };
  description?: string;
  example_value?: string;
}

/**
 * Business Intelligence KPIs
 */
export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  
  calculation: {
    formula: string;
    data_source: DataSource;
    dependencies?: string[];
  };
  
  visualization: {
    type: 'number' | 'gauge' | 'progress' | 'trend';
    format: 'currency' | 'percentage' | 'number' | 'ratio';
    color_thresholds?: Array<{
      value: number;
      color: string;
      operator: 'greater_than' | 'less_than' | 'between';
    }>;
  };
  
  targets?: {
    target_value: number;
    warning_threshold: number;
    critical_threshold: number;
  };
  
  refresh_interval: number; // minutes
  cache_duration: number; // minutes
}

/**
 * Audit Trail for Report Access
 */
export interface ReportAuditLog extends BaseEntity {
  report_id: string;
  report_type: 'template' | 'instance' | 'schedule' | 'saved';
  
  action: 'view' | 'generate' | 'export' | 'share' | 'edit' | 'delete' | 'schedule' | 'cancel';
  user_id: string;
  user_email: string;
  
  details: {
    parameters?: Record<string, any>;
    export_format?: ExportFormat;
    recipient_count?: number;
    file_size?: number;
    execution_time?: number;
  };
  
  ip_address: string;
  user_agent: string;
  timestamp: string;
  
  // Security and Compliance
  session_id: string;
  request_id: string;
  compliance_flags?: string[];
}

/**
 * Report Access Control
 */
export interface ReportPermission {
  resource_type: 'template' | 'instance' | 'schedule' | 'category';
  resource_id: string;
  user_id?: string;
  role?: string;
  organization_id?: string;
  
  permissions: {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_export: boolean;
    can_schedule: boolean;
    can_share: boolean;
    can_admin: boolean;
  };
  
  restrictions?: {
    date_range_limit?: number; // days
    export_formats?: ExportFormat[];
    max_exports_per_day?: number;
    sensitive_data_access?: boolean;
  };
  
  granted_by: string;
  granted_at: string;
  expires_at?: string;
}

/**
 * Report System Configuration
 */
export interface ReportSystemConfig {
  features: {
    custom_reports: boolean;
    scheduled_reports: boolean;
    report_sharing: boolean;
    advanced_charts: boolean;
    data_export: boolean;
    real_time_data: boolean;
    audit_logging: boolean;
  };
  
  limits: {
    max_templates_per_user: number;
    max_scheduled_reports: number;
    max_export_file_size: number; // MB
    max_data_retention_days: number;
    max_concurrent_generations: number;
    rate_limit_per_minute: number;
  };
  
  defaults: {
    timezone: string;
    currency: string;
    date_format: string;
    number_format: string;
    chart_theme: 'light' | 'dark';
    export_format: ExportFormat;
  };
  
  integrations: {
    email_service: boolean;
    cloud_storage: boolean;
    webhook_notifications: boolean;
    business_intelligence: boolean;
  };
} 