import React from 'react';
import { cn } from '@utils/cn';

export const Badge = ({
  variant = 'default',
  size = 'default',
  className,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center rounded-full font-medium transition-colors';

  const variants = {
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    primary: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    secondary: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    success: 'bg-green-100 text-green-800 hover:bg-green-200',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    danger: 'bg-red-100 text-red-800 hover:bg-red-200',
    info: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    default: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;