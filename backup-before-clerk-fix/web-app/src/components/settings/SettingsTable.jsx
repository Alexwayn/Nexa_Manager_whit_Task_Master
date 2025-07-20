import React from 'react';
import { useTranslation } from 'react-i18next';

const SettingsTable = ({
  headers,
  data,
  renderRow,
  emptyMessage,
  isLoading = false,
  className = '',
  tableClassName = '',
}) => {
  const { t } = useTranslation('settings');

  if (isLoading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>{emptyMessage || t('table.emptyMessage')}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-md border border-gray-200 ${className}`}>
      <table className={`min-w-full divide-y divide-gray-200 ${tableClassName}`}>
        {headers && headers.length > 0 && (
          <thead className='bg-gray-50'>
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  scope='col'
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    header.className || ''
                  }`}
                >
                  {header.label || header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className='bg-white divide-y divide-gray-200'>
          {data.map((item, index) => (
            <tr key={item.id || index} className='hover:bg-gray-50'>
              {renderRow ? (
                renderRow(item, index)
              ) : (
                <td colSpan={headers?.length || 1} className='px-6 py-4 text-sm text-gray-500'>
                  {t('table.noRenderFunction')}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SettingsTable;
