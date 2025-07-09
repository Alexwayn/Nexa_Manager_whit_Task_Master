import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import emailQueueService from '@lib/emailQueueService';
import { useTranslation } from 'react-i18next';

const EmailQueueManager = () => {
  const { t } = useTranslation('email');
  const [queueStatus, setQueueStatus] = useState(null);
  const [queueMetrics, setQueueMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    loadQueueData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadQueueData, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const loadQueueData = async () => {
    try {
      const [status, metrics] = await Promise.all([
        Promise.resolve(emailQueueService.getQueueStatus()),
        emailQueueService.getQueueMetrics(),
      ]);

      setQueueStatus(status);
      setQueueMetrics(metrics.success ? metrics.data : null);
    } catch (error) {
      console.error('Error loading queue data:', error);
    }
  };

  const handleStartQueue = () => {
    emailQueueService.startQueue();
    loadQueueData();
  };

  const handleStopQueue = () => {
    emailQueueService.stopQueue();
    loadQueueData();
  };

  const handleRetryFailed = async () => {
    if (!confirm('Retry all failed campaigns?')) return;

    setLoading(true);
    try {
      const result = await emailQueueService.retryFailedCampaigns();
      if (result.success) {
        alert('Failed campaigns retry initiated');
        loadQueueData();
      } else {
        alert(`Error: ${String(result?.error || 'Unknown error')}`);
      }
    } catch (error) {
      alert(`Error: ${String(error?.message || error || 'Unknown error')}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessNow = async () => {
    if (!confirm('Process queue manually now?')) return;

    setLoading(true);
    try {
      await emailQueueService.processQueue();
      alert('Queue processed successfully');
      loadQueueData();
    } catch (error) {
      alert(`Error: ${String(error?.message || error || 'Unknown error')}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndicator = (isRunning, isProcessing) => {
    if (isProcessing) {
      return (
        <div className='flex items-center text-blue-600'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2'></div>
          Processing
        </div>
      );
    }

    if (isRunning) {
      return (
        <div className='flex items-center text-green-600'>
          <CheckCircleIcon className='h-4 w-4 mr-2' />
          Running
        </div>
      );
    }

    return (
      <div className='flex items-center text-red-600'>
        <ExclamationTriangleIcon className='h-4 w-4 mr-2' />
        Stopped
      </div>
    );
  };

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold flex items-center'>
            <ClockIcon className='h-6 w-6 mr-2' />
            Email Queue Manager
          </h1>
          <p className='text-gray-600'>Monitor and control scheduled email campaigns</p>
        </div>

        <div className='flex space-x-3'>
          <button
            onClick={() => loadQueueData()}
            className='px-3 py-2 text-gray-600 hover:text-gray-800 border rounded-lg'
          >
            <ArrowPathIcon className='h-4 w-4' />
          </button>

          {queueStatus?.isRunning ? (
            <button
              onClick={handleStopQueue}
              className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center'
            >
              <PauseIcon className='h-4 w-4 mr-2' />
              Stop Queue
            </button>
          ) : (
            <button
              onClick={handleStartQueue}
              className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center'
            >
              <PlayIcon className='h-4 w-4 mr-2' />
              Start Queue
            </button>
          )}
        </div>
      </div>

      {/* Queue Status */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-lg font-medium mb-4'>Queue Status</h2>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='bg-gray-50 p-4 rounded-lg'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-sm text-gray-600'>Status</div>
                {queueStatus && getStatusIndicator(queueStatus.isRunning, queueStatus.isProcessing)}
              </div>
              <CogIcon className='h-8 w-8 text-gray-400' />
            </div>
          </div>

          <div className='bg-blue-50 p-4 rounded-lg'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-2xl font-bold text-blue-600'>
                  {queueMetrics?.totalScheduled || 0}
                </div>
                <div className='text-sm text-gray-600'>Total Scheduled</div>
              </div>
              <CalendarIcon className='h-8 w-8 text-blue-400' />
            </div>
          </div>

          <div className='bg-orange-50 p-4 rounded-lg'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-2xl font-bold text-orange-600'>
                  {queueMetrics?.overdue || 0}
                </div>
                <div className='text-sm text-gray-600'>Overdue</div>
              </div>
              <ExclamationTriangleIcon className='h-8 w-8 text-orange-400' />
            </div>
          </div>

          <div className='bg-green-50 p-4 rounded-lg'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-2xl font-bold text-green-600'>
                  {queueStatus?.stats?.processed || 0}
                </div>
                <div className='text-sm text-gray-600'>Processed</div>
              </div>
              <CheckCircleIcon className='h-8 w-8 text-green-400' />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Actions */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-lg font-medium mb-4'>Queue Actions</h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <button
            onClick={handleProcessNow}
            disabled={loading || queueStatus?.isProcessing}
            className='p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <BoltIcon className='h-8 w-8 text-blue-500 mx-auto mb-2' />
            <div className='font-medium text-blue-700'>Process Now</div>
            <div className='text-sm text-gray-600'>Manually trigger queue processing</div>
          </button>

          <button
            onClick={handleRetryFailed}
            disabled={loading}
            className='p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <ArrowPathIcon className='h-8 w-8 text-orange-500 mx-auto mb-2' />
            <div className='font-medium text-orange-700'>Retry Failed</div>
            <div className='text-sm text-gray-600'>Retry all failed campaigns</div>
          </button>

          <button
            onClick={() => loadQueueData()}
            className='p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50'
          >
            <ChartBarIcon className='h-8 w-8 text-gray-500 mx-auto mb-2' />
            <div className='font-medium text-gray-700'>Refresh Data</div>
            <div className='text-sm text-gray-600'>Update queue statistics</div>
          </button>
        </div>
      </div>

      {/* Next Campaign */}
      {queueMetrics?.nextCampaign && (
        <div className='bg-white rounded-lg shadow p-6'>
          <h2 className='text-lg font-medium mb-4'>Next Scheduled Campaign</h2>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='font-medium text-blue-900'>{queueMetrics.nextCampaign.name}</h3>
                <p className='text-sm text-blue-700 mt-1'>
                  Scheduled for: {new Date(queueMetrics.nextCampaign.scheduled_at).toLocaleString()}
                </p>
                <p className='text-xs text-blue-600 mt-1'>
                  Recipients: {queueMetrics.nextCampaign.recipients?.length || 0}
                </p>
              </div>
              <CalendarIcon className='h-8 w-8 text-blue-400' />
            </div>
          </div>
        </div>
      )}

      {/* Processing Statistics */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-lg font-medium mb-4'>Processing Statistics</h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {queueStatus?.stats?.processed || 0}
            </div>
            <div className='text-sm text-gray-600'>Successfully Processed</div>
          </div>

          <div className='text-center'>
            <div className='text-2xl font-bold text-red-600'>{queueStatus?.stats?.failed || 0}</div>
            <div className='text-sm text-gray-600'>Failed</div>
          </div>

          <div className='text-center'>
            <div className='text-sm text-gray-600'>Last Processed</div>
            <div className='font-medium'>
              {queueStatus?.stats?.lastProcessed
                ? new Date(queueStatus.stats.lastProcessed).toLocaleString()
                : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-lg font-medium mb-4'>System Information</h2>

        <div className='space-y-3 text-sm'>
          <div className='flex justify-between'>
            <span className='text-gray-600'>Queue Processor:</span>
            <span className={queueStatus?.isRunning ? 'text-green-600' : 'text-red-600'}>
              {queueStatus?.isRunning ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className='flex justify-between'>
            <span className='text-gray-600'>Check Interval:</span>
            <span className='text-gray-900'>60 seconds</span>
          </div>

          <div className='flex justify-between'>
            <span className='text-gray-600'>Next Check:</span>
            <span className='text-gray-900'>
              {queueStatus?.nextCheck
                ? new Date(queueStatus.nextCheck).toLocaleTimeString()
                : 'N/A'}
            </span>
          </div>

          <div className='flex justify-between'>
            <span className='text-gray-600'>Auto-refresh:</span>
            <span className='text-green-600'>Every 30 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailQueueManager;
