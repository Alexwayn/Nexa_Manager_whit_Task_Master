import React from 'react';
import { Bar } from 'react-chartjs-2';

const BarChart = ({
  data,
  options = {},
  formatCurrency,
  className = '',
  height = 'h-64',
  orientation = 'vertical', // "vertical" or "horizontal"
}) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: orientation === 'horizontal' ? 'y' : 'x',
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
    <div className={`${height} ${className}`}>
      <Bar data={defaultData} options={mergedOptions} />
    </div>
  );
};

export default BarChart;
