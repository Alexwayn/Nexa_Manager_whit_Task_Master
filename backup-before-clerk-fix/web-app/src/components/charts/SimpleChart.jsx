import React, { useState } from 'react';
import InteractiveTooltip from './InteractiveTooltip';

const SimpleChart = ({ data, type = 'bar', className = '' }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-gray-500 ${className}`}>
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value || 0));

  const handleMouseEnter = (item, event) => {
    setHoveredItem(item);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  if (type === 'pie') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <InteractiveTooltip
          isVisible={!!hoveredItem}
          content={hoveredItem && {
            title: hoveredItem.name,
            value: typeof hoveredItem.value === 'number' ? `€${hoveredItem.value.toLocaleString()}` : hoveredItem.value,
            description: 'Revenue source'
          }}
          position={tooltipPosition}
        >
          <div></div>
        </InteractiveTooltip>
        {data.map((item, index) => {
          const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-indigo-500'];
          const hoverColors = ['hover:bg-blue-600', 'hover:bg-green-600', 'hover:bg-yellow-600', 'hover:bg-red-600', 'hover:bg-purple-600', 'hover:bg-indigo-600'];
          return (
            <div 
              key={index} 
              className="flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105"
              onMouseEnter={(e) => handleMouseEnter(item, e)}
              onMouseLeave={handleMouseLeave}
            >
              <div className={`w-3 h-3 rounded-full transition-all duration-200 ${colors[index % colors.length]} ${hoverColors[index % hoverColors.length]}`}></div>
              <span className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200">
                {item.name}: {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'funnel') {
    return (
      <div className={`space-y-2 ${className}`}>
        <InteractiveTooltip
          isVisible={!!hoveredItem}
          content={hoveredItem && {
            title: hoveredItem.stage || hoveredItem.name,
            value: typeof hoveredItem.value === 'number' ? hoveredItem.value.toLocaleString() : hoveredItem.value,
            description: hoveredItem.percentage ? `${hoveredItem.percentage}% conversion` : 'Funnel stage'
          }}
          position={tooltipPosition}
        >
          <div></div>
        </InteractiveTooltip>
        {data.map((item, index) => {
          const width = item.percentage || (item.value / maxValue) * 100;
          return (
            <div 
              key={index} 
              className="space-y-1 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
              onMouseEnter={(e) => handleMouseEnter(item, e)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 hover:text-gray-900 transition-colors duration-200">{item.stage || item.name}</span>
                <span className="text-gray-600 hover:text-gray-800 transition-colors duration-200">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                  {item.percentage && ` (${item.percentage}%)`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 hover:bg-gray-300 transition-colors duration-200">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500 hover:from-purple-600 hover:to-purple-700"
                  style={{ width: `${width}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default bar chart
  return (
    <div className={`space-y-3 ${className}`}>
      <InteractiveTooltip
        isVisible={!!hoveredItem}
        content={hoveredItem && {
          title: hoveredItem.name,
          value: typeof hoveredItem.value === 'number' ? hoveredItem.value.toLocaleString() : hoveredItem.value,
          description: hoveredItem.trend ? `Trend: ${hoveredItem.trend}` : 'Performance metric'
        }}
        position={tooltipPosition}
      >
        <div></div>
      </InteractiveTooltip>
      {data.map((item, index) => {
        const height = (item.value / maxValue) * 100;
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-indigo-500'];
        const hoverColors = ['hover:bg-blue-600', 'hover:bg-green-600', 'hover:bg-yellow-600', 'hover:bg-red-600', 'hover:bg-purple-600', 'hover:bg-indigo-600'];
        return (
          <div 
            key={index} 
            className="flex items-center gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
            onMouseEnter={(e) => handleMouseEnter(item, e)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="w-20 text-sm text-gray-700 truncate hover:text-gray-900 transition-colors duration-200">{item.name}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-3 relative hover:bg-gray-300 transition-colors duration-200">
              <div 
                className={`${colors[index % colors.length]} ${hoverColors[index % hoverColors.length]} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${height}%` }}
              ></div>
            </div>
            <div className="w-16 text-sm text-gray-600 text-right hover:text-gray-800 transition-colors duration-200">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              {item.trend && (
                <span className={`ml-1 transition-colors duration-200 ${item.trend === 'up' ? 'text-green-500 hover:text-green-600' : item.trend === 'down' ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-600'}`}>
                  {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SimpleChart;