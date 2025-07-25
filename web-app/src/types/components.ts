// Component and UI Types

import { ReactNode, ComponentProps, HTMLAttributes } from 'react';

/**
 * Base component props
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}

/**
 * Polymorphic component props
 */
export type PolymorphicProps<T extends React.ElementType> = {
  as?: T;
} & ComponentProps<T>;

/**
 * Button component props
 */
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Input component props
 */
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  onChange?: (value: string) => void;
}

/**
 * Select option
 */
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

/**
 * Select component props
 */
export interface SelectProps extends BaseComponentProps {
  options: SelectOption[];
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  multiple?: boolean;
  searchable?: boolean;
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
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

/**
 * Table column definition
 */
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Table component props
 */
export interface TableProps<T = any> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
}

/**
 * Pagination component props
 */
export interface PaginationProps extends BaseComponentProps {
  current: number;
  total: number;
  pageSize: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  onChange: (page: number, pageSize: number) => void;
}

/**
 * Chart component props
 */
export interface ChartProps extends BaseComponentProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  data: any;
  options?: any;
  height?: number;
  width?: number;
}

/**
 * Date picker component props
 */
export interface DatePickerProps extends BaseComponentProps {
  value?: string | Date;
  defaultValue?: string | Date;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  format?: string;
  showTime?: boolean;
  range?: boolean;
  onChange?: (date: string | Date | [string | Date, string | Date]) => void;
}

/**
 * File upload component props
 */
export interface FileUploadProps extends BaseComponentProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  error?: string;
  label?: string;
  onChange?: (files: File[]) => void;
}

/**
 * Card component props
 */
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  hoverable?: boolean;
  bordered?: boolean;
}

/**
 * Badge component props
 */
export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

/**
 * Tag component props
 */
export interface TagProps extends BaseComponentProps {
  color?: string;
  closable?: boolean;
  onClose?: () => void;
}

/**
 * Alert component props
 */
export interface AlertProps extends BaseComponentProps {
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
  closable?: boolean;
  onClose?: () => void;
}

/**
 * Client card component props
 */
export interface ClientCardProps extends BaseComponentProps {
  client: {
    id: string;
    name: string;
    email: string;
    company?: string;
    status: string;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

/**
 * Client form component props
 */
export interface ClientFormProps extends BaseComponentProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
}

/**
 * Invoice card component props
 */
export interface InvoiceCardProps extends BaseComponentProps {
  invoice: {
    id: string;
    invoice_number: string;
    client_name: string;
    amount: number;
    status: string;
    due_date: string;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onPay?: (id: string) => void;
}

/**
 * Invoice form component props
 */
export interface InvoiceFormProps extends BaseComponentProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
}

/**
 * Payment modal component props
 */
export interface PaymentModalProps extends ModalProps {
  invoice: {
    id: string;
    invoice_number: string;
    amount: number;
    client_name: string;
  };
  onPayment: (data: any) => void;
}

/**
 * Calendar component props
 */
export interface CalendarProps extends BaseComponentProps {
  events: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    color?: string;
  }>;
  view?: 'month' | 'week' | 'day';
  onEventClick?: (event: any) => void;
  onDateClick?: (date: string) => void;
  onEventDrop?: (event: any, newDate: string) => void;
}

/**
 * Event modal component props
 */
export interface EventModalProps extends ModalProps {
  event?: any;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
}

/**
 * KPI card component props
 */
export interface KPICardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: ReactNode;
  color?: string;
}

/**
 * Trend data
 */
export interface TrendData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

/**
 * Sidebar component props
 */
export interface SidebarProps extends BaseComponentProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onToggle?: () => void;
}

/**
 * Sidebar item
 */
export interface SidebarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  path?: string;
  children?: SidebarItem[];
  badge?: string | number;
  active?: boolean;
}

/**
 * Navbar component props
 */
export interface NavbarProps extends BaseComponentProps {
  title?: string;
  user?: {
    name: string;
    avatar?: string;
    email: string;
  };
  notifications?: NotificationItem[];
  onUserMenuClick?: () => void;
  onNotificationClick?: (notification: NotificationItem) => void;
}

/**
 * Notification item
 */
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
 * Loading component props
 */
export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  overlay?: boolean;
}

/**
 * Empty state component props
 */
export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Error boundary component props
 */
export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

/**
 * Breakpoint
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Responsive value
 */
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;