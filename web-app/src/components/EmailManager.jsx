import React, { useState, useEffect } from 'react';
import {
  EnvelopeIcon as Mail,
  PaperAirplaneIcon as Send,
  CogIcon as Settings,
  DocumentTextIcon as FileText,
  ClockIcon as Clock,
  CheckCircleIcon as CheckCircle,
  ExclamationTriangleIcon as AlertTriangle,
} from '@heroicons/react/24/outline';
import emailService from '@lib/emailService';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';
import { useTranslation } from 'react-i18next';

const EmailManager = () => {
  const { t } = useTranslation('email');
  const [activeTab, setActiveTab] = useState('send');
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [emailActivity, setEmailActivity] = useState([]);
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    loadInvoices();
    loadEmailActivity();
    loadTemplates();
  }, []);

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(
          `
          id,
          invoice_number,
          total_amount,
          status,
          issue_date,
          clients:client_id (
            name,
            email
          )
        `,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      Logger.error('Error loading invoices:', error);
    }
  };

  const loadEmailActivity = async () => {
    try {
      const result = await emailService.getEmailActivity();
      if (result.success) {
        setEmailActivity(result.data);
      }
    } catch (error) {
      Logger.error('Error loading email activity:', error);
    }
  };

  const loadTemplates = () => {
    const templates = emailService.getTemplates();
    setTemplates(templates);
    if (Object.keys(templates).length > 0) {
      setSelectedTemplate(Object.keys(templates)[0]);
    }
  };

  const handleSendInvoice = async () => {
    if (!selectedInvoice || !recipientEmail) {
      alert(t('alerts.selectInvoiceAndEmail'));
      return;
    }

    setLoading(true);
    try {
      const result = await emailService.sendInvoice(
        selectedInvoice,
        recipientEmail,
        customMessage || null,
        true,
      );

      if (result.success) {
        alert(t('alerts.emailSentSuccess'));
        setCustomMessage('');
        loadEmailActivity();
      } else {
        alert(t('alerts.sendError', { error: result.error }));
      }
    } catch (error) {
      Logger.error('Error sending invoice:', error);
      alert(t('alerts.genericSendError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (invoiceId, reminderType) => {
    setLoading(true);
    try {
      const result = await emailService.sendPaymentReminder(invoiceId, reminderType);

      if (result.success) {
        alert(t('alerts.reminderSentSuccess'));
        loadEmailActivity();
      } else {
        alert(t('alerts.sendError', { error: result.error }));
      }
    } catch (error) {
      Logger.error('Error sending reminder:', error);
      alert(t('alerts.genericReminderError'));
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert(t('alerts.enterTestEmail'));
      return;
    }

    setLoading(true);
    try {
      const result = await emailService.testEmailConfiguration(testEmail);

      if (result.success) {
        alert(t('alerts.testSentSuccess'));
      } else {
        alert(t('alerts.testError', { error: result.error }));
      }
    } catch (error) {
      Logger.error('Error testing email:', error);
      alert(t('alerts.genericTestError'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Removed unused sendClientEmail function

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center">
          <Mail className="h-6 w-6 mr-2" />
          {t('title')}
        </h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'send', label: t('tabs.send'), icon: Send },
              { id: 'activity', label: t('tabs.activity'), icon: Clock },
              { id: 'templates', label: t('tabs.templates'), icon: FileText },
              { id: 'settings', label: t('tabs.settings'), icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Send Email Tab */}
          {activeTab === 'send' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Send Invoice */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">{t('sendInvoice.title')}</h3>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="invoice-select"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t('sendInvoice.selectInvoice')}
                      </label>
                      <select
                        id="invoice-select"
                        value={selectedInvoice}
                        onChange={(e) => {
                          const invId = e.target.value;
                          setSelectedInvoice(invId);
                          const inv = invoices.find((i) => i.id === parseInt(invId));
                          if (inv) {
                            setRecipientEmail(inv.clients.email);
                          }
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      >
                        <option value="">{t('sendInvoice.selectPlaceholder')}</option>
                        {invoices.map((invoice) => (
                          <option key={invoice.id} value={String(invoice.id)}>
                            {invoice.invoice_number} - {invoice.clients.name} - €
                            {parseFloat(invoice.total_amount).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="recipient-email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t('sendInvoice.recipientEmail')}
                      </label>
                      <input
                        type="email"
                        id="recipient-email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder={t('sendInvoice.recipientPlaceholder')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="custom-message"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t('sendInvoice.customMessage')}
                      </label>
                      <textarea
                        id="custom-message"
                        rows="4"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder={t('sendInvoice.messagePlaceholder')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      ></textarea>
                    </div>
                  </div>
                  <button
                    onClick={handleSendInvoice}
                    disabled={loading || !selectedInvoice || !recipientEmail}
                    className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t('sendInvoice.sendButton')}
                      </>
                    )}
                  </button>
                </div>

                {/* Send Reminders */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">{t('sendReminder.title')}</h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">{t('sendReminder.description')}</p>

                    {invoices
                      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
                      .map((invoice) => (
                        <div key={invoice.id} className="border rounded p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium">{invoice.invoice_number}</div>
                              <div className="text-sm text-gray-500">{invoice.clients.name}</div>
                              <div className="text-sm text-gray-500">
                                €{parseFloat(invoice.total_amount).toFixed(2)}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                invoice.status === 'overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {t(`status.${invoice.status}`)}
                            </span>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSendReminder(invoice.id, 'gentle')}
                              disabled={loading}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              {t('sendReminder.firstReminder')}
                            </button>
                            {invoice.status === 'overdue' && (
                              <button
                                onClick={() => handleSendReminder(invoice.id, 'firm')}
                                disabled={loading}
                                className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200"
                              >
                                {t('sendReminder.secondReminder')}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-medium mb-4">{t('activityLog.title')}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('activityLog.recipient')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('activityLog.subject')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('activityLog.date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('activityLog.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emailActivity.map((activity, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {activity.recipient}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activity.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(activity.sent_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(activity.status)}
                            <span className={`capitalize ${getStatusColor(activity.status)}`}>
                              {t(`status.${activity.status}`)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">{t('templates.title')}</h3>
              <div>
                <label
                  htmlFor="template-select"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('templates.selectTemplate')}
                </label>
                <select
                  id="template-select"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                >
                  {Object.keys(templates).map((key) => (
                    <option key={key} value={key}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              {selectedTemplate && (
                <div className="border rounded-lg p-6 space-y-4">
                  <div>
                    <label
                      htmlFor="template-subject"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t('templates.subject')}
                    </label>
                    <input
                      type="text"
                      id="template-subject"
                      value={templates[selectedTemplate]?.subject || ''}
                      readOnly
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="template-body"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t('templates.body')}
                    </label>
                    <textarea
                      id="template-body"
                      value={templates[selectedTemplate]?.body || ''}
                      readOnly
                      rows="12"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                    ></textarea>
                  </div>
                  <button
                    onClick={() => {
                      /* Logic to save template */
                    }}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    {t('templates.saveButton')}
                  </button>
                </div>
              )}
              <div>
                <h4 className="font-medium text-gray-800">{t('templates.placeholders')}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    '{client_name}',
                    '{company_name}',
                    '{invoice_number}',
                    '{total_amount}',
                    '{issue_date}',
                    '{due_date}',
                  ].map((placeholder, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs"
                    >
                      {placeholder}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">{t('settings.title')}</h3>
              <div className="border rounded-lg p-6">
                <p className="text-gray-600 mb-4">{t('settings.configure')}</p>
                {/* SMTP configuration form would go here */}
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-md font-medium mb-4">{t('settings.testTitle')}</h4>
                <div className="flex gap-4">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder={t('settings.testPlaceholder')}
                    className="flex-grow border-gray-300 rounded-md shadow-sm"
                  />
                  <button
                    onClick={handleTestEmail}
                    disabled={loading}
                    className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-green-300"
                  >
                    {t('settings.sendTestButton')}
                  </button>
                </div>
              </div>
              <div className="border rounded-lg p-6">
                <h4 className="font-medium mb-4">{t('settings.systemInfo')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('settings.provider')}:</span>
                    <span className="text-gray-600">Mock Service (Demo)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('settings.status')}:</span>
                    <span className="text-green-600">{t('settings.active')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('settings.emailsSentToday')}:</span>
                    <span className="text-gray-600">
                      {
                        emailActivity.filter(
                          (a) => new Date(a.sent_at).toDateString() === new Date().toDateString(),
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailManager;
