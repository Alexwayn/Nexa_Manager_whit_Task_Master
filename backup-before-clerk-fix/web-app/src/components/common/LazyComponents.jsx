import { lazy } from 'react';

// Lazy load heavy components for better performance
// These components will be loaded only when needed

// Analytics and Dashboard Components
export const AnalyticsDashboard = lazy(() => import('../AnalyticsDashboard'));
export const AdvancedFinancialAnalytics = lazy(() => import('../AdvancedFinancialAnalytics'));
export const FinancialForecast = lazy(() => import('../FinancialForecast'));

// Document Management Components
export const DocumentManager = lazy(() => import('../DocumentManager'));
export const DocumentSharing = lazy(() => import('../DocumentSharing'));
export const PDFGenerator = lazy(() => import('../PDFGenerator'));

// Quote and Invoice Management
export const QuoteTemplateManager = lazy(() => import('../QuoteTemplateManager'));
export const QuoteLifecycleManager = lazy(() => import('../QuoteLifecycleManager'));
export const QuoteToInvoiceConverter = lazy(() => import('../QuoteToInvoiceConverter'));
export const QuoteEmailSender = lazy(() => import('../QuoteEmailSender'));

// Client Management Heavy Components
export const ClientHistoryView = lazy(() => import('../ClientHistoryView'));
export const ClientImportExport = lazy(() => import('../ClientImportExport'));
export const ClientSearchFilter = lazy(() => import('../ClientSearchFilter'));

// Email and Communication
export const EmailManager = lazy(() => import('../EmailManager'));

// Calendar and Events
export const Calendar = lazy(() => import('../Calendar'));
export const EventModal = lazy(() => import('../EventModal'));

// Payment and Billing
export const PaymentDashboard = lazy(() => import('../PaymentDashboard'));
export const PaymentModal = lazy(() => import('../PaymentModal'));

// Receipt Management
export const ReceiptUpload = lazy(() => import('../ReceiptUpload'));
export const ReceiptUploadDemo = lazy(() => import('../ReceiptUploadDemo'));

// Advanced Tools
export const TaxCalculator = lazy(() => import('../TaxCalculator'));
export const AdvancedTimePeriodSelector = lazy(() => import('../AdvancedTimePeriodSelector'));
export const DashboardLayoutManager = lazy(() => import('../DashboardLayoutManager'));

// Example usage patterns:
/*
// Basic lazy loading with LazyWrapper
import LazyWrapper from '@components/common/LazyWrapper';
import { AnalyticsDashboard } from '@components/common/LazyComponents';

const MyComponent = () => (
  <LazyWrapper loadingMessage="Caricamento dashboard analytics..." loadingSize="large">
    <AnalyticsDashboard />
  </LazyWrapper>
);

// Advanced lazy loading with custom error handling
import ErrorBoundary from '@components/common/ErrorBoundary';
import { DocumentManager } from '@components/common/LazyComponents';

const DocumentSection = () => (
  <ErrorBoundary
    title="Errore nel caricamento documenti"
    message="Non è possibile caricare il gestore documenti."
  >
    <Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 rounded"></div>}>
      <DocumentManager />
    </Suspense>
  </ErrorBoundary>
);

// Route-based code splitting example
import { Routes, Route } from 'react-router-dom';
import { QuoteTemplateManager } from '@components/common/LazyComponents';

const AppRoutes = () => (
  <Routes>
    <Route 
      path="/quotes/templates" 
      element={
        <LazyWrapper loadingMessage="Caricamento gestione template..." loadingSize="large">
          <QuoteTemplateManager />
        </LazyWrapper>
      } 
    />
  </Routes>
);
*/

export default {
  AnalyticsDashboard,
  AdvancedFinancialAnalytics,
  FinancialForecast,
  DocumentManager,
  DocumentSharing,
  PDFGenerator,
  QuoteTemplateManager,
  QuoteLifecycleManager,
  QuoteToInvoiceConverter,
  QuoteEmailSender,
  ClientHistoryView,
  ClientImportExport,
  ClientSearchFilter,
  EmailManager,
  Calendar,
  EventModal,
  PaymentDashboard,
  PaymentModal,
  ReceiptUpload,
  ReceiptUploadDemo,
  TaxCalculator,
  AdvancedTimePeriodSelector,
  DashboardLayoutManager,
};
