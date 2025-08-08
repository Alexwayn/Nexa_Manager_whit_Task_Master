// Mock for @shared/components
import React from 'react';

// Mock all the shared components with simple implementations
export const Badge = ({ children, ...props }) => <span {...props}>{children}</span>;
export const Button = ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>;
export const Card = ({ children, ...props }) => <div {...props}>{children}</div>;
export const CardContent = ({ children, ...props }) => <div {...props}>{children}</div>;
export const CardHeader = ({ children, ...props }) => <div {...props}>{children}</div>;
export const CardTitle = ({ children, ...props }) => <h3 {...props}>{children}</h3>;
export const CardDescription = ({ children, ...props }) => <p {...props}>{children}</p>;
export const CardFooter = ({ children, ...props }) => <div {...props}>{children}</div>;
export const StatCard = ({ children, ...props }) => <div {...props}>{children}</div>;
export const Checkbox = ({ children, ...props }) => <input type="checkbox" {...props} />;
export const Input = ({ ...props }) => <input {...props} />;
export const Textarea = ({ ...props }) => <textarea {...props} />;
export const Select = ({ children, ...props }) => <select {...props}>{children}</select>;
export const SelectTrigger = ({ children, ...props }) => <div {...props}>{children}</div>;
export const SelectContent = ({ children, ...props }) => <div {...props}>{children}</div>;
export const SelectItem = ({ children, ...props }) => <option {...props}>{children}</option>;
export const SelectValue = ({ children, ...props }) => <span {...props}>{children}</span>;
export const Spacing = ({ children, ...props }) => <div {...props}>{children}</div>;
export const Typography = ({ children, ...props }) => <span {...props}>{children}</span>;
export const Alert = ({ children, ...props }) => <div {...props}>{children}</div>;
export const AlertDescription = ({ children, ...props }) => <p {...props}>{children}</p>;
export const AlertTitle = ({ children, ...props }) => <h4 {...props}>{children}</h4>;
export const Calendar = ({ ...props }) => <div {...props}>Calendar</div>;
export const DatePickerWithRange = ({ ...props }) => <div {...props}>DatePicker</div>;
export const Popover = ({ children, ...props }) => <div {...props}>{children}</div>;
export const Progress = ({ ...props }) => <div {...props}>Progress</div>;
export const Tabs = ({ children, ...props }) => <div {...props}>{children}</div>;
export const TabsList = ({ children, ...props }) => <div {...props}>{children}</div>;
export const TabsTrigger = ({ children, ...props }) => <button {...props}>{children}</button>;
export const TabsContent = ({ children, ...props }) => <div {...props}>{children}</div>;
export const Footer = ({ children, ...props }) => <footer {...props}>{children}</footer>;

// Error Boundary mocks
export const ErrorBoundary = ({ children, fallback, onError, ...props }) => {
  return <div {...props}>{children}</div>;
};

export const withErrorBoundary = (Component) => {
  return (props) => <Component {...props} />;
};

export const ChartErrorFallback = ({ error, retry }) => (
  <div>Chart Error: {error?.message}</div>
);

export const useErrorHandler = () => {
  return (error) => {
    console.error('Error:', error);
  };
};

export const SentryErrorBoundary = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const ComponentErrorBoundary = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const LoadingSkeleton = ({ ...props }) => <div {...props}>Loading...</div>;
export const ConfirmationDialog = ({ children, ...props }) => <div {...props}>{children}</div>;
export const Modal = ({ children, ...props }) => <div {...props}>{children}</div>;
export const ConfirmationModal = ({ children, ...props }) => <div {...props}>{children}</div>;
export const TestRoute = ({ children, ...props }) => <div {...props}>{children}</div>;

// Default export
const defaultExport = {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  StatCard,
  Checkbox,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Spacing,
  Typography,
  Alert,
  AlertDescription,
  AlertTitle,
  Calendar,
  DatePickerWithRange,
  Popover,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Footer,
  ErrorBoundary,
  withErrorBoundary,
  ChartErrorFallback,
  useErrorHandler,
  SentryErrorBoundary,
  ComponentErrorBoundary,
  LoadingSkeleton,
  ConfirmationDialog,
  Modal,
  ConfirmationModal,
  TestRoute
};

export default defaultExport;
