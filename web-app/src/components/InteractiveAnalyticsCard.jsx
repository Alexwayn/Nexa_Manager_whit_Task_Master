import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  EyeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SimpleChart from './charts/SimpleChart';

const InteractiveAnalyticsCard = ({ 
  title, 
  icon: Icon, 
  value, 
  subtitle, 
  data, 
  cardType, 
  gradient,
  onDataFilter,
  className = ''
}) => {
  const { t } = useTranslation('analytics');
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('monthly');
  const [selectedView, setSelectedView] = useState('overview');
  const [sortBy, setSortBy] = useState('value');
  const [filterBy, setFilterBy] = useState('all');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  // Time range options
  const timeRanges = [
    { value: 'daily', label: t('interactiveCard.timeRange.daily') },
    { value: 'weekly', label: t('interactiveCard.timeRange.weekly') },
    { value: 'monthly', label: t('interactiveCard.timeRange.monthly') },
    { value: 'yearly', label: t('interactiveCard.timeRange.yearly') }
  ];

  // View options based on card type
  const getViewOptions = () => {
    switch (cardType) {
      case 'revenue':
        return [
          { value: 'overview', label: t('interactiveCard.views.overview') },
          { value: 'sources', label: t('interactiveCard.views.revenueSources') },
          { value: 'trends', label: t('interactiveCard.views.trends') },
          { value: 'breakdown', label: t('interactiveCard.views.breakdown') }
        ];
      case 'user-activity':
        return [
          { value: 'overview', label: t('interactiveCard.views.overview') },
          { value: 'behavior', label: t('interactiveCard.views.userBehavior') },
          { value: 'flows', label: t('interactiveCard.views.userFlows') },
          { value: 'engagement', label: t('interactiveCard.views.engagement') }
        ];
      case 'conversion':
        return [
          { value: 'overview', label: t('interactiveCard.views.overview') },
          { value: 'funnel', label: t('interactiveCard.views.funnelAnalysis') },
          { value: 'stages', label: t('interactiveCard.views.conversionStages') },
          { value: 'optimization', label: t('interactiveCard.views.optimization') }
        ];
      case 'performance':
        return [
          { value: 'overview', label: t('interactiveCard.views.overview') },
          { value: 'kpis', label: t('interactiveCard.views.keyMetrics') },
          { value: 'efficiency', label: t('interactiveCard.views.efficiency') },
          { value: 'benchmarks', label: t('interactiveCard.views.benchmarks') }
        ];
      default:
        return [
          { value: 'overview', label: t('interactiveCard.views.overview') },
          { value: 'details', label: t('interactiveCard.views.details') }
        ];
    }
  };

  // Handle mouse move for tooltip positioning
  const handleMouseMove = (e) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Handle hover on data elements
  const handleElementHover = (element, data) => {
    setHoveredElement(element);
    setTooltipData(data);
    setShowTooltip(true);
  };

  // Handle export functionality
  const handleExport = (format) => {
    const exportData = {
      title,
      timeRange: selectedTimeRange,
      view: selectedView,
      data: data,
      timestamp: new Date().toISOString()
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${selectedTimeRange}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Convert data to CSV format
      const csvData = data?.map(item => Object.values(item).join(',')).join('\n');
      const headers = data?.[0] ? Object.keys(data[0]).join(',') : '';
      const csv = headers + '\n' + csvData;
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${selectedTimeRange}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Render chart based on card type and view
  const renderChart = () => {
    if (!data || !Array.isArray(data)) return null;

    switch (cardType) {
      case 'revenue':
        return renderRevenueChart();
      case 'user-activity':
        return renderUserActivityChart();
      case 'conversion':
        return renderConversionChart();
      case 'performance':
        return renderPerformanceChart();
      default:
        return <SimpleChart data={data} type="bar" className="h-32" />;
    }
  };

  // Revenue chart rendering
  const renderRevenueChart = () => {
    if (selectedView === 'sources') {
      return (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">{t('interactiveCard.charts.revenueSources')}</h4>
          <div className="grid grid-cols-2 gap-4">
            {data.slice(0, 6).map((item, index) => (
              <motion.div
                key={index}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onMouseEnter={(e) => handleElementHover('revenue-source', item)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-gray-700 flex-1 break-words">{item.name || `Source ${index + 1}`}</span>
                  <span className="text-base font-bold text-green-600 flex-shrink-0">€{item.value?.toLocaleString() || '0'}</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
    return renderDefaultChart();
  };

  // User activity chart rendering
  const renderUserActivityChart = () => {
    if (selectedView === 'flows') {
      return (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">{t('interactiveCard.charts.userBehaviorFlows')}</h4>
          <div className="relative">
            <svg className="w-full h-64" viewBox="0 0 400 200">
              {/* Flow visualization */}
              <defs>
                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              
              {/* Flow paths */}
              <path
                d="M50,50 Q200,30 350,50"
                stroke="url(#flowGradient)"
                strokeWidth="8"
                fill="none"
                className="animate-pulse"
              />
              <path
                d="M50,100 Q200,80 350,100"
                stroke="url(#flowGradient)"
                strokeWidth="6"
                fill="none"
                className="animate-pulse"
                style={{ animationDelay: '0.5s' }}
              />
              <path
                d="M50,150 Q200,130 350,150"
                stroke="url(#flowGradient)"
                strokeWidth="4"
                fill="none"
                className="animate-pulse"
                style={{ animationDelay: '1s' }}
              />
              
              {/* Flow nodes */}
              <circle cx="50" cy="50" r="8" fill="#3B82F6" className="animate-pulse" />
              <circle cx="50" cy="100" r="6" fill="#3B82F6" className="animate-pulse" />
              <circle cx="50" cy="150" r="4" fill="#3B82F6" className="animate-pulse" />
              
              <circle cx="350" cy="50" r="8" fill="#10B981" className="animate-pulse" />
              <circle cx="350" cy="100" r="6" fill="#10B981" className="animate-pulse" />
              <circle cx="350" cy="150" r="4" fill="#10B981" className="animate-pulse" />
            </svg>
          </div>
        </div>
      );
    }
    return renderDefaultChart();
  };

  // Conversion chart rendering
  const renderConversionChart = () => {
    if (selectedView === 'funnel') {
      const funnelData = [
        { stage: t('interactiveCard.funnel.visitors'), value: 10000, percentage: 100 },
         { stage: t('interactiveCard.funnel.leads'), value: 2500, percentage: 25 },
         { stage: t('interactiveCard.funnel.prospects'), value: 750, percentage: 7.5 },
         { stage: t('interactiveCard.funnel.customers'), value: 150, percentage: 1.5 }
      ];

      return (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">{t('interactiveCard.charts.conversionFunnel')}</h4>
          <div className="space-y-2">
            {funnelData.map((stage, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all"
                  style={{ width: `${stage.percentage}%`, minWidth: '200px' }}
                  onMouseEnter={(e) => handleElementHover('funnel-stage', stage)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="font-bold">{stage.value.toLocaleString()}</span>
                  </div>
                  <div className="text-sm opacity-90">{stage.percentage}% {t('interactiveCard.conversion')}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
    return renderDefaultChart();
  };

  // Performance chart rendering
  const renderPerformanceChart = () => {
    if (selectedView === 'kpis') {
      const kpis = [
        { name: t('interactiveCard.kpis.revenueGrowth'), value: '+23.5%', trend: 'up', color: 'text-green-600' },
         { name: t('interactiveCard.kpis.customerAcquisition'), value: '+12.8%', trend: 'up', color: 'text-green-600' },
         { name: t('interactiveCard.kpis.churnRate'), value: '-2.1%', trend: 'down', color: 'text-green-600' },
         { name: t('interactiveCard.kpis.averageOrderValue'), value: '+8.3%', trend: 'up', color: 'text-green-600' }
      ];

      return (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">{t('interactiveCard.charts.keyPerformanceIndicators')}</h4>
          <div className="grid grid-cols-2 gap-4">
            {kpis.map((kpi, index) => (
              <motion.div
                key={index}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onMouseEnter={(e) => handleElementHover('kpi', kpi)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{kpi.name}</span>
                  <ArrowTrendingUpIcon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <div className="mt-2">
                  <span className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
    return renderDefaultChart();
  };

  // Default chart rendering
  const renderDefaultChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <ChartBarIcon className="h-8 w-8 mx-auto mb-2" />
            <p>{t('interactiveCard.noDataAvailable')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="h-48 relative">
          <svg className="w-full h-full" viewBox="0 0 400 150">
            {data.slice(0, 8).map((item, index) => {
              const height = (item.value / Math.max(...data.map(d => d.value))) * 120;
              const x = (index * 45) + 30;
              
              return (
                <motion.rect
                  key={index}
                  x={x}
                  y={130 - height}
                  width="30"
                  height={height}
                  fill="url(#cardGradient)"
                  className="cursor-pointer"
                  initial={{ height: 0, y: 130 }}
                  animate={{ height, y: 130 - height }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  onMouseEnter={(e) => handleElementHover('bar', item)}
                  onMouseLeave={() => setShowTooltip(false)}
                />
              );
            })}
            
            <defs>
              <linearGradient id="cardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      ref={cardRef}
      className={`${gradient} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-opacity-20 ${className}`}
      layout
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                cardType === 'revenue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                cardType === 'user-activity' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                cardType === 'conversion' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                cardType === 'performance' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
              <p className="text-xl font-bold text-gray-900 mb-1">{value}</p>
              {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Info Icon with Tooltip */}
            <button
              className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
              onMouseEnter={() => {
                setTooltipData({ info: t('interactiveCard.detailedInfo', { title }) });
                setShowTooltip(true);
              }}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <InformationCircleIcon className="h-5 w-5" />
            </button>
            
            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Controls */}
              <div className="bg-white bg-opacity-30 rounded-lg p-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Time Range Selector */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">{t('interactiveCard.timeRange.label')}:</label>
                    <select
                      value={selectedTimeRange}
                      onChange={(e) => setSelectedTimeRange(e.target.value)}
                      className="bg-white border border-gray-300 text-gray-700 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timeRanges.map(range => (
                        <option key={range.value} value={range.value} className="text-gray-800">
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* View Selector */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">{t('interactiveCard.view.label')}:</label>
                    <select
                      value={selectedView}
                      onChange={(e) => setSelectedView(e.target.value)}
                      className="bg-white border border-gray-300 text-gray-700 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {getViewOptions().map(option => (
                        <option key={option.value} value={option.value} className="text-gray-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleExport('json')}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      <span>{t('interactiveCard.export')}</span>
                    </button>
                    
                    <button
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
                    >
                      <FunnelIcon className="h-4 w-4" />
                      <span>{t('interactiveCard.filter')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Content */}
              <div className="bg-white bg-opacity-40 rounded-lg p-4">
                {renderChart()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && tooltipData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg pointer-events-none"
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y - 10,
              transform: 'translateY(-100%)'
            }}
          >
            <div className="text-sm">
              {tooltipData.info && <p>{tooltipData.info}</p>}
              {tooltipData.name && <p className="font-medium">{tooltipData.name}</p>}
              {tooltipData.value && <p className="text-blue-300">{t('interactiveCard.value')}: {tooltipData.value}</p>}
               {tooltipData.stage && <p className="font-medium">{tooltipData.stage}</p>}
               {tooltipData.percentage && <p className="text-green-300">{t('interactiveCard.rate')}: {tooltipData.percentage}%</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InteractiveAnalyticsCard;
