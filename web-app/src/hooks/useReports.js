import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import * as reportingService from '../services/reportingService';

// Query keys
const QUERY_KEYS = {
  reports: 'reports',
  metrics: 'metrics',
  schedules: 'schedules'
};

/**
 * Hook for fetching reports with optional filters
 * @param {Object} filters - Optional filters for reports
 * @returns {Object} Query result with reports data
 */
export const useReports = (filters = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.reports, filters],
    queryFn: () => reportingService.getReports(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching report metrics with optional date range
 * @param {Object} dateRange - Optional date range for metrics
 * @returns {Object} Query result with metrics data
 */
export const useReportMetrics = (dateRange = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.metrics, dateRange],
    queryFn: () => reportingService.getReportMetrics(dateRange),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for report generation with loading state and callbacks
 * @param {Object} options - Options including onSuccess and onError callbacks
 * @returns {Object} Generation functions and state
 */
export const useReportGeneration = (options = {}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const { onSuccess, onError } = options;

  const generateReport = useCallback(async (reportParams) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await reportingService.generateReport(reportParams);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      setError(err);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [onSuccess, onError]);

  return {
    generateReport,
    isGenerating,
    error
  };
};

/**
 * Hook for managing scheduled reports
 * @returns {Object} Query result and mutation functions for scheduled reports
 */
export const useScheduledReports = () => {
  const queryClient = useQueryClient();

  // Query for fetching scheduled reports
  const query = useQuery({
    queryKey: [QUERY_KEYS.schedules],
    queryFn: () => reportingService.getScheduledReports(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for creating schedules
  const createMutation = useMutation({
    mutationFn: (scheduleData) => reportingService.createSchedule(scheduleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.schedules] });
    },
  });

  // Mutation for updating schedules
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => reportingService.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.schedules] });
    },
  });

  // Mutation for deleting schedules
  const deleteMutation = useMutation({
    mutationFn: (id) => reportingService.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.schedules] });
    },
  });

  return {
    // Query data
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Mutation functions
    createSchedule: createMutation.mutateAsync,
    updateSchedule: (id, data) => updateMutation.mutateAsync({ id, data }),
    deleteSchedule: deleteMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export default {
  useReports,
  useReportMetrics,
  useReportGeneration,
  useScheduledReports
};
