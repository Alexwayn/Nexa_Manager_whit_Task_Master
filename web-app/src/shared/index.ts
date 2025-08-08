// Shared Module Public API
// This file exports all shared utilities, components, hooks, and configurations

// Export components
export * from './components';

// Export hooks
export * from './hooks';

// Export utilities
export * from './utils';

// Export types
export * from './types';

// Export constants (with alias for BREAKPOINTS to avoid conflict)
export * from './constants';

// Export services
export * from './services';

// Export styles (with alias for BREAKPOINTS to avoid conflict)
export {
  THEME_COLORS,
  SPACING,
  BREAKPOINTS as STYLE_BREAKPOINTS
} from './styles';

// Export types separately for isolated modules
export type { CSSProperties } from 'react';
