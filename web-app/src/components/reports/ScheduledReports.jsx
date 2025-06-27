import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, PlayIcon, PencilIcon, TrashIcon, PauseIcon } from '@heroicons/react/24/outline';

const ScheduledReports = ({ onBack }) => {
  const { t } = useTranslation();

  // Dummy data for scheduled reports
  const schedules = [
    { id: 1, name: 'Monthly Revenue Report', frequency: 'Monthly', nextRun: '2023-10-01 09:00', status: 'active' },
    { id: 2, name: 'Weekly Client Activity', frequency: 'Weekly', nextRun: '2023-09-25 09:00', status: 'active' },
    { id: 3, name: 'Q3 Tax Summary', frequency: 'Quarterly', nextRun: '2023-10-05 12:00', status: 'paused' },
  ];

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <button onClick={onBack} className='flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6'>
        <ArrowLeftIcon className='h-4 w-4 mr-2' />
        Back to Reports Dashboard
      </button>

      <div className='mb-6'>
        <h2 className='text-2xl font-semibold text-gray-800'>Scheduled Reports</h2>
        <p className='mt-1 text-gray-600'>Manage your automated report schedules.</p>
      </div>

      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Report Name</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Frequency</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Next Run</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
              <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {schedules.map(schedule => (
              <tr key={schedule.id}>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{schedule.name}</td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{schedule.frequency}</td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{schedule.nextRun}</td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${schedule.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {schedule.status}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2'>
                  <button className='text-blue-600 hover:text-blue-900'>
                    {schedule.status === 'active' ? <PauseIcon className='h-5 w-5'/> : <PlayIcon className='h-5 w-5' />}
                  </button>
                  <button className='text-gray-600 hover:text-gray-900'><PencilIcon className='h-5 w-5' /></button>
                  <button className='text-red-600 hover:text-red-900'><TrashIcon className='h-5 w-5' /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduledReports;