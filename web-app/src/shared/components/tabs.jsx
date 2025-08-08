import React, { createContext, useContext, useState } from 'react';
import { cn } from '@shared/utils/cn';

// Tabs Context
const TabsContext = createContext();

const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

// Main Tabs component
const Tabs = ({ value, onValueChange, defaultValue, className, children, ...props }) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  
  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// TabsList component
const TabsList = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// TabsTrigger component
const TabsTrigger = ({ value, className, children, disabled, ...props }) => {
  const { value: selectedValue, onValueChange } = useTabs();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isSelected
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-background/50 hover:text-foreground',
        className
      )}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

// TabsContent component
const TabsContent = ({ value, className, children, ...props }) => {
  const { value: selectedValue } = useTabs();
  
  if (selectedValue !== value) {
    return null;
  }

  return (
    <div
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
