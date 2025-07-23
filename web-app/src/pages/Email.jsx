import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Footer from '@components/shared/Footer';
import {
  PencilIcon,
  InboxIcon,
  StarIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  TrashIcon,
  ChevronRightIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  ArchiveBoxIcon,
  FlagIcon,
  ArrowUturnLeftIcon,
  PaperClipIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  FolderIcon,
  TagIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, CheckIcon } from '@heroicons/react/24/solid';
import { useEmailContext } from '@context/EmailContext';
import { useEmails } from '@hooks/useEmails';
import { useEmailComposer } from '@hooks/useEmailComposer';
import EmailComposer from '@components/email/EmailComposer';
import EmailSettings from '@components/email/EmailSettings';
import EmailSecuritySettings from '@components/EmailSecuritySettings';
import EmailSecurityIndicator from '@components/EmailSecurityIndicator';
import AutomationDashboard from '@components/email/AutomationDashboard';
import emailManagementService from '@lib/emailManagementService';

export default function Email() {
  const { t } = useTranslation('email');
  const navigate = useNavigate();
  
  // Email context and hooks
  const {
    emails,
    selectedEmail,
    emailsLoading,
    emailsError,
    folders,
    selectedFolder,
    searchQuery: contextSearchQuery,
    filters,
    composerOpen,
    selectEmail,
    selectFolder,
    setSearchQuery,
    openComposer,
    closeComposer,
    refresh,
    loadEmails,
  } = useEmailContext();

  const {
    markAsRead,
    deleteEmail,
    sendEmail,
    loadMore,
    hasMoreEmails,
  } = useEmails();

  const {
    emailData: composerData,
    setEmailData: setComposerData,
    sendEmail: sendComposerEmail,
    saveDraft,
    isValid: isComposerValid,
    loading: composerLoading,
  } = useEmailComposer();
  
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [replyText, setReplyText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const replyInputRef = useRef(null);

  // Get emails from context and apply filters
  const filteredEmails = React.useMemo(() => {
    let filtered = emails;

    // Apply folder filter
    if (selectedFolder !== 'inbox') {
      filtered = filtered.filter(email => {
        switch (selectedFolder) {
          case 'sent':
            return email.folder === 'sent';
          case 'drafts':
            return email.folder === 'drafts';
          case 'spam':
            return email.folder === 'spam';
          case 'trash':
            return email.folder === 'trash';
          case 'starred':
            return email.isStarred;
          default:
            return email.folder === selectedFolder;
        }
      });
    }

    // Apply search filter
    if (contextSearchQuery) {
      const query = contextSearchQuery.toLowerCase();
      filtered = filtered.filter(email =>
        email.subject?.toLowerCase().includes(query) ||
        email.sender?.toLowerCase().includes(query) ||
        email.preview?.toLowerCase().includes(query) ||
        email.content?.toLowerCase().includes(query)
      );
    }

    // Apply other filters
    if (filters.isRead !== null) {
      filtered = filtered.filter(email => email.isRead === filters.isRead);
    }

    if (filters.isStarred !== null) {
      filtered = filtered.filter(email => email.isStarred === filters.isStarred);
    }

    if (filters.hasAttachments !== null) {
      filtered = filtered.filter(email => 
        filters.hasAttachments ? email.attachments?.length > 0 : !email.attachments?.length
      );
    }

    if (filters.labels?.length > 0) {
      filtered = filtered.filter(email =>
        email.labels?.some(label => filters.labels.includes(label))
      );
    }

    return filtered;
  }, [emails, selectedFolder, contextSearchQuery, filters]);

  // Use folders from context with icons
  const foldersWithIcons = React.useMemo(() => {
    return folders.map(folder => ({
      ...folder,
      icon: {
        'inbox': InboxIcon,
        'starred': StarIcon,
        'sent': PaperAirplaneIcon,
        'drafts': DocumentTextIcon,
        'spam': FlagIcon,
        'trash': TrashIcon,
      }[folder.id] || FolderIcon
    }));
  }, [folders]);

  // Use labels from context or default labels
  const emailLabels = React.useMemo(() => {
    return [
      { id: 'clients', name: 'Clients', color: 'bg-green-500' },
      { id: 'business', name: 'Business', color: 'bg-blue-500' },
      { id: 'important', name: 'Important', color: 'bg-yellow-500' },
      { id: 'personal', name: 'Personal', color: 'bg-purple-500' },
    ];
  }, []);

  // Email folders for organization
  const emailFolders = [
    { id: 'projects', name: 'Projects', icon: FolderIcon },
    { id: 'clients', name: 'Clients', icon: UserGroupIcon },
    { id: 'invoices', name: 'Invoices', icon: DocumentTextIcon },
    { id: 'quotes', name: 'Quotes', icon: ClipboardDocumentListIcon },
  ];

  // Tab configuration
  const tabs = [
    { id: 'inbox', name: 'Inbox', icon: InboxIcon },
    { id: 'automation', name: 'Automation', icon: ClockIcon },
  ];

  const mockEmails = [
    {
      id: 1,
      sender: 'Acme Corporation',
      email: 'contact@acmecorp.com',
      subject: 'Project Proposal: Website Redesign',
      preview:
        "Hello John, I'm reaching out regarding the website redesign project we discussed last week. We've prepared a detailed proposal for your review...",
      time: '10:24 AM',
      date: 'May 30, 2023',
      isRead: false,
      isStarred: true,
      hasAttachments: true,
      labels: ['clients'],
      avatar: '/api/placeholder/48/48',
      content: `Hello John,

I hope this email finds you well. I'm reaching out regarding the website redesign project we discussed during our meeting last week. As promised, we've prepared a detailed proposal for your review.

Our team has carefully analyzed your current website and identified several areas for improvement to enhance user experience, increase conversion rates, and better showcase your services. The proposal includes:

• Comprehensive redesign of the user interface
• Mobile-responsive implementation
• Performance optimization
• SEO enhancements
• Integration with your existing CRM system

We've attached the full proposal document which includes timeline estimates, resource allocation, and detailed pricing. We believe this redesign will significantly improve your online presence and help you achieve your business goals.

Please review the proposal at your convenience, and let's schedule a follow-up call to discuss any questions or adjustments you might have. We're excited about the possibility of working with Nexa Manager on this project.

Best regards,

Sarah Johnson
Project Manager
Acme Corporation
Phone: (555) 123-4567
Email: sarah.johnson@acmecorp.com`,
      attachments: [
        { name: 'Acme_Website_Proposal.pdf', size: '2.4 MB', type: 'pdf' },
        { name: 'Project_Timeline.xlsx', size: '1.8 MB', type: 'excel' },
      ],
    },
    {
      id: 2,
      sender: 'Globex Industries',
      email: 'info@globex.com',
      subject: 'Meeting Confirmation: Quarterly Review',
      preview:
        "This email confirms our quarterly review meeting scheduled for tomorrow at 2:00 PM. Please find attached the agenda and previous quarter's reports...",
      time: '9:15 AM',
      date: 'May 30, 2023',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      labels: ['important'],
      avatar: '/api/placeholder/48/48',
    },
    {
      id: 3,
      sender: 'Soylent Corp',
      email: 'billing@soylent.com',
      subject: 'Invoice #INV-2023-056 Payment Confirmation',
      preview:
        'Thank you for your payment of €2,150.00 for invoice #INV-2023-056. This email serves as confirmation that your payment has been received...',
      time: 'Yesterday',
      date: 'May 29, 2023',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      labels: [],
      avatar: '/api/placeholder/48/48',
    },
    {
      id: 4,
      sender: 'Initech LLC',
      email: 'support@initech.com',
      subject: 'Software License Renewal',
      preview:
        'Your software license for Nexa Manager Premium is due for renewal on 06/15/2023. To ensure uninterrupted service, please process the renewal...',
      time: 'Yesterday',
      date: 'May 29, 2023',
      isRead: true,
      isStarred: true,
      hasAttachments: false,
      labels: [],
      avatar: '/api/placeholder/48/48',
    },
    {
      id: 5,
      sender: 'Tech Conference',
      email: 'speakers@techconf.com',
      subject: 'Speaker Invitation: Business Management Summit',
      preview:
        'We would like to invite you to speak at the upcoming Business Management Summit on July 15-17. Your expertise in business operations would be valuable...',
      time: 'May 28',
      date: 'May 28, 2023',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      labels: [],
      avatar: '/api/placeholder/48/48',
    },
    {
      id: 6,
      sender: 'Marketing Team',
      email: 'marketing@company.com',
      subject: 'Q3 Marketing Strategy Draft',
      preview:
        "Please review the attached Q3 marketing strategy draft. We've incorporated the feedback from the last meeting and added new campaign ideas...",
      time: 'May 27',
      date: 'May 27, 2023',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      labels: [],
      avatar: '/api/placeholder/48/48',
    },
    {
      id: 7,
      sender: 'HR Department',
      email: 'hr@company.com',
      subject: 'Updated Company Policies',
      preview:
        'Please find attached the updated company policies effective June 1st. All employees are required to review and acknowledge these changes...',
      time: 'May 26',
      date: 'May 26, 2023',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      labels: [],
      avatar: '/api/placeholder/48/48',
    },
  ];

  // Set first email as selected by default
  React.useEffect(() => {
    if (filteredEmails.length > 0 && !selectedEmail) {
      selectEmail(filteredEmails[0]);
    }
  }, [filteredEmails, selectedEmail, selectEmail]);

  // Load emails when component mounts or folder changes
  React.useEffect(() => {
    loadEmails();
  }, [selectedFolder, loadEmails]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query); // Update context
  };

  // Handle folder selection
  const handleFolderSelect = (folderId) => {
    selectFolder(folderId);
    setSelectedEmails([]);
  };

  // Handle email selection
  const handleEmailSelect = async (email) => {
    selectEmail(email);
    
    // Mark as read if not already read
    if (!email.isRead) {
      try {
        await emailManagementService.markAsRead(email.id, true);
        // The context will handle updating the email state via WebSocket or refresh
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };

  const handleEmailCheck = (emailId, checked) => {
    const newSelected = new Set(selectedEmails);
    if (checked) {
      newSelected.add(emailId);
    } else {
      newSelected.delete(emailId);
    }
    setSelectedEmails(newSelected);
  };

  // Handle email starring
  const handleStarToggle = async (emailId, isStarred) => {
    try {
      await emailManagementService.updateEmail(emailId, { isStarred: !isStarred });
      // The context will handle updating the email state
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedEmails.length === 0) return;

    try {
      const emailIds = Array.from(selectedEmails);
      
      switch (action) {
        case 'delete':
          await Promise.all(emailIds.map(id => emailManagementService.deleteEmail(id)));
          break;
        case 'markRead':
          await Promise.all(emailIds.map(id => emailManagementService.markAsRead(id, true)));
          break;
        case 'markUnread':
          await Promise.all(emailIds.map(id => emailManagementService.markAsRead(id, false)));
          break;
        case 'star':
          await Promise.all(emailIds.map(id => emailManagementService.updateEmail(id, { isStarred: true })));
          break;
        case 'unstar':
          await Promise.all(emailIds.map(id => emailManagementService.updateEmail(id, { isStarred: false })));
          break;
        default:
          console.log('Unknown bulk action:', action);
      }
      setSelectedEmails([]);
      // Refresh emails to show updated state
      loadEmails();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  // Handle reply
  const handleReplySubmit = async () => {
    if (!selectedEmail || !replyText.trim()) return;

    try {
      const replyData = {
        to: selectedEmail.email,
        subject: `Re: ${selectedEmail.subject}`,
        text: replyText,
        inReplyTo: selectedEmail.id,
      };

      const result = await emailManagementService.sendEmail(replyData);
      
      if (result.success) {
        setReplyText('');
        // Optionally show success message
        console.log('Reply sent successfully');
      } else {
        console.error('Error sending reply:', result.error);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  // Handle compose new email
  const handleCompose = () => {
    openComposer();
  };

  // Handle refresh
  const handleRefresh = () => {
    refresh();
  };

  // Handle reply
  const handleReply = (email, replyAll = false, forward = false) => {
    setReplyToEmail({
      ...email,
      replyAll,
      forward
    });
    openComposer();
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getLabelBadge = labelId => {
    const label = emailLabels.find(l => l.id === labelId);
    if (!label) return null;

    const colorClasses = {
      'bg-green-500': 'bg-green-100 text-green-800',
      'bg-blue-500': 'bg-blue-100 text-blue-800',
      'bg-yellow-500': 'bg-yellow-100 text-yellow-800',
      'bg-purple-500': 'bg-purple-100 text-purple-800',
    };

    return (
      <span
        key={labelId}
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClasses[label.color]}`}
      >
        {label.name}
      </span>
    );
  };

  const getAttachmentIcon = type => {
    switch (type) {
      case 'pdf':
        return (
          <div className='bg-blue-100 rounded-md p-2'>
            <DocumentTextIcon className='h-8 w-8 text-blue-600' />
          </div>
        );
      case 'excel':
        return (
          <div className='bg-green-100 rounded-md p-2'>
            <DocumentTextIcon className='h-8 w-8 text-green-600' />
          </div>
        );
      default:
        return (
          <div className='bg-gray-100 rounded-md p-2'>
            <DocumentTextIcon className='h-8 w-8 text-gray-600' />
          </div>
        );
    }
  };

  return (
    <div className='h-screen flex flex-col bg-white'>
      {/* Breadcrumb */}
      <div className='bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2 text-nav-text'>
            <button
              onClick={() => navigate('/dashboard')}
              className='flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium transition-colors'
            >
              <HomeIcon className='h-5 w-5' />
              <span>Dashboard</span>
            </button>
            <ChevronRightIcon className='h-4 w-4 text-gray-400' />
            <span className='text-gray-600 font-bold'>Email</span>
          </div>
        </div>
      </div>

      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar */}
        <div className='w-60 bg-white border-r border-gray-200 flex flex-col'>
          {/* Compose Button */}
          <div className='p-4'>
            <button 
              onClick={handleCompose}
              className='w-full bg-blue-600 text-white rounded-md px-4 py-2 flex items-center justify-center hover:bg-blue-700 transition-colors'
            >
              <PencilIcon className='h-5 w-5 mr-2' />
              Compose
            </button>
          </div>

          {/* Folders */}
          <div className='px-4 pb-2'>
            {foldersWithIcons.map(folder => {
              const Icon = folder.icon;
              const isActive = selectedFolder === folder.id;

              return (
                <div
                  key={folder.id}
                  onClick={() => handleFolderSelect(folder.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className='flex items-center'>
                    <Icon className='h-5 w-5 mr-3' />
                    <span>{folder.name}</span>
                  </div>
                  {folder.count && (
                    <span
                      className={`text-caption px-2 py-1 rounded-full ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : folder.id === 'spam'
                            ? 'text-gray-400'
                            : 'bg-blue-600 text-white'
                      }`}
                    >
                      {folder.count}
                    </span>
                  )}
                  {folder.id === 'starred' || folder.id === 'drafts' ? (
                    <ChevronRightIcon className='h-4 w-4 text-gray-400' />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Labels Section */}
          <div className='px-4 py-4 border-t border-gray-200'>
            <div className='flex items-center justify-between mb-3'>
              <span className='text-caption font-medium text-gray-500 uppercase tracking-wider'>
                Labels
              </span>
              <PlusIcon className='h-4 w-4 text-gray-400' />
            </div>
            {emailLabels.map(label => (
              <div
                key={label.id}
                className='flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer'
              >
                <div className={`w-3 h-3 rounded-full mr-3 ${label.color}`}></div>
                <span>{label.name}</span>
              </div>
            ))}
          </div>

          {/* Email Folders Section */}
          <div className='px-4 py-4 border-t border-gray-200'>
            <div className='flex items-center justify-between mb-3'>
              <span className='text-caption font-medium text-gray-500 uppercase tracking-wider'>
                Folders
              </span>
              <PlusIcon className='h-4 w-4 text-gray-400' />
            </div>
            {emailFolders.map(folder => {
              const Icon = folder.icon;
              return (
                <div
                  key={folder.id}
                  className='flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer'
                >
                  <Icon className='h-5 w-5 mr-3 text-gray-500' />
                  <span>{folder.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Email List */}
        <div className='w-96 bg-white border-r border-gray-200 flex flex-col'>
          {/* Email List Header */}
          <div className='p-3 border-b border-gray-200'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-semibold text-gray-900'>{t('title')}</h2>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={handleRefresh}
                  disabled={emailsLoading}
                  className='p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50'
                  title={t('refresh')}
                >
                  <ArrowPathIcon className={`h-5 w-5 ${emailsLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
                  title={t('settings')}
                >
                  <Cog6ToothIcon className='h-5 w-5' />
                </button>
                <button
                  onClick={() => setShowSecuritySettings(true)}
                  className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
                  title="Security Settings"
                >
                  <ShieldCheckIcon className='h-5 w-5' />
                </button>
              </div>
            </div>
            
            {/* Search */}
            <div className='mb-3'>
              <div className='relative'>
                <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                <input
                  type='text'
                  placeholder={t('searchPlaceholder')}
                  value={contextSearchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>

            {/* Bulk Actions */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  className='rounded border-gray-300'
                  onChange={e => {
                    // Handle select all
                  }}
                />
                <button className='p-1 hover:bg-gray-100 rounded'>
                  <ArchiveBoxIcon className='h-5 w-5 text-gray-500' />
                </button>
              </div>
              <div className='flex items-center space-x-2'>
                {selectedEmails.length > 0 && (
                  <>
                    <span className='text-sm text-gray-500'>
                      {selectedEmails.length} selected
                    </span>
                    <button
                      onClick={() => handleBulkAction('markRead')}
                      className='p-1 hover:bg-gray-100 rounded'
                      title='Mark as read'
                    >
                      <CheckIcon className='h-5 w-5 text-gray-500' />
                    </button>
                  </>
                )}
                <button className='p-1 hover:bg-gray-100 rounded'>
                  <EllipsisHorizontalIcon className='h-5 w-5 text-gray-500' />
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className='p-1 hover:bg-gray-100 rounded hover:text-red-600'
                >
                  <TrashIcon className='h-5 w-5 text-gray-500' />
                </button>
              </div>
            </div>
          </div>

          {/* Email List Items */}
           <div className='flex-1 overflow-y-auto'>
             {emailsLoading && emails.length === 0 ? (
               <div className="flex items-center justify-center h-32">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
               </div>
             ) : emailsError ? (
               <div className="flex items-center justify-center h-32 text-red-600">
                 <p>{emailsError}</p>
               </div>
             ) : filteredEmails.length === 0 ? (
               <div className="flex items-center justify-center h-32 text-gray-500">
                 <p>{contextSearchQuery ? t('noSearchResults') : t('noEmails')}</p>
               </div>
             ) : (
               <>
                 {filteredEmails.map(email => (
                   <div
                     key={email.id}
                     onClick={() => handleEmailSelect(email)}
                     className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                       selectedEmail?.id === email.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                     } ${!email.isRead ? 'bg-blue-50' : ''}`}
                   >
                     <div className='flex items-start justify-between mb-1'>
                       <div className='flex items-center space-x-2'>
                         <input
                           type='checkbox'
                           checked={selectedEmails.includes(email.id)}
                           onChange={e => {
                             e.stopPropagation();
                             if (e.target.checked) {
                               setSelectedEmails([...selectedEmails, email.id]);
                             } else {
                               setSelectedEmails(selectedEmails.filter(id => id !== email.id));
                             }
                           }}
                           className='rounded border-gray-300'
                         />
                         <button
                           onClick={e => {
                             e.stopPropagation();
                             handleStarToggle(email.id, !email.isStarred);
                           }}
                           className='p-1'
                         >
                           {email.isStarred ? (
                             <StarSolidIcon className='h-5 w-5 text-yellow-400' />
                           ) : (
                             <StarIcon className='h-5 w-5 text-gray-400' />
                           )}
                         </button>
                       </div>
                       <span className='text-caption text-gray-500'>
                         {formatTimestamp(email.receivedAt || email.sentAt)}
                       </span>
                     </div>

                     <div className='flex items-center space-x-2 mb-1'>
                       <span className={`font-medium ${!email.isRead ? 'text-black' : 'text-gray-900'}`}>
                         {email.sender?.name || email.sender?.email || 'Unknown Sender'}
                       </span>
                       {email.labels && email.labels.map(labelId => getLabelBadge(labelId))}
                       <EmailSecurityIndicator email={email} />
                     </div>

                     <div
                       className={`font-semibold mb-1 ${!email.isRead ? 'text-blue-700' : 'text-gray-900'}`}
                     >
                       {email.subject}
                     </div>

                     <div className='text-body text-gray-600 line-clamp-2'>
                       {email.preview || (email.content?.text || email.content?.html)?.substring(0, 100) + '...'}
                     </div>
                   </div>
                 ))}
                 
                 {/* Load More Button */}
                 {hasMoreEmails && (
                   <div className="p-4 text-center">
                     <button
                       onClick={loadMore}
                       disabled={emailsLoading}
                       className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                     >
                       {emailsLoading ? 'Loading...' : 'Load More'}
                     </button>
                   </div>
                 )}
               </>
             )}
           </div>
        </div>

        {/* Main Content Area */}
        <div className='flex-1 flex flex-col bg-white'>
          {/* Tab Navigation */}
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8 px-6'>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className='h-5 w-5' />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'inbox' ? (
            /* Email Content */
            <div className='flex-1 flex flex-col'>
              {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className='p-6 border-b border-gray-200'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center space-x-3'>
                    <button
                      onClick={() => handleStarToggle(selectedEmail.id, !selectedEmail.isStarred)}
                      className='p-2 hover:bg-gray-100 rounded-full'
                    >
                      {selectedEmail.isStarred ? (
                        <StarSolidIcon className='h-5 w-5 text-yellow-400' />
                      ) : (
                        <StarIcon className='h-5 w-5 text-gray-400' />
                      )}
                    </button>
                    <button
                      onClick={() => handleReply(selectedEmail)}
                      className='p-2 hover:bg-gray-100 rounded-full'
                    >
                      <ArrowUturnLeftIcon className='h-5 w-5 text-gray-600' />
                    </button>
                    <button
                       onClick={() => handleBulkAction('delete', [selectedEmail.id])}
                       className='p-2 hover:bg-gray-100 rounded-full'
                     >
                      <TrashIcon className='h-5 w-5 text-gray-600' />
                    </button>
                  </div>
                  <span className='text-sm text-gray-500'>
                    {formatTimestamp(selectedEmail.receivedAt || selectedEmail.sentAt)}
                  </span>
                </div>

                <div className='flex items-start space-x-4'>
                  <div className='w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold'>
                    {(selectedEmail.sender?.name || selectedEmail.sender?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='font-semibold text-gray-900'>
                          {selectedEmail.sender?.name || selectedEmail.sender?.email || 'Unknown Sender'}
                        </h3>
                        <p className='text-sm text-gray-600'>
                          {selectedEmail.sender?.email}
                        </p>
                      </div>
                      {selectedEmail.labels && selectedEmail.labels.length > 0 && (
                        <div className='flex items-center space-x-1'>
                          {selectedEmail.labels.map(labelId => getLabelBadge(labelId))}
                        </div>
                      )}
                    </div>
                    <h2 className='text-xl font-semibold text-gray-900 mt-2'>
                      {selectedEmail.subject}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className='flex-1 p-6 overflow-y-auto'>
                <div className='prose max-w-none'>
                  {selectedEmail.content?.html ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.content.html }} />
                  ) : selectedEmail.content?.text ? (
                    <div className='whitespace-pre-wrap'>{selectedEmail.content.text}</div>
                  ) : selectedEmail.content ? (
                    selectedEmail.content.split('\n\n').map((paragraph, index) => {
                      if (paragraph.includes('•')) {
                        // Handle bullet points
                        const lines = paragraph.split('\n');
                        const bulletLines = lines.filter(line => line.trim().startsWith('•'));
                        if (bulletLines.length > 0) {
                          return (
                            <ul key={index} className='list-disc list-inside space-y-1 ml-4'>
                              {bulletLines.map((item, itemIndex) => (
                                <li key={itemIndex} className='text-gray-900'>
                                  {item.substring(item.indexOf('•') + 1).trim()}
                                </li>
                              ))}
                            </ul>
                          );
                        }
                      }
                      if (paragraph.trim()) {
                        return (
                          <p key={index} className='text-gray-900 leading-relaxed'>
                            {paragraph}
                          </p>
                        );
                      }
                      return null;
                    })
                  ) : (
                    <p className='text-gray-500'>No content available</p>
                  )}
                </div>

                {/* Attachments */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className='mt-6 pt-6 border-t border-gray-200'>
                    <h4 className='font-medium text-gray-900 mb-3'>
                      Attachments ({selectedEmail.attachments.length})
                    </h4>
                    <div className='space-y-2'>
                      {selectedEmail.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'
                        >
                          <PaperClipIcon className='h-5 w-5 text-gray-400' />
                          <div className='flex-1'>
                            <p className='text-sm font-medium text-gray-900'>
                              {attachment.filename || attachment.name}
                            </p>
                            <p className='text-xs text-gray-500'>
                              {attachment.size ? `${Math.round(attachment.size / 1024)} KB` : 'Unknown size'}
                            </p>
                          </div>
                          <button className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Section */}
              <div className='p-6 border-t border-gray-200'>
                <div className='flex items-center space-x-3 mb-4'>
                  <button
                    onClick={() => handleReply(selectedEmail)}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => handleReply(selectedEmail, true)}
                    className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50'
                  >
                    Reply All
                  </button>
                  <button
                    onClick={() => handleReply(selectedEmail, false, true)}
                    className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50'
                  >
                    Forward
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-center'>
                <EnvelopeIcon className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>No email selected</h3>
                <p className='text-gray-500'>Select an email from the list to view its content</p>
              </div>
            </div>
          )}
            </div>
        ) : (
          /* Automation Tab Content */
          <div className='flex-1'>
            <AutomationDashboard />
          </div>
        )}
        </div>
      </div>

      {/* Email Composer Modal */}
      {composerOpen && (
        <EmailComposer
          isOpen={composerOpen}
          onClose={() => closeComposer()}
          replyTo={replyToEmail}
          onSent={() => {
            closeComposer();
            setReplyToEmail(null);
            handleRefresh();
          }}
        />
      )}

      {/* Email Settings Modal */}
      {showSettings && (
        <EmailSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Email Security Settings Modal */}
      {showSecuritySettings && (
        <EmailSecuritySettings
          isOpen={showSecuritySettings}
          onClose={() => setShowSecuritySettings(false)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
