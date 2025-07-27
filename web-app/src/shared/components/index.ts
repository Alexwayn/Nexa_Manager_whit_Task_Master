// Shared Components Public API
// This file exports all shared components that can be used across features

// UI Components
export { default as Badge } from './Badge.jsx';
export { default as Button } from './Button.jsx';
export { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter, StatCard } from './Card.jsx';
export { default as Checkbox } from './Checkbox.jsx';
export { default as Input, Textarea } from './Input.jsx';
export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './Select.jsx';
export { default as Spacing } from './Spacing.jsx';
export { default as Typography } from './Typography.jsx';
export { Alert, AlertDescription, AlertTitle } from './alert.jsx';
export { default as Calendar } from './calendar.jsx';
export { DatePickerWithRange } from './date-picker.jsx';
export { default as Popover } from './popover.jsx';
export { Progress } from './progress.jsx';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs.jsx';

// Layout Components
export { default as Footer } from './Footer.jsx';

// Feedback Components
export { default as ErrorBoundary } from './ErrorBoundary.jsx';
export { ChartErrorFallback } from './ErrorBoundary.jsx';
export { default as ComponentErrorBoundary } from './ComponentErrorBoundary.jsx';
export { default as LoadingSkeleton } from './LoadingSkeleton.jsx';
export { default as ConfirmationDialog } from './ConfirmationDialog.jsx';
export { default as Modal } from './Modal.jsx';
export { default as ConfirmationModal } from './ConfirmationModal.jsx';

// Test Components
export { default as TestRoute } from './TestRoute.jsx';

// Re-export commonly used types
export type { ComponentProps, ReactNode } from 'react';