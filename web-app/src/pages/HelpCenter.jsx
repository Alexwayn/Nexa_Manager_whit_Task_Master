import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, Book, MessageCircle, Phone, Mail, ChevronDown, ChevronRight, Mic } from 'lucide-react';

const HelpCenter = () => {
  const { t } = useTranslation('helpCenter');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleVoiceHelpClick = () => {
    navigate('/voice-help');
  };

  const faqData = [
    {
      id: 1,
      question: t('faqs.q1.question'),
      answer: t('faqs.q1.answer'),
    },
    {
      id: 2,
      question: t('faqs.q2.question'),
      answer: t('faqs.q2.answer'),
    },
    {
      id: 3,
      question: t('faqs.q3.question'),
      answer: t('faqs.q3.answer'),
    },
    {
      id: 4,
      question: t('faqs.q4.question'),
      answer: t('faqs.q4.answer'),
    },
    {
      id: 5,
      question: t('faqs.q5.question'),
      answer: t('faqs.q5.answer'),
    },
  ];

  const guides = [
    {
      title: t('guides.quickStart.title'),
      description: t('guides.quickStart.description'),
      icon: '🚀',
      time: t('guides.quickStart.time'),
    },
    {
      title: t('guides.clientManagement.title'),
      description: t('guides.clientManagement.description'),
      icon: '👥',
      time: t('guides.clientManagement.time'),
    },
    {
      title: t('guides.invoicing.title'),
      description: t('guides.invoicing.description'),
      icon: '📄',
      time: t('guides.invoicing.time'),
    },
    {
      title: t('guides.analyticsAndReports.title'),
      description: t('guides.analyticsAndReports.description'),
      icon: '📊',
      time: t('guides.analyticsAndReports.time'),
    },
  ];

  const toggleFaq = id => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='text-center'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>{t('header.title')}</h1>
            <p className='text-xl text-gray-600 mb-8'>{t('header.subtitle')}</p>

            {/* Search Bar */}
            <div className='max-w-2xl mx-auto relative'>
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
              <input
                type='text'
                placeholder={t('search.placeholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Quick Actions */}
        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
          <div className='bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow'>
            <div className='bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <Book className='h-8 w-8 text-blue-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              {t('quickActions.documentation.title')}
            </h3>
            <p className='text-gray-600 mb-4'>{t('quickActions.documentation.description')}</p>
            <button className='text-blue-600 hover:text-blue-700 font-medium'>
              {t('quickActions.documentation.button')}
            </button>
          </div>

          <div className='bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow'>
            <div className='bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <MessageCircle className='h-8 w-8 text-green-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              {t('quickActions.supportChat.title')}
            </h3>
            <p className='text-gray-600 mb-4'>{t('quickActions.supportChat.description')}</p>
            <button className='text-green-600 hover:text-green-700 font-medium'>
              {t('quickActions.supportChat.button')}
            </button>
          </div>

          <div className='bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow'>
            <div className='bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <Phone className='h-8 w-8 text-purple-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              {t('quickActions.phoneSupport.title')}
            </h3>
            <p className='text-gray-600 mb-4'>{t('quickActions.phoneSupport.description')}</p>
            <a
              href='tel:+39351693692'
              className='text-purple-600 hover:text-purple-700 font-medium'
            >
              {t('quickActions.phoneSupport.button')}
            </a>
          </div>

          <div className='bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow cursor-pointer' onClick={handleVoiceHelpClick}>
            <div className='bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <Mic className='h-8 w-8 text-orange-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Voice Commands
            </h3>
            <p className='text-gray-600 mb-4'>Learn all available voice commands and how to use them</p>
            <span className='text-orange-600 hover:text-orange-700 font-medium'>
              View Commands
            </span>
          </div>
        </div>

        <div className='grid lg:grid-cols-2 gap-12'>
          {/* Guide Popolari */}
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>{t('popularGuides.title')}</h2>
            <div className='space-y-4'>
              {guides.map((guide, index) => (
                <div
                  key={index}
                  className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer'
                >
                  <div className='flex items-start space-x-4'>
                    <div className='text-2xl'>{guide.icon}</div>
                    <div className='flex-1'>
                      <h3 className='text-lg font-semibold text-gray-900 mb-2'>{guide.title}</h3>
                      <p className='text-gray-600 mb-2'>{guide.description}</p>
                      <span className='text-sm text-blue-600 font-medium'>
                        {t('popularGuides.readingTime', { time: guide.time })}
                      </span>
                    </div>
                    <ChevronRight className='h-5 w-5 text-gray-400' />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>{t('faq.title')}</h2>
            <div className='space-y-4'>
              {faqData.map(faq => (
                <div key={faq.id} className='bg-white rounded-lg shadow-sm'>
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className='w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition-colors'
                  >
                    <span className='font-medium text-gray-900'>{faq.question}</span>
                    {expandedFaq === faq.id ? (
                      <ChevronDown className='h-5 w-5 text-gray-500' />
                    ) : (
                      <ChevronRight className='h-5 w-5 text-gray-500' />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className='px-6 pb-6'>
                      <p className='text-gray-600 leading-relaxed'>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className='mt-16 bg-blue-50 rounded-2xl p-8 text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>{t('contact.title')}</h2>
          <p className='text-gray-600 mb-6'>{t('contact.subtitle')}</p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <a
              href='mailto:support@nexamanager.com'
              className='inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              <Mail className='h-5 w-5 mr-2' />
              {t('contact.emailButton')}
            </a>
            <a
              href='tel:+39351693692'
              className='inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors'
            >
              <Phone className='h-5 w-5 mr-2' />
              {t('contact.callButton')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
