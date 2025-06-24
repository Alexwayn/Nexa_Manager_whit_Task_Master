import React from 'react';
import { useTranslation } from 'react-i18next';
import ExportButtons from '@components/ExportButtons';

const ReportHeader = ({
  title,
  subtitle,
  dateRange,
  exportData,
  exportType = 'report',
  showExport = true,
  gradientFrom = 'blue-600',
  gradientTo = 'purple-600',
  className = '',
}) => {
  const { t, i18n } = useTranslation('reports');
  return (
    <div
      className={`bg-gradient-to-r from-${gradientFrom} to-${gradientTo} rounded-lg p-6 text-white ${className}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          {subtitle && <p className="text-blue-100 opacity-90">{subtitle}</p>}
          {dateRange && (
            <p className="text-blue-100 opacity-90">
              {typeof subtitle === 'string'
                ? subtitle
                : t('header.dateRange', {
                    startDate: new Date(dateRange.startDate).toLocaleDateString(i18n.language),
                    endDate: new Date(dateRange.endDate).toLocaleDateString(i18n.language),
                  })}
            </p>
          )}
        </div>
        {showExport && exportData && (
          <div className="flex-shrink-0 ml-4">
            <ExportButtons
              data={exportData}
              type={exportType}
              filename={`${exportType}-${dateRange?.startDate || 'report'}-${dateRange?.endDate || new Date().toISOString().split('T')[0]}`}
              period={dateRange}
              showReportOptions={true}
              className="flex-shrink-0"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportHeader;
