import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ClockIcon } from '@heroicons/react/24/outline';

const EnhancedKPICard = ({
  title,
  value,
  trend,
  icon,
  format = 'currency',
  color = 'blue',
  subtitle = null,
  showTrend = true,
  className = '',
}) => {
  const { t, i18n } = useTranslation('analytics');
  const formatCurrency = amount => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  };

  const formatPercentage = value => {
    // Converti il valore a numero e gestisci casi edge
    let numValue = 0;
    if (typeof value === 'number' && !isNaN(value)) {
      numValue = value;
    } else if (typeof value === 'string' && value !== '') {
      const parsed = parseFloat(value);
      numValue = isNaN(parsed) ? 0 : parsed;
    } else if (
      value &&
      typeof value === 'object' &&
      Object.prototype.hasOwnProperty.call(value, 'value')
    ) {
      // Caso per oggetti trend: { value: 12.5, positive: true }
      numValue = typeof value.value === 'number' && !isNaN(value.value) ? value.value : 0;
    }
    return `${numValue > 0 ? '+' : ''}${numValue.toFixed(1)}%`;
  };

  const formatValue = val => {
    if (format === 'currency') return formatCurrency(val);
    if (format === 'percentage') return formatPercentage(val);
    if (format === 'number') return new Intl.NumberFormat(i18n.language).format(val || 0);
    return val || 0;
  };

  const getTrendValue = () => {
    if (typeof trend === 'number') return trend;
    if (trend && typeof trend === 'object' && typeof trend.value === 'number') {
      return trend.value;
    }
    return 0;
  };

  const getTrendColor = () => {
    const trendValue = getTrendValue();
    if (trendValue > 0) return 'text-green-600';
    if (trendValue < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    const trendValue = getTrendValue();
    if (trendValue > 0) return ArrowTrendingUpIcon;
    if (trendValue < 0) return ArrowTrendingDownIcon;
    return ClockIcon;
  };

  const getTrendBgColor = () => {
    const trendValue = getTrendValue();
    if (trendValue > 0) return 'bg-green-100/80';
    if (trendValue < 0) return 'bg-red-100/80';
    return 'bg-gray-100/80';
  };

  // Enhanced color classes with gradients and effects
  const getColorClasses = color => {
    const colorMap = {
      blue: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-200',
        cardBg: 'bg-gradient-to-br from-white to-blue-50/30',
        iconGlow: 'shadow-lg shadow-blue-200/50',
        hoverBg: 'hover:from-blue-100 hover:to-blue-200',
        accent: 'bg-blue-500',
        ring: 'ring-blue-200',
        hoverBorder: 'hover:border-blue-300',
      },
      red: {
        bg: 'bg-gradient-to-br from-red-50 to-red-100',
        text: 'text-red-600',
        border: 'border-red-200',
        cardBg: 'bg-gradient-to-br from-white to-red-50/30',
        iconGlow: 'shadow-lg shadow-red-200/50',
        hoverBg: 'hover:from-red-100 hover:to-red-200',
        accent: 'bg-red-500',
        ring: 'ring-red-200',
        hoverBorder: 'hover:border-red-300',
      },
      green: {
        bg: 'bg-gradient-to-br from-green-50 to-green-100',
        text: 'text-green-600',
        border: 'border-green-200',
        cardBg: 'bg-gradient-to-br from-white to-green-50/30',
        iconGlow: 'shadow-lg shadow-green-200/50',
        hoverBg: 'hover:from-green-100 hover:to-green-200',
        accent: 'bg-green-500',
        ring: 'ring-green-200',
        hoverBorder: 'hover:border-green-300',
      },
      purple: {
        bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
        text: 'text-purple-600',
        border: 'border-purple-200',
        cardBg: 'bg-gradient-to-br from-white to-purple-50/30',
        iconGlow: 'shadow-lg shadow-purple-200/50',
        hoverBg: 'hover:from-purple-100 hover:to-purple-200',
        accent: 'bg-purple-500',
        ring: 'ring-purple-200',
        hoverBorder: 'hover:border-purple-300',
      },
      yellow: {
        bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
        text: 'text-yellow-600',
        border: 'border-yellow-200',
        cardBg: 'bg-gradient-to-br from-white to-yellow-50/30',
        iconGlow: 'shadow-lg shadow-yellow-200/50',
        hoverBg: 'hover:from-yellow-100 hover:to-yellow-200',
        accent: 'bg-yellow-500',
        ring: 'ring-yellow-200',
        hoverBorder: 'hover:border-yellow-300',
      },
      gray: {
        bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-200',
        cardBg: 'bg-gradient-to-br from-white to-gray-50/30',
        iconGlow: 'shadow-lg shadow-gray-200/50',
        hoverBg: 'hover:from-gray-100 hover:to-gray-200',
        accent: 'bg-gray-500',
        ring: 'ring-gray-200',
        hoverBorder: 'hover:border-gray-300',
      },
    };
    return colorMap[color] || colorMap.blue;
  };

  const TrendIcon = getTrendIcon();
  const colorClasses = getColorClasses(color);

  // Renderizza l'icona basandosi sul tipo
  const renderIcon = () => {
    if (typeof icon === 'string') {
      // Se è una stringa (emoji), la renderizziamo come testo
      return (
        <span className='text-2xl transition-transform duration-300 group-hover:rotate-12'>
          {icon}
        </span>
      );
    } else if (icon) {
      // Se è un componente React
      const IconComponent = icon;
      return (
        <IconComponent
          className={`h-7 w-7 ${colorClasses.text} transition-transform duration-300 
                                   group-hover:rotate-12`}
        />
      );
    } else {
      // Icona di default se non specificata
      return (
        <span className='text-2xl transition-transform duration-300 group-hover:rotate-12'>📊</span>
      );
    }
  };

  return (
    <div
      className={`dashboard-card ${colorClasses.cardBg} border-2 ${colorClasses.border} 
                    ${colorClasses.hoverBorder} rounded-2xl shadow-lg p-6 
                    hover:shadow-xl hover:-translate-y-1 hover:ring-4 ${colorClasses.ring}
                    relative overflow-hidden group bg-pattern ${className}`}
    >
      {/* Background accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${colorClasses.accent} shimmer`}></div>

      {/* Floating decorative elements - Centered Version */}
      <div
        className={`absolute top-4 right-4 w-16 h-16 ${colorClasses.bg} rounded-full opacity-20 
                       group-hover:opacity-30 transition-opacity duration-300`}
      ></div>
      <div
        className={`absolute bottom-4 left-4 w-10 h-10 ${colorClasses.bg} rounded-full opacity-15
                       group-hover:opacity-25 transition-opacity duration-300`}
      ></div>

      {/* Pulse ring effect */}
      <div className={`pulse-ring w-16 h-16 ${colorClasses.text} top-4 left-4 opacity-20`}></div>

      <div className='relative z-10'>
        <div className='flex items-center justify-between mb-6'>
          <div
            className={`p-4 ${colorClasses.bg} ${colorClasses.hoverBg} rounded-xl 
                          ${colorClasses.iconGlow} group-hover:scale-110 card-icon
                          transition-all duration-300`}
          >
            {renderIcon()}
          </div>

          {showTrend && (
            <div
              className={`flex items-center ${getTrendColor()} ${getTrendBgColor()}
                            backdrop-blur-sm rounded-full px-3 py-1 shadow-sm transition-all duration-300
                            group-hover:scale-105`}
            >
              <TrendIcon className='h-4 w-4 mr-1 animate-pulse' />
              <span className='text-sm font-bold'>{formatPercentage(getTrendValue())}</span>
            </div>
          )}
        </div>

        <div className='space-y-3'>
          <p
            className='text-sm font-medium text-gray-600 tracking-wide uppercase opacity-75 
                       group-hover:opacity-100 transition-opacity duration-300'
          >
            {title}
          </p>
          <p
            className='text-3xl font-black text-gray-900 tracking-tight gradient-text
                       group-hover:scale-105 transition-transform duration-300'
          >
            {formatValue(value)}
          </p>
          {subtitle && <p className='text-xs text-gray-500 font-medium'>{subtitle}</p>}
        </div>

        {/* Progress indicator */}
        <div className='mt-4 pt-3 border-t border-gray-200/50'>
          <div className='flex items-center justify-between text-xs text-gray-500'>
            <span className='font-medium'>{t('kpi.performance')}</span>
            <div className='flex items-center space-x-2'>
              <div
                className={`w-2 h-2 rounded-full ${
                  getTrendValue() > 0
                    ? 'bg-green-400'
                    : getTrendValue() < 0
                      ? 'bg-red-400'
                      : 'bg-gray-300'
                } animate-pulse`}
              ></div>
              <span className='font-bold text-xs'>{t('kpi.vsPreviousMonth')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedKPICard;
