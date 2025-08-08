import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { cn } from '@shared/utils/cn';

// Popover Context
const PopoverContext = createContext();

export function usePopover() {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('usePopover must be used within a Popover component');
  }
  return context;
}

// Main Popover component
export function Popover({ children, open, onOpenChange, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  const isControlled = open !== undefined;
  const openState = isControlled ? open : isOpen;

  const setOpenState = (newOpen) => {
    if (!isControlled) {
      setIsOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openState &&
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(event.target) &&
        !contentRef.current.contains(event.target)
      ) {
        setOpenState(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openState, setOpenState]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && openState) {
        setOpenState(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [openState, setOpenState]);

  const contextValue = {
    open: openState,
    onOpenChange: setOpenState,
    triggerRef,
    contentRef,
  };

  return (
    <PopoverContext.Provider value={contextValue}>
      <div className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

// Popover Trigger
export function PopoverTrigger({ children, asChild = false, className, ...props }) {
  const { open, onOpenChange, triggerRef } = usePopover();

  const handleClick = () => {
    onOpenChange(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick: handleClick,
      'aria-expanded': open,
      'aria-haspopup': 'dialog',
      ...children.props,
    });
  }

  return (
    <button
      ref={triggerRef}
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="dialog"
      className={cn('outline-none', className)}
      {...props}
    >
      {children}
    </button>
  );
}

// Popover Content
export function PopoverContent({ 
  children, 
  className, 
  align = 'center', 
  side = 'bottom',
  sideOffset = 4,
  alignOffset = 0,
  ...props 
}) {
  const { open, contentRef } = usePopover();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && contentRef.current) {
      const updatePosition = () => {
        const trigger = contentRef.current?.parentElement?.querySelector('[aria-expanded="true"]');
        if (!trigger) return;

        const triggerRect = trigger.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        let top = 0;
        let left = 0;

        // Calculate position based on side
        switch (side) {
          case 'top':
            top = triggerRect.top - contentRect.height - sideOffset;
            break;
          case 'bottom':
            top = triggerRect.bottom + sideOffset;
            break;
          case 'left':
            left = triggerRect.left - contentRect.width - sideOffset;
            top = triggerRect.top;
            break;
          case 'right':
            left = triggerRect.right + sideOffset;
            top = triggerRect.top;
            break;
        }

        // Calculate alignment
        if (side === 'top' || side === 'bottom') {
          switch (align) {
            case 'start':
              left = triggerRect.left + alignOffset;
              break;
            case 'center':
              left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2 + alignOffset;
              break;
            case 'end':
              left = triggerRect.right - contentRect.width + alignOffset;
              break;
          }
        } else {
          switch (align) {
            case 'start':
              top = triggerRect.top + alignOffset;
              break;
            case 'center':
              top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2 + alignOffset;
              break;
            case 'end':
              top = triggerRect.bottom - contentRect.height + alignOffset;
              break;
          }
        }

        // Ensure content stays within viewport
        left = Math.max(8, Math.min(left, viewport.width - contentRect.width - 8));
        top = Math.max(8, Math.min(top, viewport.height - contentRect.height - 8));

        setPosition({ top, left });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [open, side, align, sideOffset, alignOffset]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" />
      
      {/* Content */}
      <div
        ref={contentRef}
        className={cn(
          'fixed z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          side === 'bottom' && 'slide-in-from-top-2',
          side === 'top' && 'slide-in-from-bottom-2',
          side === 'left' && 'slide-in-from-right-2',
          side === 'right' && 'slide-in-from-left-2',
          className
        )}
        style={{
          top: position.top,
          left: position.left,
        }}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

export default Popover;
