import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  ResponsiveContainer
} from "recharts";

const DocumentAnalyticsModal = ({ isOpen, onClose, documents = [] }) => {
  const { t } = useTranslation('documents');

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!documents || documents.length === 0) {
      return {
        totalDocuments: 0,
        totalSize: 0,
        typeDistribution: [],
        monthlyUploads: [],
        sizeByType: []
      };
    }

    // Total documents and size
    const totalDocuments = documents.length;
    const totalSize = documents.reduce((acc, doc) => acc + (doc.size || 0), 0);

    // Type distribution
    const typeCount = documents.reduce((acc, doc) => {
      const type = doc.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const typeDistribution = Object.entries(typeCount).map(([type, count]) => ({
      name: type,
      value: count,
      percentage: ((count / totalDocuments) * 100).toFixed(1)
    }));

    // Monthly uploads (last 6 months)
    const now = new Date();
    const monthlyData = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = 0;
    }

    documents.forEach(doc => {
      if (doc.createdAt) {
        const docDate = new Date(doc.createdAt);
        const monthKey = docDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey]++;
        }
      }
    });

    const monthlyUploads = Object.entries(monthlyData).map(([month, count]) => ({
      month,
      uploads: count
    }));

    // Size by type
    const sizeByType = Object.entries(typeCount).map(([type, count]) => {
      const totalSizeForType = documents
        .filter(doc => doc.type === type)
        .reduce((acc, doc) => acc + (doc.size || 0), 0);
      
      return {
        type,
        size: Math.round(totalSizeForType / 1024 / 1024 * 100) / 100, // MB
        count
      };
    });

    return {
      totalDocuments,
      totalSize,
      typeDistribution,
      monthlyUploads,
      sizeByType
    };
  }, [documents]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={onClose}></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
          {/* Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                {t('analytics.title', 'Document Analytics')}
              </h3>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Documents
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {analyticsData.totalDocuments.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Storage
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatFileSize(analyticsData.totalSize)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M13 13h4a2 2 0 012 2v4a2 2 0 01-2 2h-4m-6-4a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          File Types
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {analyticsData.typeDistribution.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Document Type Distribution */}
              <div className="bg-white shadow rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Document Type Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.typeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Upload Trends */}
              <div className="bg-white shadow rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Upload Trends (Last 6 Months)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.monthlyUploads}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="uploads" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Storage by Type */}
              <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Storage Usage by File Type</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.sizeByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'size' ? `${value} MB` : value,
                        name === 'size' ? 'Storage (MB)' : 'File Count'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="size" fill="#8884d8" name="Storage (MB)" />
                    <Bar dataKey="count" fill="#82ca9d" name="File Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalyticsModal;
