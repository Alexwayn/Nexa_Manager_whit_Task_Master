import React, { useState, useEffect } from 'react';
import {
  EnvelopeIcon,
  PlusIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import emailCampaignService from '@lib/emailCampaignService';
import emailTemplateService from '@lib/emailTemplateService';
import EmailTemplateEditor from './EmailTemplateEditor';
import EmailQueueManager from './EmailQueueManager';
import { useTranslation } from 'react-i18next';

const EmailCampaignManager = () => {
  const { t } = useTranslation('email');
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState(null);

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    templateId: '',
    subject: '',
    recipients: [],
    variables: {},
    trackOpens: true,
    trackClicks: true,
    scheduledAt: null
  });

  const [recipientSource, setRecipientSource] = useState('manual'); // manual, clients, csv
  const [csvFile, setCsvFile] = useState(null);
  const [clientFilters, setClientFilters] = useState({});

  useEffect(() => {
    loadCampaigns();
    loadTemplates();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const result = await emailCampaignService.getCampaigns();
      if (result.success) {
        setCampaigns(result.data);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const result = await emailTemplateService.getTemplates();
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.templateId || campaignForm.recipients.length === 0) {
      alert('Please fill in all required fields and add recipients');
      return;
    }

    setLoading(true);
    try {
      const result = await emailCampaignService.createCampaign(campaignForm);
      if (result.success) {
        setShowCreateCampaign(false);
        resetCampaignForm();
        loadCampaigns();
        alert('Campaign created successfully!');
      } else {
        alert(`Error creating campaign: ${result.error}`);
      }
    } catch (error) {
      alert(`Error creating campaign: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId, scheduled = false, scheduledTime = null) => {
    const message = scheduled 
      ? `Schedule this campaign for ${scheduledTime}?`
      : 'Send this campaign now?';
      
    if (!confirm(message)) {
      return;
    }

    setLoading(true);
    try {
      const options = { 
        scheduled, 
        scheduledAt: scheduled ? scheduledTime : null 
      };
      
      const result = await emailCampaignService.sendCampaign(campaignId, options);
      if (result.success) {
        loadCampaigns();
        alert(result.message);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await emailCampaignService.deleteCampaign(campaignId);
      if (result.success) {
        loadCampaigns();
        alert('Campaign deleted successfully');
      } else {
        alert(`Error deleting campaign: ${result.error}`);
      }
    } catch (error) {
      alert(`Error deleting campaign: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadClientsAsRecipients = async () => {
    setLoading(true);
    try {
      const result = await emailCampaignService.getClientsAsRecipients(clientFilters);
      if (result.success) {
        setCampaignForm(prev => ({
          ...prev,
          recipients: result.data
        }));
        alert(`Loaded ${result.data.length} clients as recipients`);
      } else {
        alert(`Error loading clients: ${result.error}`);
      }
    } catch (error) {
      alert(`Error loading clients: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = async () => {
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvContent = e.target.result;
        const result = await emailCampaignService.importRecipientsFromCSV(csvContent);
        
        if (result.success) {
          setCampaignForm(prev => ({
            ...prev,
            recipients: result.data
          }));
          
          let message = `Imported ${result.data.length} recipients`;
          if (result.errors) {
            message += `\n\nWarnings:\n${result.errors.join('\n')}`;
          }
          alert(message);
        } else {
          alert(`Error importing CSV: ${result.error}`);
        }
      } catch (error) {
        alert(`Error reading CSV: ${error.message}`);
      }
    };
    reader.readAsText(csvFile);
  };

  const handleViewCampaignDetails = async (campaignId) => {
    setLoading(true);
    try {
      const result = await emailCampaignService.getCampaignDetails(campaignId);
      if (result.success) {
        setSelectedCampaign(campaignId);
        setCampaignDetails(result.data);
      }
    } catch (error) {
      console.error('Error loading campaign details:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      description: '',
      templateId: '',
      subject: '',
      recipients: [],
      variables: {},
      trackOpens: true,
      trackClicks: true,
      scheduledAt: null
    });
    setRecipientSource('manual');
    setCsvFile(null);
  };

  const addManualRecipient = () => {
    const email = prompt('Enter email address:');
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const name = prompt('Enter name (optional):') || email;
      setCampaignForm(prev => ({
        ...prev,
        recipients: [...prev.recipients, { email, name, variables: {} }]
      }));
    } else if (email) {
      alert('Invalid email address');
    }
  };

  const removeRecipient = (index) => {
    setCampaignForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'sending':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'scheduled':
        return <CalendarIcon className="h-5 w-5 text-orange-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-orange-100 text-orange-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showTemplateEditor) {
    return (
      <EmailTemplateEditor
        template={selectedTemplate}
        onSave={(template) => {
          setShowTemplateEditor(false);
          setSelectedTemplate(null);
          loadTemplates();
        }}
        onCancel={() => {
          setShowTemplateEditor(false);
          setSelectedTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <EnvelopeIcon className="h-6 w-6 mr-2" />
            Email Campaigns
          </h1>
          <p className="text-gray-600">Manage bulk email campaigns and templates</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setShowTemplateEditor(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            New Template
          </button>
          <button
            onClick={() => setShowCreateCampaign(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'campaigns', name: 'Campaigns', icon: EnvelopeIcon },
              { id: 'queue', name: 'Queue Manager', icon: ClockIcon },
              { id: 'templates', name: 'Templates', icon: DocumentTextIcon },
              { id: 'analytics', name: 'Analytics', icon: ChartBarIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              {/* Queue Summary */}
              {campaigns.filter(c => c.status === 'scheduled').length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <h3 className="font-medium text-orange-800">Campaign Queue</h3>
                    </div>
                    <span className="text-sm text-orange-600">
                      {campaigns.filter(c => c.status === 'scheduled').length} campaigns scheduled
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {campaigns
                      .filter(c => c.status === 'scheduled')
                      .slice(0, 3)
                      .map((campaign) => (
                        <div key={campaign.id} className="text-sm text-orange-700">
                          • {campaign.name} - {campaign.scheduled_at ? 
                            new Date(campaign.scheduled_at).toLocaleString() : 'Time not set'}
                        </div>
                      ))}
                    {campaigns.filter(c => c.status === 'scheduled').length > 3 && (
                      <div className="text-sm text-orange-600">
                        ...and {campaigns.filter(c => c.status === 'scheduled').length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading campaigns...</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                  <p className="text-gray-600 mb-4">Create your first email campaign to get started</p>
                  <button
                    onClick={() => setShowCreateCampaign(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Campaign
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          {getStatusIcon(campaign.status)}
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleViewCampaignDetails(campaign.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {campaign.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handleSendCampaign(campaign.id)}
                                className="p-1 text-blue-400 hover:text-blue-600"
                                title="Send immediately"
                              >
                                <PaperAirplaneIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const time = prompt('Schedule send time (YYYY-MM-DD HH:MM):', 
                                    new Date(Date.now() + 3600000).toISOString().slice(0, 16).replace('T', ' ')
                                  );
                                  if (time) {
                                    handleSendCampaign(campaign.id, true, time);
                                  }
                                }}
                                className="p-1 text-orange-400 hover:text-orange-600"
                                title="Schedule campaign"
                              >
                                <CalendarIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(campaign.id)}
                                className="p-1 text-red-400 hover:text-red-600"
                                title="Delete campaign"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {campaign.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => handleSendCampaign(campaign.id)}
                                className="p-1 text-green-400 hover:text-green-600"
                                title="Send now (cancel schedule)"
                              >
                                <PlayIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(campaign.id)}
                                className="p-1 text-red-400 hover:text-red-600"
                                title="Cancel campaign"
                              >
                                <PauseIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Template: {campaign.email_templates?.name || 'Unknown'}</div>
                        <div>Recipients: {campaign.recipients?.length || 0}</div>
                        <div>Created: {new Date(campaign.created_at).toLocaleDateString()}</div>
                        {campaign.scheduled_at && (
                          <div className="text-orange-600 font-medium">
                            Scheduled: {new Date(campaign.scheduled_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Queue Manager Tab */}
          {activeTab === 'queue' && (
            <EmailQueueManager />
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {template.category}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowTemplateEditor(true);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    
                    <div className="text-xs text-gray-500">
                      Updated: {new Date(template.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Analytics</h3>
                <p className="text-gray-600">Select a campaign to view detailed analytics</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Create Email Campaign</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter campaign name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Template *
                  </label>
                  <select
                    value={campaignForm.templateId}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, templateId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Campaign description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject line"
                />
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Recipients *
                </label>
                
                <div className="mb-4">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="recipientSource"
                        value="manual"
                        checked={recipientSource === 'manual'}
                        onChange={(e) => setRecipientSource(e.target.value)}
                        className="mr-2"
                      />
                      Manual Entry
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="recipientSource"
                        value="clients"
                        checked={recipientSource === 'clients'}
                        onChange={(e) => setRecipientSource(e.target.value)}
                        className="mr-2"
                      />
                      From Clients
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="recipientSource"
                        value="csv"
                        checked={recipientSource === 'csv'}
                        onChange={(e) => setRecipientSource(e.target.value)}
                        className="mr-2"
                      />
                      CSV Import
                    </label>
                  </div>
                </div>

                {recipientSource === 'manual' && (
                  <div className="space-y-2">
                    <button
                      onClick={addManualRecipient}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <PlusIcon className="h-4 w-4 inline mr-1" />
                      Add Recipient
                    </button>
                  </div>
                )}

                {recipientSource === 'clients' && (
                  <button
                    onClick={handleLoadClientsAsRecipients}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <UserGroupIcon className="h-4 w-4 inline mr-2" />
                    Load Clients
                  </button>
                )}

                {recipientSource === 'csv' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <button
                      onClick={handleImportCSV}
                      disabled={!csvFile}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 inline mr-2" />
                      Import CSV
                    </button>
                  </div>
                )}

                {/* Recipients List */}
                {campaignForm.recipients.length > 0 && (
                  <div className="mt-4 max-h-40 overflow-y-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {campaignForm.recipients.map((recipient, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900">{recipient.email}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{recipient.name}</td>
                            <td className="px-3 py-2 text-sm">
                              <button
                                onClick={() => removeRecipient(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Scheduling */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Scheduling</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Send Time
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sendTime"
                          value="now"
                          checked={!campaignForm.scheduledAt}
                          onChange={() => setCampaignForm(prev => ({ ...prev, scheduledAt: null }))}
                          className="mr-2"
                        />
                        Send immediately
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sendTime"
                          value="scheduled"
                          checked={!!campaignForm.scheduledAt}
                          onChange={() => {
                            const now = new Date();
                            now.setHours(now.getHours() + 1);
                            setCampaignForm(prev => ({ ...prev, scheduledAt: now.toISOString().slice(0, 16) }));
                          }}
                          className="mr-2"
                        />
                        Schedule for later
                      </label>
                    </div>
                  </div>
                  
                  {campaignForm.scheduledAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scheduled Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={campaignForm.scheduledAt}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Tracking Settings</h3>
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={campaignForm.trackOpens}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, trackOpens: e.target.checked }))}
                      className="mr-2"
                    />
                    Track Email Opens
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={campaignForm.trackClicks}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, trackClicks: e.target.checked }))}
                      className="mr-2"
                    />
                    Track Link Clicks
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex items-center justify-between">
              <button
                onClick={() => {
                  setShowCreateCampaign(false);
                  resetCampaignForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateCampaign}
                  disabled={loading || !campaignForm.name || !campaignForm.templateId || campaignForm.recipients.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Creating...' : campaignForm.scheduledAt ? 'Create & Schedule' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && campaignDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{campaignDetails.name}</h2>
              <button
                onClick={() => {
                  setSelectedCampaign(null);
                  setCampaignDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {/* Campaign Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{campaignDetails.stats.total_recipients}</div>
                  <div className="text-sm text-gray-600">Recipients</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{campaignDetails.stats.sent}</div>
                  <div className="text-sm text-gray-600">Sent</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{campaignDetails.stats.unique_opens}</div>
                  <div className="text-sm text-gray-600">Opens</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{campaignDetails.stats.unique_clicks}</div>
                  <div className="text-sm text-gray-600">Clicks</div>
                </div>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{campaignDetails.stats.delivery_rate}%</div>
                  <div className="text-sm text-gray-600">Delivery Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{campaignDetails.stats.open_rate}%</div>
                  <div className="text-sm text-gray-600">Open Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{campaignDetails.stats.click_rate}%</div>
                  <div className="text-sm text-gray-600">Click Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{campaignDetails.stats.click_through_rate}%</div>
                  <div className="text-sm text-gray-600">CTR</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaignManager; 