// Centralized Type Exports for Better Developer Experience

// API and Business Logic Types
export * from './api';

// Component and UI Types
export * from './components';

// Utility Types
export * from './utils';

// Re-export commonly used React types for convenience
export type {
  ReactNode,
  ReactElement,
  ComponentProps,
  ComponentPropsWithoutRef,
  ElementType,
  FC,
  FunctionComponent,
  HTMLAttributes,
  HTMLProps,
  CSSProperties,
  MouseEvent,
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  RefObject,
  MutableRefObject,
} from 'react';

// Note: TypeScript utility types are globally available, no need to re-export

// Supabase types (if using Supabase)
export type { User, Session } from '@supabase/supabase-js';

// Common type combinations for convenience
export type {
  // API types
  ApiResponse,
  ApiError,
  PaginatedResponse,
  BaseEntity,

  // User and Auth types
  UserProfile,
  UserPreferences,

  // Business entity types
  Client,
  Invoice,
  InvoiceStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Product,
  Document,
  CalendarEvent,

  // Analytics types
  AnalyticsMetrics,
  TrendDataPoint,

    // Form types
  FormState,
  ValidationError,
} from './api';

export type {
  // Base component types
  BaseComponentProps,
  PolymorphicProps,
  
  // Form component types
  ButtonProps,
  InputProps,
  SelectOption,
  SelectProps,
  
  // UI component types
  ModalProps,
  TableColumn,
  TableProps,
  PaginationProps,
  ChartProps,
  DatePickerProps,
  FileUploadProps,
  CardProps,
  BadgeProps,
  TagProps,
  AlertProps,

  // Business component types
  ClientCardProps,
  ClientFormProps,
  InvoiceCardProps,
  InvoiceFormProps,
  PaymentModalProps,
  CalendarProps,
  EventModalProps,

  // Dashboard types
  KPICardProps,
  TrendData,

  // Layout types
  SidebarProps,
  SidebarItem,
  NavbarProps,
  NotificationItem,

  // UI state types
  LoadingProps,
  EmptyStateProps,
  ErrorBoundaryProps,

  // Theme types
  ThemeConfig,
  Breakpoint,
  ResponsiveValue,
} from './components';

export type {
  // Utility types
  AsyncFunction,
  SyncFunction,
  AnyFunction,
  EventHandler,
  AsyncEventHandler,
  PromiseValue,
  ArrayElement,
  ValueOf,

  // Type manipulation
  DeepPartial,
  PartialBy,
  RequiredBy,
  Brand,

  // String types
  Capitalize,
  Uncapitalize,

  // Object manipulation
  Merge,
  Override,

  // Branded types
  UserId,
  ClientId,
  InvoiceId,
  PaymentId,
  EventId,

  // API types
  ApiMethod,
  ApiRequestConfig,

  // Hook types
  UseStateReturn,
  UseEffectDeps,
  AsyncHookReturn,
  PaginatedHookReturn,
  FormHookReturn,

  // Storage types
  StorageItem,
  StorageKey,
  StorageValue,

  // Logging types
  LogLevel,
  LogEntry,

  // Performance types
  PerformanceMetric,

  // Theme utility types
  ColorScheme,
  ThemeSize,
  ThemeVariant,

  // Routing types
  RouteConfig,
  NavigationState,

  // Error types
  AppError,
  ErrorBoundaryFallback,

  // CRUD types
  CrudOperations,

  // Environment types
  Environment,
  EnvironmentConfig,

  // Feature flags
  FeatureFlag,
  FeatureFlagValue,
  FeatureFlags,
} from './utils';
