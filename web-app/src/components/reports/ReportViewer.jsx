import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const ReportViewer = ({ report, onBack }) => {
  const { t } = useTranslation();

  // Dummy report data
  const reportData = {
    title: 'Quarterly Financial Summary',
    columns: ['Month', 'Revenue', 'Expenses', 'Profit'],
    rows: [
      ['January', '$10,000', '$3,000', '$7,000'],
      ['February', '$12,500', '$3,500', '$9,000'],
      ['March', '$15,000', '$4,000', '$11,000'],
    ],
  };

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <button onClick={onBack} className='flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6'>
        <ArrowLeftIcon className='h-4 w-4 mr-2' />
        Back to Reports
      </button>

      {/* Report Header and Actions */}
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-semibold text-gray-800'>{reportData.title}</h2>
        <div className='flex items-center space-x-3'>
          <button className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors'>
            <PrinterIcon className='h-6 w-6' />
          </button>
          <button className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors'>
            <DocumentArrowDownIcon className='h-6 w-6' />
          </button>
        </div>
      </div>

      {/* Report Content Table */}
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              {reportData.columns.map(col => (
                <th key={col} scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {reportData.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportViewer;