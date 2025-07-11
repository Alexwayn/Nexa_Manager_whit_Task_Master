import React, { useRef, useState } from 'react';
import { Bar, getElementAtEvent } from 'react-chartjs-2';
import { ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const BarChart = ({
  data,
  options = {},
  formatCurrency,
  className = '',
  height = 'h-64',
  orientation = 'vertical', // "vertical" or "horizontal"
  onElementClick = null, // Callback for drill-down functionality
  enableExport = true,
  enableDrillDown = false,
  title = '',
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
      link.download = `${title || 'chart'}-${new Date().toISOString().split('T')[0]}.png`;
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
    indexAxis: orientation === 'horizontal' ? 'y' : 'x',
    onClick: handleChartClick,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed[orientation === 'horizontal' ? 'x' : 'y'];
            return formatCurrency
              ? `${context.dataset.label}: ${formatCurrency(value)}`
              : `${context.dataset.label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatCurrency && orientation === 'vertical' ? formatCurrency(value) : value;
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatCurrency && orientation === 'horizontal' ? formatCurrency(value) : value;
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
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
      data?.datasets?.map((dataset, index) => ({
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ][index % 6],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ][index % 6],
        borderWidth: 1,
        borderRadius: 4,
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
        <Bar 
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

export default BarChart;
