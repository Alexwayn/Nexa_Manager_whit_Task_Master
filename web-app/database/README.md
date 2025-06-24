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