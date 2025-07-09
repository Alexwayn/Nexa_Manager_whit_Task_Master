import React from 'react';
import { cn } from '@utils/cn';
import { Heading, Text } from './Typography';

export const Card = ({
  variant = 'default',
  padding = 'default',
  className,
  children,
  ...props
}) => {
  const baseStyles = 'bg-white rounded-lg border border-gray-200 shadow-sm';

  const variants = {
    default: 'hover:shadow-md transition-shadow duration-200',
    elevated: 'shadow-lg hover:shadow-xl transition-shadow duration-200',
    flat: 'shadow-none border-gray-100',
    interactive: 'hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={cn(baseStyles, variants[variant], paddings[padding], className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => {
  return (
    <div className={cn('mb-6', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ as = 'h3', className, children, ...props }) => {
  return (
    <Heading as={as} variant='card-title' className={cn('mb-2', className)} {...props}>
      {children}
    </Heading>
  );
};

export const CardDescription = ({ className, children, ...props }) => {
  return (
    <Text variant='body' color='secondary' className={className} {...props}>
      {children}
    </Text>
  );
};

export const CardContent = ({ className, children, ...props }) => {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ className, children, ...props }) => {
  return (
    <div className={cn('mt-6 pt-4 border-t border-gray-100', className)} {...props}>
      {children}
    </div>
  );
};

// Stat Card - specialized card for displaying metrics
export const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  className,
  ...props
}) => {
  return (
    <Card variant='default' className={cn('relative overflow-hidden', className)} {...props}>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <Text variant='body-small' color='secondary' className='mb-1'>
            {title}
          </Text>
          <div className='text-metric-large text-primary font-bold mb-1'>{value}</div>
          {subtitle && (
            <Text variant='caption' color='tertiary'>
              {subtitle}
            </Text>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-lg', iconBg)}>
            <Icon className={cn('w-6 h-6', iconColor)} />
          </div>
        )}
      </div>
      {trend && (
        <div className='mt-4 flex items-center'>
          <span
            className={cn(
              'text-caption font-medium',
              trend.type === 'positive'
                ? 'text-success'
                : trend.type === 'negative'
                  ? 'text-error'
                  : 'text-secondary',
            )}
          >
            {trend.value}
          </span>
          <Text variant='caption' color='tertiary' className='ml-2'>
            {trend.label}
          </Text>
        </div>
      )}
    </Card>
  );
};

export default Card;
