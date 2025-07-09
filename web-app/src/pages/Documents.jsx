import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Footer from '@components/shared/Footer';
import ErrorBoundary from '@components/common/ErrorBoundary';
import {
  CloudArrowUpIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  EyeIcon,
  ShareIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  EllipsisVerticalIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  DocumentArrowUpIcon,
  FolderPlusIcon,
  HomeIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  DocumentIcon as DocumentSolidIcon,
  PhotoIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
} from '@heroicons/react/24/solid';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const Documents = () => {
  const { t } = useTranslation(['documents', 'common']);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [dateRange, setDateRange] = useState('All time');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('All Owners');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Mock data - in real app, this would come from API
  const stats = {
    totalDocuments: 247,
    totalDocumentsIncrease: 15,
    recentUploads: 36,
    recentUploadsIncrease: 8,
    sharedDocuments: 52,
    sharedDocumentsIncrease: 12,
    storageUsed: '4.8GB/10GB',
  };

  const categoryData = {
    labels: ['Contracts (35%)', 'Invoices (25%)', 'Receipts (20%)', 'Other (20%)'],
    datasets: [
      {
        data: [35, 25, 20, 20],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0,
        cutout: '60%',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return context.label || '';
          },
        },
      },
    },
  };

  const recentActivity = [
    {
      id: 1,
      action: 'uploaded',
      document: 'Q2 Financial Report.pdf',
      user: 'You',
      time: '10 minutes ago',
      icon: <DocumentArrowUpIcon className='w-4 h-4' />,
      color: 'text-green-500',
    },
    {
      id: 2,
      action: 'viewed',
      document: 'Client Contract - Acme Corp.docx',
      user: 'John Doe',
      time: '1 hour ago',
      icon: <EyeIcon className='w-4 h-4' />,
      color: 'text-blue-500',
    },
    {
      id: 3,
      action: 'shared',
      document: 'Marketing Presentation.pptx',
      user: 'You',
      time: '2 hours ago',
      icon: <ShareIcon className='w-4 h-4' />,
      color: 'text-purple-500',
    },
    {
      id: 4,
      action: 'edited',
      document: 'Project Proposal.docx',
      user: 'Sarah Johnson',
      time: '5 hours ago',
      icon: <DocumentTextIcon className='w-4 h-4' />,
      color: 'text-orange-500',
    },
    {
      id: 5,
      action: 'deleted',
      document: 'Outdated Guidelines.pdf',
      user: 'Mike Wilson',
      time: '1 day ago',
      icon: <TrashIcon className='w-4 h-4' />,
      color: 'text-red-500',
    },
  ];

  const folders = [
    { id: 'all', name: 'My Documents', count: 162, type: 'all' },
    { id: 'contracts', name: 'Contracts', count: 45, type: 'folder' },
    { id: 'invoices', name: 'Invoices', count: 38, type: 'folder' },
    { id: 'reports', name: 'Reports', count: 24, type: 'folder' },
    { id: 'templates', name: 'Templates', count: 15, type: 'folder' },
    { id: 'shared', name: 'Shared with Me', count: 18, type: 'special' },
    { id: 'favorites', name: 'Favorites', count: 12, type: 'special' },
    { id: 'trash', name: 'Trash', count: 7, type: 'special' },
  ];

  const documents = [
    {
      id: 1,
      name: 'Q2 Financial Report.pdf',
      type: 'PDF',
      size: '3.2 MB',
      dateModified: '10 Jun 2023',
      owner: 'John Doe',
      status: 'Shared',
      actions: ['view', 'download', 'share'],
    },
    {
      id: 2,
      name: 'Client Contract - Acme Corp.docx',
      type: 'Word',
      size: '1.8 MB',
      dateModified: '05 Jun 2023',
      owner: 'Sarah Johnson',
      status: 'Private',
      actions: ['view', 'edit', 'share'],
    },
    {
      id: 3,
      name: 'Marketing Presentation.pptx',
      type: 'PowerPoint',
      size: '5.7 MB',
      dateModified: '01 Jun 2023',
      owner: 'Mike Wilson',
      status: 'Shared',
      actions: ['view', 'download', 'share'],
    },
    {
      id: 4,
      name: 'Project Budget.xlsx',
      type: 'Excel',
      size: '2.3 MB',
      dateModified: '28 May 2023',
      owner: 'John Doe',
      status: 'Private',
      actions: ['view', 'edit', 'share'],
    },
    {
      id: 5,
      name: 'Company Logo.png',
      type: 'Image',
      size: '1.1 MB',
      dateModified: '25 May 2023',
      owner: 'Emily Chen',
      status: 'Archived',
      actions: ['view', 'download'],
    },
    {
      id: 6,
      name: 'Product Specifications.pdf',
      type: 'PDF',
      size: '4.5 MB',
      dateModified: '20 May 2023',
      owner: 'Sarah Johnson',
      status: 'Shared',
      actions: ['view', 'download', 'share'],
    },
    {
      id: 7,
      name: 'User Research Results.zip',
      type: 'Archive',
      size: '8.2 MB',
      dateModified: '15 May 2023',
      owner: 'Mike Wilson',
      status: 'Private',
      actions: ['view', 'download'],
    },
    {
      id: 8,
      name: 'Meeting Notes.docx',
      type: 'Word',
      size: '0.9 MB',
      dateModified: '10 May 2023',
      owner: 'Emily Chen',
      status: 'Shared',
      actions: ['view', 'edit', 'share'],
    },
  ];

  const getFileIcon = type => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <DocumentSolidIcon className='w-5 h-5 text-red-500' />;
      case 'word':
        return <DocumentSolidIcon className='w-5 h-5 text-blue-500' />;
      case 'powerpoint':
        return <PresentationChartBarIcon className='w-5 h-5 text-orange-500' />;
      case 'excel':
        return <TableCellsIcon className='w-5 h-5 text-green-500' />;
      case 'image':
        return <PhotoIcon className='w-5 h-5 text-purple-500' />;
      case 'archive':
        return <ArchiveBoxIcon className='w-5 h-5 text-gray-500' />;
      default:
        return <DocumentSolidIcon className='w-5 h-5 text-gray-500' />;
    }
  };

  const getStatusBadge = status => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'Shared':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Private':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'Archived':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50'>
        {/* Breadcrumb */}
        <div className='bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8'>
          <div className='flex items-center space-x-2 text-nav-text text-gray-700'>
            <HomeIcon className='h-5 w-5 text-gray-500' />
            <button
              onClick={() => navigate('/dashboard')}
              className='text-blue-600 hover:text-blue-700 font-medium transition-colors'
            >
              Dashboard
            </button>
            <ChevronRightIcon className='h-5 w-5 text-gray-400' />
            <span className='font-bold'>{t('title')}</span>
          </div>
        </div>

        {/* Header */}
        <div className='bg-white border-b border-gray-200 px-6 py-4'>
          <div className='flex justify-between items-center'>
            <h1 className='text-page-title font-semibold text-gray-900'>{t('title')}</h1>
            <div className='flex gap-3'>
              <button className='bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors text-body'>
                <CloudArrowUpIcon className='w-5 h-5' />
                Upload Document
              </button>
              <button className='bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-body'>
                Export
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className='grid grid-cols-4 gap-6 mt-6'>
            <div className='bg-white p-4 rounded-lg border border-gray-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-body text-gray-600'>Total Documents</p>
                  <p className='text-page-title font-semibold text-gray-900'>
                    {stats.totalDocuments}
                  </p>
                  <p className='text-caption text-gray-500'>All document types</p>
                </div>
                <div className='bg-blue-100 p-3 rounded-lg'>
                  <DocumentDuplicateIcon className='w-6 h-6 text-blue-600' />
                </div>
              </div>
              <div className='mt-2 flex items-center'>
                <span className='text-green-600 text-body'>
                  ↗ {stats.totalDocumentsIncrease}% increase from last month
                </span>
              </div>
            </div>

            <div className='bg-white p-4 rounded-lg border border-gray-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-body text-gray-600'>Recent Uploads</p>
                  <p className='text-page-title font-semibold text-gray-900'>
                    {stats.recentUploads}
                  </p>
                  <p className='text-caption text-gray-500'>This month</p>
                </div>
                <div className='bg-green-100 p-3 rounded-lg'>
                  <CloudArrowUpIcon className='w-6 h-6 text-green-600' />
                </div>
              </div>
              <div className='mt-2 flex items-center'>
                <span className='text-green-600 text-body'>
                  ↗ {stats.recentUploadsIncrease}% increase from last month
                </span>
              </div>
            </div>

            <div className='bg-white p-4 rounded-lg border border-gray-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-body text-gray-600'>Shared Documents</p>
                  <p className='text-page-title font-semibold text-gray-900'>
                    {stats.sharedDocuments}
                  </p>
                  <p className='text-caption text-gray-500'>With team and clients</p>
                </div>
                <div className='bg-orange-100 p-3 rounded-lg'>
                  <ShareIcon className='w-6 h-6 text-orange-600' />
                </div>
              </div>
              <div className='mt-2 flex items-center'>
                <span className='text-green-600 text-body'>
                  ↗ {stats.sharedDocumentsIncrease}% increase from last month
                </span>
              </div>
            </div>

            <div className='bg-white p-4 rounded-lg border border-gray-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-body text-gray-600'>Storage Used</p>
                  <p className='text-page-title font-semibold text-gray-900'>{stats.storageUsed}</p>
                  <p className='text-caption text-gray-500'>48% of total storage</p>
                </div>
                <div className='bg-purple-100 p-3 rounded-lg'>
                  <ArchiveBoxIcon className='w-6 h-6 text-purple-600' />
                </div>
              </div>
              <div className='mt-2'>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div className='bg-purple-600 h-2 rounded-full' style={{ width: '48%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='flex'>
          {/* Sidebar */}
          <div className='w-64 bg-white border-r border-gray-200 min-h-screen'>
            {/* Folders */}
            <div className='p-4'>
              <h3 className='text-card-title font-semibold text-gray-900 mb-4'>Folders</h3>
              <div className='space-y-1'>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-body rounded-lg transition-colors ${
                      selectedFolder === folder.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className='flex items-center'>
                      <FolderIcon className='w-4 h-4 mr-2' />
                      {folder.name}
                    </div>
                    <span className='text-caption text-gray-500'>{folder.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className='p-4 border-t border-gray-200'>
              <h3 className='text-card-title font-semibold text-gray-900 mb-4'>Filters</h3>

              {/* File Type */}
              <div className='mb-4'>
                <label className='block text-body font-medium text-gray-700 mb-2'>Category</label>
                <div className='relative'>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-body focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option>All Categories</option>
                    <option>Contracts</option>
                    <option>Invoices</option>
                    <option>Reports</option>
                    <option>Templates</option>
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div className='mb-4'>
                <label className='block text-body font-medium text-gray-700 mb-2'>Date Range</label>
                <div className='relative'>
                  <select
                    value={dateRange}
                    onChange={e => setDateRange(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-body focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option>All time</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                    <option>This year</option>
                  </select>
                </div>
              </div>

              {/* Owner */}
              <div className='mb-4'>
                <label className='block text-body font-medium text-gray-700 mb-2'>Owner</label>
                <div className='relative'>
                  <select
                    value={selectedOwner}
                    onChange={e => setSelectedOwner(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-body focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option>All Owners</option>
                    <option>John Doe</option>
                    <option>Sarah Johnson</option>
                    <option>Mike Wilson</option>
                    <option>Emily Chen</option>
                  </select>
                </div>
              </div>

              <button className='w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-body font-medium hover:bg-blue-700 transition-colors'>
                Apply Filters
              </button>

              <button className='w-full mt-2 text-blue-600 text-body font-medium hover:text-blue-700 transition-colors'>
                Clear All
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className='flex-1 p-6'>
            <div className='grid grid-cols-3 gap-6 mb-6'>
              {/* Document Categories Chart */}
              <div className='bg-white p-6 rounded-lg border border-gray-200'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-card-title font-semibold text-gray-900'>
                    Document Categories
                  </h3>
                  <button className='text-blue-600 text-body hover:text-blue-700'>—</button>
                </div>
                <div className='h-48 flex items-center justify-center'>
                  <Doughnut data={categoryData} options={chartOptions} />
                </div>
              </div>

              {/* Recent Activity */}
              <div className='col-span-2 bg-white p-6 rounded-lg border border-gray-200'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-card-title font-semibold text-gray-900'>Recent Activity</h3>
                  <button className='text-blue-600 text-body hover:text-blue-700'>View All</button>
                </div>
                <div className='space-y-3'>
                  {recentActivity.map(activity => (
                    <div key={activity.id} className='flex items-center space-x-3'>
                      <div className={`p-2 rounded-lg bg-gray-50 ${activity.color}`}>
                        {activity.icon}
                      </div>
                      <div className='flex-1'>
                        <p className='text-body text-gray-900'>
                          <span className='font-medium'>{activity.user}</span> {activity.action}{' '}
                          <span className='font-medium'>{activity.document}</span>
                        </p>
                        <p className='text-caption text-gray-500'>{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className='bg-white p-4 rounded-lg border border-gray-200 mb-6'>
              <div className='flex items-center space-x-4'>
                <div className='flex-1 relative'>
                  <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <input
                    type='text'
                    placeholder='Search documents...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-body'
                  />
                </div>
                <div className='flex items-center space-x-2'>
                  <button className='px-3 py-2 text-body text-gray-600 hover:text-gray-900 border-r border-gray-200'>
                    All Types
                  </button>
                  <button className='px-3 py-2 text-body text-gray-600 hover:text-gray-900 border-r border-gray-200'>
                    Last 30 Days
                  </button>
                  <button className='px-3 py-2 text-body text-gray-600 hover:text-gray-900'>
                    Clear
                  </button>
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='text-body text-gray-500'>10 per page</span>
                </div>
              </div>
            </div>

            {/* Documents Table */}
            <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                      Document Name
                    </th>
                    <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                      Type
                    </th>
                    <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                      Date Modified
                    </th>
                    <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                      Owner
                    </th>
                    <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {documents.map(doc => (
                    <tr key={doc.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          {getFileIcon(doc.type)}
                          <div className='ml-3'>
                            <div className='text-body font-medium text-gray-900'>{doc.name}</div>
                            <div className='text-body text-gray-500'>{doc.size}</div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-body text-gray-500'>
                        {doc.type}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-body text-gray-500'>
                        {doc.dateModified}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <div className='w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-caption text-white font-medium mr-2'>
                            {doc.owner
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </div>
                          <span className='text-body text-gray-900'>{doc.owner}</span>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className={getStatusBadge(doc.status)}>{doc.status}</span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-body text-gray-500'>
                        <div className='flex items-center space-x-2'>
                          <button className='text-blue-600 hover:text-blue-900'>
                            <EyeIcon className='w-4 h-4' />
                          </button>
                          <button className='text-gray-600 hover:text-gray-900'>
                            <DocumentDuplicateIcon className='w-4 h-4' />
                          </button>
                          <button className='text-gray-600 hover:text-gray-900'>
                            <ShareIcon className='w-4 h-4' />
                          </button>
                          <button className='text-gray-600 hover:text-gray-900'>
                            <EllipsisVerticalIcon className='w-4 h-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className='mt-6 flex items-center justify-between'>
              <div className='text-body text-gray-700'>
                Showing <span className='font-medium'>1</span> to{' '}
                <span className='font-medium'>8</span> of <span className='font-medium'>24</span>{' '}
                entries
              </div>
              <div className='flex items-center space-x-2'>
                <button className='px-3 py-1 text-body text-gray-500 hover:text-gray-700'>
                  Previous
                </button>
                <button className='px-3 py-1 text-body bg-blue-600 text-white rounded'>1</button>
                <button className='px-3 py-1 text-body text-gray-700 hover:text-gray-900'>2</button>
                <button className='px-3 py-1 text-body text-gray-700 hover:text-gray-900'>3</button>
                <button className='px-3 py-1 text-body text-gray-500 hover:text-gray-700'>
                  Next
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='grid grid-cols-4 gap-4 mt-8'>
              <div className='bg-blue-600 text-white p-6 rounded-lg text-center cursor-pointer hover:bg-blue-700 transition-colors'>
                <CloudArrowUpIcon className='w-8 h-8 mx-auto mb-3' />
                <h3 className='font-semibold mb-2'>Upload Document</h3>
                <p className='text-body opacity-90'>Upload new files to your document storage</p>
                <button className='mt-4 bg-white bg-opacity-20 text-white px-4 py-2 rounded text-body font-medium hover:bg-opacity-30 transition-colors'>
                  Upload Now
                </button>
              </div>

              <div className='bg-green-600 text-white p-6 rounded-lg text-center cursor-pointer hover:bg-green-700 transition-colors'>
                <FolderPlusIcon className='w-8 h-8 mx-auto mb-3' />
                <h3 className='font-semibold mb-2'>Create Folder</h3>
                <p className='text-body opacity-90'>
                  Organize your documents in a folder structure
                </p>
                <button className='mt-4 bg-white bg-opacity-20 text-white px-4 py-2 rounded text-body font-medium hover:bg-opacity-30 transition-colors'>
                  Create Now
                </button>
              </div>

              <div className='bg-orange-600 text-white p-6 rounded-lg text-center cursor-pointer hover:bg-orange-700 transition-colors'>
                <DocumentTextIcon className='w-8 h-8 mx-auto mb-3' />
                <h3 className='font-semibold mb-2'>Request Document</h3>
                <p className='text-body opacity-90'>
                  Request documents from clients or team members
                </p>
                <button className='mt-4 bg-white bg-opacity-20 text-white px-4 py-2 rounded text-body font-medium hover:bg-opacity-30 transition-colors'>
                  Request Now
                </button>
              </div>

              <div className='bg-purple-600 text-white p-6 rounded-lg text-center cursor-pointer hover:bg-purple-700 transition-colors'>
                <ArchiveBoxIcon className='w-8 h-8 mx-auto mb-3' />
                <h3 className='font-semibold mb-2'>Archive</h3>
                <p className='text-body opacity-90'>Archive documents you no longer need</p>
                <button className='mt-4 bg-white bg-opacity-20 text-white px-4 py-2 rounded text-body font-medium hover:bg-opacity-30 transition-colors'>
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default Documents;
