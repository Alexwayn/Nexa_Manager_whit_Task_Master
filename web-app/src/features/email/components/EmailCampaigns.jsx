import React, { useState } from 'react';
import {
  MegaphoneIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  ChartBarIcon,
  UsersIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useEmailCampaigns } from '@features/email';
import { format } from 'date-fns';

const EmailCampaigns = () => {
  const { 
    campaigns, 
    loading, 
    createCampaign, 
    updateCampaign, 
    deleteCampaign, 
    startCampaign, 
    pauseCampaign, 
    stopCampaign,
    getCampaignStats 
  } = useEmailCampaigns();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list, stats
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    content: '',
    recipients: '',
    schedule_type: 'immediate', // immediate, scheduled, recurring
    scheduled_date: '',
    recurrence_pattern: '',
    settings: {
      track_opens: true,
      track_clicks: true,
      auto_unsubscribe: true
    }
  });

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const campaignData = {
        ...formData,
        recipients: formData.recipients.split(',').map(email => email.trim()).filter(Boolean),
        scheduled_date: formData.scheduled_date ? new Date(formData.scheduled_date).toISOString() : null
      };
      
      await createCampaign(campaignData);
      
      setFormData({
        name: '',
        description: '',
        subject: '',
        content: '',
        recipients: '',
        schedule_type: 'immediate',
        scheduled_date: '',
        recurrence_pattern: '',
        settings: {
          track_opens: true,
          track_clicks: true,
          auto_unsubscribe: true
        }
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleCampaignAction = async (campaignId, action) => {
    try {
      switch (action) {
        case 'start':
          await startCampaign(campaignId);
          break;
        case 'pause':
          await pauseCampaign(campaignId);
          break;
        case 'stop':
          await stopCampaign(campaignId);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} campaign:`, error);
    }
  };

  const getCampaignStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'stopped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionButtons = (campaign) => {
    const buttons = [];
    
    switch (campaign.status) {
      case 'draft':
        buttons.push(
          <button
            key="start"
            onClick={() => handleCampaignAction(campaign.id, 'start')}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            <PlayIcon className="h-3 w-3" />
            <span>Start</span>
          </button>
        );
        break;
      case 'active':
        buttons.push(
          <button
            key="pause"
            onClick={() => handleCampaignAction(campaign.id, 'pause')}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            <PauseIcon className="h-3 w-3" />
            <span>Pause</span>
          </button>
        );
        buttons.push(
          <button
            key="stop"
            onClick={() => handleCampaignAction(campaign.id, 'stop')}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            <StopIcon className="h-3 w-3" />
            <span>Stop</span>
          </button>
        );
        break;
      case 'paused':
        buttons.push(
          <button
            key="resume"
            onClick={() => handleCampaignAction(campaign.id, 'start')}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            <PlayIcon className="h-3 w-3" />
            <span>Resume</span>
          </button>
        );
        buttons.push(
          <button
            key="stop"
            onClick={() => handleCampaignAction(campaign.id, 'stop')}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            <StopIcon className="h-3 w-3" />
            <span>Stop</span>
          </button>
        );
        break;
      default:
        break;
    }

    buttons.push(
      <button
        key="view"
        onClick={() => setSelectedCampaign(campaign)}
        className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        <EyeIcon className="h-3 w-3" />
        <span>View</span>
      </button>
    );

    return buttons;
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MegaphoneIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Email Campaigns</h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'stats'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ChartBarIcon className="h-4 w-4 inline mr-1" />
              Stats
            </button>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Campaign Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MegaphoneIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Campaigns</p>
              <p className="text-2xl font-semibold text-gray-900">{campaigns.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PlayIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {campaigns.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EnvelopeIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Emails Sent</p>
              <p className="text-2xl font-semibold text-gray-900">
                {campaigns.reduce((total, campaign) => total + (campaign.emails_sent || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Open Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {campaigns.length > 0 
                  ? Math.round(campaigns.reduce((total, campaign) => total + (campaign.open_rate || 0), 0) / campaigns.length)
                  : 0
                }%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      {viewMode === 'list' && (
        <div className="bg-white shadow rounded-lg">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first email campaign to reach your audience.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Campaign
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent / Opens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                          <div className="text-sm text-gray-500">{campaign.subject}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCampaignStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {campaign.recipients?.length || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div>{campaign.emails_sent || 0} sent</div>
                          <div className="text-xs text-gray-500">
                            {campaign.open_rate || 0}% opens
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          {campaign.schedule_type === 'immediate' ? (
                            <>
                              <ClockIcon className="h-4 w-4 mr-1" />
                              Immediate
                            </>
                          ) : campaign.scheduled_date ? (
                            <>
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {format(new Date(campaign.scheduled_date), 'MMM d, h:mm a')}
                            </>
                          ) : (
                            'Not scheduled'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {getActionButtons(campaign)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Campaign Stats View */}
      {viewMode === 'stats' && (
        <div className="space-y-6">
          {campaigns.map((campaign) => {
            const stats = getCampaignStats(campaign.id);
            return (
              <div key={campaign.id} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCampaignStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats?.sent || 0}</div>
                    <div className="text-sm text-gray-500">Emails Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats?.opened || 0}</div>
                    <div className="text-sm text-gray-500">Opened ({stats?.openRate || 0}%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats?.clicked || 0}</div>
                    <div className="text-sm text-gray-500">Clicked ({stats?.clickRate || 0}%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats?.bounced || 0}</div>
                    <div className="text-sm text-gray-500">Bounced ({stats?.bounceRate || 0}%)</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateCampaign}>
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">Create Email Campaign</h3>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Monthly Newsletter"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Schedule Type
                    </label>
                    <select
                      value={formData.schedule_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, schedule_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="immediate">Send Immediately</option>
                      <option value="scheduled">Schedule for Later</option>
                      <option value="recurring">Recurring Campaign</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this campaign..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Subject line for your emails"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Your email content here..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients *
                  </label>
                  <textarea
                    value={formData.recipients}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipients: e.target.value }))}
                    placeholder="Enter email addresses separated by commas"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple email addresses with commas
                  </p>
                </div>

                {formData.schedule_type === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {formData.schedule_type === 'recurring' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recurrence Pattern
                    </label>
                    <select
                      value={formData.recurrence_pattern}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurrence_pattern: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select pattern</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Settings
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.settings.track_opens}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, track_opens: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Track email opens</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.settings.track_clicks}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, track_clicks: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Track link clicks</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.settings.auto_unsubscribe}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, auto_unsubscribe: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include unsubscribe link</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{selectedCampaign.name}</h3>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Campaign Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Status:</dt>
                      <dd className="font-medium">{selectedCampaign.status}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Subject:</dt>
                      <dd className="font-medium">{selectedCampaign.subject}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Recipients:</dt>
                      <dd className="font-medium">{selectedCampaign.recipients?.length || 0}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Schedule Type:</dt>
                      <dd className="font-medium">{selectedCampaign.schedule_type}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Emails Sent:</span>
                      <span className="font-medium">{selectedCampaign.emails_sent || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Open Rate:</span>
                      <span className="font-medium">{selectedCampaign.open_rate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Click Rate:</span>
                      <span className="font-medium">{selectedCampaign.click_rate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bounce Rate:</span>
                      <span className="font-medium">{selectedCampaign.bounce_rate || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Email Content</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {selectedCampaign.content}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaigns;
