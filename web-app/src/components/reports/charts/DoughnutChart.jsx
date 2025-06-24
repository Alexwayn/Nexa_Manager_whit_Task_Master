import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const DoughnutChart = ({
  data,
  options = {},
  formatCurrency,
  formatPercentage,
  showLegend = true,
  className = '',
  height = 'h-64',
}) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);

            let label = context.label || '';
            if (formatCurrency) {
              label += `: ${formatCurrency(value)} (${percentage}%)`;
            } else if (formatPercentage) {
              label += `: ${formatPercentage(value)}`;
            } else {
              label += `: ${value} (${percentage}%)`;
            }
            return label;
          },
        },
      },
    },
    cutout: '60%',
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
    },
  };

  const defaultColors = [
    'rgba(59, 130, 246, 0.8)', // Blue
    'rgba(16, 185, 129, 0.8)', // Green
    'rgba(245, 158, 11, 0.8)', // Yellow
    'rgba(239, 68, 68, 0.8)', // Red
    'rgba(139, 92, 246, 0.8)', // Purple
    'rgba(236, 72, 153, 0.8)', // Pink
    'rgba(6, 182, 212, 0.8)', // Cyan
    'rgba(251, 146, 60, 0.8)', // Orange
  ];

  const defaultData = {
    labels: data?.labels || [],
    datasets:
      data?.datasets?.map((dataset) => ({
        backgroundColor: dataset.backgroundColor || defaultColors,
        borderColor:
          dataset.backgroundColor || defaultColors.map((color) => color.replace('0.8', '1')),
        borderWidth: 2,
        ...dataset,
      })) || [],
  };

  return (
    <div className={`${height} ${className}`}>
      <Doughnut data={defaultData} options={mergedOptions} />
    </div>
  );
};

export default DoughnutChart;
