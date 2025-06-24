import { useState, useCallback, useMemo } from 'react';

const useDateRange = (initialRange = null) => {
  const defaultRange = useMemo(
    () => ({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)
        .toISOString()
        .split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    }),
    [],
  );

  const [dateRange, setDateRange] = useState(initialRange || defaultRange);
  const [errors, setErrors] = useState({});

  const validateDateRange = useCallback((range) => {
    const newErrors = {};
    const startDate = new Date(range.startDate);
    const endDate = new Date(range.endDate);
    const today = new Date();

    if (startDate > endDate) {
      newErrors.startDate = 'La data di inizio deve essere precedente alla data di fine';
    }

    if (endDate > today) {
      newErrors.endDate = 'La data di fine non può essere futura';
    }

    if (startDate > today) {
      newErrors.startDate = 'La data di inizio non può essere futura';
    }

    // Check if range is too large (more than 2 years)
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 730) {
      newErrors.range = "L'intervallo di date non può superare i 2 anni";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const updateDateRange = useCallback(
    (field, value) => {
      const newRange = {
        ...dateRange,
        [field]: value,
      };

      if (validateDateRange(newRange)) {
        setDateRange(newRange);
      }
    },
    [dateRange, validateDateRange],
  );

  const setPreset = useCallback(
    (preset) => {
      const endDate = new Date().toISOString().split('T')[0];
      let startDate;

      switch (preset) {
        case 'last7days':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last30days':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last3months':
          startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)
            .toISOString()
            .split('T')[0];
          break;
        case 'last6months':
          startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
            .toISOString()
            .split('T')[0];
          break;
        case 'lastYear':
          startDate = new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0];
          break;
        case 'thisMonth':
          startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split('T')[0];
          break;
        case 'thisYear':
          startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
          break;
        default:
          return;
      }

      const newRange = { startDate, endDate };
      if (validateDateRange(newRange)) {
        setDateRange(newRange);
      }
    },
    [validateDateRange],
  );

  const resetToDefault = useCallback(() => {
    setDateRange(defaultRange);
    setErrors({});
  }, [defaultRange]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const daysDifference = useMemo(() => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [dateRange]);

  const formattedRange = useMemo(
    () => ({
      start: new Date(dateRange.startDate).toLocaleDateString('it-IT'),
      end: new Date(dateRange.endDate).toLocaleDateString('it-IT'),
      display: `dal ${new Date(dateRange.startDate).toLocaleDateString('it-IT')} al ${new Date(dateRange.endDate).toLocaleDateString('it-IT')}`,
    }),
    [dateRange],
  );

  return {
    dateRange,
    updateDateRange,
    setPreset,
    resetToDefault,
    errors,
    isValid,
    daysDifference,
    formattedRange,
  };
};

export default useDateRange;
