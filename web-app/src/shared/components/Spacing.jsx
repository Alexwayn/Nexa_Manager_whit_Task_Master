import React from 'react';
import { cn } from '@shared/utils/cn';

/**
 * Spacing component for consistent layout spacing
 * Based on 8px grid system
 */
export const Spacing = ({ size = 4, direction = 'vertical', className, ...props }) => {
  const spacingMap = {
    1: 'h-1 w-1',
    2: 'h-2 w-2',
    3: 'h-3 w-3',
    4: 'h-4 w-4',
    5: 'h-5 w-5',
    6: 'h-6 w-6',
    8: 'h-8 w-8',
    10: 'h-10 w-10',
    12: 'h-12 w-12',
    16: 'h-16 w-16',
    20: 'h-20 w-20',
    24: 'h-24 w-24',
  };

  const directionMap = {
    vertical: `h-${size}`,
    horizontal: `w-${size}`,
    both: spacingMap[size] || `h-${size} w-${size}`,
  };

  return <div className={cn(directionMap[direction], className)} {...props} />;
};

/**
 * Container component with consistent padding
 */
export const Container = ({ size = 'default', className, children, ...props }) => {
  const sizes = {
    sm: 'px-4 py-3',
    default: 'px-6 py-4',
    lg: 'px-8 py-6',
    xl: 'px-12 py-8',
  };

  return (
    <div className={cn(sizes[size], className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Stack component for vertical spacing between elements
 */
export const Stack = ({ spacing = 4, className, children, ...props }) => {
  const spacingMap = {
    1: 'space-y-1',
    2: 'space-y-2',
    3: 'space-y-3',
    4: 'space-y-4',
    5: 'space-y-5',
    6: 'space-y-6',
    8: 'space-y-8',
    10: 'space-y-10',
    12: 'space-y-12',
    16: 'space-y-16',
    20: 'space-y-20',
    24: 'space-y-24',
  };

  return (
    <div className={cn(spacingMap[spacing], className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Inline component for horizontal spacing between elements
 */
export const Inline = ({ spacing = 4, align = 'start', className, children, ...props }) => {
  const spacingMap = {
    1: 'space-x-1',
    2: 'space-x-2',
    3: 'space-x-3',
    4: 'space-x-4',
    5: 'space-x-5',
    6: 'space-x-6',
    8: 'space-x-8',
    10: 'space-x-10',
    12: 'space-x-12',
    16: 'space-x-16',
    20: 'space-x-20',
    24: 'space-x-24',
  };

  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  };

  return (
    <div className={cn('flex', spacingMap[spacing], alignMap[align], className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Grid component with consistent gaps
 */
export const Grid = ({ cols = 1, gap = 4, className, children, ...props }) => {
  const colsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };

  const gapMap = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10',
    12: 'gap-12',
    16: 'gap-16',
    20: 'gap-20',
    24: 'gap-24',
  };

  return (
    <div className={cn('grid', colsMap[cols], gapMap[gap], className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Section component for page sections with consistent spacing
 */
export const Section = ({ spacing = 'default', className, children, ...props }) => {
  const spacings = {
    sm: 'py-8',
    default: 'py-12',
    lg: 'py-16',
    xl: 'py-24',
  };

  return (
    <section className={cn(spacings[spacing], className)} {...props}>
      {children}
    </section>
  );
};

export default {
  Spacing,
  Container,
  Stack,
  Inline,
  Grid,
  Section,
};
