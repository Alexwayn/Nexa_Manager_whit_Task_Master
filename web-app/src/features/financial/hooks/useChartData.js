import { useMemo } from 'react';

const useChartData = (rawData, type = 'line', options = {}) => {
  const {
    formatCurrency,
    formatNumber,
    formatPercentage,
    colors = [
      'rgba(59, 130, 246, 0.8)', // Blue
      'rgba(16, 185, 129, 0.8)', // Green
      'rgba(245, 158, 11, 0.8)', // Yellow
      'rgba(239, 68, 68, 0.8)', // Red
      'rgba(139, 92, 246, 0.8)', // Purple
      'rgba(236, 72, 153, 0.8)', // Pink
      'rgba(6, 182, 212, 0.8)', // Cyan
      'rgba(251, 146, 60, 0.8)', // Orange
    ],
    labelKey = 'label',
    valueKey = 'value',
    groupBy = null,
  } = options;

  const chartData = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) {
      return {
        labels: [],
        datasets: [],
      };
    }

    let processedData = rawData;

    // Group data if needed
    if (groupBy) {
      const grouped = processedData.reduce((acc, item) => {
        const key = item[groupBy];
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      }, {});

      processedData = Object.entries(grouped).map(([key, values]) => ({
        [labelKey]: key,
        [valueKey]: values.reduce((sum, item) => sum + (item[valueKey] || 0), 0),
        count: values.length,
        items: values,
      }));
    }

    const labels = processedData.map(item => item[labelKey]);
    const values = processedData.map(item => item[valueKey] || 0);

    // Create datasets based on chart type
    let datasets = [];

    switch (type) {
      case 'line':
        datasets = [
          {
            label: options.label || 'Valore',
            data: values,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ];
        break;

      case 'bar':
        datasets = [
          {
            label: options.label || 'Valore',
            data: values,
            backgroundColor: colors.slice(0, values.length),
            borderColor: colors.map(color => color.replace('0.8', '1')).slice(0, values.length),
            borderWidth: 1,
            borderRadius: 4,
          },
        ];
        break;

      case 'doughnut':
        datasets = [
          {
            data: values,
            backgroundColor: colors.slice(0, values.length),
            borderColor: colors.map(color => color.replace('0.8', '1')).slice(0, values.length),
            borderWidth: 2,
          },
        ];
        break;

      case 'multiline':
        // For multiple series line charts
        const series = options.seriesKeys || [];
        datasets = series.map((seriesKey, index) => ({
          label: seriesKey,
          data: processedData.map(item => item[seriesKey] || 0),
          borderColor: colors[index % colors.length].replace('0.8', '1'),
          backgroundColor: colors[index % colors.length],
          fill: false,
          tension: 0.4,
        }));
        break;

      default:
        datasets = [
          {
            label: options.label || 'Valore',
            data: values,
            backgroundColor: colors[0],
            borderColor: colors[0].replace('0.8', '1'),
          },
        ];
    }

    return {
      labels,
      datasets,
      rawData: processedData,
    };
  }, [rawData, type, colors, labelKey, valueKey, groupBy, options.label, options.seriesKeys]);

  const chartOptions = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed[type === 'doughnut' ? undefined : 'y'] ?? context.parsed;

              if (formatCurrency) {
                return `${context.dataset.label}: ${formatCurrency(value)}`;
              } else if (formatNumber) {
                return `${context.dataset.label}: ${formatNumber(value)}`;
              } else if (formatPercentage && type === 'doughnut') {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }

              return `${context.dataset.label || context.label}: ${value}`;
            },
          },
        },
      },
    };

    // Add scales for bar and line charts
    if (type === 'bar' || type === 'line' || type === 'multiline') {
      baseOptions.scales = {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              if (formatCurrency) return formatCurrency(value);
              if (formatNumber) return formatNumber(value);
              return value;
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
      };
    }

    // Doughnut specific options
    if (type === 'doughnut') {
      baseOptions.cutout = '60%';
      baseOptions.plugins.legend = {
        display: true,
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      };
    } else {
      baseOptions.plugins.legend = {
        display: type === 'multiline',
      };
    }

    return baseOptions;
  }, [type, formatCurrency, formatNumber, formatPercentage]);

  const summary = useMemo(() => {
    if (!chartData.rawData.length) return {};

    const values = chartData.datasets[0]?.data || [];
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length || 0;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      total,
      average,
      max,
      min,
      count: values.length,
      formattedTotal: formatCurrency
        ? formatCurrency(total)
        : formatNumber
          ? formatNumber(total)
          : total,
      formattedAverage: formatCurrency
        ? formatCurrency(average)
        : formatNumber
          ? formatNumber(average)
          : average,
    };
  }, [chartData, formatCurrency, formatNumber]);

  return {
    chartData,
    chartOptions,
    summary,
    isEmpty: !rawData || rawData.length === 0,
  };
};

export default useChartData;
