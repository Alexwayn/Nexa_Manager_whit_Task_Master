# Risoluzione Problemi di Salvataggio Profilo - Nexa Manager Web App

Questo documento spiega come risolvere i problemi di salvataggio delle modifiche al profilo nella tua applicazione Nexa Manager Web App.

## Problema

Quando si tenta di salvare le modifiche al profilo nella pagina Impostazioni, l'operazione fallisce senza un chiaro messaggio di errore.

## Soluzione

Abbiamo preparato una serie di strumenti di diagnostica e fix per aiutarti a risolvere il problema:

### 1. File di diagnosi e riparazione

Sono stati creati i seguenti file:

- `database_diagnostic.sql` - Query SQL per diagnosticare la struttura del database
- `profile_fix.sql` - Query SQL per riparare la tabella 'profiles'
- `settings_debug.js` - Utility JavaScript per il debug del componente Settings
- `debug_console.js` - Script da incollare nella console del browser per il debug immediato

### 2. Modifiche al codice

Sono state apportate le seguenti modifiche al codice:

1. Miglioramenti alla funzione `handleSubmit` in `Settings.jsx`:
   - Gestione migliore degli errori con messaggi più descrittivi
   - Retry automatico senza il campo problematico notification_settings
   - Rimozione del campo email dal profilo per evitare conflitti

2. Miglioramenti alla funzione `fetchUserProfile` in `Settings.jsx`:
   - Creazione automatica di un profilo base se non esiste
   - Gestione migliore del campo notification_settings

3. Modifiche a `supabaseClient.js`:
   - Esposizione del client Supabase come variabile globale in modalità development per facilitare il debug

### 3. Come applicare le correzioni

#### 3.1 Correzioni al database

1. Accedi alla dashboard di Supabase del tuo progetto
2. Vai alla sezione "SQL Editor"
3. Esegui lo script contenuto in `profile_fix.sql`

Questo script:
- Verifica e crea la tabella profiles se non esiste
- Aggiunge le colonne mancanti (first_name, last_name, ecc.)
- Corregge le politiche RLS
- Ripara problemi con il campo notification_settings

#### 3.2 Testing dalla console del browser

Per diagnosticare rapidamente:

1. Apri l'app nel browser
2. Apri la Console degli strumenti di sviluppo (F12)
3. Incolla il contenuto di `debug_console.js`
4. Segui le istruzioni e i risultati mostrati nella console

#### 3.3 Verifica del funzionamento

Dopo aver applicato le correzioni:

1. Aggiorna la pagina
2. Prova a modificare i dati del profilo
3. Clicca su "Salva modifiche"

Se tutto funziona correttamente, dovresti vedere un messaggio di successo e i dati dovrebbero essere persistenti anche dopo un refresh della pagina.

## Problemi comuni e soluzioni

### Il profilo non viene creato automaticamente

Verifica che il trigger per la creazione automatica del profilo sia attivo:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'create_profile_on_signup';
```

Se non ci sono risultati, esegui nuovamente lo script `profile_fix.sql`.

### Errore nel salvataggio del campo notification_settings

Questo campo deve essere di tipo JSONB. Se continui ad avere problemi:

```sql
ALTER TABLE profiles 
DROP COLUMN IF EXISTS notification_settings;

ALTER TABLE profiles 
ADD COLUMN notification_settings JSONB DEFAULT '{"emailNotifications": true, "smsNotifications": false, "promotionalEmails": true, "weeklyDigest": true, "monthlyReport": true, "securityAlerts": true}'::jsonb;
```

### Problemi con i permessi RLS

Verifica che le politiche RLS siano configurate correttamente:

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

Dovrebbero esserci politiche per SELECT, INSERT e UPDATE.

## Contatti

Se i problemi persistono, contatta il team di supporto fornendo:

1. I log di errore dalla console del browser
2. I risultati dell'esecuzione degli script di diagnostica
3. Una descrizione dettagliata del problema

---

Documento creato il: 05/07/2024 