import { lazy } from 'react';

// Lazy load page components for automatic code splitting
// Main application pages
const Dashboard = lazy(() => import('@pages/Dashboard'));
const Clients = lazy(() => import('@pages/Clients'));
const Calendar = lazy(() => import('@pages/Calendar'));
const Inventory = lazy(() => import('@pages/Inventory'));
const Invoices = lazy(() => import('@pages/Invoices'));
const Transactions = lazy(() => import('@pages/Transactions'));
const Analytics = lazy(() => import('@pages/Analytics'));
const Reports = lazy(() => import('@pages/Reports'));
const Settings = lazy(() => import('@pages/Settings'));
const Quotes = lazy(() => import('@pages/Quotes'));
const Test = lazy(() => import('@pages/Test'));
const Email = lazy(() => import('@pages/Email'));
const Documents = lazy(() => import('@pages/Documents'));
const CalendarPage = lazy(() => import('@pages/CalendarPage'));
const HelpCenter = lazy(() => import('@pages/HelpCenter'));
const Documentation = lazy(() => import('@pages/Documentation'));
const ApiReference = lazy(() => import('@pages/ApiReference'));
const SystemStatus = lazy(() => import('@pages/SystemStatus'));
const Security = lazy(() => import('@pages/Security'));
const Compliance = lazy(() => import('@pages/Compliance'));
const TermsOfService = lazy(() => import('@pages/TermsOfService'));
const LegalNotice = lazy(() => import('@pages/LegalNotice'));
const ProfileForm = lazy(() => import('@pages/ProfileForm'));
const Scan = lazy(() => import('@pages/Scan'));
const Voice = lazy(() => import('@pages/Voice'));
const OrganizationManagement = lazy(() => import('@pages/OrganizationManagement'));
const EmailAnalyticsPage = lazy(() => import('@pages/EmailAnalyticsPage'));

// Testing components - also lazy loaded for better performance
const TestRoute = lazy(() => import('../components/shared/TestRoute'));
const TestDebug = lazy(() => import('@pages/TestDebug'));
const TestAnalytics = lazy(() => import('@pages/TestAnalytics'));
const TestExport = lazy(() => import('@pages/TestExport'));
const TaxAndPDFTest = lazy(() => import('@pages/TaxAndPDFTest'));

// Auth components - keep these immediately loaded as they're critical for app initialization
import Login from '@pages/Login';
import Register from '@pages/Register';
import Onboarding from '@pages/Onboarding';
import ResetPassword from '@pages/ResetPassword';
import RSVPPage from '@pages/RSVPPage';

/**
 * Public routes - accessible without authentication
 * Auth routes are not lazy loaded for better UX on initial load
 */
export const publicRoutes = [
  {
    path: '/login',
    element: Login,
    name: 'Login',
  },
  {
    path: '/register',
    element: Register,
    name: 'Register',
  },
  {
    path: '/reset-password',
    element: ResetPassword,
    name: 'Reset Password',
  },
  {
    path: '/rsvp/:token',
    element: RSVPPage,
    name: 'RSVP',
  },
];

/**
 * Test routes - for debugging and development
 * Lazy loaded to reduce main bundle size
 */
export const testRoutes = [
  {
    path: '/test-route',
    element: TestRoute,
    name: 'Test Route',
  },
  {
    path: '/test-debug',
    element: TestDebug,
    name: 'Test Debug',
  },
  {
    path: '/test-analytics',
    element: TestAnalytics,
    name: 'Test Analytics',
  },
  {
    path: '/test-export',
    element: TestExport,
    name: 'Test Export',
  },
  {
    path: '/tax-pdf-test',
    element: TaxAndPDFTest,
    name: 'Tax PDF Test',
  },
];

/**
 * Main application routes - require authentication and use Layout
 * All lazy loaded for optimal performance
 */
export const mainRoutes = [
  {
    path: '/dashboard',
    element: Dashboard,
    name: 'Dashboard',
    category: 'main',
  },
  {
    path: '/onboarding',
    element: Onboarding,
    name: 'Onboarding',
    category: 'account',
  },
  {
    path: '/clients',
    element: Clients,
    name: 'Clients',
    category: 'main',
  },
  {
    path: '/invoices',
    element: Invoices,
    name: 'Invoices',
    category: 'financial',
  },
  {
    path: '/quotes',
    element: Quotes,
    name: 'Quotes',
    category: 'financial',
  },
  {
    path: '/transactions',
    element: Transactions,
    name: 'Transactions',
    category: 'financial',
  },
  {
    path: '/inventory',
    element: Inventory,
    name: 'Inventory',
    category: 'business',
  },
  {
    path: '/analytics',
    element: Analytics,
    name: 'Analytics',
    category: 'reports',
    authConfig: {
      organizationRequired: true,
      requiredPermissions: ['view_analytics'],
    },
  },
  {
    path: '/reports',
    element: Reports,
    name: 'Reports',
    category: 'reports',
    authConfig: {
      organizationRequired: true,
      requiredPermissions: ['view_analytics', 'access_reports'],
    },
  },
  {
    path: '/documents',
    element: Documents,
    name: 'Documents',
    category: 'business',
  },
  {
    path: '/email',
    element: Email,
    name: 'Email',
    category: 'communication',
  },
  {
    path: '/email/analytics',
    element: EmailAnalyticsPage,
    name: 'Email Analytics',
    category: 'communication',
    authConfig: {
      organizationRequired: true,
      requiredPermissions: ['view_analytics'],
    },
  },
  {
    path: '/scan',
    element: Scan,
    name: 'Scan',
    category: 'tools',
  },
  {
    path: '/voice',
    element: Voice,
    name: 'Voice',
    category: 'tools',
  },
  {
    path: '/calendar',
    element: Calendar,
    name: 'Calendar',
    category: 'scheduling',
  },
  {
    path: '/calendar-page',
    element: CalendarPage,
    name: 'Calendar Page',
    category: 'scheduling',
  },
  {
    path: '/settings',
    element: Settings,
    name: 'Settings',
    category: 'account',
  },
  {
    path: '/organization',
    element: OrganizationManagement,
    name: 'Organization',
    category: 'account',
    authConfig: {
      adminOnly: true,
      organizationRequired: true,
    },
  },
  {
    path: '/profile',
    element: ProfileForm,
    name: 'Profile',
    category: 'account',
  },
  {
    path: '/test',
    element: Test,
    name: 'Test',
    category: 'development',
  },
];

/**
 * Support and documentation routes
 * Lazy loaded as they're accessed less frequently
 */
export const supportRoutes = [
  {
    path: '/help',
    element: HelpCenter,
    name: 'Help Center',
    category: 'support',
  },
  {
    path: '/documentation',
    element: Documentation,
    name: 'Documentation',
    category: 'support',
  },
  {
    path: '/api-reference',
    element: ApiReference,
    name: 'API Reference',
    category: 'support',
  },
  {
    path: '/system-status',
    element: SystemStatus,
    name: 'System Status',
    category: 'support',
  },
  {
    path: '/security',
    element: Security,
    name: 'Security',
    category: 'legal',
  },
  {
    path: '/compliance',
    element: Compliance,
    name: 'Compliance',
    category: 'legal',
  },
  {
    path: '/terms',
    element: TermsOfService,
    name: 'Terms of Service',
    category: 'legal',
  },
  {
    path: '/legal',
    element: LegalNotice,
    name: 'Legal Notice',
    category: 'legal',
  },
];

/**
 * All protected routes combined
 */
export const protectedRoutes = [...mainRoutes, ...supportRoutes];

/**
 * Default routes for the application
 */
export const defaultRoutes = {
  index: Dashboard,
  fallback: Dashboard,
};

/**
 * Utility functions for route management
 */

/**
 * Get all routes by category
 */
export const getRoutesByCategory = category => {
  return protectedRoutes.filter(route => route.category === category);
};

/**
 * Find route by path
 */
export const getRouteByPath = path => {
  const allRoutes = [...publicRoutes, ...testRoutes, ...protectedRoutes];
  return allRoutes.find(route => route.path === path);
};

/**
 * Get all available categories
 */
export const getCategories = () => {
  const categories = new Set(protectedRoutes.map(route => route.category));
  return Array.from(categories);
};
