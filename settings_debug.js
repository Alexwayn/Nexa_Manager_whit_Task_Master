// Script di Debug per il componente Settings.jsx
// Questo script contiene funzioni per diagnosticare i problemi
// durante il salvataggio delle modifiche al profilo

import { supabase } from './web-app/src/lib/supabaseClient';

// 1. Funzione per verificare la connessione a Supabase
async function testSupabaseConnection() {
  console.log('Testando la connessione a Supabase...');
  try {
    const { data, error } = await supabase.from('profiles').select('count(*)');
    
    if (error) {
      console.error('Errore di connessione a Supabase:', error);
      return false;
    }
    
    console.log('Connessione a Supabase stabilita con successo!');
    return true;
  } catch (err) {
    console.error('Eccezione durante il test di connessione:', err);
    return false;
  }
}

// 2. Funzione per verificare le autorizzazioni dell'utente
async function checkUserPermissions(userId) {
  console.log(`Verificando le autorizzazioni per l'utente ${userId}...`);
  
  if (!userId) {
    console.error('Errore: userId non fornito');
    return false;
  }
  
  try {
    // Test SELECT
    console.log('Testando permessi SELECT...');
    const { data: selectData, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (selectError) {
      console.error('Errore nei permessi SELECT:', selectError);
    } else {
      console.log('Permessi SELECT OK');
    }
    
    // Test INSERT/UPDATE
    console.log('Testando permessi UPDATE...');
    const updateFields = {
      updated_at: new Date()
    };
    
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', userId);
    
    if (updateError) {
      console.error('Errore nei permessi UPDATE:', updateError);
      return false;
    } else {
      console.log('Permessi UPDATE OK');
      return true;
    }
  } catch (err) {
    console.error('Eccezione durante il controllo dei permessi:', err);
    return false;
  }
}

// 3. Funzione per verificare la struttura della tabella profiles
async function checkProfilesTable() {
  console.log('Verificando la struttura della tabella profiles...');
  
  try {
    // Ottieni la definizione della tabella usando una query raw SQL
    const { data, error } = await supabase.rpc('get_table_definition', { table_name: 'profiles' });
    
    if (error) {
      console.error('Errore nel recupero della definizione della tabella:', error);
      return null;
    }
    
    console.log('Definizione della tabella profiles:', data);
    return data;
  } catch (err) {
    console.error('Eccezione durante la verifica della tabella profiles:', err);
    return null;
  }
}

// 4. Funzione per verificare lo stato del profilo specifico
async function checkUserProfile(userId) {
  console.log(`Verificando il profilo dell'utente ${userId}...`);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Errore nel recupero del profilo:', error);
      return null;
    }
    
    console.log('Profilo utente:', data);
    return data;
  } catch (err) {
    console.error('Eccezione durante il controllo del profilo:', err);
    return null;
  }
}

// 5. Funzione per simulare un salvataggio del profilo con dati di test
async function testProfileSave(userId) {
  console.log(`Testando il salvataggio del profilo per l'utente ${userId}...`);
  
  if (!userId) {
    console.error('Errore: userId non fornito');
    return false;
  }
  
  // Dati di test per il profilo
  const testProfileData = {
    id: userId,
    first_name: 'Test',
    last_name: 'User',
    phone: '+1234567890',
    company_name: 'Test Company',
    position: 'Tester',
    address: 'Test Address',
    bio: 'This is a test bio',
    notification_settings: {
      emailNotifications: true,
      smsNotifications: false,
      promotionalEmails: true,
      weeklyDigest: true,
      monthlyReport: true,
      securityAlerts: true
    },
    updated_at: new Date()
  };
  
  try {
    // Verifica se il profilo esiste
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Errore durante la verifica del profilo esistente:', checkError);
      return false;
    }
    
    let error;
    
    if (existingProfile) {
      // Aggiorna il profilo esistente
      console.log('Profilo esistente, tentativo di aggiornamento...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update(testProfileData)
        .eq('id', userId);
      
      error = updateError;
    } else {
      // Inserisci un nuovo profilo
      console.log('Profilo non esistente, tentativo di inserimento...');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([testProfileData]);
      
      error = insertError;
    }
    
    if (error) {
      console.error('Errore durante il salvataggio del profilo:', error);
      return false;
    }
    
    console.log('Profilo salvato con successo!');
    return true;
  } catch (err) {
    console.error('Eccezione durante il test di salvataggio del profilo:', err);
    return false;
  }
}

// 6. Funzione per verificare errori comuni nella struttura JSON
async function checkJsonFields(userId) {
  console.log(`Verificando i campi JSON per l'utente ${userId}...`);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('notification_settings')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Errore nel recupero dei campi JSON:', error);
      return false;
    }
    
    if (!data.notification_settings) {
      console.log('Campo notification_settings mancante o nullo');
      
      // Prova a riparare il campo
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          notification_settings: {
            emailNotifications: true,
            smsNotifications: false,
            promotionalEmails: true,
            weeklyDigest: true,
            monthlyReport: true,
            securityAlerts: true
          }
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Errore nella riparazione del campo JSON:', updateError);
        return false;
      }
      
      console.log('Campo notification_settings riparato con successo');
    } else {
      console.log('Campo notification_settings presente e valido:', data.notification_settings);
    }
    
    return true;
  } catch (err) {
    console.error('Eccezione durante il controllo dei campi JSON:', err);
    return false;
  }
}

// 7. Funzione di diagnostic completa
async function runFullDiagnostic(userId) {
  console.log('Avvio diagnostica completa...');
  
  // Test 1: Connessione Supabase
  const connectionOk = await testSupabaseConnection();
  if (!connectionOk) {
    console.error('ERRORE CRITICO: Problemi con la connessione a Supabase');
    return false;
  }
  
  // Test 2: Verifica permessi utente
  if (userId) {
    const permissionsOk = await checkUserPermissions(userId);
    if (!permissionsOk) {
      console.error('ERRORE: Problemi con i permessi utente');
    }
  } else {
    console.warn('Avviso: Nessun userId fornito, test permessi saltato');
  }
  
  // Test 3: Verifica struttura tabella
  const tableStructure = await checkProfilesTable();
  if (!tableStructure) {
    console.error('ERRORE: Problemi con la struttura della tabella profiles');
  }
  
  // Test 4: Verifica profilo utente
  if (userId) {
    const userProfile = await checkUserProfile(userId);
    if (!userProfile) {
      console.error('ERRORE: Problemi con il profilo utente');
    }
  } else {
    console.warn('Avviso: Nessun userId fornito, test profilo saltato');
  }
  
  // Test 5: Test salvataggio profilo
  if (userId) {
    const saveTest = await testProfileSave(userId);
    if (!saveTest) {
      console.error('ERRORE: Problemi con il salvataggio del profilo');
    }
  } else {
    console.warn('Avviso: Nessun userId fornito, test salvataggio saltato');
  }
  
  // Test 6: Verifica campi JSON
  if (userId) {
    const jsonFields = await checkJsonFields(userId);
    if (!jsonFields) {
      console.error('ERRORE: Problemi con i campi JSON');
    }
  } else {
    console.warn('Avviso: Nessun userId fornito, test campi JSON saltato');
  }
  
  console.log('Diagnostica completa terminata');
  return true;
}

// Esporta tutte le funzioni per l'uso
export {
  testSupabaseConnection,
  checkUserPermissions,
  checkProfilesTable,
  checkUserProfile,
  testProfileSave,
  checkJsonFields,
  runFullDiagnostic
}; 