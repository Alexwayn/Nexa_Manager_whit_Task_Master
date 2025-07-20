// API Response Types for Supabase and External Services

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  data: T | null;
  error: ApiError | null;
  status: number;
  message?: string;
}

/**
 * API Error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  hint?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

/**
 * Database row base interface
 */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * User profile from Supabase Auth
 */
export interface UserProfile extends BaseEntity {
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  phone?: string;
  role: 'admin' | 'user' | 'viewer';
  is_active: boolean;
  last_login?: string;
  preferences: UserPreferences;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'it';
  timezone: string;
  notifications: NotificationSettings;
  dashboard_layout?: DashboardLayout;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  email_enabled: boolean;
  push_enabled: boolean;
  invoice_reminders: boolean;
  payment_confirmations: boolean;
  system_updates: boolean;
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  widgets: WidgetConfiguration[];
  layout: 'grid' | 'list' | 'custom';
}

export interface WidgetConfiguration {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'calendar';
  position: { x: number; y: number; w: number; h: number };
  settings: Record<string, any>;
  visible: boolean;
}

/**
 * Client/Customer entity
 */
export interface Client extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: Address;
  tax_code?: string;
  vat_number?: string;
  payment_terms: number; // days
  is_active: boolean;
  notes?: string;
  tags: string[];
  total_revenue: number;
  total_invoices: number;
  last_transaction?: string;
}

/**
 * Address structure
 */
export interface Address {
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

/**
 * Invoice entity
 */
export interface Invoice extends BaseEntity {
  client_id: string;
  client?: Client;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  payment_date?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  payments: Payment[];
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

/**
 * Invoice item
 */
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total: number;
  product_id?: string;
}

/**
 * Payment entity
 */
export interface Payment extends BaseEntity {
  invoice_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
  status: PaymentStatus;
}

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'credit_card'
  | 'paypal'
  | 'stripe'
  | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/**
 * Product/Service entity
 */
export interface Product extends BaseEntity {
  name: string;
  description?: string;
  price: number;
  currency: string;
  tax_rate: number;
  category_id?: string;
  sku?: string;
  is_active: boolean;
  inventory_tracked: boolean;
  stock_quantity?: number;
  unit: string;
}

/**
 * Document entity
 */
export interface Document extends BaseEntity {
  name: string;
  type: DocumentType;
  file_path: string;
  file_size: number;
  mime_type: string;
  client_id?: string;
  invoice_id?: string;
  is_public: boolean;
  expires_at?: string;
  tags: string[];
}

export type DocumentType = 'invoice' | 'receipt' | 'contract' | 'estimate' | 'other';

/**
 * Analytics data structures
 */
export interface AnalyticsMetrics {
  revenue: RevenueMetrics;
  clients: ClientMetrics;
  invoices: InvoiceMetrics;
  payments: PaymentMetrics;
}

export interface RevenueMetrics {
  total: number;
  period_change: number;
  monthly_trend: TrendDataPoint[];
  by_client: ClientRevenue[];
}

export interface ClientMetrics {
  total_active: number;
  new_this_period: number;
  churn_rate: number;
  top_clients: Client[];
}

export interface InvoiceMetrics {
  total_sent: number;
  total_paid: number;
  overdue_count: number;
  average_payment_time: number;
  status_distribution: StatusDistribution[];
}

export interface PaymentMetrics {
  total_collected: number;
  pending_amount: number;
  payment_methods: PaymentMethodStats[];
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ClientRevenue {
  client: Client;
  revenue: number;
  invoice_count: number;
}

export interface StatusDistribution {
  status: InvoiceStatus;
  count: number;
  percentage: number;
}

export interface PaymentMethodStats {
  method: PaymentMethod;
  count: number;
  total_amount: number;
}

/**
 * Calendar/Event types
 */
export interface CalendarEvent extends BaseEntity {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  client_id?: string;
  invoice_id?: string;
  type: EventType;
  status: EventStatus;
  location?: string;
  attendees: EventAttendee[];
  reminders: EventReminder[];
}

export type EventType = 'meeting' | 'deadline' | 'follow_up' | 'payment_due' | 'other';
export type EventStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed';

export interface EventAttendee {
  email: string;
  name?: string;
  status: 'pending' | 'accepted' | 'declined';
  is_organizer: boolean;
}

export interface EventReminder {
  type: 'email' | 'popup';
  minutes_before: number;
}

/**
 * Form validation types
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormState<T = any> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

/**
 * Chart data types
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartConfiguration {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  data: ChartDataPoint[];
  options: ChartOptions;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      display: boolean;
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    title: {
      display: boolean;
      text: string;
    };
  };
  scales?: Record<string, any>;
}
