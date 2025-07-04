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
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, CheckIcon } from '@heroicons/react/24/solid';

export default function Email() {
  const { t } = useTranslation('email');
  const navigate = useNavigate();
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [replyText, setReplyText] = useState('');
  const replyInputRef = useRef(null);

  // Mock data
  const folders = [
    { id: 'inbox', name: 'Inbox', icon: InboxIcon, count: 24, active: true },
    { id: 'starred', name: 'Starred', icon: StarIcon, count: null },
    { id: 'sent', name: 'Sent', icon: PaperAirplaneIcon, count: null },
    { id: 'drafts', name: 'Drafts', icon: DocumentTextIcon, count: null },
    { id: 'spam', name: 'Spam', icon: FlagIcon, count: 12 },
    { id: 'trash', name: 'Trash', icon: TrashIcon, count: null },
  ];

  const labels = [
    { id: 'clients', name: 'Clients', color: 'bg-green-500' },
    { id: 'important', name: 'Important', color: 'bg-blue-500' },
    { id: 'personal', name: 'Personal', color: 'bg-yellow-500' },
    { id: 'projects', name: 'Projects', color: 'bg-purple-500' },
  ];

  const emailFolders = [
    { id: 'invoices', name: 'Invoices', icon: DocumentTextIcon },
    { id: 'receipts', name: 'Receipts', icon: DocumentTextIcon },
    { id: 'archives', name: 'Archives', icon: ArchiveBoxIcon },
  ];

  const emails = [
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
        'Thank you for your payment of $2,150.00 for invoice #INV-2023-056. This email serves as confirmation that your payment has been received...',
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
    if (emails.length > 0 && !selectedEmail) {
      setSelectedEmail(emails[0]);
    }
  }, []);

  const handleEmailSelect = email => {
    setSelectedEmail(email);
    // Mark as read when selected
    if (!email.isRead) {
      // In a real app, you'd update this via an API call
      email.isRead = true;
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

  const handleStarToggle = emailId => {
    // In a real app, you'd update this via an API call
    const email = emails.find(e => e.id === emailId);
    if (email) {
      email.isStarred = !email.isStarred;
    }
  };

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      // In a real app, you'd send this via an API call
      console.log('Sending reply:', replyText);
      setReplyText('');
    }
  };

  const getLabelBadge = labelId => {
    const label = labels.find(l => l.id === labelId);
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
          <div className='flex items-center space-x-2 text-base'>
            <button 
              onClick={() => navigate('/dashboard')}
              className='flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium transition-colors'
            >
              <HomeIcon className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
            <ChevronRightIcon className='h-4 w-4 text-gray-400' />
            <span className="text-gray-600 font-bold">Email</span>
          </div>
        </div>
      </div>

      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar */}
        <div className='w-60 bg-white border-r border-gray-200 flex flex-col'>
          {/* Compose Button */}
          <div className='p-4'>
            <button className='w-full bg-blue-600 text-white rounded-md px-4 py-2 flex items-center justify-center hover:bg-blue-700 transition-colors'>
              <PencilIcon className='h-5 w-5 mr-2' />
              Compose
            </button>
          </div>

          {/* Folders */}
          <div className='px-4 pb-2'>
            {folders.map(folder => {
              const Icon = folder.icon;
              const isActive = selectedFolder === folder.id;

              return (
                <div
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
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
                      className={`text-xs px-2 py-1 rounded-full ${
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
              <span className='text-sm font-medium text-gray-500 uppercase tracking-wider'>
                Labels
              </span>
              <PlusIcon className='h-4 w-4 text-gray-400' />
            </div>
            {labels.map(label => (
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
              <span className='text-sm font-medium text-gray-500 uppercase tracking-wider'>
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
          <div className='p-3 border-b border-gray-200 flex items-center justify-between'>
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
              <button className='p-1 hover:bg-gray-100 rounded'>
                <EllipsisHorizontalIcon className='h-5 w-5 text-gray-500' />
              </button>
              <button className='p-1 hover:bg-gray-100 rounded'>
                <TrashIcon className='h-5 w-5 text-gray-500' />
              </button>
            </div>
          </div>

          {/* Email List Items */}
          <div className='flex-1 overflow-y-auto'>
            {emails.map(email => (
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
                      checked={selectedEmails.has(email.id)}
                      onChange={e => handleEmailCheck(email.id, e.target.checked)}
                      className='rounded border-gray-300'
                      onClick={e => e.stopPropagation()}
                    />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleStarToggle(email.id);
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
                  <span className='text-xs text-gray-500'>{email.time}</span>
                </div>

                <div className='flex items-center space-x-2 mb-1'>
                  <span className={`font-medium ${!email.isRead ? 'text-black' : 'text-gray-900'}`}>
                    {email.sender}
                  </span>
                  {email.labels.map(labelId => getLabelBadge(labelId))}
                </div>

                <div
                  className={`font-semibold mb-1 ${!email.isRead ? 'text-blue-700' : 'text-gray-900'}`}
                >
                  {email.subject}
                </div>

                <div className='text-sm text-gray-600 line-clamp-2'>{email.preview}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Content */}
        <div className='flex-1 flex flex-col bg-white'>
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className='p-6 border-b border-gray-200'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center space-x-7'>
                    <button className='p-2 hover:bg-gray-100 rounded'>
                      <ArchiveBoxIcon className='h-5 w-5 text-gray-500' />
                    </button>
                    <button className='p-2 hover:bg-gray-100 rounded'>
                      <TrashIcon className='h-5 w-5 text-gray-500' />
                    </button>
                    <button className='p-2 hover:bg-gray-100 rounded'>
                      <FlagIcon className='h-5 w-5 text-gray-500' />
                    </button>
                    <button className='p-2 hover:bg-gray-100 rounded'>
                      <EllipsisHorizontalIcon className='h-5 w-5 text-gray-500' />
                    </button>
                  </div>
                  <button className='p-2 hover:bg-gray-100 rounded'>
                    <EllipsisHorizontalIcon className='h-5 w-5 text-gray-500' />
                  </button>
                </div>

                <h1 className='text-2xl font-semibold text-gray-900 mb-4'>
                  {selectedEmail.subject}
                </h1>

                <div className='flex items-center space-x-4'>
                  <img
                    src={selectedEmail.avatar}
                    alt={selectedEmail.sender}
                    className='w-12 h-12 rounded-full'
                  />
                  <div className='flex-1'>
                    <div className='flex items-center space-x-2'>
                      <span className='font-medium text-gray-900'>{selectedEmail.sender}</span>
                      <span className='text-gray-600'>&lt;{selectedEmail.email}&gt;</span>
                    </div>
                    <div className='flex items-center space-x-2 text-sm text-gray-600'>
                      <span>To: John Doe</span>
                      <span>•</span>
                      <span>
                        {selectedEmail.date}, {selectedEmail.time}
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    {selectedEmail.isStarred && (
                      <StarSolidIcon className='h-5 w-5 text-yellow-400' />
                    )}
                    <button className='p-2 hover:bg-gray-100 rounded'>
                      <ArrowUturnLeftIcon className='h-5 w-5 text-gray-500' />
                    </button>
                    <button className='p-2 hover:bg-gray-100 rounded'>
                      <EllipsisHorizontalIcon className='h-5 w-5 text-gray-500' />
                    </button>
                    <button className='p-2 hover:bg-gray-100 rounded'>
                      <EllipsisHorizontalIcon className='h-5 w-5 text-gray-500' />
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Content */}
              <div className='flex-1 overflow-y-auto p-6'>
                <div className='space-y-4 max-w-none'>
                  {selectedEmail.content ? (
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
                    <p className='text-gray-900 leading-relaxed'>{selectedEmail.preview}</p>
                  )}
                </div>

                {/* Attachments */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className='mt-8 border-t border-gray-200 pt-6'>
                    <div className='flex items-center space-x-2 mb-4'>
                      <PaperClipIcon className='h-5 w-5 text-gray-500' />
                      <span className='font-medium text-gray-900'>
                        {selectedEmail.attachments.length} Attachments
                      </span>
                    </div>
                    <div className='flex space-x-4'>
                      {selectedEmail.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className='border border-gray-200 rounded-md p-3 flex items-center space-x-3 hover:bg-gray-50 cursor-pointer'
                        >
                          {getAttachmentIcon(attachment.type)}
                          <div>
                            <div className='font-medium text-sm text-gray-900'>
                              {attachment.name}
                            </div>
                            <div className='text-xs text-gray-500'>{attachment.size}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply Section */}
                <div className='mt-8 border-t border-gray-200 pt-6'>
                  <div className='bg-gray-50 border border-gray-200 rounded-md p-4'>
                    <div className='flex items-center justify-between mb-4'>
                      <span className='font-medium text-gray-900'>Reply</span>
                      <PaperClipIcon className='h-5 w-5 text-gray-500' />
                    </div>
                    <textarea
                      ref={replyInputRef}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder='Click here to compose a reply...'
                      className='w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                    <div className='flex justify-end mt-4'>
                      <button
                        onClick={handleReplySubmit}
                        className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2'
                      >
                        <span>Send</span>
                        <PaperAirplaneIcon className='h-4 w-4' />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-center'>
                <EnvelopeIcon className='h-16 w-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>No email selected</h3>
                <p className='text-gray-500'>Select an email from the list to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
