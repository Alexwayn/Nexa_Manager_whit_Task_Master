export interface TranslationOptions {
  defaultValue?: string;
  fallbackKey?: string;
  namespace?: string;
  [key: string]: any;
}

export interface UseTranslationOptions {
  lazy?: boolean;
  fallbackNamespace?: string;
  loadingText?: string;
  preloadComponents?: string[] | null;
}

export interface UseTranslationReturn {
  t: (key: string, options?: TranslationOptions) => string;
  format: (key: string, values?: Record<string, any>, options?: TranslationOptions) => string;
  tn: (namespace: string, key: string, options?: TranslationOptions) => string;
  exists: (key: string, options?: { namespace?: string }) => boolean;
  load: () => Promise<void>;
  loadNamespace: (namespace: string) => Promise<void>;
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  ready: boolean;
  language: string;
  changeLanguage: (language: string) => Promise<void>;
  i18n: any;
}

export declare function useTranslation(
  namespace?: string | string[],
  options?: UseTranslationOptions
): UseTranslationReturn;

export declare function useComponentTranslation(
  componentName: string,
  options?: UseTranslationOptions
): UseTranslationReturn;
