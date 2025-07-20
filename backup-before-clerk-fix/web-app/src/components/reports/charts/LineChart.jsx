import React, { useRef, useState } from 'react';
import { Line, getElementAtEvent } from 'react-chartjs-2';
import { ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const LineChart = ({
  data,
  options = {},
  title,
  formatCurrency,
  className = '',
  height = 'h-64',
  onElementClick = null,
  enableExport = true,
  enableDrillDown = false,
}) => {
  const chartRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  // Handle chart element clicks for drill-down
  const handleChartClick = (event) => {
    if (!enableDrillDown || !onElementClick) return;
    
    const elements = getElementAtEvent(chartRef.current, event);
    if (elements.length > 0) {
      const element = elements[0];
      const datasetIndex = element.datasetIndex;
      const index = element.index;
      const label = data.labels[index];
      const value = data.datasets[datasetIndex].data[index];
      
      onElementClick({
        label,
        value,
        datasetIndex,
        index,
        dataset: data.datasets[datasetIndex]
      });
    }
  };

  // Export chart as image
  const exportChart = async () => {
    if (!chartRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title || 'line-chart'}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error('Error exporting chart:', error);
    } finally {
      setIsExporting(false);
    }
  };
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            return formatCurrency
              ? `${context.dataset.label}: ${formatCurrency(value)}`
              : `${context.dataset.label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatCurrency ? formatCurrency(value) : value;
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
    },
    scales: {
      ...defaultOptions.scales,
      ...options.scales,
    },
  };

  const defaultData = {
    labels: data?.labels || [],
    datasets:
      data?.datasets?.map(dataset => ({
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        ...dataset,
      })) || [],
  };

  return (
    <div className={`relative ${className}`}>
      {/* Chart Controls */}
      {(enableExport || enableDrillDown) && (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {enableDrillDown && (
            <button
              className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Click chart elements to drill down"
            >
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          {enableExport && (
            <button
              onClick={exportChart}
              disabled={isExporting}
              className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Export chart as PNG"
            >
              <ArrowDownTrayIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      )}
      
      {/* Chart */}
      <div className={height}>
        <Line 
          ref={chartRef}
          data={defaultData} 
          options={mergedOptions} 
        />
      </div>
      
      {/* Drill-down hint */}
      {enableDrillDown && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Click on chart elements to drill down for more details
        </div>
      )}
    </div>
  );
};

export default LineChart;
