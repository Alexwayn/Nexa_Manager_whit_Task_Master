// Import all page components
import Dashboard from '@pages/Dashboard';
import Clients from '@pages/Clients';
import Calendar from '@pages/Calendar';
import Inventory from '@pages/Inventory';
import Invoices from '@pages/Invoices';
import Transactions from '@pages/Transactions';
import Analytics from '@pages/Analytics';
import Reports from '@pages/Reports';
import Settings from '@pages/Settings';
import Quotes from '@pages/Quotes';
import Test from '@pages/Test';
import Email from '@pages/Email';
import Documents from '@pages/Documents';
import CalendarPage from '@pages/CalendarPage';
import HelpCenter from '@pages/HelpCenter';
import Documentation from '@pages/Documentation';
import ApiReference from '@pages/ApiReference';
import SystemStatus from '@pages/SystemStatus';
import Security from '@pages/Security';
import Compliance from '@pages/Compliance';
import TermsOfService from '@pages/TermsOfService';
import LegalNotice from '@pages/LegalNotice';
import ProfileForm from '@pages/ProfileForm';
import Scan from '@pages/Scan';
import Voice from '@pages/Voice';

// Testing components
import TestRoute from '@components/TestRoute';
import TestDebug from '@pages/TestDebug';
import TestAnalytics from '@pages/TestAnalytics';
import TestExport from '@pages/TestExport';
import TaxAndPDFTest from '@pages/TaxAndPDFTest';

// Auth components
import Login from '@pages/Login';
import ResetPassword from '@pages/ResetPassword';
import RSVPPage from '@pages/RSVPPage';

/**
 * Public routes - accessible without authentication
 */
export const publicRoutes = [
  {
    path: '/login',
    element: Login,
    name: 'Login'
  },
  {
    path: '/reset-password', 
    element: ResetPassword,
    name: 'Reset Password'
  },
  {
    path: '/rsvp/:token',
    element: RSVPPage,
    name: 'RSVP'
  }
];

/**
 * Test routes - for debugging and development
 */
export const testRoutes = [
  {
    path: '/test-route',
    element: TestRoute,
    name: 'Test Route'
  },
  {
    path: '/test-debug',
    element: TestDebug,
    name: 'Test Debug'
  },
  {
    path: '/test-analytics',
    element: TestAnalytics,
    name: 'Test Analytics'
  },
  {
    path: '/test-export',
    element: TestExport,
    name: 'Test Export'
  }
];

/**
 * Main application routes - require authentication and use Layout
 */
export const mainRoutes = [
  {
    path: '/dashboard',
    element: Dashboard,
    name: 'Dashboard',
    category: 'main'
  },
  {
    path: '/clients',
    element: Clients,
    name: 'Clients',
    category: 'main'
  },
  {
    path: '/invoices',
    element: Invoices,
    name: 'Invoices',
    category: 'financial'
  },
  {
    path: '/quotes',
    element: Quotes,
    name: 'Quotes',
    category: 'financial'
  },
  {
    path: '/transactions',
    element: Transactions,
    name: 'Transactions',
    category: 'financial'
  },
  {
    path: '/inventory',
    element: Inventory,
    name: 'Inventory',
    category: 'business'
  },
  {
    path: '/analytics',
    element: Analytics,
    name: 'Analytics',
    category: 'reports'
  },
  {
    path: '/reports',
    element: Reports,
    name: 'Reports',
    category: 'reports'
  },
  {
    path: '/documents',
    element: Documents,
    name: 'Documents',
    category: 'business'
  },
  {
    path: '/email',
    element: Email,
    name: 'Email',
    category: 'communication'
  },
  {
    path: '/scan',
    element: Scan,
    name: 'Scan',
    category: 'tools'
  },
  {
    path: '/voice',
    element: Voice,
    name: 'Voice',
    category: 'tools'
  },
  {
    path: '/calendar',
    element: Calendar,
    name: 'Calendar',
    category: 'scheduling'
  },
  {
    path: '/calendar-page',
    element: CalendarPage,
    name: 'Calendar Page',
    category: 'scheduling'
  },
  {
    path: '/settings',
    element: Settings,
    name: 'Settings',
    category: 'account'
  },
  {
    path: '/profile',
    element: ProfileForm,
    name: 'Profile',
    category: 'account'
  },
  {
    path: '/test',
    element: Test,
    name: 'Test',
    category: 'development'
  }
];

/**
 * Support and documentation routes
 */
export const supportRoutes = [
  {
    path: '/help',
    element: HelpCenter,
    name: 'Help Center',
    category: 'support'
  },
  {
    path: '/documentation',
    element: Documentation,
    name: 'Documentation',
    category: 'support'
  },
  {
    path: '/api-reference',
    element: ApiReference,
    name: 'API Reference',
    category: 'support'
  },
  {
    path: '/system-status',
    element: SystemStatus,
    name: 'System Status',
    category: 'support'
  },
  {
    path: '/security',
    element: Security,
    name: 'Security',
    category: 'legal'
  },
  {
    path: '/compliance',
    element: Compliance,
    name: 'Compliance',
    category: 'legal'
  },
  {
    path: '/terms',
    element: TermsOfService,
    name: 'Terms of Service',
    category: 'legal'
  },
  {
    path: '/privacy',
    element: LegalNotice,
    name: 'Privacy Policy',
    category: 'legal'
  }
];

/**
 * Development and testing routes for protected area
 */
export const developmentRoutes = [
  {
    path: '/test-analytics',
    element: TestAnalytics,
    name: 'Test Analytics',
    category: 'development'
  },
  {
    path: '/test-export',
    element: TestExport,
    name: 'Test Export',
    category: 'development'
  },
  {
    path: '/test-debug',
    element: TestDebug,
    name: 'Test Debug',
    category: 'development'
  },
  {
    path: '/tax-pdf-test',
    element: TaxAndPDFTest,
    name: 'Tax PDF Test',
    category: 'development'
  }
];

/**
 * All protected routes (require authentication and Layout)
 */
export const protectedRoutes = [
  ...mainRoutes,
  ...supportRoutes,
  ...developmentRoutes
];

/**
 * Default routes and redirects
 */
export const defaultRoutes = {
  index: Dashboard,
  fallback: Dashboard
};

/**
 * Get routes by category
 */
export const getRoutesByCategory = (category) => {
  return protectedRoutes.filter(route => route.category === category);
};

/**
 * Get route by path
 */
export const getRouteByPath = (path) => {
  const allRoutes = [...publicRoutes, ...testRoutes, ...protectedRoutes];
  return allRoutes.find(route => route.path === path);
}; 