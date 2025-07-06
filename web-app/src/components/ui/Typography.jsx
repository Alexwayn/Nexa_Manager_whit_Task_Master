import React from 'react';
import { cn } from '@utils/cn';

// Heading component with semantic variants
export const Heading = ({ 
  as: Component = 'h1', 
  variant = 'page-title', 
  className, 
  children, 
  ...props 
}) => {
  const variants = {
    'page-title': 'text-page-title text-primary',
    'page-subtitle': 'text-page-subtitle text-primary',
    'section-title': 'text-section-title text-primary',
    'card-title': 'text-card-title text-primary',
  };

  return (
    <Component 
      className={cn(variants[variant], className)} 
      {...props}
    >
      {children}
    </Component>
  );
};

// Text component for body content
export const Text = ({ 
  as: Component = 'p', 
  variant = 'body', 
  color = 'secondary',
  className, 
  children, 
  ...props 
}) => {
  const variants = {
    'body-large': 'text-body-large',
    'body': 'text-body',
    'body-small': 'text-body-small',
    'subtitle': 'text-subtitle',
    'caption': 'text-caption',
  };

  const colors = {
    'primary': 'text-primary',
    'secondary': 'text-secondary',
    'tertiary': 'text-tertiary',
    'muted': 'text-muted',
    'interactive': 'text-interactive',
    'success': 'text-success',
    'warning': 'text-warning',
    'error': 'text-error',
  };

  return (
    <Component 
      className={cn(variants[variant], colors[color], className)} 
      {...props}
    >
      {children}
    </Component>
  );
};

// Metric component for displaying KPIs and important numbers
export const Metric = ({ 
  variant = 'large', 
  className, 
  children, 
  ...props 
}) => {
  const variants = {
    'large': 'text-metric-large text-primary',
    'medium': 'text-metric-medium text-primary',
  };

  return (
    <div 
      className={cn(variants[variant], className)} 
      {...props}
    >
      {children}
    </div>
  );
};

// Label component for form labels
export const Label = ({ 
  className, 
  children, 
  required = false,
  ...props 
}) => {
  return (
    <label 
      className={cn('text-label text-secondary font-medium', className)} 
      {...props}
    >
      {children}
      {required && <span className="text-error ml-1">*</span>}
    </label>
  );
};

// Navigation text component
export const NavText = ({ 
  className, 
  children, 
  active = false,
  ...props 
}) => {
  return (
    <span 
      className={cn(
        'text-nav font-medium transition-colors',
        active ? 'text-interactive' : 'text-tertiary hover:text-secondary',
        className
      )} 
      {...props}
    >
      {children}
    </span>
  );
};

// Button text component
export const ButtonText = ({ 
  size = 'default',
  className, 
  children, 
  ...props 
}) => {
  const sizes = {
    'default': 'text-button',
    'large': 'text-button-large',
  };

  return (
    <span 
      className={cn(sizes[size], 'font-semibold', className)} 
      {...props}
    >
      {children}
    </span>
  );
};

// Export all components
export default {
  Heading,
  Text,
  Metric,
  Label,
  NavText,
  ButtonText,
};