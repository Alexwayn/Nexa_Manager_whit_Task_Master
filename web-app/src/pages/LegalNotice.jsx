import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Eye, Lock, Users, Database, Mail, Phone, FileText } from 'lucide-react';

const LegalNotice = () => {
  const { t } = useTranslation('legalNotice');

  const sections = [
    {
      id: 'data-collection',
      title: t('sections.dataCollection.title'),
      icon: <Database className="h-6 w-6 text-blue-600" />,
      content: t('sections.dataCollection.content'),
    },
    {
      id: 'data-usage',
      title: t('sections.dataUsage.title'),
      icon: <Eye className="h-6 w-6 text-green-600" />,
      content: t('sections.dataUsage.content'),
    },
    {
      id: 'data-sharing',
      title: t('sections.dataSharing.title'),
      icon: <Users className="h-6 w-6 text-purple-600" />,
      content: t('sections.dataSharing.content'),
    },
    {
      id: 'data-security',
      title: t('sections.dataSecurity.title'),
      icon: <Lock className="h-6 w-6 text-red-600" />,
      content: t('sections.dataSecurity.content'),
    },
  ];

  const gdprRights = [
    {
      title: t('gdpr.rights.access.title'),
      description: t('gdpr.rights.access.description'),
      icon: '👁️',
    },
    {
      title: t('gdpr.rights.rectification.title'),
      description: t('gdpr.rights.rectification.description'),
      icon: '✏️',
    },
    {
      title: t('gdpr.rights.erasure.title'),
      description: t('gdpr.rights.erasure.description'),
      icon: '🗑️',
    },
    {
      title: t('gdpr.rights.portability.title'),
      description: t('gdpr.rights.portability.description'),
      icon: '📦',
    },
    {
      title: t('gdpr.rights.restriction.title'),
      description: t('gdpr.rights.restriction.description'),
      icon: '⏸️',
    },
    {
      title: t('gdpr.rights.objection.title'),
      description: t('gdpr.rights.objection.description'),
      icon: '🛑',
    },
  ];

  const dataRetention = [
    {
      type: t('retention.rows.account.type'),
      period: t('retention.rows.account.period'),
      reason: t('retention.rows.account.reason'),
    },
    {
      type: t('retention.rows.billing.type'),
      period: t('retention.rows.billing.period'),
      reason: t('retention.rows.billing.reason'),
    },
    {
      type: t('retention.rows.security.type'),
      period: t('retention.rows.security.period'),
      reason: t('retention.rows.security.reason'),
    },
    {
      type: t('retention.rows.marketing.type'),
      period: t('retention.rows.marketing.period'),
      reason: t('retention.rows.marketing.reason'),
    },
    {
      type: t('retention.rows.support.type'),
      period: t('retention.rows.support.period'),
      reason: t('retention.rows.support.reason'),
    },
  ];

  const transferMethods = t('transfers.methods', { returnObjects: true }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('header.title')}</h1>
            <p className="text-xl text-gray-600 mb-8">{t('header.subtitle')}</p>
            <div className="bg-green-50 rounded-lg p-4 text-left max-w-2xl mx-auto">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">{t('header.gdprCompliant')}</span>
              </div>
              <p className="text-sm text-green-700">
                <strong>{t('header.effectiveDate')}</strong>
                <br />
                <strong>{t('header.lastModified')}</strong>
                <br />
                <strong>{t('header.version')}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('introduction.title')}</h2>
          <p className="text-gray-700 leading-relaxed mb-4">{t('introduction.p1')}</p>
          <p className="text-gray-700 leading-relaxed">{t('introduction.p2')}</p>
        </div>

        {/* Main Sections */}
        <div className="space-y-6 mb-12">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">{section.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{section.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* GDPR Rights */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('gdpr.title')}</h3>
          <p className="text-gray-600 mb-6">{t('gdpr.intro')}</p>
          <div className="grid md:grid-cols-2 gap-6">
            {gdprRights.map((right, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{right.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{right.title}</h4>
                    <p className="text-sm text-gray-600">{right.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{t('gdpr.exerciseRights')}</strong> {t('gdpr.exerciseRightsDetails')}
            </p>
          </div>
        </div>

        {/* Data Retention */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('retention.title')}</h3>
          <p className="text-gray-600 mb-6">{t('retention.intro')}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('retention.tableHeaders.type')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('retention.tableHeaders.period')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('retention.tableHeaders.reason')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dataRetention.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.period}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('cookies.title')}</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('cookies.essential.title')}</h4>
              <p className="text-gray-600">{t('cookies.essential.description')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('cookies.analytics.title')}</h4>
              <p className="text-gray-600">{t('cookies.analytics.description')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('cookies.marketing.title')}</h4>
              <p className="text-gray-600">{t('cookies.marketing.description')}</p>
            </div>
          </div>
        </div>

        {/* International Transfers */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('transfers.title')}</h3>
          <p className="text-gray-600 mb-4">{t('transfers.intro')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            {Array.isArray(transferMethods) &&
              transferMethods.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>

        {/* Updates */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('updates.title')}</h3>
          <p className="text-gray-600 mb-4">{t('updates.content')}</p>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('contact.title')}</h3>
            <p className="text-gray-600 mb-6">{t('contact.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`mailto:${t('contact.email')}`}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Mail className="h-5 w-5 mr-2" />
                {t('contact.email')}
              </a>
              <a
                href={`tel:${t('contact.phone')}`}
                className="inline-flex items-center px-6 py-3 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Phone className="h-5 w-5 mr-2" />
                {t('contact.phone')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalNotice;
