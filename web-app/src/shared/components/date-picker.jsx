import React, { useState } from 'react';
import Calendar from './calendar.jsx';
import { Button } from '@shared/components';
import { Popover, PopoverContent, PopoverTrigger } from './popover.jsx';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { format } from 'date-fns';

export function DatePickerWithRange({ date, onDateChange, className }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (range) => {
    if (range?.from && range?.to) {
      onDateChange(range);
      setIsOpen(false);
    } else if (range?.from) {
      onDateChange({ from: range.from, to: range.from });
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
