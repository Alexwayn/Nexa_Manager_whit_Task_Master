import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@shared/utils/cn';

// Select Context
const SelectContext = createContext();

const useSelect = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select');
  }
  return context;
};

// Main Select Component
export const Select = ({ children, value, onValueChange, defaultValue, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '');
  const [selectedLabel, setSelectedLabel] = useState('');
  const selectRef = useRef(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleValueChange = (newValue, label) => {
    setSelectedValue(newValue);
    setSelectedLabel(label);
    setIsOpen(false);
    onValueChange?.(newValue);
  };

  return (
    <SelectContext.Provider
      value={{
        isOpen,
        setIsOpen,
        selectedValue,
        selectedLabel,
        handleValueChange,
        disabled,
      }}
    >
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// Select Trigger Component
export const SelectTrigger = ({ children, className, ...props }) => {
  const { isOpen, setIsOpen, disabled } = useSelect();

  return (
    <button
      type="button"
      onClick={() => !disabled && setIsOpen(!isOpen)}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus:ring-blue-400',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className={cn('h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')} />
    </button>
  );
};

// Select Value Component
export const SelectValue = ({ placeholder, className }) => {
  const { selectedLabel, selectedValue } = useSelect();

  return (
    <span className={cn('block truncate', className)}>
      {selectedValue ? selectedLabel || selectedValue : placeholder}
    </span>
  );
};

// Select Content Component
export const SelectContent = ({ children, className, position = 'popper' }) => {
  const { isOpen } = useSelect();

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md animate-in fade-in-0 zoom-in-95 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50',
        position === 'popper' && 'top-full mt-1 w-full',
        className
      )}
    >
      {children}
    </div>
  );
};

// Select Item Component
export const SelectItem = ({ children, value, disabled = false, className, ...props }) => {
  const { selectedValue, handleValueChange } = useSelect();
  const isSelected = selectedValue === value;

  return (
    <div
      onClick={() => !disabled && handleValueChange(value, children)}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50',
        disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800',
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <CheckIcon className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
};

export default Select;