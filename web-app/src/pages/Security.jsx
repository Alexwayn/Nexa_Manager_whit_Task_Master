import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Lock,
  Eye,
  Zap,
  Database,
  Cloud,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
} from 'lucide-react';

const Security = () => {
  const { t } = useTranslation('security');

  const securityFeatures = [
    {
      id: 'encryption',
      title: t('features.encryption.title'),
      icon: <Lock className="h-8 w-8 text-blue-600" />,
      description: t('features.encryption.description'),
      details: t('features.encryption.details', { returnObjects: true }),
    },
    {
      id: 'access',
      title: t('features.accessControl.title'),
      icon: <Eye className="h-8 w-8 text-green-600" />,
      description: t('features.accessControl.description'),
      details: t('features.accessControl.details', { returnObjects: true }),
    },
    {
      id: 'monitoring',
      title: t('features.monitoring.title'),
      icon: <Zap className="h-8 w-8 text-purple-600" />,
      description: t('features.monitoring.description'),
      details: t('features.monitoring.details', { returnObjects: true }),
    },
    {
      id: 'infrastructure',
      title: t('features.secureInfrastructure.title'),
      icon: <Cloud className="h-8 w-8 text-orange-600" />,
      description: t('features.secureInfrastructure.description'),
      details: t('features.secureInfrastructure.details', { returnObjects: true }),
    },
  ];

  const certifications = [
    {
      name: t('certifications.iso27001.name'),
      description: t('certifications.iso27001.description'),
      status: t('certifications.status.certified'),
      validUntil: 'Dicembre 2024',
      icon: '🏆',
    },
    {
      name: t('certifications.soc2.name'),
      description: t('certifications.soc2.description'),
      status: t('certifications.status.certified'),
      validUntil: 'Marzo 2024',
      icon: '✅',
    },
    {
      name: t('certifications.gdpr.name'),
      description: t('certifications.gdpr.description'),
      status: t('certifications.status.compliant'),
      validUntil: 'Sempre aggiornato',
      icon: '🇪🇺',
    },
    {
      name: t('certifications.pci.name'),
      description: t('certifications.pci.description'),
      status: t('certifications.status.certified'),
      validUntil: 'Giugno 2024',
      icon: '💳',
    },
  ];

  const securityPractices = [
    {
      category: t('practices.secureDevelopment.category'),
      practices: t('practices.secureDevelopment.practices', { returnObjects: true }),
    },
    {
      category: t('practices.dataManagement.category'),
      practices: t('practices.dataManagement.practices', { returnObjects: true }),
    },
    {
      category: t('practices.teamTraining.category'),
      practices: t('practices.teamTraining.practices', { returnObjects: true }),
    },
    {
      category: t('practices.compliance.category'),
      practices: t('practices.compliance.practices', { returnObjects: true }),
    },
  ];

  const incidentResponse = [
    {
      phase: t('incidentResponse.phases.detection.name'),
      description: t('incidentResponse.phases.detection.description'),
      time: '< 5 minuti',
      color: 'bg-red-100 text-red-800',
    },
    {
      phase: t('incidentResponse.phases.containment.name'),
      description: t('incidentResponse.phases.containment.description'),
      time: '< 15 minuti',
      color: 'bg-orange-100 text-orange-800',
    },
    {
      phase: t('incidentResponse.phases.analysis.name'),
      description: t('incidentResponse.phases.analysis.description'),
      time: '< 1 ora',
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      phase: t('incidentResponse.phases.resolution.name'),
      description: t('incidentResponse.phases.resolution.description'),
      time: '< 4 ore',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      phase: t('incidentResponse.phases.recovery.name'),
      description: t('incidentResponse.phases.recovery.description'),
      time: '< 24 ore',
      color: 'bg-green-100 text-green-800',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('header.title')}</h1>
            <p className="text-xl text-gray-600 mb-8">{t('header.subtitle')}</p>
            <div className="bg-green-50 rounded-lg p-6 text-left max-w-3xl mx-auto">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-8 w-8 text-green-600" />
                <span className="text-xl font-semibold text-green-800">
                  {t('header.enterpriseGrade')}
                </span>
              </div>
              <p className="text-green-700">{t('header.description')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Security Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {t('features.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {securityFeatures.map((feature) => (
              <div key={feature.id} className="bg-white rounded-lg shadow-sm p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="flex-shrink-0 p-3 bg-gray-100 rounded-lg">{feature.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {feature.details.map((detail, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {t('certifications.title')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="text-4xl mb-4">{cert.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{cert.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{cert.description}</p>
                <div className="space-y-2">
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      cert.status === t('certifications.status.certified') ||
                      cert.status === t('certifications.status.compliant')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {cert.status}
                  </div>
                  <p className="text-xs text-gray-500">
                    {t('certifications.validUntil', { date: cert.validUntil })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Practices */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {t('practices.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {securityPractices.map((practiceGroup, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{practiceGroup.category}</h3>
                <ul className="space-y-3">
                  {practiceGroup.practices.map((practice, pIndex) => (
                    <li key={pIndex} className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{practice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Response */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {t('incidentResponse.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-gray-200 rounded-lg overflow-hidden shadow-sm">
            {incidentResponse.map((item, index) => (
              <div key={index} className={`p-6 ${item.color}`}>
                <p className="font-bold text-sm mb-1">{item.phase}</p>
                <p className="text-xs mb-2">{item.description}</p>
                <p className="text-lg font-bold">{item.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="text-center bg-white rounded-lg shadow-sm p-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('contact.title')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">{t('contact.description')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:security@nexmanager.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="h-5 w-5 mr-2" />
              {t('contact.email')}
            </a>
            <a
              href="tel:+18001234567"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Phone className="h-5 w-5 mr-2" />
              {t('contact.phone')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
