// Shared Hooks Public API
// This file exports all shared hooks that can be used across features

// Authentication Hooks
export { AuthProvider, useAuth } from './AuthContext.tsx';
export { 
  OptimizedAuthProvider,
  useUser,
  useAuthState,
  useAuthActions
} from './OptimizedAuthContext.tsx';

// Organization Hooks
export { useOrganizationContext } from './OrganizationContext.jsx';

// Email Hooks
export { EmailProvider } from './EmailContext.jsx';

// Theme Hooks - Optimized Theme Context
export { 
  OptimizedThemeProvider,
  useThemeState,
  useThemeActions,
  useOptimizedTheme,
  useIsDarkTheme,
  useThemeToggle,
  useCurrentTheme
} from './OptimizedThemeContext.jsx';

// Theme Hooks - Standard Theme Context
export { 
  ThemeProvider,
  useTheme,
  themes as themeConstants,
  fontSizes,
  colorBlindnessModes,
  getThemeColors,
  getAccessibilityClass
} from './ThemeContext.jsx';

// Utility Hooks
export * from './use-toast.js';
export { default as useDebounce } from './useDebounce.ts';
export { default as useIntersectionObserver } from './useIntersectionObserver.js';
export * from './useTranslation.js';

// Providers
export * from './providers.ts';