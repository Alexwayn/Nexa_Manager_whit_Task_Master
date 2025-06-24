import { useState, useEffect } from 'react';
import { supabase, testSupabaseConnection } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

export default function Test() {
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);

  // Test con il client originale
  const handleTestOriginal = async () => {
    setLoading1(true);
    try {
      const result = await testSupabaseConnection();
      setResult1(result);
      Logger.info('Test client originale:', result);
    } catch (error) {
      setError1(error.message || 'Errore sconosciuto');
      Logger.error('Errore test client originale:', error);
    } finally {
      setLoading1(false);
    }
  };

  // Test con query diretta al client originale
  const handleTestOriginalDirect = async () => {
    setLoading2(true);
    setError2(null);
    setResult2(null);

    try {
      Logger.debug('Iniziando test 2 con approcci multipli...');

      // Approccio 1: Select con limit semplice
      Logger.error('Test 2 - Approccio 1: Select con limit');
      try {
        const { data: data1, error: error1 } = await supabase.from('clients').select('*').limit(1);

        Logger.error('Approccio 1 risultato:', { data: data1, error: error1 });

        if (!error1) {
          setResult2({
            approccio: 'Select con limit',
            success: true,
            data: data1,
          });
          return;
        }
      } catch (err) {
        Logger.error('Errore approccio 1:', err);
      }

      // Approccio 2: Verifica esistenza tabella
      Logger.error('Test 2 - Approccio 2: Verifica esistenza tabella');
      try {
        const { data: data2, error: error2 } = await supabase
          .rpc('get_schema_info')
          .contains('name', 'clients');

        Logger.error('Approccio 2 risultato:', { data: data2, error: error2 });

        if (!error2) {
          setResult2({
            approccio: 'Verifica esistenza tabella',
            success: true,
            data: data2,
          });
          return;
        }
      } catch (err) {
        Logger.error('Errore approccio 2:', err);
      }

      // Approccio 3: Utilizzo di fetch diretto invece del client Supabase
      Logger.debug('Test 2 - Approccio 3: Fetch diretto');
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error(
            'Missing environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY',
          );
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/clients?select=id&limit=1`, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Approccio 3 risultato:', {
          status: response.status,
          statusText: response.statusText,
        });

        if (response.ok) {
          const data3 = await response.json();
          setResult2({
            approccio: 'Fetch diretto',
            success: true,
            data: data3,
          });
          return;
        } else {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        Logger.error('Errore approccio 3:', err);
      }

      // Se arriviamo qui, tutti gli approcci sono falliti
      throw new Error(
        "Tutti gli approcci per accedere alla tabella 'clients' sono falliti. Verificare che la tabella esista e sia accessibile.",
      );
    } catch (error) {
      setError2(error.message || 'Errore sconosciuto');
      Logger.error('Errore generale test client originale:', error);
    } finally {
      setLoading2(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-6'>Test Connessione Supabase</h1>

      <div className='space-y-8'>
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <h2 className='text-xl font-semibold mb-4'>
            Test 1: Client Originale (testSupabaseConnection)
          </h2>
          <button
            onClick={handleTestOriginal}
            disabled={loading1}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 mb-4'
          >
            {loading1 ? 'Test in corso...' : 'Esegui Test'}
          </button>

          {error1 && (
            <div className='bg-red-50 text-red-700 p-4 rounded mb-4'>
              <h3 className='font-semibold'>Errore:</h3>
              <p>{error1}</p>
            </div>
          )}

          {result1 && (
            <div className='bg-gray-50 p-4 rounded'>
              <h3 className='font-semibold'>Risultato:</h3>
              <pre className='text-sm mt-2 bg-gray-100 p-2 rounded overflow-x-auto'>
                {JSON.stringify(result1, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className='bg-white p-6 rounded-lg shadow-md'>
          <h2 className='text-xl font-semibold mb-4'>Test 2: Query Diretta al Client Originale</h2>
          <button
            onClick={handleTestOriginalDirect}
            disabled={loading2}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 mb-4'
          >
            {loading2 ? 'Test in corso...' : 'Esegui Test'}
          </button>

          {error2 && (
            <div className='bg-red-50 text-red-700 p-4 rounded mb-4'>
              <h3 className='font-semibold'>Errore:</h3>
              <p>{error2}</p>
            </div>
          )}

          {result2 && (
            <div className='bg-gray-50 p-4 rounded'>
              <h3 className='font-semibold'>Risultato:</h3>
              <pre className='text-sm mt-2 bg-gray-100 p-2 rounded overflow-x-auto'>
                {JSON.stringify(result2, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
