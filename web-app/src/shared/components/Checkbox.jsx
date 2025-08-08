import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

/**
 * Checkbox Component
 * A customizable checkbox component
 */
export const Checkbox = ({
  checked = false,
  onCheckedChange,
  disabled = false,
  indeterminate = false,
  className = '',
  size = 'default',
  variant = 'default',
  label,
  id,
  ...props
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center rounded border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const variantClasses = {
    default: checked 
      ? 'bg-blue-600 border-blue-600 text-white focus:ring-blue-500' 
      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-blue-500',
    primary: checked 
      ? 'bg-blue-600 border-blue-600 text-white focus:ring-blue-500' 
      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-blue-500',
    success: checked 
      ? 'bg-green-600 border-green-600 text-white focus:ring-green-500' 
      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-green-500',
  };

  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500';

  const checkboxClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${disabledClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const handleChange = (e) => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(e.target.checked);
    }
  };

  return (
    <div className="flex items-center">
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <div
          className={checkboxClasses}
          onClick={() => !disabled && onCheckedChange?.(!checked)}
        >
          {checked && (
            <CheckIcon className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} stroke-2`} />
          )}
          {indeterminate && !checked && (
            <div className={`${size === 'sm' ? 'w-2 h-0.5' : size === 'lg' ? 'w-3 h-0.5' : 'w-2.5 h-0.5'} bg-current`} />
          )}
        </div>
      </div>
      {label && (
        <label
          htmlFor={id}
          className={`ml-2 text-sm text-gray-900 dark:text-gray-100 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => !disabled && onCheckedChange?.(!checked)}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
