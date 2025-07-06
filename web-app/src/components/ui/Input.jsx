import React from 'react';
import { cn } from '@utils/cn';
import { Label, Text } from './Typography';

export const Input = React.forwardRef(({
  type = 'text',
  size = 'default',
  variant = 'default',
  error = false,
  disabled = false,
  className,
  ...props
}, ref) => {
  const baseStyles = 'w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    default: cn(
      'border-gray-300 bg-white text-gray-900 placeholder-gray-500',
      'focus:border-blue-500 focus:ring-blue-500',
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
    ),
    filled: cn(
      'border-transparent bg-gray-50 text-gray-900 placeholder-gray-500',
      'focus:bg-white focus:border-blue-500 focus:ring-blue-500',
      error && 'bg-red-50 focus:border-red-500 focus:ring-red-500'
    ),
  };

  const sizes = {
    sm: 'px-3 py-2 text-input',
    default: 'px-4 py-2.5 text-input',
    lg: 'px-4 py-3 text-input',
  };

  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export const Textarea = React.forwardRef(({
  size = 'default',
  variant = 'default',
  error = false,
  disabled = false,
  rows = 4,
  className,
  ...props
}, ref) => {
  const baseStyles = 'w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical';
  
  const variants = {
    default: cn(
      'border-gray-300 bg-white text-gray-900 placeholder-gray-500',
      'focus:border-blue-500 focus:ring-blue-500',
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
    ),
    filled: cn(
      'border-transparent bg-gray-50 text-gray-900 placeholder-gray-500',
      'focus:bg-white focus:border-blue-500 focus:ring-blue-500',
      error && 'bg-red-50 focus:border-red-500 focus:ring-red-500'
    ),
  };

  const sizes = {
    sm: 'px-3 py-2 text-input',
    default: 'px-4 py-2.5 text-input',
    lg: 'px-4 py-3 text-input',
  };

  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(({
  size = 'default',
  variant = 'default',
  error = false,
  disabled = false,
  placeholder,
  children,
  className,
  ...props
}, ref) => {
  const baseStyles = 'w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10';
  
  const variants = {
    default: cn(
      'border-gray-300 bg-white text-gray-900',
      'focus:border-blue-500 focus:ring-blue-500',
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
    ),
    filled: cn(
      'border-transparent bg-gray-50 text-gray-900',
      'focus:bg-white focus:border-blue-500 focus:ring-blue-500',
      error && 'bg-red-50 focus:border-red-500 focus:ring-red-500'
    ),
  };

  const sizes = {
    sm: 'px-3 py-2 text-input',
    default: 'px-4 py-2.5 text-input',
    lg: 'px-4 py-3 text-input',
  };

  const chevronIcon = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e";

  return (
    <select
      ref={ref}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      style={{
        backgroundImage: `url("${chevronIcon}")`
      }}
      disabled={disabled}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
});

Select.displayName = 'Select';

// Form Field wrapper component
export const FormField = ({
  label,
  error,
  hint,
  required = false,
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {label && (
        <Label required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && !error && (
        <Text variant="caption" color="tertiary">
          {hint}
        </Text>
      )}
      {error && (
        <Text variant="caption" color="error">
          {error}
        </Text>
      )}
    </div>
  );
};

export default Input;