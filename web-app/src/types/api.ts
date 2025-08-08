// API and Business Logic Types

/**
 * Base entity interface for all database entities
 */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * User Profile
 */
export interface UserProfile extends BaseEntity {
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: 'admin' | 'user' | 'viewer';
  is_active: boolean;
  last_login?: string;
  preferences: UserPreferences;
}

/**
 * User Preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  dashboard: {
    layout: string;
    widgets: string[];
  };
}

/**
 * Client entity
 */
export interface Client extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  tax_id?: string;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  tags: string[];
}

/**
 * Invoice entity
 */
export interface Invoice extends BaseEntity {
  invoice_number: string;
  client_id: string;
  client?: Client;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string;
  issued_date: string;
  paid_date?: string;
  items: InvoiceItem[];
  notes?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

/**
 * Payment entity
 */
export interface Payment extends BaseEntity {
  invoice_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  processed_at?: string;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'paypal' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/**
 * Product entity
 */
export interface Product extends BaseEntity {
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  sku?: string;
  is_active: boolean;
  tax_rate?: number;
}

/**
 * Document entity
 */
export interface Document extends BaseEntity {
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  client_id?: string;
  invoice_id?: string;
  category: string;
  tags: string[];
  is_public: boolean;
}

/**
 * Calendar Event entity
 */
export interface CalendarEvent extends BaseEntity {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location?: string;
  client_id?: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  reminder_minutes?: number;
}

/**
 * Analytics Metrics
 */
export interface AnalyticsMetrics {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
  };
  clients: {
    total: number;
    active: number;
    new: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  payments: {
    total: number;
    thisMonth: number;
    avgProcessingTime: number;
  };
}

/**
 * Trend Data Point
 */
export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * Form State
 */
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

/**
 * Validation Error
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}
