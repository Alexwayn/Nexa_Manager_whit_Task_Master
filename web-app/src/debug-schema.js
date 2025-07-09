// Script di debug per verificare la connessione e lo schema Supabase
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

// Funzione per stampare i risultati in modo più leggibile
const formatResult = (data, error) => {
  if (error) {
    console.error('Errore:', error);
    return;
  }
  Logger.info('Dati:', JSON.stringify(data, null, 2));
};

// Verifica la connessione
Logger.error('Verifica connessione Supabase...');
supabase.auth.getSession().then(({ data, error }) => {
  Logger.error('Stato sessione:', data?.session ? 'Autenticato' : 'Non autenticato');
  if (error) console.error('Errore sessione:', error);

  // Verifica lo schema della tabella clients
  Logger.error('\nVerifica schema tabella clients...');
  supabase.rpc('get_table_definition', { table_name: 'clients' }).then(({ data, error }) => {
    formatResult(data, error);
  });

  // Verifica metadati della tabella clients
  Logger.info('\nVerifica metadati tabella clients...');
  supabase
    .from('clients')
    .select('*')
    .limit(0)
    .then(({ data, error }) => {
      Logger.error('Risultato query vuota:', error ? `Errore: ${String(error?.message || error || 'Unknown error')}` : 'OK');
      if (error) {
        console.error('Dettagli errore:', error);
      }
    });
});

// Puoi eseguire questo file con Node.js:
// node -r esm debug-schema.js
