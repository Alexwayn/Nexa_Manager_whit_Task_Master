// Debug script da eseguire nella console del browser
// Copia e incolla questo codice nella console del browser
// quando sei nella pagina Settings.jsx

// 1. Recupera lo stato corrente del componente Settings
const getComponentState = () => {
  // Cerca l'istanza del componente Settings
  let foundReactInstance = null;
  
  // Funzione ricorsiva per cercare il componente React
  const findReactComponent = (node) => {
    const keys = Object.keys(node);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
        const fiber = node[key];
        let current = fiber;
        
        while (current) {
          if (current.memoizedState && 
              current.memoizedState.element && 
              current.memoizedState.element.type && 
              current.memoizedState.element.type.name === 'Settings') {
            return current.memoizedState.element;
          }
          
          if (current.child) current = current.child;
          else if (current.sibling) current = current.sibling;
          else {
            let parent = current.return;
            let parentSibling = null;
            while (parent && !parentSibling) {
              parentSibling = parent.sibling;
              parent = parent.return;
            }
            current = parentSibling;
          }
        }
      }
    }
    
    return null;
  };
  
  // Cerca nei nodi del DOM
  const rootElements = document.querySelectorAll('[id^="root"]');
  rootElements.forEach(rootElement => {
    const result = findReactComponent(rootElement);
    if (result) foundReactInstance = result;
  });
  
  return foundReactInstance;
};

// 2. Debug delle variabili di stato dal componente React
const debugComponentState = () => {
  console.log('Debugging Stato Componente Settings...');
  
  // Ottieni gli hook di React dallo stato
  const hooks = {};
  
  // Verifica gli stati in React DevTools
  console.log('Per favore, usa React DevTools per ispezionare lo stato completo.');
  console.log('Cerca il componente "Settings" per vedere tutte le props e lo stato.');
  
  // Alternativa: recupera le informazioni dal contesto di autenticazione
  const authContext = window.__REACT_CONTEXT_DEVTOOL_GLOBAL_HOOK?.renderers?.[0]?.getCurrentFiberStateNode()?.memoizedState?.baseState?.authContext;
  
  if (authContext) {
    console.log('Auth Context trovato:', authContext);
  } else {
    console.log('Auth Context non trovato. Provando metodi alternativi...');
  }
  
  return hooks;
};

// 3. Analisi dei problemi di salvataggio del profilo
const debugProfileSaving = async () => {
  console.log('Debugging del salvataggio del profilo...');
  
  try {
    // Recupera il client Supabase dalla window, se è stato esposto per debug
    const supabase = window.supabase || null;
    
    if (!supabase) {
      console.error('Client Supabase non trovato nella finestra. Aggiungere "window.supabase = supabase;" nel file supabaseClient.js per il debug.');
      return;
    }
    
    // Verifica la sessione utente
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Errore nel recupero della sessione utente:', sessionError);
      return;
    }
    
    if (!session || !session.user) {
      console.error('Utente non autenticato. Effettua il login e riprova.');
      return;
    }
    
    const userId = session.user.id;
    console.log('ID utente corrente:', userId);
    
    // Verifica il profilo esistente
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Errore nel recupero del profilo:', profileError);
      console.log('Possibile causa: il profilo non esiste o problemi con le politiche RLS.');
      
      // Verifica se il profilo esiste
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('id', userId);
      
      if (countError) {
        console.error('Errore nella verifica dell\'esistenza del profilo:', countError);
      } else if (count === 0) {
        console.log('Il profilo non esiste. È necessario crearlo.');
        
        // Crea un profilo di base
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            username: session.user.email,
            full_name: '',
            created_at: new Date(),
            updated_at: new Date()
          }]);
        
        if (insertError) {
          console.error('Errore nella creazione del profilo:', insertError);
        } else {
          console.log('Profilo creato con successo! Ricarica la pagina.');
        }
      }
    } else {
      console.log('Profilo esistente recuperato:', profileData);
      
      // Test di aggiornamento semplice
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ updated_at: new Date() })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Errore nell\'aggiornamento del profilo:', updateError);
        console.log('Possibile causa: politiche RLS errate o problemi di permessi.');
      } else {
        console.log('Aggiornamento di test eseguito con successo!');
      }
    }
    
    // Verifica la struttura dati del profilo e compara con i campi nel form
    console.log('Verifica coerenza tra dati del form e struttura del database:');
    
    // Ottieni i valori attuali nel form
    const nameInput = document.querySelector('input[name="firstName"]');
    const lastName = document.querySelector('input[name="lastName"]');
    const phoneInput = document.querySelector('input[name="phone"]');
    const companyInput = document.querySelector('input[name="companyName"]');
    const positionInput = document.querySelector('input[name="position"]');
    const addressInput = document.querySelector('input[name="address"]');
    const bioInput = document.querySelector('textarea[name="bio"]');
    
    if (nameInput) console.log('Form firstName:', nameInput.value, 'DB first_name:', profileData?.first_name);
    if (lastName) console.log('Form lastName:', lastName.value, 'DB last_name:', profileData?.last_name);
    if (phoneInput) console.log('Form phone:', phoneInput.value, 'DB phone:', profileData?.phone);
    if (companyInput) console.log('Form companyName:', companyInput.value, 'DB company_name:', profileData?.company_name);
    if (positionInput) console.log('Form position:', positionInput.value, 'DB position:', profileData?.position);
    if (addressInput) console.log('Form address:', addressInput.value, 'DB address:', profileData?.address);
    if (bioInput) console.log('Form bio:', bioInput.value, 'DB bio:', profileData?.bio);
    
    // Confronta notification_settings
    if (profileData?.notification_settings) {
      console.log('DB notification_settings:', profileData.notification_settings);
      console.log('Tipo di notification_settings:', typeof profileData.notification_settings);
      
      if (typeof profileData.notification_settings === 'string') {
        console.warn('Warning: notification_settings è una stringa, dovrebbe essere un oggetto JSON');
        try {
          const parsed = JSON.parse(profileData.notification_settings);
          console.log('Parsing riuscito:', parsed);
        } catch (e) {
          console.error('Errore nel parsing di notification_settings:', e);
        }
      }
    } else {
      console.warn('notification_settings mancante nel profilo.');
    }
  } catch (err) {
    console.error('Eccezione durante il debug del salvataggio del profilo:', err);
  }
};

// 4. Funzione per patchare temporaneamente il metodo handleSubmit
const patchHandleSubmit = () => {
  console.log('Tentativo di patch della funzione handleSubmit...');
  
  // Trova il bottone "Salva modifiche"
  const saveButton = Array.from(document.querySelectorAll('button')).find(
    button => button.textContent.includes('Salva') || button.textContent.includes('modific')
  );
  
  if (!saveButton) {
    console.error('Bottone "Salva modifiche" non trovato');
    return;
  }
  
  console.log('Bottone "Salva modifiche" trovato:', saveButton);
  
  // Ottieni l'handler originale
  const originalOnClick = saveButton.onclick;
  
  // Sostituisci con un handler modificato
  saveButton.onclick = async function(e) {
    console.log('Intercettato click sul bottone "Salva modifiche"');
    e.preventDefault();
    
    try {
      // Recupera il client Supabase e l'utente
      const supabase = window.supabase;
      if (!supabase) {
        console.error('Client Supabase non trovato');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        console.error('Utente non autenticato');
        return;
      }
      
      const userId = session.user.id;
      
      // Recupera i valori del form
      const firstName = document.querySelector('input[name="firstName"]')?.value || '';
      const lastName = document.querySelector('input[name="lastName"]')?.value || '';
      const email = document.querySelector('input[name="email"]')?.value || '';
      const phone = document.querySelector('input[name="phone"]')?.value || '';
      const companyName = document.querySelector('input[name="companyName"]')?.value || '';
      const position = document.querySelector('input[name="position"]')?.value || '';
      const address = document.querySelector('input[name="address"]')?.value || '';
      const bio = document.querySelector('textarea[name="bio"]')?.value || '';
      
      // Ricrea l'oggetto notification_settings
      const notifications = {
        emailNotifications: document.querySelector('input[name="emailNotifications"]')?.checked ?? true,
        smsNotifications: document.querySelector('input[name="smsNotifications"]')?.checked ?? false,
        promotionalEmails: document.querySelector('input[name="promotionalEmails"]')?.checked ?? true,
        weeklyDigest: document.querySelector('input[name="weeklyDigest"]')?.checked ?? true,
        monthlyReport: document.querySelector('input[name="monthlyReport"]')?.checked ?? true,
        securityAlerts: document.querySelector('input[name="securityAlerts"]')?.checked ?? true
      };
      
      // Costruisci l'oggetto di aggiornamento
      const updateData = {
        id: userId,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        company_name: companyName,
        position: position,
        address: address,
        bio: bio,
        notification_settings: notifications,
        updated_at: new Date()
      };
      
      console.log('Dati di aggiornamento:', updateData);
      
      // Aggiorna il profilo direttamente
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
      
      if (error) {
        console.error('Errore nell\'aggiornamento del profilo:', error);
        alert('Errore durante il salvataggio del profilo: ' + error.message);
      } else {
        console.log('Profilo aggiornato con successo!');
        alert('Profilo aggiornato con successo!');
      }
    } catch (err) {
      console.error('Eccezione durante l\'aggiornamento del profilo:', err);
      alert('Errore durante il salvataggio del profilo: ' + err.message);
    }
  };
  
  console.log('Patch applicata con successo! Ora il bottone "Salva modifiche" utilizzerà la funzione di salvataggio modificata.');
};

// 5. Rileva i campi mancanti nel database
const checkMissingFields = async () => {
  console.log('Verifico i campi mancanti nel database...');
  
  try {
    // Recupera il client Supabase
    const supabase = window.supabase;
    if (!supabase) {
      console.error('Client Supabase non trovato');
      return;
    }
    
    // Ottieni la sessione utente
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      console.error('Utente non autenticato');
      return;
    }
    
    const userId = session.user.id;
    
    // Ottieni la definizione della tabella
    const { data: tableData, error: tableError } = await supabase.rpc('get_table_definition', {
      table_name: 'profiles'
    });
    
    if (tableError) {
      console.error('Errore nel recupero della definizione della tabella:', tableError);
      console.log('Utilizzo metodo alternativo...');
      
      // Metodo alternativo: ottieni i dati del profilo e verifica i campi
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Errore nel recupero del profilo:', profileError);
        return;
      }
      
      console.log('Campi presenti nel profilo:', Object.keys(profileData));
      
      // Verifica i campi necessari
      const requiredFields = [
        'first_name', 'last_name', 'phone', 'company_name', 
        'position', 'address', 'bio', 'notification_settings'
      ];
      
      const missingFields = requiredFields.filter(field => !Object.keys(profileData).includes(field));
      
      if (missingFields.length > 0) {
        console.error('Campi mancanti nel profilo:', missingFields);
        
        // Tentativo di aggiungere i campi mancanti
        console.log('Tentativo di aggiungere i campi mancanti...');
        
        const updateData = {};
        missingFields.forEach(field => {
          if (field === 'notification_settings') {
            updateData[field] = {
              emailNotifications: true,
              smsNotifications: false,
              promotionalEmails: true,
              weeklyDigest: true,
              monthlyReport: true,
              securityAlerts: true
            };
          } else {
            updateData[field] = '';
          }
        });
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
        
        if (updateError) {
          console.error('Errore nell\'aggiunta dei campi mancanti:', updateError);
        } else {
          console.log('Campi mancanti aggiunti con successo!');
        }
      } else {
        console.log('Tutti i campi necessari sono presenti nel profilo.');
      }
    } else {
      console.log('Definizione della tabella profiles:', tableData);
    }
  } catch (err) {
    console.error('Eccezione durante la verifica dei campi mancanti:', err);
  }
};

// 6. Funzione principale di debug
const runDebugSuite = async () => {
  console.log('Avvio debug suite per Settings.jsx...');
  
  // Visualizza lo stato del componente
  debugComponentState();
  
  // Verifica il salvataggio del profilo
  await debugProfileSaving();
  
  // Verifica i campi mancanti
  await checkMissingFields();
  
  // Chiedi all'utente se vuole applicare la patch temporanea
  if (confirm('Vuoi applicare una patch temporanea alla funzione di salvataggio per tentare di risolvere il problema?')) {
    patchHandleSubmit();
  }
  
  console.log('Debug completato!');
};

// Esegui la suite di debug
runDebugSuite(); 