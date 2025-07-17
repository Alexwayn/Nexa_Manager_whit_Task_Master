// Component Props and UI-specific Types

import { ReactNode, ComponentPropsWithoutRef, ElementType } from 'react';
import { Client, Invoice, Payment, CalendarEvent, ChartConfiguration } from './api';

/**
 * Common props for all components
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

/**
 * Polymorphic component props
 */
export type PolymorphicProps<T extends ElementType> = {
  as?: T;
} & ComponentPropsWithoutRef<T>;

/**
 * Button component variants and sizes
 */
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Input field props
 */
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  label?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

/**
 * Select/Dropdown props
 */
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface SelectProps extends BaseComponentProps {
  options: SelectOption[];
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  error?: string;
  label?: string;
  onChange?: (value: string | number | (string | number)[]) => void;
}

/**
 * Modal component props
 */
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  hideCloseButton?: boolean;
  footer?: ReactNode;
  centered?: boolean;
}

/**
 * Table component types
 */
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  width?: number | string;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationProps;
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  selectedRows?: string[];
  onSelectionChange?: (selectedKeys: string[]) => void;
  emptyText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  onChange?: (page: number, pageSize: number) => void;
}

/**
 * Chart component props
 */
export interface ChartProps extends BaseComponentProps {
  config: ChartConfiguration;
  height?: number;
  width?: number;
  loading?: boolean;
  error?: string;
  onDataPointClick?: (dataPoint: any, index: number) => void;
}

/**
 * Date picker props
 */
export interface DatePickerProps extends BaseComponentProps {
  value?: Date | string;
  defaultValue?: Date | string;
  format?: string;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
  range?: boolean;
  onChange?: (date: Date | Date[] | null) => void;
}

/**
 * File upload props
 */
export interface FileUploadProps extends BaseComponentProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  onUpload?: (files: File[]) => void;
  onError?: (error: string) => void;
  progress?: number;
  uploading?: boolean;
}

/**
 * Card component props
 */
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  extra?: ReactNode;
  footer?: ReactNode;
  bordered?: boolean;
  hoverable?: boolean;
  loading?: boolean;
  actions?: ReactNode[];
}

/**
 * Badge/Tag props
 */
export interface BadgeProps extends BaseComponentProps {
  count?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  dot?: boolean;
  showZero?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface TagProps extends BaseComponentProps {
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  variant?: 'filled' | 'outline' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  closable?: boolean;
  onClose?: () => void;
}

/**
 * Alert/Notification props
 */
export interface AlertProps extends BaseComponentProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  description?: string;
  closable?: boolean;
  onClose?: () => void;
  action?: ReactNode;
  icon?: ReactNode;
}

/**
 * Client-specific component props
 */
export interface ClientCardProps extends BaseComponentProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
  onView?: (client: Client) => void;
  compact?: boolean;
  showActions?: boolean;
}

export interface ClientFormProps extends BaseComponentProps {
  initialData?: Partial<Client>;
  onSubmit?: (data: Client) => void;
  onCancel?: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

/**
 * Invoice-specific component props
 */
export interface InvoiceCardProps extends BaseComponentProps {
  invoice: Invoice;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onView?: (invoice: Invoice) => void;
  onMarkPaid?: (invoice: Invoice) => void;
  onSend?: (invoice: Invoice) => void;
  compact?: boolean;
  showActions?: boolean;
}

export interface InvoiceFormProps extends BaseComponentProps {
  initialData?: Partial<Invoice>;
  clients?: Client[];
  onSubmit?: (data: Invoice) => void;
  onCancel?: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

/**
 * Payment-specific component props
 */
export interface PaymentModalProps extends ModalProps {
  invoice?: Invoice;
  payment?: Payment;
  onSubmit?: (data: Payment) => void;
  loading?: boolean;
}

/**
 * Calendar-specific component props
 */
export interface CalendarProps extends BaseComponentProps {
  events: CalendarEvent[];
  view?: 'month' | 'week' | 'day';
  date?: Date;
  onDateChange?: (date: Date) => void;
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventCreate?: (event: Partial<CalendarEvent>) => void;
  editable?: boolean;
}

export interface EventModalProps extends ModalProps {
  event?: CalendarEvent;
  clients?: Client[];
  onSubmit?: (data: CalendarEvent) => void;
  loading?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

/**
 * Dashboard-specific component props
 */
export interface KPICardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: ReactNode;
  loading?: boolean;
  trend?: TrendData[];
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface TrendData {
  label: string;
  value: number;
}

/**
 * Layout component props
 */
export interface SidebarProps extends BaseComponentProps {
  collapsed?: boolean;
  onToggle?: () => void;
  items: SidebarItem[];
  activeItem?: string;
  onItemClick?: (item: SidebarItem) => void;
}

export interface SidebarItem {
  key: string;
  label: string;
  icon?: ReactNode;
  path?: string;
  children?: SidebarItem[];
  badge?: number;
  disabled?: boolean;
}

export interface NavbarProps extends BaseComponentProps {
  title?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
  onProfileClick?: () => void;
  notifications?: NotificationItem[];
  onNotificationClick?: (notification: NotificationItem) => void;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Form-specific component props
 */
export interface FormFieldProps extends BaseComponentProps {
  name: string;
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  touched?: boolean;
}

export interface FormSectionProps extends BaseComponentProps {
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

/**
 * Loading and Error states
 */
export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  overlay?: boolean;
}

export interface EmptyStateProps extends BaseComponentProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

/**
 * Theme and styling
 */
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    light: string;
    dark: string;
  };
  spacing: Record<string, string>;
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
  };
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

/**
 * Responsive breakpoints
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}
