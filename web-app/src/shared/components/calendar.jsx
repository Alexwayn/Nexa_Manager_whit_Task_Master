import React, { useState, useMemo } from 'react';
import { cn } from '@shared/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isWithinInterval,
  isBefore,
  isAfter
} from 'date-fns';

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  defaultMonth = new Date(),
  numberOfMonths = 1,
  className,
  initialFocus = false,
  ...props
}) {
  const [currentMonth, setCurrentMonth] = useState(defaultMonth);

  const months = useMemo(() => {
    const monthsArray = [];
    for (let i = 0; i < numberOfMonths; i++) {
      monthsArray.push(addMonths(currentMonth, i));
    }
    return monthsArray;
  }, [currentMonth, numberOfMonths]);

  const getDaysInMonth = (month) => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  };

  const isDateSelected = (date) => {
    if (!selected) return false;
    
    if (mode === 'single') {
      return isSameDay(date, selected);
    }
    
    if (mode === 'range') {
      if (selected.from && selected.to) {
        return isWithinInterval(date, { start: selected.from, end: selected.to });
      }
      if (selected.from) {
        return isSameDay(date, selected.from);
      }
    }
    
    return false;
  };

  const isDateInRange = (date) => {
    if (mode !== 'range' || !selected?.from || !selected?.to) return false;
    return isWithinInterval(date, { start: selected.from, end: selected.to });
  };

  const isRangeStart = (date) => {
    if (mode !== 'range' || !selected?.from) return false;
    return isSameDay(date, selected.from);
  };

  const isRangeEnd = (date) => {
    if (mode !== 'range' || !selected?.to) return false;
    return isSameDay(date, selected.to);
  };

  const handleDateClick = (date) => {
    if (mode === 'single') {
      onSelect?.(date);
      return;
    }

    if (mode === 'range') {
      if (!selected?.from || (selected.from && selected.to)) {
        // Start new range
        onSelect?.({ from: date, to: null });
      } else if (selected.from && !selected.to) {
        // Complete range
        if (isBefore(date, selected.from)) {
          onSelect?.({ from: date, to: selected.from });
        } else {
          onSelect?.({ from: selected.from, to: date });
        }
      }
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className={cn('p-3', className)} {...props}>
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
        {months.map((month, monthIndex) => (
          <div key={month.toISOString()} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              {monthIndex === 0 && (
                <button
                  type="button"
                  onClick={() => navigateMonth('prev')}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              
              <div className="flex-1 text-center">
                <h2 className="text-sm font-semibold">
                  {format(month, 'MMMM yyyy')}
                </h2>
              </div>
              
              {monthIndex === months.length - 1 && (
                <button
                  type="button"
                  onClick={() => navigateMonth('next')}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="flex h-9 w-9 items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(month).map((date) => {
                const isCurrentMonth = isSameMonth(date, month);
                const isSelected = isDateSelected(date);
                const inRange = isDateInRange(date);
                const rangeStart = isRangeStart(date);
                const rangeEnd = isRangeEnd(date);
                const isToday = isSameDay(date, new Date());

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-normal ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                      // Base styles
                      isCurrentMonth 
                        ? 'text-foreground hover:bg-accent hover:text-accent-foreground' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      // Today
                      isToday && 'bg-accent text-accent-foreground',
                      // Selected/Range styles
                      isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                      inRange && !rangeStart && !rangeEnd && 'bg-accent text-accent-foreground',
                      rangeStart && 'bg-primary text-primary-foreground rounded-r-none',
                      rangeEnd && 'bg-primary text-primary-foreground rounded-l-none',
                      rangeStart && rangeEnd && 'rounded-md'
                    )}
                  >
                    {format(date, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Calendar;
