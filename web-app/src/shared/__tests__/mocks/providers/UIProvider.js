/**
 * UI Provider Mock for Tests
 * Provides UI context for testing components that use UI functionality like toasts, modals, etc.
 */

import React from 'react';

// Mock toast functions
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  promise: jest.fn(),
  custom: jest.fn()
};

// Mock UI state
const mockUIState = {
  isLoading: false,
  modals: {},
  notifications: [],
  sidebar: {
    isOpen: false,
    isCollapsed: false
  }
};

// Mock UI actions
const mockUIActions = {
  showModal: jest.fn(),
  hideModal: jest.fn(),
  toggleModal: jest.fn(),
  showNotification: jest.fn(),
  hideNotification: jest.fn(),
  clearNotifications: jest.fn(),
  setLoading: jest.fn(),
  toggleSidebar: jest.fn(),
  setSidebarCollapsed: jest.fn()
};

const mockUIValue = {
  ...mockUIState,
  ...mockUIActions,
  toast: mockToast
};

/**
 * Test UI Provider with mock UI context
 * Use this for testing components that use UI functionality
 */
export const TestUIProvider = ({ 
  children, 
  isLoading = false,
  customValues = {}
}) => {
  const uiValue = {
    ...mockUIValue,
    isLoading,
    ...customValues
  };

  // Mock the UI context
  const MockUIContext = React.createContext(uiValue);
  
  return (
    <MockUIContext.Provider value={uiValue}>
      {children}
    </MockUIContext.Provider>
  );
};

/**
 * Toast Provider mock for react-hot-toast
 * Use this for testing components that use toast notifications
 */
export const TestToastProvider = ({ children }) => {
  // Mock Toaster component from react-hot-toast
  const MockToaster = () => null;
  
  return (
    <>
      {children}
      <MockToaster />
    </>
  );
};

/**
 * Modal Provider mock for testing modal functionality
 */
export const TestModalProvider = ({ 
  children, 
  modals = {},
  onShowModal = jest.fn(),
  onHideModal = jest.fn()
}) => {
  const modalValue = {
    modals,
    showModal: onShowModal,
    hideModal: onHideModal,
    toggleModal: jest.fn(),
    isModalOpen: (modalId) => !!modals[modalId]
  };

  const MockModalContext = React.createContext(modalValue);
  
  return (
    <MockModalContext.Provider value={modalValue}>
      {children}
    </MockModalContext.Provider>
  );
};

/**
 * Notification Provider mock for testing notification functionality
 */
export const TestNotificationProvider = ({ 
  children, 
  notifications = [],
  onShowNotification = jest.fn(),
  onHideNotification = jest.fn()
}) => {
  const notificationValue = {
    notifications,
    showNotification: onShowNotification,
    hideNotification: onHideNotification,
    clearNotifications: jest.fn()
  };

  const MockNotificationContext = React.createContext(notificationValue);
  
  return (
    <MockNotificationContext.Provider value={notificationValue}>
      {children}
    </MockNotificationContext.Provider>
  );
};

/**
 * Combined UI Provider with all UI contexts
 */
export const TestCombinedUIProvider = ({ 
  children,
  uiProps = {},
  modalProps = {},
  notificationProps = {}
}) => {
  return (
    <TestUIProvider {...uiProps}>
      <TestModalProvider {...modalProps}>
        <TestNotificationProvider {...notificationProps}>
          <TestToastProvider>
            {children}
          </TestToastProvider>
        </TestNotificationProvider>
      </TestModalProvider>
    </TestUIProvider>
  );
};

// Export mock UI hooks
export const mockUseUI = () => mockUIValue;
export const mockUseToast = () => mockToast;
export const mockUseModal = () => ({
  modals: mockUIState.modals,
  showModal: mockUIActions.showModal,
  hideModal: mockUIActions.hideModal,
  toggleModal: mockUIActions.toggleModal
});

// Export default provider
export default TestUIProvider;