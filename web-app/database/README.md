# Database Setup e Verifica - Nexa Manager

Questa directory contiene tutti gli script SQL e gli strumenti per configurare e verificare il database di Nexa Manager.

## ⚠️ REGOLA FONDAMENTALE - CONTROLLO PREVENTIVO

**PRIMA DI ESEGUIRE QUALSIASI SCRIPT SQL, DEVI SEMPRE CONTROLLARE COSA C'È GIÀ PRESENTE IN SUPABASE**

Questa regola è obbligatoria per evitare:
- Errori di tabelle già esistenti
- Conflitti di dati
- Perdita di informazioni
- Problemi di integrità del database

### Come Verificare lo Stato del Database:

1. **Metodo Raccomandato - Script Node.js:**
   ```bash
   node check_database_status.js
   ```

2. **Metodo Alternativo - SQL Editor:**
   - Apri Supabase Dashboard
   - Vai su SQL Editor
   - Esegui `check_database_status.sql`

3. **Controllo Manuale:**
   - Verifica le tabelle esistenti nel Dashboard
   - Controlla la struttura delle colonne
   - Verifica i dati presenti

### Procedura Obbligatoria:

1. ✅ **CONTROLLA** lo stato attuale del database
2. ✅ **IDENTIFICA** cosa manca o deve essere modificato
3. ✅ **SELEZIONA** solo gli script necessari
4. ✅ **ESEGUI** gli script nell'ordine corretto
5. ✅ **VERIFICA** il risultato dopo ogni script

### 📖 Documentazione Completa:

Per informazioni dettagliate sulla regola di controllo preventivo, consulta:
- **[📋 REGOLA_CONTROLLO_PREVENTIVO.md](./REGOLA_CONTROLLO_PREVENTIVO.md)** - Documentazione completa
- **[✅ CHECKLIST_CONTROLLO_PREVENTIVO.md](./CHECKLIST_CONTROLLO_PREVENTIVO.md)** - Checklist rapida

### 🚨 Violazione della Regola:

La mancata applicazione di questa regola può causare:
- Perdita di dati
- Downtime del sistema
- Conflitti nel database
- Perdita di tempo in debug

**Tutti gli sviluppatori sono tenuti a rispettare questa regola senza eccezioni.**

## 🔍 Verifica Stato Database

Prima di eseguire qualsiasi script SQL, è consigliabile verificare lo stato attuale del database.

### Opzione 1: Script Node.js (Raccomandato)

```bash
# Dalla directory web-app
node database/check_database_status.js
```

Questo script:
- ✅ Controlla quali tabelle esistono già
- 📊 Mostra il numero di record per tabella
- 📋 Raccomanda quali script eseguire
- ⚠️ Identifica potenziali problemi
- 💡 Fornisce suggerimenti per la risoluzione

### Opzione 2: Query SQL Manuale

Se preferisci usare direttamente Supabase SQL Editor:

```sql
-- Copia e incolla il contenuto di check_database_status.sql
-- nel Supabase Dashboard > SQL Editor
```

# Configurazione Database Supabase per Nexa Manager

Questo documento contiene le istruzioni per configurare correttamente il database Supabase necessario per l'applicazione Nexa Manager.

## Tabella Events (Calendario)

Per utilizzare la funzionalità del calendario, è necessario creare la tabella `events` nel database Supabase. Segui questi passaggi:

1. Vai al pannello di controllo di Supabase
2. Naviga alla sezione "SQL Editor"
3. Crea una nuova query
4. Copia e incolla il contenuto del file `create_events_table.sql` 
5. Esegui la query

La tabella `events` memorizza tutti gli eventi del calendario, inclusi appuntamenti, preventivi, fatture, entrate e spese.

### Struttura della tabella

La tabella `events` include i seguenti campi principali:

- `id`: Identificativo unico dell'evento
- `user_id`: Identificativo dell'utente che ha creato l'evento
- `title`: Titolo dell'evento
- `type`: Tipo di evento (appuntamento, preventivo, fattura, entrata, spesa)
- `date`: Data dell'evento
- `start_time` / `end_time`: Orari di inizio e fine
- `client`: Nome del cliente associato
- `client_id`: Riferimento alla tabella clients
- `color`: Colore dell'evento nella visualizzazione del calendario

Inoltre, sono presenti campi specifici per ciascun tipo di evento:

- Per preventivi e fatture: documento, stato, scadenza, voci, totali
- Per entrate e spese: importo, metodo di pagamento, categoria

## Politiche di sicurezza

La tabella ha configurato le politiche RLS (Row Level Security) per garantire che ogni utente possa vedere, modificare ed eliminare solo i propri eventi.

## Troubleshooting

Se riscontri problemi con il salvataggio o il caricamento degli eventi:

1. Verifica che la tabella `events` sia stata creata correttamente
2. Controlla le politiche RLS per assicurarti che l'utente abbia i permessi corretti
3. Verifica che i campi obbligatori vengano compilati correttamente nel form

Per ulteriori informazioni consulta la documentazione di Supabase sulle tabelle e le politiche RLS.