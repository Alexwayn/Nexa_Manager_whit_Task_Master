import React from 'react';
import { useTranslation } from 'react-i18next';
import nexaLogo from '@assets/logo_nexa.png';

export default function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className='w-full bg-gradient-to-r from-blue-50 to-blue-100 mt-8'>
      {/* Main Footer Section */}
      <div className='px-12 pt-8 pb-14'>
        {/* Content Grid with Headers */}
        <div className='grid grid-cols-5 gap-8'>
          {/* Company Description and Social */}
          <div className='col-span-1'>
            {/* Logo */}
            <div className='flex items-center space-x-3 mb-6'>
              <img src={nexaLogo} alt='Nexa Manager' className='h-12 w-auto' />
            </div>

            <p className='text-gray-600 text-sm leading-5 mb-6 max-w-60'>
              {t('footer.company.description')}
            </p>

            <div className='flex space-x-3'>
              <div className='bg-white rounded-full p-2 shadow-sm'>
                <svg className='w-4 h-4 text-gray-600' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z' />
                </svg>
              </div>
              <div className='bg-white rounded-full p-2 shadow-sm'>
                <svg className='w-4 h-4 text-gray-600' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
                </svg>
              </div>
              <div className='bg-white rounded-full p-2 shadow-sm'>
                <svg className='w-4 h-4 text-gray-600' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z' />
                </svg>
              </div>
            </div>
          </div>

          {/* Resources Column */}
          <div className='col-span-1'>
            <h3 className='text-blue-900 text-base font-semibold mb-4'>
              {t('footer.resources.title')}
            </h3>
            <div className='space-y-3'>
              <a
                href='/help-center'
                className='block text-gray-600 hover:text-blue-600 text-sm transition-colors'
              >
                {t('footer.resources.helpCenter')}
              </a>
              <a
                href='/documentation'
                className='block text-gray-600 hover:text-blue-600 text-sm transition-colors'
              >
                {t('footer.resources.documentation')}
              </a>
              <a
                href='/api-reference'
                className='block text-gray-600 hover:text-blue-600 text-sm transition-colors'
              >
                {t('footer.resources.apiReference')}
              </a>
              <a
                href='/system-status'
                className='block text-gray-600 hover:text-blue-600 text-sm transition-colors'
              >
                {t('footer.resources.systemStatus')}
              </a>
            </div>
          </div>

          {/* Legal Column */}
          <div className='col-span-1'>
            <h3 className='text-blue-900 text-base font-semibold mb-4'>
              {t('footer.legal.title')}
            </h3>
            <div className='space-y-3'>
              <a
                href='/terms-of-service'
                className='block text-gray-600 hover:text-blue-600 text-sm transition-colors'
              >
                {t('footer.legal.termsOfService')}
              </a>
              <a
                href='/privacy-policy'
                className='block text-gray-600 hover:text-blue-600 text-sm transition-colors'
              >
                {t('footer.legal.privacyPolicy')}
              </a>
              <a
                href='/security'
                className='block text-gray-600 hover:text-blue-600 text-sm transition-colors'
              >
                {t('footer.legal.security')}
              </a>
              <a
                href='/compliance'
                className='block text-gray-600 hover:text-blue-600 text-sm transition-colors'
              >
                {t('footer.legal.compliance')}
              </a>
            </div>
          </div>

          {/* Contact Us Column */}
          <div className='col-span-2'>
            <h3 className='text-blue-900 text-base font-semibold mb-4'>
              {t('footer.contact.title')}
            </h3>
            <div className='space-y-3 mb-4'>
              <a
                href='mailto:support@nexamanager.com'
                className='flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors'
              >
                <svg className='w-4 h-4 text-blue-500' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h.91L12 10.09l9.455-6.269h.909c.904 0 1.636.732 1.636 1.636z' />
                </svg>
                <span className='text-sm'>{t('footer.contact.email')}</span>
              </a>
              <a
                href='tel:+39351693692'
                className='flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors'
              >
                <svg className='w-4 h-4 text-blue-500' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z' />
                </svg>
                <span className='text-sm'>{t('footer.contact.phone')}</span>
              </a>
            </div>

            <div className='bg-white rounded-lg p-3 shadow-sm max-w-64'>
              <p className='text-gray-600 text-sm mb-3'>{t('footer.contact.supportMessage')}</p>
              <button className='bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors'>
                {t('footer.contact.contactSupport')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className='bg-blue-100 border-t border-blue-200 px-12 py-3.5 flex justify-between items-center'>
        <div className='text-gray-600 text-sm'>{t('footer.company.copyright')}</div>

        <div className='flex items-center space-x-6'>
          <div className='flex items-center space-x-1'>
            <svg className='w-4 h-4 text-gray-600' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' />
            </svg>
            <span className='text-gray-600 text-sm'>{t('footer.company.securityVerified')}</span>
          </div>

          <div className='flex items-center space-x-1'>
            <span className='text-gray-600 text-sm'>{t('footer.company.language')}</span>
            <svg className='w-3 h-3 text-gray-600' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M7 10l5 5 5-5z' />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
