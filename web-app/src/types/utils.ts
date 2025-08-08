// Utility Types

/**
 * Function types
 */
export type AsyncFunction<T = any, R = any> = (...args: T[]) => Promise<R>;
export type SyncFunction<T = any, R = any> = (...args: T[]) => R;
export type AnyFunction = (...args: any[]) => any;

/**
 * Event handler types
 */
export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

/**
 * Promise utility types
 */
export type PromiseValue<T> = T extends Promise<infer U> ? U : T;

/**
 * Array utility types
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

/**
 * Object utility types
 */
export type ValueOf<T> = T[keyof T];

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Partial by specific keys
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Required by specific keys
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Brand type for type safety
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * String manipulation types
 */
export type Capitalize<S extends string> = S extends `${infer F}${infer R}` 
  ? `${Uppercase<F>}${R}` 
  : S;

export type Uncapitalize<S extends string> = S extends `${infer F}${infer R}` 
  ? `${Lowercase<F>}${R}` 
  : S;

/**
 * Object manipulation types
 */
export type Merge<T, U> = Omit<T, keyof U> & U;

export type Override<T, U> = Omit<T, keyof U> & U;

/**
 * Branded ID types for type safety
 */
export type UserId = Brand<string, 'UserId'>;
export type ClientId = Brand<string, 'ClientId'>;
export type InvoiceId = Brand<string, 'InvoiceId'>;
export type PaymentId = Brand<string, 'PaymentId'>;
export type EventId = Brand<string, 'EventId'>;

/**
 * API utility types
 */
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestConfig {
  method: ApiMethod;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

/**
 * React Hook utility types
 */
export type UseStateReturn<T> = [T, (value: T | ((prev: T) => T)) => void];

export type UseEffectDeps = React.DependencyList;

export interface AsyncHookReturn<T, E = Error> {
  data: T | null;
  loading: boolean;
  error: E | null;
  refetch: () => Promise<void>;
}

export interface PaginatedHookReturn<T> extends AsyncHookReturn<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  loadMore: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

export interface FormHookReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  setTouched: <K extends keyof T>(field: K, touched: boolean) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => void;
  reset: (values?: Partial<T>) => void;
}

/**
 * Storage utility types
 */
export interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  expiry?: number;
}

export type StorageKey = string;
export type StorageValue = any;

/**
 * Logging utility types
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  error?: Error;
}

/**
 * Performance utility types
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Theme utility types
 */
export type ColorScheme = 'light' | 'dark' | 'system';
export type ThemeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ThemeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * Routing utility types
 */
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  roles?: string[];
  title?: string;
  meta?: Record<string, any>;
}

export interface NavigationState {
  currentPath: string;
  previousPath?: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

/**
 * Error utility types
 */
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
  timestamp: number;
}

export type ErrorBoundaryFallback = React.ComponentType<{
  error: Error;
  resetError: () => void;
}>;

/**
 * CRUD utility types
 */
export interface CrudOperations<T> {
  create: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T>;
  read: (id: string) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
  list: (params?: any) => Promise<T[]>;
}

/**
 * Environment utility types
 */
export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  NODE_ENV: Environment;
  API_URL: string;
  APP_URL: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  [key: string]: string | undefined;
}

/**
 * Feature flag utility types
 */
export type FeatureFlagValue = boolean | string | number | object;

export interface FeatureFlag {
  key: string;
  value: FeatureFlagValue;
  enabled: boolean;
  description?: string;
  conditions?: Array<{
    property: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }>;
}

export type FeatureFlags = Record<string, FeatureFlag>;
