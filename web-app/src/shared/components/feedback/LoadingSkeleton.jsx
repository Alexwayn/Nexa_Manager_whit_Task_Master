import React from 'react';

const LoadingSkeleton = ({ 
  type = 'default', 
  rows = 3, 
  className = '',
  animate = true 
}) => {
  const baseClasses = `bg-gray-200 rounded ${animate ? 'animate-pulse' : ''}`;

  const renderDefault = () => (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className={`h-4 ${baseClasses} w-3/4`}></div>
          <div className={`h-4 ${baseClasses} w-1/2`}></div>
        </div>
      ))}
    </div>
  );

  const renderTable = () => (
    <div className={`space-y-2 ${className}`}>
      {/* Table Header */}
      <div className="flex space-x-4 p-4 bg-gray-50">
        <div className={`h-4 ${baseClasses} w-1/4`}></div>
        <div className={`h-4 ${baseClasses} w-1/4`}></div>
        <div className={`h-4 ${baseClasses} w-1/4`}></div>
        <div className={`h-4 ${baseClasses} w-1/4`}></div>
      </div>
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex space-x-4 p-4 border-b border-gray-100">
          <div className={`h-4 ${baseClasses} w-1/4`}></div>
          <div className={`h-4 ${baseClasses} w-1/4`}></div>
          <div className={`h-4 ${baseClasses} w-1/4`}></div>
          <div className={`h-4 ${baseClasses} w-1/4`}></div>
        </div>
      ))}
    </div>
  );

  const renderCard = () => (
    <div className={`bg-white rounded-lg shadow p-6 space-y-4 ${className}`}>
      <div className={`h-6 ${baseClasses} w-1/3`}></div>
      <div className="space-y-2">
        <div className={`h-4 ${baseClasses} w-full`}></div>
        <div className={`h-4 ${baseClasses} w-5/6`}></div>
        <div className={`h-4 ${baseClasses} w-4/6`}></div>
      </div>
      <div className="flex space-x-2">
        <div className={`h-8 ${baseClasses} w-20`}></div>
        <div className={`h-8 ${baseClasses} w-20`}></div>
      </div>
    </div>
  );

  const renderChart = () => (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className={`h-6 ${baseClasses} w-1/4 mb-4`}></div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-end space-x-1">
            <div className={`${baseClasses} w-8`} style={{ height: `${Math.random() * 100 + 20}px` }}></div>
            <div className={`${baseClasses} w-8`} style={{ height: `${Math.random() * 100 + 20}px` }}></div>
            <div className={`${baseClasses} w-8`} style={{ height: `${Math.random() * 100 + 20}px` }}></div>
            <div className={`${baseClasses} w-8`} style={{ height: `${Math.random() * 100 + 20}px` }}></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderList = () => (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow">
          <div className={`h-10 w-10 ${baseClasses} rounded-full`}></div>
          <div className="flex-1 space-y-2">
            <div className={`h-4 ${baseClasses} w-3/4`}></div>
            <div className={`h-3 ${baseClasses} w-1/2`}></div>
          </div>
          <div className={`h-6 ${baseClasses} w-16`}></div>
        </div>
      ))}
    </div>
  );

  const renderMetrics = () => (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className={`h-4 ${baseClasses} w-1/2 mb-2`}></div>
          <div className={`h-8 ${baseClasses} w-3/4 mb-2`}></div>
          <div className={`h-3 ${baseClasses} w-1/3`}></div>
        </div>
      ))}
    </div>
  );

  const renderForm = () => (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className={`h-4 ${baseClasses} w-1/4`}></div>
          <div className={`h-10 ${baseClasses} w-full`}></div>
        </div>
      ))}
      <div className={`h-10 ${baseClasses} w-32 mt-6`}></div>
    </div>
  );

  const renderReport = () => (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className={`h-6 ${baseClasses} w-1/3 mb-2`}></div>
        <div className={`h-4 ${baseClasses} w-1/2`}></div>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="text-center">
              <div className={`h-8 ${baseClasses} w-16 mx-auto mb-2`}></div>
              <div className={`h-4 ${baseClasses} w-20 mx-auto`}></div>
            </div>
          ))}
        </div>
        
        {/* Chart */}
        <div className={`h-64 ${baseClasses} w-full`}></div>
        
        {/* Table */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex space-x-4">
              <div className={`h-4 ${baseClasses} w-1/4`}></div>
              <div className={`h-4 ${baseClasses} w-1/4`}></div>
              <div className={`h-4 ${baseClasses} w-1/4`}></div>
              <div className={`h-4 ${baseClasses} w-1/4`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  switch (type) {
    case 'table':
      return renderTable();
    case 'card':
      return renderCard();
    case 'chart':
      return renderChart();
    case 'list':
      return renderList();
    case 'metrics':
      return renderMetrics();
    case 'form':
      return renderForm();
    case 'report':
      return renderReport();
    default:
      return renderDefault();
  }
};

export default LoadingSkeleton;