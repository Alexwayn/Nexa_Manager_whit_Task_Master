import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Footer from '@shared/components/layout/Footer';
import ErrorBoundary from '@shared/components/feedback/ErrorBoundary';
// Add modal imports
import DocumentUploadModal from '@components/documents/DocumentUploadModal';
import CreateFolderModal from '@components/documents/CreateFolderModal';
import ShareDocumentsModal from '@components/documents/ShareDocumentsModal';
import DocumentAnalyticsModal from '@components/documents/DocumentAnalyticsModal';
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
  DocumentPlusIcon,
  FolderPlusIcon,
  HomeIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import {
  DocumentIcon as DocumentSolidIcon,
  PhotoIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
} from '@heroicons/react/24/solid';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import '../styles/typography-improvements.css';

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
  
  // Add modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

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
      actionKey: 'uploaded',
      document: 'Q2 Financial Report.pdf',
      documentKey: 'q2FinancialReport',
      user: 'You',
      time: '10 minutes ago',
      icon: <DocumentArrowUpIcon className='w-4 h-4' />,
      color: 'text-green-500',
    },
    {
      id: 2,
      action: 'viewed',
      actionKey: 'viewed',
      document: 'Client Contract - Acme Corp.docx',
      documentKey: 'clientContractAcme',
      user: 'John Doe',
      time: '1 hour ago',
      icon: <EyeIcon className='w-4 h-4' />,
      color: 'text-blue-500',
    },
    {
      id: 3,
      action: 'shared',
      actionKey: 'shared',
      document: 'Marketing Presentation.pptx',
      documentKey: 'marketingPresentation',
      user: 'You',
      time: '2 hours ago',
      icon: <ShareIcon className='w-4 h-4' />,
      color: 'text-purple-500',
    },
    {
      id: 4,
      action: 'edited',
      actionKey: 'edited',
      document: 'Project Proposal.docx',
      documentKey: 'projectProposal',
      user: 'Sarah Johnson',
      time: '5 hours ago',
      icon: <DocumentTextIcon className='w-4 h-4' />,
      color: 'text-orange-500',
    },
    {
      id: 5,
      action: 'deleted',
      actionKey: 'deleted',
      document: 'Outdated Guidelines.pdf',
      documentKey: 'outdatedGuidelines',
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
      date: '10 Jun 2023',
      owner: 'John Doe',
      status: 'Shared',
      actions: ['view', 'download', 'share'],
    },
    {
      id: 2,
      name: 'Client Contract - Acme Corp.docx',
      type: 'Word',
      size: '1.8 MB',
      date: '05 Jun 2023',
      owner: 'Sarah Johnson',
      status: 'Private',
      actions: ['view', 'edit', 'share'],
    },
    {
      id: 3,
      name: 'Marketing Presentation.pptx',
      type: 'PowerPoint',
      size: '5.7 MB',
      date: '01 Jun 2023',
      owner: 'Mike Wilson',
      status: 'Shared',
      actions: ['view', 'download', 'share'],
    },
    {
      id: 4,
      name: 'Project Budget.xlsx',
      type: 'Excel',
      size: '2.3 MB',
      date: '28 May 2023',
      owner: 'John Doe',
      status: 'Private',
      actions: ['view', 'edit', 'share'],
    },
    {
      id: 5,
      name: 'Company Logo.png',
      type: 'Image',
      size: '1.1 MB',
      date: '25 May 2023',
      owner: 'Emily Chen',
      status: 'Archived',
      actions: ['view', 'download'],
    },
    {
      id: 6,
      name: 'Product Specifications.pdf',
      type: 'PDF',
      size: '4.5 MB',
      date: '20 May 2023',
      owner: 'Sarah Johnson',
      status: 'Shared',
      actions: ['view', 'download', 'share'],
    },
    {
      id: 7,
      name: 'User Research Results.zip',
      type: 'Archive',
      size: '8.2 MB',
      date: '15 May 2023',
      owner: 'Mike Wilson',
      status: 'Private',
      actions: ['view', 'download'],
    },
    {
      id: 8,
      name: 'Meeting Notes.docx',
      type: 'Word',
      size: '0.9 MB',
      date: '10 May 2023',
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

  
  // Handler for document request submission
  const handleSubmitDocumentRequest = async (requestData) => {
    try {
      setLoading(true);

      // Create document request record
      const documentRequest = {
        recipient_email: requestData.recipientEmail,
        recipient_name: requestData.recipientName || null,
        document_type: requestData.documentType || 'other',
        description: requestData.description,
        due_date: requestData.dueDate,
        priority: requestData.priority || 'medium',
        status: 'pending',
        requested_by: 'current_user', // In real app, get from auth context
        requested_at: new Date().toISOString(),
        path: requestData.path || selectedFolder,
        metadata: {
          source: 'documents_page',
          user_agent: navigator.userAgent
        }
      };

      // In a real implementation, this would save to database
      // For now, we'll simulate the API call
      const result = await documentService.createDocument({
        name: `Document Request - ${requestData.description.substring(0, 50)}`,
        type: 'request',
        description: `Document request sent to ${requestData.recipientEmail}`,
        createdBy: 'current_user',
        metadata: documentRequest,
        tags: ['request', requestData.priority]
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create document request');
      }

      // Send notification email to recipient
      try {
        const emailData = {
          recipientEmail: requestData.recipientEmail,
          recipientName: requestData.recipientName || 'Recipient',
          documentType: requestData.documentType || 'document',
          description: requestData.description,
          dueDate: new Date(requestData.dueDate).toLocaleDateString(),
          priority: requestData.priority,
          requesterName: 'Your Name', // In real app, get from user context
          companyName: 'Nexa Manager'
        };

        // Simulate email sending (in real app, use emailService)
        await emailService.sendDocumentRequestEmail(emailData);
      } catch (emailError) {
        console.warn('Email notification failed:', emailError);
        // Don't fail the entire operation if email fails
      }

      // Send in-app notification
      try {
        await sendInAppNotification({
          type: 'document_request_sent',
          title: 'Document Request Sent',
          message: `Document request sent to ${requestData.recipientEmail}`,
          data: {
            requestId: result.data.id,
            recipientEmail: requestData.recipientEmail,
            dueDate: requestData.dueDate
          }
        });
      } catch (notificationError) {
        console.warn('In-app notification failed:', notificationError);
      }

      // Show success message
      toast.success(
        t('notifications.documentRequestSent', 'Document request sent successfully to {{email}}', {
          email: requestData.recipientEmail
        })
      );

      // Log the activity for demo purposes
      console.log('Document request created:', {
        id: result.data.id,
        recipient: requestData.recipientEmail,
        type: requestData.documentType,
        dueDate: requestData.dueDate
      });

    } catch (error) {
      console.error('Error submitting document request:', error);
      toast.error(
        error.message || t('notifications.documentRequestFailed', 'Failed to send document request')
      );
      throw error; // Re-throw to let modal handle the error
    } finally {
      setLoading(false);
    }
  };

  // Handler for archiving documents
  const handleArchiveDocuments = async (archiveData) => {
    try {
      setLoading(true);

      const { documentIds, reason, archivedAt } = archiveData;
      
      if (!documentIds || documentIds.length === 0) {
        throw new Error('No documents selected for archiving');
      }

      // Get documents to be archived for logging
      const documentsToArchive = documents.filter(doc => documentIds.includes(doc.id));
      
      // In a real implementation, this would update multiple documents in the database
      // For now, we'll simulate the batch update operation
      const archivePromises = documentIds.map(async (docId) => {
        const document = documents.find(d => d.id === docId);
        if (!document) {
          throw new Error(`Document with ID ${docId} not found`);
        }

        // Simulate updating document status to archived
        const result = await documentService.updateDocument(docId, {
          status: 'archived',
          archived_at: archivedAt,
          archived_by: 'current_user', // In real app, get from auth context
          archive_reason: reason,
          previous_status: document.status || 'active',
          updated_by: 'current_user'
        });

        if (!result.success) {
          throw new Error(`Failed to archive document: ${document.name}`);
        }

        return result.data;
      });

      // Execute all archive operations
      const results = await Promise.all(archivePromises);

      // Create archive activity log
      const archiveLog = {
        action: 'bulk_archive',
        document_count: documentIds.length,
        document_names: documentsToArchive.map(d => d.name),
        reason: reason || null,
        archived_by: 'current_user',
        archived_at: archivedAt,
        metadata: {
          source: 'documents_page',
          original_statuses: documentsToArchive.map(d => ({ id: d.id, status: d.status }))
        }
      };

      // Log the archive operation (in real app, save to audit log)
      console.log('Documents archived:', archiveLog);

      // Send in-app notification
      try {
        await sendInAppNotification({
          type: 'documents_archived',
          title: 'Documents Archived',
          message: `${documentIds.length} document${documentIds.length > 1 ? 's' : ''} archived successfully`,
          data: {
            documentCount: documentIds.length,
            documentNames: documentsToArchive.map(d => d.name).slice(0, 3), // First 3 names
            reason: reason
          }
        });
      } catch (notificationError) {
        console.warn('In-app notification failed:', notificationError);
      }

      // Show success message
      const documentCount = documentIds.length;
      toast.success(
        t('notifications.documentsArchived', '{{count}} document{{s}} archived successfully', {
          count: documentCount,
          s: documentCount > 1 ? 's' : ''
        })
      );

      // In a real app, you might want to refresh the documents list here
      // or update the local state to reflect the changes
      console.log('Archive operation completed:', {
        archivedCount: results.length,
        documentNames: documentsToArchive.map(d => d.name),
        reason: reason
      });

    } catch (error) {
      console.error('Error archiving documents:', error);
      toast.error(
        error.message || t('notifications.archiveFailed', 'Failed to archive documents')
      );
      throw error; // Re-throw to let modal handle the error
    } finally {
      setLoading(false);
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
              {t('breadcrumb.dashboard')}
            </button>
            <ChevronRightIcon className='h-5 w-5 text-gray-400' />
            <span className='font-bold'>{t('breadcrumb.documents')}</span>
          </div>
        </div>

        {/* Header */}
        <div className='bg-white p-6 rounded-lg border border-gray-200 mb-6'>
          <div className='flex items-center justify-between'>
            <div>
                            <h1 className='text-page-title text-gray-900 mb-2'>{t('header.title')}</h1>
              <p className='text-sm text-gray-600'>Gestisci e organizza tutti i tuoi documenti in un unico posto</p>
            </div>
            <div className='flex items-center space-x-3'>
              <button
                onClick={() => setShowUploadModal(true)}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg text-button-text font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2'
              >
                <CloudArrowUpIcon className='w-5 h-5' />
                <span>{t('header.uploadDocument')}</span>
              </button>
              <button className='text-gray-600 hover:text-gray-900 text-button-text'>
                {t('header.export')}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-4 gap-6 mt-6'>
          {/* Total Documents Card */}
          <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-200 hover:border-blue-300'>
            <div className='flex items-start justify-between mb-2'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
                  <DocumentDuplicateIcon className='w-6 h-6 text-white' />
                </div>
                <div>
                  <p className='text-card-title text-blue-700'>{t('statistics.totalDocuments')}</p>
                  <p className='text-card-metric text-blue-900'>
                    {stats.totalDocuments}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-badge font-semibold shadow-sm'>
                <ArrowUpIcon className='w-3 h-3' />
                +{stats.totalDocumentsIncrease}%
              </div>
            </div>
            <div className='w-full bg-blue-200 rounded-full h-3 mb-2 shadow-inner'>
              <div
                className='bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm'
                style={{ width: '82%' }}
              ></div>
            </div>
            <div className='flex justify-between text-badge text-blue-600 font-medium'>
              <span>{t('statistics.totalDocumentsDescription')}</span>
              <span>82% {t('statistics.ofTarget', { defaultValue: 'of target' })}</span>
            </div>
          </div>

          {/* Recent Uploads Card */}
          <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-200 hover:border-green-300'>
            <div className='flex items-start justify-between mb-2'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
                  <CloudArrowUpIcon className='w-6 h-6 text-white' />
                </div>
                <div>
                  <p className='text-card-title text-green-700'>{t('statistics.recentUploads')}</p>
                  <p className='text-card-metric text-green-900'>
                    {stats.recentUploads}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-badge font-semibold shadow-sm'>
                <ArrowUpIcon className='w-3 h-3' />
                +{stats.recentUploadsIncrease}%
              </div>
            </div>
            <div className='w-full bg-green-200 rounded-full h-3 mb-2 shadow-inner'>
              <div
                className='bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full shadow-sm'
                style={{ width: '65%' }}
              ></div>
            </div>
            <div className='flex justify-between text-badge text-green-600 font-medium'>
              <span>{t('statistics.recentUploadsDescription')}</span>
              <span>65% {t('statistics.ofTarget', { defaultValue: 'of target' })}</span>
            </div>
          </div>

          {/* Shared Documents Card */}
          <div className='bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-orange-200 hover:border-orange-300'>
            <div className='flex items-start justify-between mb-2'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
                  <ShareIcon className='w-6 h-6 text-white' />
                </div>
                <div>
                  <p className='text-card-title text-orange-700'>{t('statistics.sharedDocuments')}</p>
                  <p className='text-card-metric text-orange-900'>
                    {stats.sharedDocuments}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-badge font-semibold shadow-sm'>
                <ArrowUpIcon className='w-3 h-3' />
                +{stats.sharedDocumentsIncrease}%
              </div>
            </div>
            <div className='w-full bg-orange-200 rounded-full h-3 mb-2 shadow-inner'>
              <div
                className='bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full shadow-sm'
                style={{ width: '78%' }}
              ></div>
            </div>
            <div className='flex justify-between text-badge text-orange-600 font-medium'>
              <span>{t('statistics.sharedDocumentsDescription')}</span>
              <span>78% {t('statistics.ofTarget', { defaultValue: 'of target' })}</span>
            </div>
          </div>

          {/* Storage Used Card */}
          <div className='bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-200 hover:border-purple-300'>
            <div className='flex items-start justify-between mb-2'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
                  <ArchiveBoxIcon className='w-6 h-6 text-white' />
                </div>
                <div>
                  <p className='text-card-title text-purple-700'>{t('statistics.storageUsed')}</p>
                  <p className='text-card-metric text-purple-900'>{stats.storageUsed}</p>
                </div>
              </div>
              <div className='flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded-full text-badge font-semibold shadow-sm'>
                <ExclamationTriangleIcon className='w-3 h-3' />
                {t('statistics.alert', { defaultValue: 'Alert' })}
              </div>
            </div>
            <div className='w-full bg-purple-200 rounded-full h-3 mb-2 shadow-inner'>
              <div
                className='bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full shadow-sm'
                style={{ width: '48%' }}
              ></div>
            </div>
            <div className='flex justify-between text-badge text-purple-600 font-medium'>
              <span>{t('statistics.storageUsedDescription', { percentage: 48 })}</span>
              <span>48% {t('statistics.ofCapacity', { defaultValue: 'of capacity' })}</span>
            </div>
                    </div>
        </div>

        {/* Action Cards */}
        <div className='grid grid-cols-4 gap-6 mb-6 mt-4'>
          {/* Upload Document Card */}
          <div className='group relative bg-gradient-to-br from-[#4F46E5] to-[#357AF3] rounded-2xl p-4 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full'>
            {/* Background Pattern */}
            <div className='absolute inset-0 opacity-10'>
              <div className='absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16'></div>
              <div className='absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12'></div>
              <div className='absolute top-1/2 right-0 w-16 h-16 bg-white rounded-full translate-x-8'></div>
            </div>
            <div className='relative z-10 flex flex-col h-full'>
              <div className='flex items-start justify-between mb-2'>
                <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm'>
                  <CloudArrowUpIcon className='w-5 h-5 text-white' />
                </div>
                <div className='px-2 py-1 bg-white/20 rounded-md text-xs font-medium backdrop-blur-sm'>
                  File
                </div>
              </div>
              <div className='flex-1 flex flex-col justify-center'>
                <h3 className='text-action-title font-semibold mb-1'>{t('actionCards.uploadDocument.title')}</h3>
                <p className='text-action-description text-white/90 text-sm mb-3'>{t('actionCards.uploadDocument.description')}</p>
              </div>
              <button 
                onClick={() => setShowUploadModal(true)}
                className='w-full bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm rounded-lg py-2 px-4 text-white text-button-text font-medium transition-all duration-200 hover:scale-105'
              >
                {t('actionCards.uploadDocument.button')}
              </button>
            </div>
          </div>

          {/* Create Folder Card */}
          <div className='group relative bg-gradient-to-br from-[#059669] to-[#10B981] rounded-2xl p-4 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full'>
            {/* Background Pattern */}
            <div className='absolute inset-0 opacity-10'>
              <div className='absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16'></div>
              <div className='absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12'></div>
              <div className='absolute top-1/2 right-0 w-16 h-16 bg-white rounded-full translate-x-8'></div>
            </div>
            <div className='relative z-10 flex flex-col h-full'>
              <div className='flex items-start justify-between mb-2'>
                <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm'>
                  <FolderPlusIcon className='w-5 h-5 text-white' />
                </div>
                <div className='px-2 py-1 bg-white/20 rounded-md text-xs font-medium backdrop-blur-sm'>
                  Folder
                </div>
              </div>
              <div className='flex-1 flex flex-col justify-center'>
                <h3 className='text-action-title font-semibold mb-1'>{t('actionCards.createFolder.title')}</h3>
                <p className='text-action-description text-white/90 text-sm mb-3'>{t('actionCards.createFolder.description')}</p>
              </div>
              <button 
                onClick={() => setShowCreateFolderModal(true)}
                className='w-full bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm rounded-lg py-2 px-4 text-white text-button-text font-medium transition-all duration-200 hover:scale-105'
              >
                {t('actionCards.createFolder.button')}
              </button>
            </div>
          </div>

          {/* Request Document Card */}
          <div className='group relative bg-gradient-to-br from-[#D97706] to-[#F59E0B] rounded-2xl p-4 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full'>
            {/* Background Pattern */}
            <div className='absolute inset-0 opacity-10'>
              <div className='absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16'></div>
              <div className='absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12'></div>
              <div className='absolute top-1/2 right-0 w-16 h-16 bg-white rounded-full translate-x-8'></div>
            </div>
            <div className='relative z-10 flex flex-col h-full'>
              <div className='flex items-start justify-between mb-2'>
                <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm'>
                  <DocumentPlusIcon className='w-5 h-5 text-white' />
                </div>
                <div className='px-2 py-1 bg-white/20 rounded-md text-xs font-medium backdrop-blur-sm'>
                  Request
                </div>
              </div>
              <div className='flex-1 flex flex-col justify-center'>
                <h3 className='text-action-title font-semibold mb-1'>{t('actionCards.requestDocument.title')}</h3>
                <p className='text-action-description text-white/90 text-sm mb-3'>{t('actionCards.requestDocument.description')}</p>
              </div>
              <button className='w-full bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm rounded-lg py-2 px-4 text-white text-button-text font-medium transition-all duration-200 hover:scale-105'>
                {t('actionCards.requestDocument.button')}
              </button>
            </div>
          </div>

          {/* Archive Card */}
          <div className='group relative bg-gradient-to-br from-[#7C3AED] to-[#A855F7] rounded-2xl p-4 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full'>
            {/* Background Pattern */}
            <div className='absolute inset-0 opacity-10'>
              <div className='absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16'></div>
              <div className='absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12'></div>
              <div className='absolute top-1/2 right-0 w-16 h-16 bg-white rounded-full translate-x-8'></div>
            </div>
            <div className='relative z-10 flex flex-col h-full'>
              <div className='flex items-start justify-between mb-2'>
                <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm'>
                  <ArchiveBoxIcon className='w-5 h-5 text-white' />
                </div>
                <div className='px-2 py-1 bg-white/20 rounded-md text-xs font-medium backdrop-blur-sm'>
                  Archive
                </div>
              </div>
              <div className='flex-1 flex flex-col justify-center'>
                <h3 className='text-action-title font-semibold mb-1'>{t('actionCards.archive.title')}</h3>
                <p className='text-action-description text-white/90 text-sm mb-3'>{t('actionCards.archive.description')}</p>
              </div>
              <button className='w-full bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm rounded-lg py-2 px-4 text-white text-button-text font-medium transition-all duration-200 hover:scale-105'>
                {t('actionCards.archive.button')}
              </button>
            </div>
          </div>
        </div>

                        <div className='flex'>
          {/* Sidebar */}
          <div className='w-80 bg-white rounded-lg border border-gray-200 mt-6'>
            {/* Folders */}
            <div className='p-4'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-section-title text-gray-900'>{t('sidebar.folders')}</h3>
                <button
                  onClick={() => setShowCreateFolderModal(true)}
                  className='text-blue-600 hover:text-blue-700 text-nav-text'
                >
                  <FolderPlusIcon className='w-5 h-5' />
                </button>
              </div>
              <div className='space-y-2'>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    className='w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-center text-nav-text text-gray-700'>
                      <FolderIcon className='w-4 h-4 mr-2' />
                      {t(`foldersList.${folder.id}`, { defaultValue: folder.name })}
                    </div>
                    <span className='text-subtitle text-gray-500'>{folder.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className='p-4 border-t border-gray-200'>
              <h3 className='text-section-title text-gray-900 mb-4'>{t('sidebar.filters')}</h3>

              {/* File Type */}
              <div className='mb-4'>
                <label className='block text-nav-text font-medium text-gray-700 mb-2'>{t('sidebar.category')}</label>
                <div className='relative'>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-nav-text focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option>{t('categories.allCategories')}</option>
                    <option>{t('categories.contracts')}</option>
                    <option>{t('categories.invoices')}</option>
                    <option>{t('categories.reports')}</option>
                    <option>{t('categories.templates')}</option>
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div className='mb-4'>
                <label className='block text-nav-text font-medium text-gray-700 mb-2'>{t('sidebar.dateRange')}</label>
                <div className='relative'>
                  <select
                    value={dateRange}
                    onChange={e => setDateRange(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-nav-text focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option>{t('dateRanges.allTime')}</option>
                    <option>{t('dateRanges.last7Days')}</option>
                    <option>{t('dateRanges.last30Days')}</option>
                    <option>{t('dateRanges.last3Months')}</option>
                    <option>{t('dateRanges.thisYear')}</option>
                  </select>
                </div>
              </div>

              {/* Owner */}
              <div className='mb-4'>
                <label className='block text-nav-text font-medium text-gray-700 mb-2'>{t('sidebar.owner')}</label>
                <div className='relative'>
                  <select
                    value={selectedOwner}
                    onChange={e => setSelectedOwner(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-nav-text focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option>{t('owners.allOwners')}</option>
                    <option>{t('owners.johnDoe')}</option>
                    <option>{t('owners.sarahJohnson')}</option>
                    <option>{t('owners.mikeWilson')}</option>
                    <option>{t('owners.emilychen')}</option>
                  </select>
                </div>
              </div>

              <button className='w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-button-text font-medium hover:bg-blue-700 transition-colors'>
                {t('sidebar.applyFilters')}
              </button>

              <button className='w-full mt-2 text-blue-600 text-button-text font-medium hover:text-blue-700 transition-colors'>
                {t('sidebar.clearAll')}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className='flex-1 p-6'>
            <div className='grid grid-cols-3 gap-6 mb-6'>
              {/* Document Categories Chart */}
              <div className='bg-white p-6 rounded-lg border border-gray-200'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-section-title text-gray-900'>
                    {t('analytics.documentCategories')}
                  </h3>
                  <button className='text-blue-600 text-nav-text hover:text-blue-700'>{t('analytics.viewAll')}</button>
                </div>
                <div className='h-48 flex items-center justify-center'>
                  <Doughnut data={categoryData} options={chartOptions} />
                </div>
              </div>

              {/* Recent Activity */}
              <div className='col-span-2 bg-white p-6 rounded-lg border border-gray-200'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-section-title text-gray-900'>{t('analytics.recentActivity')}</h3>
                  <button className='text-blue-600 text-nav-text hover:text-blue-700'>{t('analytics.viewAll')}</button>
                </div>
                <div className='space-y-3'>
                  {recentActivity.map(activity => (
                    <div key={activity.id} className='flex items-center space-x-3'>
                      <div className={`p-2 rounded-lg bg-gray-50 ${activity.color}`}>
                        {activity.icon}
                      </div>
                      <div className='flex-1'>
                        <p className='text-nav-text text-gray-900'>
                          <span className='font-medium'>{activity.user}</span> {t(`recentActivity.actions.${activity.actionKey}`, { defaultValue: activity.action })}{' '}
                          <span className='font-medium'>{t(`recentActivity.documents.${activity.documentKey}`, { defaultValue: activity.document })}</span>
                        </p>
                        <p className='text-subtitle text-gray-500'>{activity.time}</p>
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
                    placeholder={t('searchAndFilters.searchPlaceholder')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-nav-text'
                  />
                </div>
                <div className='flex items-center space-x-2'>
                  <button className='px-3 py-2 text-nav-text text-gray-600 hover:text-gray-900 border-r border-gray-200'>
                    {t('searchAndFilters.allTypes')}
                  </button>
                  <button className='px-3 py-2 text-nav-text text-gray-600 hover:text-gray-900 border-r border-gray-200'>
                    {t('searchAndFilters.last30Days')}
                  </button>
                  <button className='px-3 py-2 text-nav-text text-gray-600 hover:text-gray-900'>
                    {t('searchAndFilters.clear')}
                  </button>
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='text-nav-text text-gray-500'>{t('searchAndFilters.perPage', { count: 10 })}</span>
                </div>
              </div>
            </div>

            {/* Documents Table */}
            <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                      {t('table.headers.documentName')}
                    </th>
                    <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                      {t('table.headers.type')}
                    </th>
                    <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                      {t('table.headers.dateModified')}
                    </th>
                    <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                      {t('table.headers.owner')}
                    </th>
                    <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                      {t('table.headers.status')}
                    </th>
                    <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                      {t('table.headers.actions')}
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
                            <div className='text-nav-text font-medium text-gray-900'>{doc.name}</div>
                            <div className='text-subtitle text-gray-500'>{doc.size}</div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-metric-small font-medium bg-blue-100 text-blue-800'>
                          {t(`fileTypes.${doc.type}`, { defaultValue: doc.type })}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-nav-text text-gray-900'>{doc.date}</td>
                      <td className='px-6 py-4 whitespace-nowrap text-nav-text text-gray-900'>{doc.owner}</td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-metric-small font-medium ${
                          doc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {t(`statuses.${doc.status}`, { defaultValue: doc.status })}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-nav-text font-medium'>
                        <button className='text-blue-600 hover:text-blue-900 mr-3'>
                          {t('table.actions.view')}
                        </button>
                        <button className='text-gray-600 hover:text-gray-900'>
                          <EllipsisHorizontalIcon className='w-5 h-5' />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className='bg-white px-4 py-3 border-t border-gray-200 sm:px-6'>
              <div className='flex items-center justify-between'>
                <div className='flex-1 flex justify-between sm:hidden'>
                  <button className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-nav-text font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'>
                    {t('pagination.previous')}
                  </button>
                  <button className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-nav-text font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'>
                    {t('pagination.next')}
                  </button>
                </div>
                <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-nav-text text-gray-700'>
                      {t('pagination.showing')} <span className='font-medium'>1</span> {t('pagination.to')} <span className='font-medium'>10</span> {t('pagination.of')}{' '}
                      <span className='font-medium'>{documents.length}</span> {t('pagination.entries')}
                    </p>
                  </div>
                  <div>
                    <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px' aria-label='Pagination'>
                      <button className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-nav-text font-medium text-gray-500 hover:bg-gray-50'>
                        {t('pagination.previous')}
                      </button>
                      <button className='relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-nav-text font-medium text-gray-700 hover:bg-gray-50'>
                        1
                      </button>
                      <button className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-nav-text font-medium text-gray-500 hover:bg-gray-50'>
                        {t('pagination.next')}
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            
          </div>
        </div>

        {/* Footer */}
        <Footer />

        {/* Modals */}
        {showUploadModal && (
          <DocumentUploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUpload={(files) => {
              // Handle file upload logic here
              console.log('Files uploaded:', files);
              setShowUploadModal(false);
            }}
          />
        )}

        {showCreateFolderModal && (
          <CreateFolderModal
            isOpen={showCreateFolderModal}
            onClose={() => setShowCreateFolderModal(false)}
            onCreateFolder={(folderData) => {
              // Handle folder creation logic here
              console.log('Folder created:', folderData);
              setShowCreateFolderModal(false);
            }}
          />
        )}

        {showShareModal && (
          <ShareDocumentsModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            documents={selectedDocuments}
            onShare={(shareData) => {
              // Handle document sharing logic here
              console.log('Documents shared:', shareData);
              setShowShareModal(false);
            }}
          />
        )}

        {showAnalyticsModal && (
          <DocumentAnalyticsModal
            isOpen={showAnalyticsModal}
            onClose={() => setShowAnalyticsModal(false)}
            documents={documents}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Documents;