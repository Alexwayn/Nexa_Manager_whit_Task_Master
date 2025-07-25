// Authentication Feature - Public API

// Components
export { default as OrganizationProtectedRoute } from './components/OrganizationProtectedRoute';
export { default as ProtectedRoute } from './components/ProtectedRoute';
export { default as UnauthorizedAccess } from './components/UnauthorizedAccess';
export { withAuth } from './components/withAuth';

// Hooks
export { useClerkAuth } from './hooks/useClerkAuth.js';
export { useAuthGuard } from './hooks/useAuthGuard';

// Services
export { default as authService } from './services/authService.js';
export { clerkSupabaseIntegration } from './services/clerkSupabaseIntegration.js';
export { default as securityService } from './services/securityService.js';

// Re-export types if any
export type * from './services/authService.js';
export type * from './services/clerkSupabaseIntegration.js';
export type * from './services/securityService.js';