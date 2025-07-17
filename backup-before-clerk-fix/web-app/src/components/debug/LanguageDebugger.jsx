import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageDebugger = () => {
  const { i18n, t, ready } = useTranslation('inventory');
  const [debugInfo, setDebugInfo] = useState({});
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    const info = {
      currentLanguage: i18n.language,
      isReady: ready,
      availableLanguages: i18n.languages,
      loadedNamespaces: i18n.options.ns,
      localStorage: localStorage.getItem('nexa-language'),
      fallbackLanguage: i18n.options.fallbackLng,
    };
    setDebugInfo(info);

    // Test traduzioni specifiche
    const testTranslations = {
      'reorder.title': t('reorder.title'),
      'reorder.itemInfo': t('reorder.itemInfo'),
      'reorder.quantity': t('reorder.quantity'),
      'reorder.urgencyLabel': t('reorder.urgencyLabel'),
      'common.cancel': t('common.cancel'),
    };
    setTranslations(testTranslations);
  }, [i18n, t, ready]);

  const forceItalian = async () => {
    try {
      localStorage.setItem('nexa-language', 'it');
      await i18n.changeLanguage('it');
      window.location.reload();
    } catch (error) {
      console.error('Errore nel cambio lingua:', error);
    }
  };

  const clearCache = () => {
    localStorage.removeItem('nexa-language');
    localStorage.removeItem('i18nextLng');
    window.location.reload();
  };

  return (
    <div className='fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-md'>
      <h3 className='font-bold text-lg mb-3 text-red-600'>🐛 Language Debugger</h3>

      <div className='space-y-2 text-sm'>
        <div>
          <strong>Lingua attuale:</strong> {debugInfo.currentLanguage}
        </div>
        <div>
          <strong>i18n Ready:</strong> {debugInfo.isReady ? '✅' : '❌'}
        </div>
        <div>
          <strong>localStorage:</strong> {debugInfo.localStorage || 'non impostato'}
        </div>
        <div>
          <strong>Lingue disponibili:</strong> {debugInfo.availableLanguages?.join(', ')}
        </div>
      </div>

      <div className='mt-4'>
        <h4 className='font-semibold mb-2'>Traduzioni Test:</h4>
        <div className='space-y-1 text-xs'>
          {Object.entries(translations).map(([key, value]) => (
            <div key={key} className={`${value === key ? 'text-red-600' : 'text-green-600'}`}>
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>
      </div>

      <div className='mt-4 space-y-2'>
        <button
          onClick={forceItalian}
          className='w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600'
        >
          🇮🇹 Forza Italiano
        </button>
        <button
          onClick={clearCache}
          className='w-full bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600'
        >
          🗑️ Pulisci Cache
        </button>
      </div>

      <div className='mt-3 text-xs text-gray-500'>
        Questo componente è solo per debug. Rimuovere in produzione.
      </div>
    </div>
  );
};

export default LanguageDebugger;
