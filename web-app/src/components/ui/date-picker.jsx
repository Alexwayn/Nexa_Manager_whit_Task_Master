import React from 'react';
import PropTypes from 'prop-types';

/**
 * DatePicker Component
 * A simple date picker component for testing purposes
 */
const DatePicker = ({ onDateChange, value, placeholder = "Select date range" }) => {
  const handleDateChange = () => {
    // Mock date change for testing
    if (onDateChange) {
      onDateChange({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31')
      });
    }
  };

  return (
    <div data-testid="date-picker" className="date-picker">
      <button 
        onClick={handleDateChange}
        className="date-picker-button"
        type="button"
      >
        {placeholder}
      </button>
      {value && (
        <div className="date-picker-value">
          Selected: {value.from?.toDateString()} - {value.to?.toDateString()}
        </div>
      )}
    </div>
  );
};

DatePicker.propTypes = {
  onDateChange: PropTypes.func,
  value: PropTypes.shape({
    from: PropTypes.instanceOf(Date),
    to: PropTypes.instanceOf(Date)
  }),
  placeholder: PropTypes.string
};

export default DatePicker;
