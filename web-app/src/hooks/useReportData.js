import { useState, useEffect, useCallback } from 'react';
import Logger from '@utils/Logger';

const useReportData = (fetchFunction, dependencies = [], options = {}) => {
  const {
    initialData = null,
    onSuccess = null,
    onError = null,
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const executeWithRetry = useCallback(
    async (fn, attempts = 0) => {
      try {
        return await fn();
      } catch (err) {
        if (attempts < retryCount) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempts + 1)));
          return executeWithRetry(fn, attempts + 1);
        }
        throw err;
      }
    },
    [retryCount, retryDelay],
  );

  const fetchData = useCallback(
    async (force = false) => {
      // Check cache
      if (!force && lastFetch && Date.now() - lastFetch < cacheTime && data) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await executeWithRetry(fetchFunction);

        if (result?.success) {
          setData(result.data);
          setLastFetch(Date.now());
          if (onSuccess) onSuccess(result.data);
        } else {
          throw new Error(result?.error || 'Failed to fetch data');
        }
      } catch (err) {
        Logger.error('Report data fetch error:', err);
        const errorMessage = err?.message || 'Errore nel caricamento dei dati';
        setError(errorMessage);
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    },
    [fetchFunction, executeWithRetry, lastFetch, cacheTime, data, onSuccess, onError],
  );

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const clearCache = useCallback(() => {
    setData(initialData);
    setLastFetch(null);
    setError(null);
  }, [initialData]);

  useEffect(() => {
    fetchData();
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
    isStale: lastFetch && Date.now() - lastFetch > cacheTime,
  };
};

export default useReportData;
