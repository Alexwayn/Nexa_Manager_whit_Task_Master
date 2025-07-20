import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { useIntersectionObserver } from '@hooks/useIntersectionObserver';
import LoadingSkeleton from '@components/common/LoadingSkeleton';
import { ChartErrorFallback } from '@components/common/ErrorBoundary';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Chart type mapping
const CHART_COMPONENTS = {
  bar: Bar,
  line: Line,
  pie: Pie,
  doughnut: Doughnut,
};

// Default chart options with performance optimizations
const getDefaultOptions = (type, theme = 'light') => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: theme === 'dark' ? '#e5e7eb' : '#374151',
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        titleColor: theme === 'dark' ? '#f9fafb' : '#111827',
        bodyColor: theme === 'dark' ? '#e5e7eb' : '#374151',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
      },
    },
    // Performance optimizations
    parsing: {
      xAxisKey: 'x',
      yAxisKey: 'y',
    },
    datasets: {
      bar: {
        categoryPercentage: 0.8,
        barPercentage: 0.9,
      },
      line: {
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
      },
    },
  };

  // Add scales for bar and line charts
  if (type === 'bar' || type === 'line') {
    baseOptions.scales = {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: theme === 'dark' ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
      },
    };
  }

  return baseOptions;
};

// Memoized chart data processor
const useProcessedChartData = (data, type) => {
  return useMemo(() => {
    if (!data || !data.datasets) return null;

    // Deep clone to avoid mutations
    const processedData = JSON.parse(JSON.stringify(data));

    // Apply type-specific optimizations
    if (type === 'line') {
      processedData.datasets.forEach(dataset => {
        if (!dataset.fill) dataset.fill = false;
        if (!dataset.tension) dataset.tension = 0.4;
      });
    }

    return processedData;
  }, [data, type]);
};

// Main OptimizedChart component
const OptimizedChart = memo(({
  type = 'bar',
  data,
  options = {},
  height = 300,
  loading = false,
  error = null,
  theme = 'light',
  lazy = true,
  onChartClick,
  onDataPointClick,
  className = '',
  id,
  ...props
}) => {
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  
  // Intersection observer for lazy loading
  const [isVisible, setIsVisible] = useIntersectionObserver(containerRef, {
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Process chart data with memoization
  const processedData = useProcessedChartData(data, type);

  // Memoized chart options
  const chartOptions = useMemo(() => {
    const defaultOptions = getDefaultOptions(type, theme);
    
    return {
      ...defaultOptions,
      ...options,
      onClick: onChartClick || onDataPointClick ? (event, elements) => {
        if (onChartClick) onChartClick(event, elements);
        if (onDataPointClick && elements.length > 0) {
          const element = elements[0];
          const datasetIndex = element.datasetIndex;
          const index = element.index;
          const value = processedData.datasets[datasetIndex].data[index];
          const label = processedData.labels[index];
          onDataPointClick({ datasetIndex, index, value, label });
        }
      } : undefined,
      plugins: {
        ...defaultOptions.plugins,
        ...options.plugins,
      },
    };
  }, [type, theme, options, onChartClick, onDataPointClick, processedData]);

  // Chart component selection
  const ChartComponent = CHART_COMPONENTS[type];

  // Error handling
  const handleChartError = useCallback((error) => {
    console.error('Chart rendering error:', error);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy?.();
      }
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div ref={containerRef} className={`${className}`} style={{ height }}>
        <LoadingSkeleton type="chart" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div ref={containerRef} className={`${className}`} style={{ height }}>
        <ChartErrorFallback error={error} retry={() => window.location.reload()} />
      </div>
    );
  }

  // No data state
  if (!processedData || !processedData.datasets || processedData.datasets.length === 0) {
    return (
      <div ref={containerRef} className={`${className} flex items-center justify-center bg-gray-50 rounded-lg`} style={{ height }}>
        <div className="text-center text-gray-500">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  // Lazy loading - don't render chart until visible
  if (lazy && !isVisible) {
    return (
      <div ref={containerRef} className={`${className}`} style={{ height }}>
        <LoadingSkeleton type="chart" animate={false} />
      </div>
    );
  }

  // Render chart
  if (!ChartComponent) {
    console.error(`Unsupported chart type: ${type}`);
    return (
      <div ref={containerRef} className={`${className}`} style={{ height }}>
        <ChartErrorFallback error={new Error(`Unsupported chart type: ${type}`)} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${className}`} style={{ height }}>
      <ChartComponent
        ref={chartRef}
        data={processedData}
        options={chartOptions}
        onError={handleChartError}
        {...props}
      />
    </div>
  );
});

// Display name for debugging
OptimizedChart.displayName = 'OptimizedChart';

// Prop comparison function for memo
const areEqual = (prevProps, nextProps) => {
  // Compare primitive props
  const primitiveProps = ['type', 'height', 'loading', 'error', 'theme', 'lazy', 'className'];
  for (const prop of primitiveProps) {
    if (prevProps[prop] !== nextProps[prop]) return false;
  }

  // Deep compare data and options
  if (JSON.stringify(prevProps.data) !== JSON.stringify(nextProps.data)) return false;
  if (JSON.stringify(prevProps.options) !== JSON.stringify(nextProps.options)) return false;

  // Compare function props
  if (prevProps.onChartClick !== nextProps.onChartClick) return false;
  if (prevProps.onDataPointClick !== nextProps.onDataPointClick) return false;

  return true;
};

export default memo(OptimizedChart, areEqual);

// Export chart type constants
export const CHART_TYPES = {
  BAR: 'bar',
  LINE: 'line',
  PIE: 'pie',
  DOUGHNUT: 'doughnut',
};

// Export utility functions
export const chartUtils = {
  getDefaultOptions,
  CHART_COMPONENTS,
};