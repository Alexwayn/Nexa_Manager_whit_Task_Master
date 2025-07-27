import React from 'react';
import { cn } from '@shared/utils';
import { ButtonText } from './Typography';

const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 shadow-sm hover:shadow-md',
  outline: 'bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm hover:shadow-md',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
  link: 'text-primary underline-offset-4 hover:underline',
};

const buttonSizes = {
  sm: 'px-3 py-2 text-button gap-2 h-9',
  default: 'px-4 py-2.5 text-button gap-2 h-10',
  lg: 'px-6 py-3 text-button-large gap-3 h-11',
  icon: 'h-10 w-10',
};

export const Button = React.forwardRef(({
  variant = 'primary',
  size = 'default',
  className,
  children,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  asChild = false,
  ...props
}, ref) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  const iconSizes = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-5 h-5',
  };

  const LoadingSpinner = () => (
    <svg className={cn('animate-spin', iconSizes[size])} fill='none' viewBox='0 0 24 24'>
      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
      <path
        className='opacity-75'
        fill='currentColor'
        d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
      />
    </svg>
  );

  const Comp = asChild ? 'span' : 'button';

  return (
    <Comp
      className={cn(baseStyles, buttonVariants[variant], buttonSizes[size], className)}
      disabled={disabled || loading}
      ref={ref}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && Icon && iconPosition === 'left' && <Icon className={iconSizes[size]} />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className={iconSizes[size]} />}
    </Comp>
  );
});

Button.displayName = 'Button';

// Icon button variant
export const IconButton = ({
  variant = 'ghost',
  size = 'default',
  className,
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizes = {
    sm: 'p-1.5',
    default: 'p-2',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {Icon && <Icon className={iconSizes[size]} />}
    </button>
  );
};

export default Button;
