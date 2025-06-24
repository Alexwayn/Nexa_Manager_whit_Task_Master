import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@context/AuthContext';
import { ThemeProvider } from '@context/ThemeContext';
// import Navbar from '@components/Navbar'; // Commented out or removed
import ProtectedRoute from '@components/ProtectedRoute';
import Layout from '@components/Layout';
import Login from '@pages/Login';
import Dashboard from '@pages/Dashboard';
import Clients from '@pages/Clients';

import Calendar from '@pages/Calendar';
import Inventory from '@pages/Inventory';
import Invoices from '@pages/Invoices';
import Transactions from '@pages/Transactions';
import Analytics from '@pages/Analytics';
import Reports from '@pages/Reports';
import Settings from '@pages/Settings';
// Importiamo la pagina Preventivi (da creare)
import Quotes from '@pages/Quotes';
// Importiamo la pagina di Test per il debug
import Test from '@pages/Test';
// Import our new test route component
import TestRoute from '@components/TestRoute';
import ResetPassword from '@pages/ResetPassword';
// Import the TestDebug page
import TestDebug from '@pages/TestDebug';
// Import Email page
import Email from '@pages/Email';
import Documents from '@pages/Documents';
// Import TestAnalytics page
import TestAnalytics from '@pages/TestAnalytics';
// Import TestExport page
import TestExport from '@pages/TestExport';
import CalendarPage from '@pages/CalendarPage';
import RSVPPage from '@pages/RSVPPage';
import HelpCenter from '@pages/HelpCenter';
import Documentation from '@pages/Documentation';
import ApiReference from '@pages/ApiReference';
import SystemStatus from '@pages/SystemStatus';
import Security from '@pages/Security';
import Compliance from '@pages/Compliance';
import TermsOfService from '@pages/TermsOfService';
import LegalNotice from '@pages/LegalNotice';
import TaxAndPDFTest from '@pages/TaxAndPDFTest';
import ProfileForm from '@pages/ProfileForm';
import Scan from '@pages/Scan';
import Voice from '@pages/Voice';
import FloatingMicrophone from '@components/FloatingMicrophone';

import './index.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* <Navbar /> */} {/* Commented out or removed */}
            <Routes>
              {/* Login route doesn't use the main Layout */}
              <Route path="/login" element={<Login />} />

              {/* Password reset route - not protected */}
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* RSVP route - not protected */}
              <Route path="/rsvp/:token" element={<RSVPPage />} />

              {/* Test routes for debugging - not protected */}
              <Route path="/test-route" element={<TestRoute />} />
              <Route path="/test-debug" element={<TestDebug />} />
              <Route path="/test-analytics" element={<TestAnalytics />} />
              <Route path="/test-export" element={<TestExport />} />

              {/* Protected routes use the main Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/quotes" element={<Quotes />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/email" element={<Email />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="/voice" element={<Voice />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/calendar-page" element={<CalendarPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<ProfileForm />} />
                <Route path="/test" element={<Test />} />

                {/* Support & Documentation */}
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/api-reference" element={<ApiReference />} />
                <Route path="/system-status" element={<SystemStatus />} />
                <Route path="/security" element={<Security />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<LegalNotice />} />

                {/* Testing Routes */}
                <Route path="/test-analytics" element={<TestAnalytics />} />
                <Route path="/test-export" element={<TestExport />} />
                <Route path="/test-debug" element={<TestDebug />} />
                <Route path="/tax-pdf-test" element={<TaxAndPDFTest />} />

                {/* Default route for logged-in users */}
                {/* Redirect to dashboard if no other route matches */}
                <Route index element={<Dashboard />} />
                <Route path="*" element={<Dashboard />} />
              </Route>
            </Routes>
          </div>

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              // Define default options
              className: '',
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
              },
              // Default options for specific types
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
              loading: {
                duration: Infinity,
              },
            }}
          />

          {/* Global Floating Microphone - Available on all pages */}
          <FloatingMicrophone />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
