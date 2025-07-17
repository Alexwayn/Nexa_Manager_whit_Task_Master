// Utility Types for Better Type Safety

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Non-nullable type
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Extract keys of specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Function type helpers
 */
export type AsyncFunction<T extends any[] = any[], R = any> = (...args: T) => Promise<R>;
export type SyncFunction<T extends any[] = any[], R = any> = (...args: T) => R;
export type AnyFunction<T extends any[] = any[], R = any> =
  | AsyncFunction<T, R>
  | SyncFunction<T, R>;

/**
 * Event handler types
 */
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

/**
 * Promise-related types
 */
export type PromiseValue<T> = T extends Promise<infer U> ? U : T;
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Array element type
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

/**
 * Object value types
 */
export type ValueOf<T> = T[keyof T];

/**
 * Conditional type helpers
 */
export type If<C extends boolean, T, F> = C extends true ? T : F;
export type Not<C extends boolean> = C extends true ? false : true;
export type And<A extends boolean, B extends boolean> = A extends true ? B : false;
export type Or<A extends boolean, B extends boolean> = A extends true ? true : B;

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
 * Union type helpers
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

export type LastOf<T> =
  UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? R : never;

/**
 * Tuple type helpers
 */
export type Head<T extends readonly any[]> = T extends readonly [any, ...any[]] ? T[0] : never;
export type Tail<T extends readonly any[]> = T extends readonly [any, ...infer U] ? U : [];
export type Last<T extends readonly any[]> = T extends readonly [...any[], infer U] ? U : never;

/**
 * Object manipulation types
 */
export type Merge<T, U> = Omit<T, keyof U> & U;
export type Override<T, U> = Omit<T, keyof U> & U;

/**
 * Brand types for type safety
 */
export type Brand<T, B> = T & { readonly __brand: B };

// Common branded types
export type UserId = Brand<string, 'UserId'>;
export type ClientId = Brand<string, 'ClientId'>;
export type InvoiceId = Brand<string, 'InvoiceId'>;
export type PaymentId = Brand<string, 'PaymentId'>;
export type EventId = Brand<string, 'EventId'>;

/**
 * API-related utility types
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
 * React Hook types
 */
export type UseStateReturn<T> = [T, React.Dispatch<React.SetStateAction<T>>];
export type UseEffectDeps = React.DependencyList | undefined;

/**
 * Custom hook return types
 */
export interface AsyncHookReturn<T, E = Error> {
  data: T | null;
  loading: boolean;
  error: E | null;
  refresh: () => Promise<void>;
}

export interface PaginatedHookReturn<T, E = Error> extends AsyncHookReturn<T[], E> {
  hasMore: boolean;
  loadMore: () => Promise<void>;
  total: number;
  page: number;
}

export interface FormHookReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => void;
  reset: () => void;
}

/**
 * Storage types
 */
export interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  expires?: number;
}

export type StorageKey = string;
export type StorageValue = string | number | boolean | object | null;

/**
 * Logger types
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  stack?: string;
}

/**
 * Performance types
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: number;
  context?: Record<string, any>;
}

/**
 * Theme types
 */
export type ColorScheme = 'light' | 'dark' | 'system';
export type ThemeSize = 'sm' | 'md' | 'lg';
export type ThemeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Routing types
 */
export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  protected?: boolean;
  roles?: string[];
  title?: string;
  meta?: Record<string, any>;
}

export type NavigationState = 'idle' | 'loading' | 'submitting';

/**
 * Error types
 */
export interface AppError {
  code: string;
  message: string;
  context?: Record<string, any>;
  timestamp: number;
  recoverable: boolean;
}

export type ErrorBoundaryFallback = React.ComponentType<{
  error: Error;
  resetErrorBoundary: () => void;
}>;

/**
 * Generic CRUD types
 */
export interface CrudOperations<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  create: (data: CreateData) => Promise<T>;
  read: (id: string) => Promise<T>;
  update: (id: string, data: UpdateData) => Promise<T>;
  delete: (id: string) => Promise<void>;
  list: (filters?: Record<string, any>) => Promise<T[]>;
}

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  API_URL: string;
  APP_ENV: Environment;
  DEBUG: boolean;
  VERSION: string;
  BUILD_TIME: string;
}

/**
 * Feature flag types
 */
export type FeatureFlag = string;
export type FeatureFlagValue = boolean | string | number | object;

export interface FeatureFlags {
  [key: FeatureFlag]: FeatureFlagValue;
}
