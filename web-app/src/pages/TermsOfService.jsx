import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Shield, Users, AlertTriangle, Mail, Phone } from 'lucide-react';

const TermsOfService = () => {
  const { t } = useTranslation('termsOfService');

  const sections = [
    {
      id: 'acceptance',
      title: t('sections.acceptance.title'),
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      content: t('sections.acceptance.content'),
    },
    {
      id: 'services',
      title: t('sections.services.title'),
      icon: <Users className="h-6 w-6 text-green-600" />,
      content: t('sections.services.content'),
    },
    {
      id: 'account',
      title: t('sections.account.title'),
      icon: <Shield className="h-6 w-6 text-purple-600" />,
      content: t('sections.account.content'),
    },
    {
      id: 'usage',
      title: t('sections.usage.title'),
      icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
      content: t('sections.usage.content'),
    },
  ];

  const additionalSections = [
    {
      title: t('additionalSections.ip.title'),
      content: t('additionalSections.ip.content', { returnObjects: true }) || [],
    },
    {
      title: t('additionalSections.privacy.title'),
      content: t('additionalSections.privacy.content', { returnObjects: true }) || [],
    },
    {
      title: t('additionalSections.billing.title'),
      content: t('additionalSections.billing.content', { returnObjects: true }) || [],
    },
    {
      title: t('additionalSections.liability.title'),
      content: t('additionalSections.liability.content', { returnObjects: true }) || [],
    },
    {
      title: t('additionalSections.disputes.title'),
      content: t('additionalSections.disputes.content', { returnObjects: true }) || [],
    },
    {
      title: t('additionalSections.termination.title'),
      content: t('additionalSections.termination.content', { returnObjects: true }) || [],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('header.title')}</h1>
            <p className="text-xl text-gray-600 mb-8">{t('header.subtitle')}</p>
            <div className="bg-blue-50 rounded-lg p-4 text-left max-w-2xl mx-auto">
              <p className="text-sm text-blue-800">
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

        {/* Additional Sections */}
        <div className="space-y-6 mb-12">
          {additionalSections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">{section.title}</h3>
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <span className="text-gray-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('contact.title')}</h3>
            <p className="text-gray-600 mb-6">{t('contact.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`mailto:${t('contact.email')}`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="h-5 w-5 mr-2" />
                {t('contact.email')}
              </a>
              <a
                href={`tel:${t('contact.phone')}`}
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Phone className="h-5 w-5 mr-2" />
                {t('contact.phone')}
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-blue-200">
              <p className="text-sm text-gray-600">
                <strong>{t('companyInfo.name')}</strong>
                <br />
                {t('companyInfo.address')}
                <br />
                {t('companyInfo.vatId')}
                <br />
                {t('companyInfo.registration')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {t('footer.pdfNote')}
            <a href="#" className="text-blue-600 hover:text-blue-700 ml-1">
              {t('footer.downloadPdf')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
