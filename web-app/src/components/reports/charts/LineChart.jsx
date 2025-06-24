import React from 'react';
import { Line } from 'react-chartjs-2';

const LineChart = ({
  data,
  options = {},
  title,
  formatCurrency,
  className = '',
  height = 'h-64',
}) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
      data?.datasets?.map((dataset) => ({
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        ...dataset,
      })) || [],
  };

  return (
    <div className={`${height} ${className}`}>
      <Line data={defaultData} options={mergedOptions} />
    </div>
  );
};

export default LineChart;
