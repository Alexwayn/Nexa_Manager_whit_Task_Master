import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  forceItalianLanguage,
  debugLanguageSettings,
  resetLanguageSettings,
} from '@shared/utils/languageUtils';

const LanguageForcer = () => {
  const { i18n, t } = useTranslation('inventory');
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Debug current language settings
    debugLanguageSettings();

    // Update debug info
    setDebugInfo({
      currentLang: i18n.language,
      resolvedLang: i18n.resolvedLanguage,
      isInitialized: i18n.isInitialized,
      localStorage: localStorage.getItem('nexa-language'),
      i18nextLng: localStorage.getItem('i18nextLng'),
      navigatorLang: navigator.language,
    });

    // Test some translations
    console.log('🧪 Testing translations:');
    console.log('- reorder.title:', t('reorder.title'));
    console.log('- reorder.itemInfo:', t('reorder.itemInfo'));
    console.log('- reorder.fields.name:', t('reorder.fields.name'));
  }, [i18n, t]);

  return (
    <div className='fixed top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-md text-sm z-50 max-w-xs'>
      <div className='font-bold mb-2'>🌐 Language Debug</div>
      <div className='space-y-1 text-xs'>
        <div>Current: {debugInfo.currentLang}</div>
        <div>Resolved: {debugInfo.resolvedLang}</div>
        <div>Ready: {debugInfo.isInitialized ? '✅' : '❌'}</div>
        <div>Storage: {debugInfo.localStorage}</div>
        <div>i18next: {debugInfo.i18nextLng}</div>
        <div>Browser: {debugInfo.navigatorLang}</div>
        <div>Test: {t('reorder.title', 'Fallback')}</div>
      </div>
      <div className='mt-2 space-x-1'>
        <button
          onClick={forceItalianLanguage}
          className='bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600'
        >
          Force IT
        </button>
        <button
          onClick={resetLanguageSettings}
          className='bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600'
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default LanguageForcer;
