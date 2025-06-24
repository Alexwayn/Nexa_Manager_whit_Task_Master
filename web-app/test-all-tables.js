// Script per testare tutte le tabelle principali
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configurazione client Supabase - using environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing required environment variable: VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing required environment variable: VITE_SUPABASE_ANON_KEY');
}

// Creo il client senza localStorage (che non è disponibile in Node.js)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  schema: {
    cacheControl: { useCache: false },
  },
  auth: {
    persistSession: false,
  },
});

// Test di una tabella
async function testTable(tableName) {
  console.log(`\n--- TEST TABELLA: ${tableName} ---`);

  try {
    // 1. Verifichiamo se la tabella esiste
    console.log(`1. Verifica esistenza tabella ${tableName}...`);

    // Prova a fare una query COUNT
    const { data: countData, error: countError } = await supabase
      .from(tableName)
      .select('count(*)', { count: 'exact', head: true });

    if (countError) {
      console.error(`Errore nel verificare la tabella ${tableName}:`, countError);

      if (countError.code === '42P01') {
        console.log(`La tabella ${tableName} non esiste!`);
        return false;
      } else {
        console.log(`La tabella ${tableName} esiste ma c'è un altro errore:`);
        console.log(`- Codice: ${countError.code}`);
        console.log(`- Messaggio: ${countError.message}`);
        console.log(`- Dettagli: ${countError.details || 'nessun dettaglio'}`);
        console.log(`- Hint: ${countError.hint || 'nessun hint'}`);
      }
    } else {
      console.log(`La tabella ${tableName} esiste e contiene ${countData[0].count} record.`);

      // 2. Proviamo a fare una SELECT
      console.log(`2. Prova di SELECT su ${tableName}...`);

      const { data: selectData, error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (selectError) {
        console.error(`Errore nella SELECT su ${tableName}:`, selectError);
        console.log(`- Codice: ${selectError.code}`);
        console.log(`- Messaggio: ${selectError.message}`);
      } else {
        console.log(
          `SELECT su ${tableName} riuscita:`,
          selectData.length > 0 ? 'Dati trovati' : 'Tabella vuota',
        );
      }

      // 3. Proviamo a fare un INSERT e poi DELETE
      console.log(`3. Prova di INSERT e DELETE su ${tableName}...`);

      // Definiamo un record di test per ciascuna tabella
      let testRecord = {};

      switch (tableName) {
        case 'clients':
          testRecord = {
            full_name: 'Test Client ' + Date.now(),
            email: 'test@example.com',
            phone: '123456789',
          };
          break;
        case 'quotes':
          testRecord = {
            quote_number: 'TEST-' + Date.now(),
            issue_date: new Date().toISOString().split('T')[0],
            status: 'draft',
            subtotal: 100,
            tax_amount: 22,
            total_amount: 122,
          };
          break;
        case 'quote_items':
          console.log(`  Saltando INSERT su ${tableName} perché richiede una foreign key.`);
          return true;
        case 'profiles':
          console.log(`  Saltando INSERT su ${tableName} perché richiede una foreign key.`);
          return true;
        default:
          testRecord = {
            test_field: 'test value',
            created_at: new Date().toISOString(),
          };
      }

      const { data: insertData, error: insertError } = await supabase
        .from(tableName)
        .insert([testRecord])
        .select();

      if (insertError) {
        console.error(`Errore nell'INSERT su ${tableName}:`, insertError);
        console.log(`- Codice: ${insertError.code}`);
        console.log(`- Messaggio: ${insertError.message}`);

        if (insertError.code === '42501') {
          console.log(`  ERRORE DI PERMESSI: probabilmente mancano politiche RLS.`);
        } else if (insertError.code === '23503') {
          console.log(`  ERRORE DI FOREIGN KEY: manca una chiave esterna richiesta.`);
        } else if (insertError.code === '23502') {
          console.log(`  ERRORE NOT NULL: manca un campo obbligatorio.`);
        }
      } else {
        console.log(`INSERT su ${tableName} riuscito, ID:`, insertData[0].id);

        // Se l'inserimento è riuscito, proviamo a cancellare
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', insertData[0].id);

        if (deleteError) {
          console.error(`Errore nel DELETE su ${tableName}:`, deleteError);
          console.log(`- Codice: ${deleteError.code}`);
          console.log(`- Messaggio: ${deleteError.message}`);
        } else {
          console.log(`DELETE su ${tableName} riuscito.`);
        }
      }
    }

    return true;
  } catch (err) {
    console.error(`Errore imprevisto nel test di ${tableName}:`, err);
    return false;
  }
}

// Test di tutte le tabelle
async function testAllTables() {
  console.log('INIZIO TEST DI TUTTE LE TABELLE');

  const tables = ['clients', 'quotes', 'quote_items', 'profiles'];

  for (const table of tables) {
    await testTable(table);
  }

  console.log('\nFINE TEST DI TUTTE LE TABELLE');
}

// Esecuzione
testAllTables()
  .then(() => console.log('\nTest completato.'))
  .catch((err) => console.error('\nErrore durante i test:', err));
