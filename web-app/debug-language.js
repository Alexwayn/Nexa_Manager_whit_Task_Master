// Debug script per verificare e forzare la lingua italiana
// Esegui questo script nella console del browser (F12)

console.log('=== DEBUG LINGUA ITALIANA ===');

// 1. Verifica stato attuale i18n
if (window.i18n) {
  console.log('Lingua attuale:', window.i18n.language);
  console.log('Lingue disponibili:', window.i18n.languages);
  console.log('Namespace caricati:', window.i18n.options.ns);
} else {
  console.log('i18n non trovato nel window object');
}

// 2. Verifica localStorage
const savedLanguage = localStorage.getItem('nexa-language');
console.log('Lingua salvata in localStorage:', savedLanguage);

// 3. Verifica se le traduzioni italiane sono caricate
fetch('/locales/it/inventory.json')
  .then(response => response.json())
  .then(data => {
    console.log('Traduzioni italiane inventory caricate:', !!data.reorder);
    if (data.reorder) {
      console.log('Titolo reorder in italiano:', data.reorder.title);
    }
  })
  .catch(error => console.error('Errore caricamento traduzioni:', error));

// 4. Funzione per forzare il cambio lingua
window.forceItalian = function () {
  console.log('Forzando lingua italiana...');

  // Imposta localStorage
  localStorage.setItem('nexa-language', 'it');

  // Se i18n è disponibile, cambia lingua
  if (window.i18n) {
    window.i18n.changeLanguage('it').then(() => {
      console.log('Lingua cambiata a:', window.i18n.language);
      // Ricarica la pagina per applicare le modifiche
      window.location.reload();
    });
  } else {
    // Ricarica la pagina
    window.location.reload();
  }
};

// 5. Verifica traduzioni specifiche del ReorderModal
window.checkReorderTranslations = function () {
  if (window.i18n && window.i18n.t) {
    console.log('=== TRADUZIONI REORDER ===');
    console.log('reorder.title:', window.i18n.t('reorder.title', { ns: 'inventory' }));
    console.log('reorder.itemInfo:', window.i18n.t('reorder.itemInfo', { ns: 'inventory' }));
    console.log('reorder.quantity:', window.i18n.t('reorder.quantity', { ns: 'inventory' }));
    console.log('common.cancel:', window.i18n.t('common.cancel', { ns: 'inventory' }));
  } else {
    console.log('i18n.t non disponibile');
  }
};

console.log('=== COMANDI DISPONIBILI ===');
console.log('forceItalian() - Forza lingua italiana e ricarica');
console.log('checkReorderTranslations() - Verifica traduzioni reorder');
console.log('===============================');

// Auto-check delle traduzioni se i18n è già disponibile
if (window.i18n && window.i18n.t) {
  setTimeout(() => {
    window.checkReorderTranslations();
  }, 1000);
}
