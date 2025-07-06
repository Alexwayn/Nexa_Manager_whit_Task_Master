import React from 'react';
import { useTranslation } from 'react-i18next';

const TranslationTester = () => {
  const { t, i18n, ready } = useTranslation(['inventory', 'common']);

  const testTranslations = () => {
    console.log('=== TRANSLATION TEST ===');
    console.log('i18n ready:', ready);
    console.log('Current language:', i18n.language);
    console.log('Available languages:', i18n.languages);
    console.log('localStorage language:', localStorage.getItem('nexa-language'));
    console.log('i18n store:', i18n.store.data);
    console.log('Loaded namespaces:', Object.keys(i18n.store.data[i18n.language] || {}));
    
    // Check if Italian inventory namespace is loaded
    const italianData = i18n.store.data['it'];
    console.log('Italian data loaded:', !!italianData);
    if (italianData) {
      console.log('Italian namespaces:', Object.keys(italianData));
      console.log('Italian inventory data:', italianData.inventory?.reorder);
    }
    
    // Test specific reorder translations
    const testKeys = [
      'reorder.title',
      'reorder.itemInfo',
      'reorder.fields.name',
      'reorder.stockDeficit'
    ];
    
    testKeys.forEach(key => {
      const translation = t(key, { ns: 'inventory' });
      console.log(`${key}: "${translation}"`);
    });
    
    // Test with explicit namespace
    console.log('Direct inventory namespace test:');
    console.log('reorder.title (inventory):', t('reorder.title', { ns: 'inventory' }));
    
    // Force reload Italian inventory namespace
    console.log('Forcing reload of Italian inventory...');
    i18n.reloadResources('it', 'inventory').then(() => {
      console.log('Reload complete, testing again:');
      console.log('reorder.title after reload:', t('reorder.title', { ns: 'inventory' }));
    });
    
    console.log('=== END TEST ===');
  };

  React.useEffect(() => {
    if (ready) {
      testTranslations();
    }
  }, [ready, i18n.language]);

  return (
    <div className="fixed top-4 right-4 bg-blue-100 p-4 rounded-lg shadow-lg z-50">
      <h3 className="font-bold text-sm mb-2">Translation Debug</h3>
      <div className="text-xs space-y-1">
        <div>Language: {i18n.language}</div>
        <div>Ready: {ready ? '✅' : '❌'}</div>
        <div>Test: {t('reorder.title', { ns: 'inventory' })}</div>
        <button 
          onClick={testTranslations}
          className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Run Test
        </button>
      </div>
    </div>
  );
};

export default TranslationTester;