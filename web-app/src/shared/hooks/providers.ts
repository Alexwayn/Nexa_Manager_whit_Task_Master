/**
 * State Management Providers
 * 
 * This module exports all context providers organized by domain.
 * Providers are organized to support feature-based architecture
 * while maintaining shared state management capabilities.
 */

// Authentication Providers
export { AuthProvider, useAuth } from './AuthContext';
export { 
  OptimizedAuthProvider, 
  useOptimizedAuth, 
  useUser, 
  useAuthState, 
  useAuthActions 
} from './OptimizedAuthContext';

// Theme Providers
export { ThemeProvider, useTheme } from './ThemeContext';
export { 
  OptimizedThemeProvider, 
  useOptimizedTheme, 
  useThemeState, 
  useThemeActions, 
  useIsDarkTheme, 
  useThemeToggle, 
  useCurrentTheme 
} from './OptimizedThemeContext';

// Email Providers
export { EmailProvider, useEmailContext } from './EmailContext';

// Organization Providers
export { OrganizationProvider, useOrganizationContext } from './OrganizationContext';
// TODO: Export useOrganizationFilter when OrganizationContext is converted to TypeScript

// Provider Types
export type { AuthContextType } from './AuthContext';
// TODO: Add proper TypeScript types for EmailContext and OrganizationContext

/**
 * Combined Provider Component
 * 
 * Combines all providers in the correct order for the application.
 * This ensures proper provider hierarchy and dependency management.
 */
import React from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { EmailProvider } from './EmailContext';
import { OrganizationProvider } from './OrganizationContext';

interface CombinedProvidersProps {
  children: React.ReactNode;
}

export const CombinedProviders: React.FC<CombinedProvidersProps> = ({ children }) => {
  return React.createElement(
    ThemeProvider,
    null,
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        OrganizationProvider,
        null,
        React.createElement(
          EmailProvider,
          null,
          children
        )
      )
    )
  );
};

/**
 * Provider Configuration
 * 
 * Configuration object for provider setup and initialization.
 */
export const providerConfig = {
  auth: {
    provider: 'supabase',
    features: ['session-recovery', 'avatar-management'],
  },
  theme: {
    defaultTheme: 'light',
    features: ['system-preference', 'accessibility'],
  },
  email: {
    features: ['real-time-sync', 'notifications'],
  },
  organization: {
    provider: 'clerk',
    features: ['multi-tenant', 'role-based-access'],
  },
};
