import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDownIcon,
  CheckIcon,
  GlobeAltIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';

const LanguageSwitcher = ({ className = '', showLabel = true, compact = false }) => {
  const { i18n, t } = useTranslation('navigation');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Available languages with metadata
  const languages = [
    {
      code: 'it',
      name: 'Italiano',
      flag: '🇮🇹',
      direction: 'ltr',
      locale: 'it-IT',
    },
    {
      code: 'en',
      name: 'English',
      flag: '🇺🇸',
      direction: 'ltr',
      locale: 'en-US',
    },
    // Future RTL languages
    {
      code: 'ar',
      name: 'العربية',
      flag: '🇸🇦',
      direction: 'rtl',
      locale: 'ar-SA',
      disabled: true, // Will be enabled in future
    },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  // Change language with loading state
  const changeLanguage = async languageCode => {
    if (languageCode === i18n.language || isLoading) return;

    setIsLoading(true);
    try {
      await i18n.changeLanguage(languageCode);

      // Save to localStorage for persistence
      localStorage.setItem('nexa-language', languageCode);

      // Apply RTL direction if needed
      const selectedLang = languages.find(lang => lang.code === languageCode);
      if (selectedLang) {
        document.documentElement.dir = selectedLang.direction;
        document.documentElement.lang = languageCode;

        // Set locale for date/number formatting
        if (selectedLang.locale) {
          document.documentElement.setAttribute('data-locale', selectedLang.locale);
        }
      }

      // Smooth transition effect
      setTimeout(() => {
        setIsOpen(false);
        setIsLoading(false);
      }, 300);
    } catch (error) {
      console.error('Failed to change language:', error);
      setIsLoading(false);
    }
  };

  // Detect and apply RTL on mount
  useEffect(() => {
    const currentLang = languages.find(lang => lang.code === i18n.language);
    if (currentLang) {
      document.documentElement.dir = currentLang.direction;
      document.documentElement.lang = currentLang.code;
      if (currentLang.locale) {
        document.documentElement.setAttribute('data-locale', currentLang.locale);
      }
    }
  }, [i18n.language]);

  if (compact) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className='flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors duration-200'
          aria-label={t('language.switch', 'Switch language')}
          aria-expanded={isOpen}
          aria-haspopup='listbox'
          disabled={isLoading}
        >
          {isLoading ? (
            <ArrowPathIcon className='h-5 w-5 animate-spin' />
          ) : (
            <>
              <span className='text-lg mr-1' role='img' aria-hidden='true'>
                {currentLanguage.flag}
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </>
          )}
        </button>

        <Transition
          show={isOpen}
          enter='transition ease-out duration-200'
          enterFrom='opacity-0 scale-95'
          enterTo='opacity-100 scale-100'
          leave='transition ease-in duration-150'
          leaveFrom='opacity-100 scale-100'
          leaveTo='opacity-0 scale-95'
        >
          <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50'>
            <div
              className='py-1'
              role='listbox'
              aria-label={t('language.available', 'Available languages')}
            >
              {languages.map(language => (
                <button
                  key={language.code}
                  onClick={() => !language.disabled && changeLanguage(language.code)}
                  disabled={language.disabled || isLoading}
                  className={`
                    w-full text-left px-4 py-2 text-sm flex items-center justify-between
                    ${
                      language.code === i18n.language
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                    ${language.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    transition-colors duration-150
                  `}
                  role='option'
                  aria-selected={language.code === i18n.language}
                >
                  <div className='flex items-center'>
                    <span className='text-lg mr-3' role='img' aria-hidden='true'>
                      {language.flag}
                    </span>
                    <span>{language.name}</span>
                    {language.disabled && (
                      <span className='ml-2 text-xs text-gray-500 dark:text-gray-400'>
                        {t('language.comingSoon', 'Coming soon')}
                      </span>
                    )}
                  </div>
                  {language.code === i18n.language && !language.disabled && (
                    <CheckIcon className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Transition>
      </div>
    );
  }

  // Full language switcher with label
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className='flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors duration-200'
        aria-label={t('language.current', { language: currentLanguage.name })}
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        disabled={isLoading}
      >
        {isLoading ? (
          <ArrowPathIcon className='h-5 w-5 animate-spin' />
        ) : (
          <GlobeAltIcon className='h-5 w-5' />
        )}

        {showLabel && (
          <span className='hidden sm:block text-sm font-medium'>{currentLanguage.name}</span>
        )}

        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <Transition
        show={isOpen}
        enter='transition ease-out duration-200'
        enterFrom='opacity-0 scale-95'
        enterTo='opacity-100 scale-100'
        leave='transition ease-in duration-150'
        leaveFrom='opacity-100 scale-100'
        leaveTo='opacity-0 scale-95'
      >
        <div className='absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50'>
          <div
            className='py-1'
            role='listbox'
            aria-label={t('language.available', 'Available languages')}
          >
            <div className='px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700'>
              {t('language.selectLanguage', 'Select Language')}
            </div>

            {languages.map(language => (
              <button
                key={language.code}
                onClick={() => !language.disabled && changeLanguage(language.code)}
                disabled={language.disabled || isLoading}
                className={`
                  w-full text-left px-4 py-3 text-sm flex items-center justify-between
                  ${
                    language.code === i18n.language
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${language.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  transition-colors duration-150
                `}
                role='option'
                aria-selected={language.code === i18n.language}
              >
                <div className='flex items-center'>
                  <span className='text-xl mr-3' role='img' aria-label={`${language.name} flag`}>
                    {language.flag}
                  </span>
                  <div>
                    <div className='font-medium'>{language.name}</div>
                    {language.direction === 'rtl' && (
                      <div className='text-xs text-gray-500 dark:text-gray-400'>
                        {t('language.rtl', 'Right-to-left')}
                      </div>
                    )}
                    {language.disabled && (
                      <div className='text-xs text-gray-500 dark:text-gray-400'>
                        {t('language.comingSoon', 'Coming soon')}
                      </div>
                    )}
                  </div>
                </div>
                {language.code === i18n.language && !language.disabled && (
                  <CheckIcon className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                )}
              </button>
            ))}
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default LanguageSwitcher;
