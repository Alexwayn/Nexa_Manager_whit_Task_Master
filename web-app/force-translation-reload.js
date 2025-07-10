// Script per forzare il ricaricamento delle traduzioni
// Esegui questo script nella console del browser per forzare il reload delle traduzioni

// Cancella la cache delle traduzioni
if (window.i18next) {
  // Rimuovi tutte le traduzioni dalla cache
  window.i18next.store.data = {};
  
  // Ricarica le traduzioni
  window.i18next.reloadResources(['it'], ['analytics', 'common']).then(() => {
    console.log('Traduzioni ricaricate con successo');
    // Forza il re-render della pagina
    window.location.reload();
  });
} else {
  console.log('i18next non trovato, ricarico la pagina');
  window.location.reload();
}

// Alternativa: cancella localStorage e ricarica
localStorage.removeItem('i18nextLng');
localStorage.setItem('nexa-language', 'it');
console.log('Cache localStorage pulita, ricarica la pagina manualmente');