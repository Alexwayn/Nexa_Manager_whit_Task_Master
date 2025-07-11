import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReportingService } from '../services/ReportingService';
import { toast } from 'react-hot-toast';

// Query keys for consistent caching
export const QUERY_KEYS = {
  reports: {
    all: ['reports'],
    metrics: () => [...QUERY_KEYS.reports.all, 'metrics'],
    history: (filters) => [...QUERY_KEYS.reports.all, 'history', filters],
    templates: () => [...QUERY_KEYS.reports.all, 'templates'],
    scheduled: () => [...QUERY_KEYS.reports.all, 'scheduled'],
    preview: (id, params) => [...QUERY_KEYS.reports.all, 'preview', id, params],
  },
};

// Hook for fetching report metrics with caching
export const useReportMetrics = () => {
  return useQuery({
    queryKey: QUERY_KEYS.reports.metrics(),
    queryFn: async () => {
      const [revenue, clients, performance] = await Promise.all([
        ReportingService.getRevenueMetrics(),
        ReportingService.getClientMetrics(),
        ReportingService.getPerformanceMetrics(),
      ]);
      return { revenue, clients, performance };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for metrics
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

// Hook for fetching report history with pagination
export const useReportHistory = (filters = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.reports.history(filters),
    queryFn: () => ReportingService.getReportHistory(filters),
    staleTime: 1 * 60 * 1000, // 1 minute for history
    keepPreviousData: true, // Keep previous data while fetching new
  });
};

// Hook for fetching report templates
export const useReportTemplates = () => {
  return useQuery({
    queryKey: QUERY_KEYS.reports.templates(),
    queryFn: () => ReportingService.getReportTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutes for templates (rarely change)
  });
};

// Hook for fetching scheduled reports
export const useScheduledReports = () => {
  return useQuery({
    queryKey: QUERY_KEYS.reports.scheduled(),
    queryFn: () => ReportingService.getScheduledReports(),
    staleTime: 30 * 1000, // 30 seconds for scheduled reports
  });
};

// Hook for report preview with lazy loading
export const useReportPreview = (reportId, params, enabled = false) => {
  return useQuery({
    queryKey: QUERY_KEYS.reports.preview(reportId, params),
    queryFn: () => ReportingService.generateReportPreview(reportId, params),
    enabled: enabled && !!reportId,
    staleTime: 0, // Always fresh for previews
    cacheTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
  });
};

// Mutation for generating reports
export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reportType, params, format }) => 
      ReportingService.generateReport(reportType, params, format),
    onSuccess: (data, variables) => {
      // Invalidate and refetch report history
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.history() });
      
      // Show success message
      toast.success(`Report generated successfully`);
    },
    onError: (error) => {
      console.error('Report generation failed:', error);
      toast.error('Failed to generate report. Please try again.');
    },
  });
};

// Mutation for scheduling reports
export const useScheduleReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (scheduleData) => ReportingService.scheduleReport(scheduleData),
    onSuccess: () => {
      // Invalidate scheduled reports cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.scheduled() });
      toast.success('Report scheduled successfully');
    },
    onError: (error) => {
      console.error('Report scheduling failed:', error);
      toast.error('Failed to schedule report. Please try again.');
    },
  });
};

// Mutation for deleting reports
export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reportId) => ReportingService.deleteReport(reportId),
    onSuccess: () => {
      // Invalidate report history cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.history() });
      toast.success('Report deleted successfully');
    },
    onError: (error) => {
      console.error('Report deletion failed:', error);
      toast.error('Failed to delete report. Please try again.');
    },
  });
};

// Hook for prefetching data
export const usePrefetchReports = () => {
  const queryClient = useQueryClient();
  
  const prefetchMetrics = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.reports.metrics(),
      queryFn: async () => {
        const [revenue, clients, performance] = await Promise.all([
          ReportingService.getRevenueMetrics(),
          ReportingService.getClientMetrics(),
          ReportingService.getPerformanceMetrics(),
        ]);
        return { revenue, clients, performance };
      },
      staleTime: 2 * 60 * 1000,
    });
  };
  
  const prefetchHistory = (filters = {}) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.reports.history(filters),
      queryFn: () => ReportingService.getReportHistory(filters),
      staleTime: 1 * 60 * 1000,
    });
  };
  
  return { prefetchMetrics, prefetchHistory };
};

// Utility hook for cache management
export const useReportCache = () => {
  const queryClient = useQueryClient();
  
  const clearCache = () => {
    queryClient.removeQueries({ queryKey: QUERY_KEYS.reports.all });
  };
  
  const refreshMetrics = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.metrics() });
  };
  
  const refreshHistory = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.history() });
  };
  
  return { clearCache, refreshMetrics, refreshHistory };
};