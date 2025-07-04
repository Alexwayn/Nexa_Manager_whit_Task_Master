import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

const InventoryValueTrend = () => {
  const { t, ready } = useTranslation('inventory');

  // Safe translation function
  const safeT = (key, options = {}, fallback = key) => {
    if (!ready) return fallback;
    return t(key, options);
  };

  // Sample data for trend
  const trendData = [
    { month: 'Jan', value: 85000, point: { x: 8, y: 80 } },
    { month: 'Feb', value: 92000, point: { x: 25, y: 65 } },
    { month: 'Mar', value: 78000, point: { x: 42, y: 95 } },
    { month: 'Apr', value: 95000, point: { x: 58, y: 58 } },
    { month: 'May', value: 103000, point: { x: 75, y: 45 } },
    { month: 'Jun', value: 110000, point: { x: 92, y: 35 } }
  ];

  // Create SVG path for line chart
  const createPath = () => {
    let path = '';
    trendData.forEach((point, index) => {
      if (index === 0) {
        path += `M ${point.point.x} ${point.point.y}`;
      } else {
        path += ` L ${point.point.x} ${point.point.y}`;
      }
    });
    return path;
  };

  // Calculate percentage change
  const percentageChange = ((trendData[trendData.length - 1].value - trendData[0].value) / trendData[0].value * 100).toFixed(1);

  return (
    <div className="bg-white rounded-none shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {safeT('valueTrend.title', {}, 'Inventory Value Trend')}
          </h3>
          <div className="flex items-center space-x-2 text-green-600">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            <span className="text-sm font-medium">+{percentageChange}%</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-6">
          <p className="text-3xl font-bold text-gray-900">
            €{trendData[trendData.length - 1].value.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            {safeT('valueTrend.currentValue', {}, 'Current inventory value')}
          </p>
        </div>

        {/* Simple line chart */}
        <div className="relative h-32 flex-1">
          <svg className="w-full h-full" viewBox="0 0 100 120">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="120" fill="url(#grid)" />
            
            {/* Area under curve */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path
              d={`${createPath()} L 92 120 L 8 120 Z`}
              fill="url(#areaGradient)"
            />
            
            {/* Line */}
            <path
              d={createPath()}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {trendData.map((point, index) => (
              <circle
                key={index}
                cx={point.point.x}
                cy={point.point.y}
                r="3"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="2"
              />
            ))}
          </svg>
        </div>

        {/* Month labels */}
        <div className="flex justify-between mt-4 text-xs text-gray-500">
          {trendData.map((point, index) => (
            <span key={index}>{point.month}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryValueTrend;