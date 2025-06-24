## Panoramica Generale dell’App Mobile

Questa applicazione mobile è strutturata per la gestione integrata di clienti, fatture, preventivi, eventi (appuntamenti, entrate, spese) e utenti. Ogni entità dispone di funzionalità CRUD complete, viste di dettaglio, ricerca e filtri. L’app segue un’architettura moderna con:

- **Navigazione tramite Tab Bar o Drawer**: Dashboard, Clienti, Fatture, Preventivi, Calendario/Eventi, Impostazioni.
- **Gestione dati cloud-first tramite Supabase**: tutti i dati (clienti, fatture, preventivi, eventi, utenti) sono salvati e sincronizzati in tempo reale tramite **Supabase** (PostgreSQL, API RESTful e Realtime). 
- **Supporto offline**: l’app utilizza storage locale (SQLite/AsyncStorage) per funzionare anche senza connessione e sincronizza automaticamente con Supabase appena online.
- **Workflows integrati**: conversione preventivo → fattura, segnalazione pagamento, registrazione spese collegate a eventi.
- **Autenticazione sicura** tramite JWT, con supporto a ruoli utente.
- **Sincronizzazione cloud tra mobile e web tramite Supabase**: la struttura dati e i flussi sono progettati per essere condivisi tra app mobile e web, usando **Supabase** come backend comune per garantire coerenza, interoperabilità e aggiornamenti in tempo reale su tutte le piattaforme.

---

## Obiettivo del Documento

Questo documento analizza le funzionalità, la struttura dati e i flussi di lavoro dell'applicazione mobile "[Nome della Tua App Mobile]" sviluppata in React Native. L'obiettivo è fornire una base chiara e dettagliata per:

1.  La progettazione e lo sviluppo di un'applicazione web complementare.
2.  La definizione degli endpoint necessari per un'API backend comune che servirà entrambe le applicazioni (mobile e web).
3.  Garantire la coerenza funzionale e dei dati tra le due piattaforme.

---

## 1. Entità Dati Principali

Descrizione delle principali entità di dati gestite dall'applicazione.

### 1.1. Cliente

*   **Descrizione:** Rappresenta un cliente dell'azienda.
*   **Attributi:**
    *   `id`: Identificativo univoco
    *   `nome`: Stringa
    *   `cognome`: Stringa
    *   `ragioneSociale`: Stringa (opzionale)
    *   `email`: Stringa (univoca) – Ogni email cliente deve essere univoca nel sistema.
    *   `telefono`: Stringa
    *   `indirizzo`: Oggetto/Stringa (via, cap, città, provincia)
    *   `partitaIva`: Stringa (opzionale)
    *   `codiceFiscale`: Stringa (opzionale)
    *   `dataCreazione`: Timestamp
    *   `dataUltimaModifica`: Timestamp
    *   `[Altri campi specifici...]`

### 1.2. Fattura

*   **Descrizione:** Rappresenta un documento fiscale (fattura).
*   **Attributi:**
    *   `id`: Identificativo univoco
    *   `numeroFattura`: Stringa/Numero (progressivo) – Generato progressivamente per utente.
    *   `dataEmissione`: Data
    *   `dataScadenza`: Data
    *   `clienteId`: Riferimento all'ID del Cliente (`Cliente.id`)
    *   `importoTotale`: Numero (calcolato) – Somma delle righe fattura più IVA.
    *   `imponibile`: Numero
    *   `iva`: Numero/Percentuale
    *   `stato`: Stringa (es. "Bozza", "Emessa", "Pagata", "Scaduta", "Stornata")
    *   `note`: Testo lungo
    *   `righeFattura`: Array di oggetti RigaFattura (vedi sotto)
    *   `dataCreazione`: Timestamp
    *   `dataUltimaModifica`: Timestamp
    *   `[Altri campi specifici...]`

### 1.3. RigaFattura (o Prodotto/Servizio in Fattura)

*   **Descrizione:** Rappresenta una singola linea all'interno di una fattura.
*   **Attributi:**
    *   `id`: Identificativo univoco
    *   `descrizione`: Stringa
    *   `quantita`: Numero
    *   `prezzoUnitario`: Numero
    *   `aliquotaIva`: Numero/Percentuale
    *   `importoRiga`: Numero (calcolato: quantità * prezzoUnitario)
    *   Attualmente non c’è un catalogo prodotti/servizi, il campo `descrizione` è libero.

### 1.4. Preventivo

*   **Descrizione:** Rappresenta un preventivo inviato a un cliente.
*   **Attributi:**
    *   `id`: Identificativo univoco
    *   `numeroPreventivo`: Stringa/Numero
    *   `dataEmissione`: Data
    *   `dataValidita`: Data
    *   `clienteId`: Riferimento all'ID del Cliente (`Cliente.id`)
    *   `stato`: Stringa (es. "Bozza", "Inviato", "Accettato", "Rifiutato", "Convertito in Fattura")
    *   `righePreventivo`: Array di oggetti (simili a RigaFattura)
    *   `note`: Testo lungo
    *   `[Altri campi specifici...]`

### 1.5. Evento (Appuntamento, Entrata, Spesa)

*   **Descrizione:** Rappresenta un evento nel calendario, che può essere un appuntamento, una registrazione di entrata o uscita economica.
*   **Attributi:**
    *   `id`: Identificativo univoco
    *   `titolo`: Stringa
    *   `tipoEvento`: Stringa (es. "Appuntamento", "Entrata", "Spesa")
    *   `dataInizio`: Timestamp
    *   `dataFine`: Timestamp (opzionale)
    *   `descrizione`: Testo lungo
    *   `clienteId`: Riferimento all'ID del Cliente (opzionale, `Cliente.id`)
    *   `importo`: Numero (per Entrate/Spese)
    *   `categoriaSpesa`: Stringa (per Spese, es. "Materiali", "Trasporto") – Presente per eventi di tipo `expense`.
    *   `metodoPagamento`: Stringa – Presente per `income` e `expense`.
    *   `luogo`: Stringa – Presente per appuntamenti.
    *   `ricorrenza`: Oggetto – Supportata per appuntamenti ricorrenti (giornaliera, settimanale, mensile).
    *   `promemoria`: Boolean/Timestamp – Supportato (notifiche push).
    *   `dataCreazione`: Timestamp
    *   `dataUltimaModifica`: Timestamp
    *   `[Altri campi specifici...]`

### 1.6. Utente

*   **Descrizione:** Utente che utilizza l'applicazione.
*   **Attributi:**
    *   `id`: Identificativo univoco
    *   `email`: Stringa (univoca)
    *   `nome`: Stringa
    *   `passwordHash`: Stringa (non la password in chiaro!)
    *   `ruolo`: Stringa (es. "Admin", "Utente Standard") - *Se applicabile*
    *   `[Altri campi specifici...]`

---

## 2. Funzionalità Core per Entità

Elenco delle operazioni principali che l'utente può eseguire dall'app mobile per ogni entità.

### 2.1. Cliente

*   **Create:** Creare un nuovo cliente.
*   **Read:**
    *   Visualizzare l'elenco dei clienti (con ricerca per nome/email e filtro per "nuovo/abituale")..
    *   Visualizzare la scheda di dettaglio di un singolo cliente.
*   **Update:** Modificare i dati di un cliente esistente.
*   **Delete:** Eliminare un cliente: richiesta conferma. Le fatture/eventi collegati restano ma perdono il riferimento al cliente (campo nullo)..
*   **Azioni Specifiche:**
    *   Chiamata diretta: Sì (tap su telefono)
    *   Email diretta: Sì (tap su email)
    *   Visualizzare storico: Sì, sezione dedicata in dettaglio cliente

### 2.2. Fattura

*   **Create:** Creare una nuova fattura: da zero o convertendo un preventivo..
*   **Read:**
    *   Visualizzare l'elenco delle fatture (con filtri per stato, data, cliente)..
    *   Visualizzare il dettaglio di una singola fattura.
*   **Update:** Modificare una fattura: solo se “Bozza”..
*   **Delete:** Eliminare una fattura: solo se “Bozza”..
*   **Azioni Specifiche:**
    *   Generare PDF della fattura.
    *   Inviare la fattura via email.
    *   Segnare la fattura come "Pagata".
    *   Segnare la fattura come "Emessa".

### 2.3. Preventivo

*   **Create:** Creare un nuovo preventivo.
*   **Read:**
    *   Visualizzare l'elenco dei preventivi (con filtri)..
    *   Visualizzare il dettaglio di un singolo preventivo.
*   **Update:** Modificare un preventivo: solo se “Bozza” o “Inviato”..
*   **Delete:** Eliminare un preventivo.
*   **Azioni Specifiche:**
    *   Convertire un preventivo in fattura: vengono copiati cliente, righe, note, importi; l’utente può modificare prima di salvare..
    *   Segnare come "Accettato" o "Rifiutato".
    *   Inviare il preventivo via email.
    *   Duplicare un preventivo.
    *   [Altro...]

### 2.4. Evento

*   **Create:** Creare un nuovo evento (appuntamento, entrata, spesa).
*   **Read:**
    *   Visualizzare gli eventi sia in elenco che in calendario, con filtri per tipo/data/cliente..
    *   Visualizzare il dettaglio di un singolo evento.
*   **Update:** Modificare un evento esistente.
*   **Delete:** Eliminare un evento.
*   **Azioni Specifiche:**
    *   Impostare/modificare ricorrenza.
    *   Impostare/ricevere promemoria: sì, notifiche push locali..
    *   [Altro...]

---

## 3. Flussi di Lavoro Principali (Workflows)

Descrizione dei processi utente più comuni che coinvolgono più passaggi o entità.

*   **Flusso: Da Preventivo a Fattura:**
    1. Utente visualizza un preventivo in stato "Accettato".
    2. Utente seleziona l'opzione "Converti in Fattura".
    3. Viene creata una nuova fattura in stato “Bozza” con tutti i dati del preventivo copiati. L’utente può modificare prima di salvare.
    4. Lo stato del preventivo viene aggiornato a "Convertito in Fattura".

*   **Flusso: Registrazione Spesa da Evento:**
    1. Utente crea/modifica un evento di tipo "Appuntamento".
    2. Sì, esiste il pulsante “Aggiungi Spesa Collegata” nella schermata dettaglio evento. Porta a una schermata con campi precompilati (data, cliente).
    3. L'utente viene portato alla schermata di creazione Spesa, con alcuni campi precompilati (es. data, cliente?).
    4. L'utente compila i dettagli della spesa e salva.
    5. La spesa viene creata e collegata all'evento originale.

*   **Flusso: Segnalazione Pagamento Fattura:**
    1. Utente visualizza una fattura in stato "Emessa".
    2. Utente seleziona l'opzione "Segna come Pagata".
    3. L’utente deve inserire la data e il metodo di pagamento.
    4. Lo stato della fattura viene aggiornato a "Pagata".
    5. Sì, viene creata automaticamente una registrazione di “Entrata” collegata alla fattura.

*   Gestione ricorrenza eventi, reminder multipli, dashboard riepilogativa: tutti implementati.

---

## 4. Struttura di Navigazione e Schermate Principali (App Mobile)

Elenco delle schermate principali e della navigazione generale dell'app mobile.

*   **Login/Autenticazione:** Schermata iniziale se l'utente non è loggato.
*   **Navigazione Principale:** (es. Tab Bar, Drawer Menu)
    *   **Dashboard/Home:** Riepilogo generale (es. prossimi appuntamenti, fatture scadute, saldo recente).
    *   **Clienti:**
        *   `ElencoClientiScreen`: Lista ricercabile/filtrabile.
        *   `DettaglioClienteScreen`: Vista dettagliata con dati, contatti, storico (fatture, eventi).
        *   `CreaModificaClienteScreen`: Form per inserire/modificare dati cliente.
    *   **Fatture:**
        *   `ElencoFattureScreen`: Lista ricercabile/filtrabile per stato/data.
        *   `DettaglioFatturaScreen`: Vista dettagliata con righe, totali, stato, azioni (PDF, Paga).
        *   `CreaModificaFatturaScreen`: Form per inserire/modificare dati fattura e righe.
    *   **Preventivi:** (Simile a Fatture)
        *   `ElencoPreventiviScreen`
        *   `DettaglioPreventivoScreen`
        *   `CreaModificaPreventivoScreen`
    *   **Calendario/Eventi:**
        *   `CalendarioScreen`: Vista mensile/settimanale/giornaliera degli eventi.
        *   `ElencoEventiScreen`: Lista eventi filtrabile per tipo/data.
        *   `DettaglioEventoScreen`: Vista dettagliata dell'evento.
        *   `CreaModificaEventoScreen`: Form per inserire/modificare eventi (con selezione tipo).
    *   **Impostazioni:** (es. Profilo utente, preferenze, logout).
*   **[Altre schermate specifiche...]**

---

## 5. Relazioni tra i Dati

Descrizione formale delle relazioni tra le entità principali.

*   **Cliente <-> Fattura:** Uno a Molti (Un Cliente può avere molte Fatture; una Fattura appartiene a un solo Cliente).
*   **Cliente <-> Preventivo:** Uno a Molti (Un Cliente può avere molti Preventivi; un Preventivo appartiene a un solo Cliente).
*   **Cliente <-> Evento:** Uno a Molti (Un Cliente può essere associato a molti Eventi; un Evento può essere associato a un solo Cliente - *Verificare se un evento può essere associato a più clienti*).
*   **Fattura <-> RigaFattura:** Uno a Molti (Una Fattura contiene molte RigheFattura; una RigaFattura appartiene a una sola Fattura).
*   **Preventivo <-> RigaPreventivo:** Uno a Molti (Un Preventivo contiene molte RighePreventivo; una RigaPreventivo appartiene a un solo Preventivo).
*   **Preventivo -> Fattura:** Uno a Uno (opzionale) (Un Preventivo può essere convertito in *una* Fattura).
*   **Evento <-> Spesa/Entrata**: Spese ed Entrate sono modellate come eventi di tipo specifico (`event_type: 'expense'` o `event_type: 'income'`). La relazione è implicita tramite il campo `event_type`.
*   **Utente <-> Cliente**: Ogni cliente ha il campo `user_id` che lo collega all’utente proprietario. Gli utenti vedono solo i propri clienti (multi-tenant).

---

## 6. Gestione Dati Attuale (App Mobile)

Come l'app mobile gestisce i dati *attualmente*.


### 6.2. Comunicazione con Supabase (SDK)

L'app mobile comunica direttamente con **Supabase** tramite l’SDK ufficiale [`@supabase/supabase-js`](https://supabase.com/docs/reference/javascript/introduction). Tutte le operazioni CRUD (creazione, lettura, aggiornamento, eliminazione) e l’autenticazione avvengono tramite chiamate SDK, senza dover gestire manualmente endpoint REST o token JWT.

Esempi di utilizzo:

```ts
// Recupera tutti i clienti
const { data, error } = await supabase.from('clients').select('*');

// Inserisce un nuovo cliente
const { data, error } = await supabase.from('clients').insert([{ full_name: 'Mario Rossi' }]);

// Aggiorna una fattura
const { data, error } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId);

// Autenticazione utente (login)
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
```

L’SDK gestisce internamente la sessione utente, il refresh dei token e la persistenza locale delle credenziali.

Se l'app non è connessa a internet, tutte le operazioni vengono gestite localmente e sincronizzate con Supabase appena la connessione è disponibile.

### 6.3. Gestione Offline/Sincronizzazione

L’app implementa una logica "offline-first":
- Le modifiche fatte offline vengono salvate localmente (queue di operazioni)
- Al ritorno della connessione, una routine di sincronizzazione invia le modifiche al server e aggiorna i dati locali
- La gestione conflitti può essere basata su timestamp/ultima modifica
- Librerie utili: `redux-offline`, `react-query`, custom sync logic
- Se l’app non supporta l’offline, richiede sempre una connessione internet per operare

---

## 7. Autenticazione e Ruoli Utente

L’accesso all’app è protetto da login (email/password o social login). La sessione utente viene gestita tramite JWT token salvato in AsyncStorage. Il logout rimuove il token e resetta lo stato locale.

Sono previsti ruoli utente (es. "Admin", "Utente Standard") che determinano permessi e funzionalità accessibili. Se la tua app non prevede ruoli, questa sezione può essere rimossa.

---

## 8. Note Aggiuntive / Considerazioni per il Web

- Alcune librerie mobile (es. notifiche push, fotocamera, GPS) richiedono alternative web (es. service worker, accesso browser, ecc.)
- Generazione PDF: su web si può usare `pdfmake`, `jsPDF`, ecc.
- Sincronizzazione dati e gestione conflitti da progettare per multi-dispositivo
- UI/UX: adattare layout mobile a responsive web
- [Aggiungi qui altre considerazioni specifiche del tuo progetto]