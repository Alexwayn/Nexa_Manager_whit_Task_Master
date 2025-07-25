// Shared Components Public API
// This file exports all shared components that can be used across features

// UI Components
export * from './ui';

// Layout Components
export { default as Footer } from './layout/Footer';

// Feedback Components
export { default as ErrorBoundary } from './feedback/ErrorBoundary';
export { default as ComponentErrorBoundary } from './feedback/ComponentErrorBoundary';
export { default as LoadingSkeleton } from './feedback/LoadingSkeleton';
export { default as ConfirmationDialog } from './feedback/ConfirmationDialog';
export { default as Modal } from './feedback/Modal';
export { default as ConfirmationModal } from './feedback/ConfirmationModal';

// Form Components
// (To be added as form components are identified and moved)

// Re-export commonly used types
export type { ComponentProps, ReactNode } from 'react';