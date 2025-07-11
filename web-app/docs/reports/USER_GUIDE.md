# Guida Utente - Sistema di Reporting

## Indice

1. [Introduzione](#introduzione)
2. [Accesso al Sistema](#accesso-al-sistema)
3. [Dashboard Reports](#dashboard-reports)
4. [Generazione Report](#generazione-report)
5. [Schedulazione Report](#schedulazione-report)
6. [Gestione File](#gestione-file)
7. [Filtri e Ricerca](#filtri-e-ricerca)
8. [Esportazione Dati](#esportazione-dati)
9. [Notifiche](#notifiche)
10. [Risoluzione Problemi](#risoluzione-problemi)
11. [FAQ](#faq)

---

## Introduzione

Benvenuto nel sistema di reporting di Nexa Manager! Questa guida ti aiuterà a utilizzare tutte le funzionalità disponibili per generare, visualizzare e gestire i report aziendali.

### Cosa puoi fare

✅ **Visualizzare metriche in tempo reale**
- Entrate, spese e profitti
- Grafici interattivi
- Indicatori di crescita

✅ **Generare report personalizzati**
- Formati PDF ed Excel
- Periodi personalizzabili
- Template professionali

✅ **Programmare report automatici**
- Frequenze giornaliere, settimanali, mensili
- Invio automatico via email
- Gestione completa degli schedule

✅ **Monitorare in tempo reale**
- Notifiche di completamento
- Indicatori di progresso
- Aggiornamenti automatici

---

## Accesso al Sistema

### 1. Login

1. Accedi a Nexa Manager con le tue credenziali
2. Dal menu principale, clicca su **"Reports"**
3. Verrai reindirizzato alla dashboard dei report

### 2. Permessi Richiesti

Per utilizzare il sistema di reporting, devi avere almeno uno di questi ruoli:
- **Admin**: Accesso completo a tutte le funzionalità
- **Manager**: Generazione e visualizzazione report
- **Analyst**: Solo visualizzazione report esistenti

---

## Dashboard Reports

### Panoramica

La dashboard è la tua home page per tutti i report. Qui puoi:
- Visualizzare metriche chiave
- Vedere i report recenti
- Accedere rapidamente alle funzioni principali

### Sezioni della Dashboard

#### 📊 Metriche Principali

Nella parte superiore trovi 6 card con le metriche più importanti:

1. **Entrate Totali** 💰
   - Somma di tutte le entrate del periodo
   - Percentuale di crescita rispetto al periodo precedente
   - Indicatore visivo (verde/rosso)

2. **Spese Totali** 💸
   - Somma di tutte le spese del periodo
   - Percentuale di variazione
   - Confronto con budget (se disponibile)

3. **Profitto Netto** 📈
   - Differenza tra entrate e spese
   - Margine di profitto percentuale
   - Trend rispetto ai mesi precedenti

4. **Crescita Entrate** 📊
   - Percentuale di crescita delle entrate
   - Confronto mese su mese
   - Proiezioni future

5. **Variazione Spese** 📉
   - Percentuale di variazione delle spese
   - Analisi delle categorie principali
   - Ottimizzazioni suggerite

6. **Margine di Profitto** 🎯
   - Percentuale di profitto sulle entrate
   - Confronto con obiettivi aziendali
   - Benchmark di settore

#### 📈 Grafici Interattivi

**Grafico Entrate:**
- Visualizzazione temporale delle entrate
- Filtri per periodo (settimana, mese, anno)
- Hover per dettagli specifici
- Zoom e pan per esplorare i dati

**Grafico Spese:**
- Breakdown delle spese per categoria
- Confronto con periodi precedenti
- Identificazione di anomalie
- Drill-down per maggiori dettagli

#### 📋 Report Recenti

Lista degli ultimi report generati con:
- Nome del report
- Tipo (Entrate/Spese/Profitto)
- Data di creazione
- Formato (PDF/Excel)
- Stato (Completato/In elaborazione/Errore)
- Azioni rapide (Download/Visualizza/Elimina)

### Come Navigare

1. **Filtro Periodo**: Usa il selettore in alto a destra per cambiare il periodo di visualizzazione
2. **Aggiornamento**: I dati si aggiornano automaticamente ogni 5 minuti
3. **Esportazione**: Clicca sull'icona di esportazione per scaricare i dati dei grafici
4. **Dettagli**: Clicca su qualsiasi metrica per vedere i dettagli completi

---

## Generazione Report

### Avviare la Generazione

1. **Clicca su "Genera Report"** nella dashboard
2. Si aprirà il **Report Generator** in una finestra modale
3. Compila i campi richiesti
4. Clicca **"Genera"** per avviare il processo

### Parametri di Generazione

#### 📝 Campi Obbligatori

**Tipo di Report:**
- 💰 **Entrate**: Report delle entrate aziendali
- 💸 **Spese**: Report delle spese sostenute
- 📊 **Profitto**: Report di profitti e perdite

**Periodo:**
- **Data Inizio**: Seleziona dal calendario
- **Data Fine**: Deve essere successiva alla data inizio
- **Suggerimenti**: Periodi comuni (Ultimo mese, Trimestre, Anno)

**Formato Output:**
- 📄 **PDF**: Ideale per presentazioni e stampa
- 📊 **Excel**: Perfetto per analisi e manipolazione dati

#### ⚙️ Opzioni Avanzate

**Nome Personalizzato:**
- Campo opzionale per dare un nome specifico al report
- Se vuoto, verrà generato automaticamente
- Esempio: "Report Vendite Q1 2024"

**Opzioni di Contenuto:**
- ✅ **Includi Grafici**: Aggiunge visualizzazioni grafiche
- ✅ **Includi Dettagli**: Aggiunge tabelle dettagliate
- ✅ **Includi Analisi**: Aggiunge commenti e insights
- ✅ **Includi Confronti**: Confronta con periodi precedenti

### Processo di Generazione

#### Fase 1: Validazione
- Il sistema verifica tutti i parametri inseriti
- Controlla la disponibilità dei dati per il periodo selezionato
- Valida i permessi dell'utente

#### Fase 2: Elaborazione
- **Raccolta Dati** (0-30%): Estrazione dati dal database
- **Calcoli** (30-60%): Elaborazione metriche e statistiche
- **Generazione Grafici** (60-80%): Creazione visualizzazioni
- **Formattazione** (80-100%): Creazione file finale

#### Fase 3: Completamento
- Il report viene salvato nel sistema
- Ricevi una notifica di completamento
- Il link di download diventa disponibile

### Monitoraggio Progresso

**Indicatori Visivi:**
- 🔄 **Barra di Progresso**: Mostra la percentuale di completamento
- 📝 **Messaggio di Stato**: Descrive la fase corrente
- ⏱️ **Tempo Stimato**: Stima del tempo rimanente

**Notifiche in Tempo Reale:**
- Le notifiche appaiono automaticamente
- Puoi continuare a lavorare mentre il report viene generato
- Riceverai un avviso quando il report è pronto

### Download e Gestione

**Download Immediato:**
1. Clicca sul pulsante **"Scarica"** quando appare
2. Il file verrà scaricato nella cartella download del browser
3. Il nome del file include data e tipo di report

**Gestione File:**
- I report rimangono disponibili per 30 giorni
- Puoi scaricarli nuovamente dalla sezione "Report Recenti"
- I file vengono automaticamente eliminati dopo la scadenza

---

## Schedulazione Report

### Accesso al Scheduler

1. Dalla dashboard, clicca sulla tab **"Schedulazione"**
2. Vedrai l'interfaccia di gestione delle programmazioni
3. Qui puoi creare, modificare ed eliminare schedule

### Creare una Nuova Schedulazione

#### Passo 1: Informazioni Base

**Nome Schedulazione:**
- Scegli un nome descrittivo
- Esempio: "Report Settimanale Vendite"
- Massimo 100 caratteri

**Tipo di Report:**
- Seleziona tra Entrate, Spese o Profitto
- Stesso tipo verrà generato ad ogni esecuzione

#### Passo 2: Frequenza

**Giornaliera:**
- Il report viene generato ogni giorno
- Specifica solo l'ora di esecuzione
- Formato: HH:MM (24 ore)

**Settimanale:**
- Scegli il giorno della settimana
- Lunedì = 1, Domenica = 7
- Specifica l'ora di esecuzione

**Mensile:**
- Scegli il giorno del mese (1-31)
- Se il giorno non esiste (es. 31 febbraio), verrà usato l'ultimo giorno del mese
- Specifica l'ora di esecuzione

#### Passo 3: Destinazione

**Email Destinatario:**
- Inserisci l'indirizzo email
- Deve essere un indirizzo valido
- Puoi inserire più indirizzi separati da virgola

**Formato Report:**
- PDF per presentazioni
- Excel per analisi

#### Passo 4: Opzioni Avanzate

**Periodo Report:**
- **Automatico**: Il sistema sceglie il periodo appropriato
  - Giornaliero: giorno precedente
  - Settimanale: settimana precedente
  - Mensile: mese precedente
- **Personalizzato**: Specifica un periodo fisso

**Opzioni Email:**
- **Oggetto Personalizzato**: Personalizza l'oggetto dell'email
- **Messaggio**: Aggiungi un messaggio personalizzato
- **Allegato**: Il report viene sempre allegato

### Gestione Schedule Esistenti

#### Visualizzazione

Ogni schedule mostra:
- 📝 **Nome** e tipo di report
- 🕐 **Frequenza** e prossima esecuzione
- 📧 **Destinatario** email
- 🔄 **Stato** (Attivo/Disattivo)
- 📅 **Ultima esecuzione** e risultato

#### Azioni Disponibili

**Attiva/Disattiva:**
- Toggle switch per abilitare/disabilitare
- Schedule disattivati non vengono eseguiti
- Puoi riattivare in qualsiasi momento

**Modifica:**
1. Clicca sull'icona di modifica ✏️
2. Si apre il form con i dati attuali
3. Modifica i campi necessari
4. Salva le modifiche

**Elimina:**
1. Clicca sull'icona di eliminazione 🗑️
2. Conferma l'eliminazione nel popup
3. Lo schedule viene rimosso definitivamente

**Esegui Ora:**
- Forza l'esecuzione immediata dello schedule
- Utile per testare la configurazione
- Non influisce sulla programmazione normale

### Monitoraggio Esecuzioni

#### Log delle Esecuzioni

Per ogni schedule puoi vedere:
- **Data/Ora** di esecuzione
- **Stato** (Successo/Errore)
- **Durata** dell'elaborazione
- **Dimensione** del file generato
- **Destinatari** che hanno ricevuto l'email

#### Gestione Errori

**Tipi di Errore Comuni:**
- 📧 **Email non valida**: Controlla l'indirizzo destinatario
- 📊 **Dati insufficienti**: Periodo senza transazioni
- 🔧 **Errore sistema**: Problema temporaneo del server
- ⏰ **Timeout**: Elaborazione troppo lunga

**Azioni Automatiche:**
- Il sistema riprova automaticamente 3 volte
- Intervallo di 5 minuti tra i tentativi
- Dopo 3 fallimenti, lo schedule viene disattivato
- Ricevi una notifica email dell'errore

---

## Gestione File

### Organizzazione Report

#### Struttura File

I report vengono organizzati automaticamente:
```
Reports/
├── 2024/
│   ├── 01-Gennaio/
│   │   ├── Revenue/
│   │   ├── Expenses/
│   │   └── Profit/
│   └── 02-Febbraio/
└── Archives/
```

#### Nomenclatura File

I file seguono questo schema:
```
[Tipo]_[DataInizio]_[DataFine]_[Timestamp].[Formato]

Esempi:
Revenue_2024-01-01_2024-01-31_20240115103000.pdf
Expenses_2024-Q1_20240401090000.xlsx
```

### Archiviazione

#### Politiche di Retention

- **Report Recenti**: Disponibili per 30 giorni
- **Report Schedulati**: Disponibili per 90 giorni
- **Report Importanti**: Possono essere marcati per conservazione permanente
- **Archivio**: Report più vecchi vengono compressi e archiviati

#### Spazio di Archiviazione

**Limiti per Utente:**
- **Basic**: 1 GB di spazio
- **Professional**: 5 GB di spazio
- **Enterprise**: Spazio illimitato

**Ottimizzazione Spazio:**
- I file PDF vengono compressi automaticamente
- I file Excel utilizzano compressione ZIP
- I report duplicati vengono de-duplicati

### Download e Condivisione

#### Metodi di Download

**Download Diretto:**
1. Clicca sul nome del report
2. Il download inizia automaticamente
3. Il file viene salvato nella cartella download

**Download Multiplo:**
1. Seleziona più report con le checkbox
2. Clicca "Scarica Selezionati"
3. Viene creato un file ZIP con tutti i report

**Link di Condivisione:**
1. Clicca sull'icona di condivisione 🔗
2. Viene generato un link temporaneo (24 ore)
3. Condividi il link con colleghi o clienti
4. Il link scade automaticamente per sicurezza

#### Sicurezza Download

**Controlli di Accesso:**
- Solo utenti autorizzati possono scaricare
- Log di tutti i download per audit
- Watermark sui PDF con nome utente

**Protezione File:**
- I PDF possono essere protetti da password
- I file Excel possono avere fogli protetti
- Crittografia durante il trasferimento

---

## Filtri e Ricerca

### Filtri Disponibili

#### Filtro per Tipo

**Opzioni:**
- 💰 **Entrate**: Solo report delle entrate
- 💸 **Spese**: Solo report delle spese
- 📊 **Profitto**: Solo report di profitto
- 🔄 **Tutti**: Mostra tutti i tipi

**Come Usare:**
1. Clicca sui pulsanti di filtro sopra la lista
2. I report vengono filtrati immediatamente
3. Il contatore mostra quanti report corrispondono

#### Filtro per Formato

**Opzioni:**
- 📄 **PDF**: Solo file PDF
- 📊 **Excel**: Solo file Excel
- 📁 **Tutti**: Tutti i formati

#### Filtro per Data

**Periodo Predefinito:**
- 📅 **Oggi**: Report generati oggi
- 📅 **Questa Settimana**: Ultimi 7 giorni
- 📅 **Questo Mese**: Mese corrente
- 📅 **Ultimo Trimestre**: Ultimi 3 mesi

**Periodo Personalizzato:**
1. Clicca su "Personalizzato"
2. Seleziona data inizio e fine
3. Clicca "Applica Filtro"

#### Filtro per Stato

**Stati Disponibili:**
- ✅ **Completato**: Report pronti per il download
- 🔄 **In Elaborazione**: Report in fase di generazione
- ❌ **Errore**: Report con errori di generazione
- ⏸️ **In Pausa**: Report temporaneamente sospesi

### Ricerca Avanzata

#### Ricerca per Nome

**Funzionalità:**
- Ricerca in tempo reale mentre digiti
- Non case-sensitive
- Supporta ricerca parziale
- Evidenzia i termini trovati

**Esempi:**
- "revenue" → trova tutti i report con "revenue" nel nome
- "Q1" → trova tutti i report del primo trimestre
- "2024" → trova tutti i report del 2024

#### Ricerca per Contenuto

**Metadati Ricercabili:**
- Nome del report
- Descrizione
- Tag personalizzati
- Nome utente che ha creato il report
- Commenti e note

#### Operatori di Ricerca

**Operatori Supportati:**
- `AND`: "revenue AND 2024" → deve contenere entrambi
- `OR`: "revenue OR profit" → deve contenere almeno uno
- `NOT`: "revenue NOT expenses" → contiene revenue ma non expenses
- `""`: "revenue report" → frase esatta

### Ordinamento

#### Criteri di Ordinamento

**Per Data:**
- 📅 **Data Creazione**: Quando è stato generato
- 📅 **Data Modifica**: Ultima modifica
- 📅 **Data Report**: Periodo coperto dal report

**Per Nome:**
- 🔤 **Alfabetico A-Z**: Ordine alfabetico crescente
- 🔤 **Alfabetico Z-A**: Ordine alfabetico decrescente

**Per Dimensione:**
- 📏 **Più Piccoli**: File più piccoli prima
- 📏 **Più Grandi**: File più grandi prima

**Per Tipo:**
- 📊 **Per Categoria**: Raggruppa per tipo di report
- 📄 **Per Formato**: Raggruppa per formato file

#### Ordinamento Personalizzato

1. Clicca sull'intestazione della colonna
2. Prima volta: ordine crescente
3. Seconda volta: ordine decrescente
4. Terza volta: rimuove ordinamento

### Salvataggio Filtri

#### Filtri Preferiti

**Creare un Filtro Preferito:**
1. Imposta tutti i filtri desiderati
2. Clicca "Salva Filtro"
3. Dai un nome al filtro
4. Il filtro appare nella lista "Preferiti"

**Esempi di Filtri Utili:**
- "Report Mensili PDF": Tipo=Tutti, Formato=PDF, Periodo=Ultimo Mese
- "Entrate 2024": Tipo=Entrate, Data=2024
- "Report Errori": Stato=Errore, Tutti i tipi

#### Filtri Condivisi

**Per Team:**
- I manager possono creare filtri per il team
- Filtri condivisi appaiono per tutti i membri
- Utili per standardizzare le visualizzazioni

---

## Esportazione Dati

### Esportazione Grafici

#### Formati Disponibili

**Immagini:**
- 🖼️ **PNG**: Alta qualità, ideale per presentazioni
- 🖼️ **JPG**: Dimensioni ridotte, buona qualità
- 🖼️ **SVG**: Vettoriale, scalabile senza perdita qualità

**Dati:**
- 📊 **CSV**: Dati grezzi per analisi
- 📊 **Excel**: Formattazione avanzata
- 📊 **JSON**: Per sviluppatori e integrazioni

#### Processo di Esportazione

**Esportazione Singola:**
1. Hover sul grafico desiderato
2. Clicca sull'icona di esportazione 📤
3. Scegli il formato
4. Il file viene scaricato automaticamente

**Esportazione Multipla:**
1. Clicca "Esporta Dashboard"
2. Seleziona i grafici da includere
3. Scegli formato e qualità
4. Viene creato un pacchetto ZIP

#### Opzioni Avanzate

**Qualità Immagini:**
- **Standard**: 72 DPI, dimensioni ridotte
- **Alta**: 150 DPI, buona qualità
- **Stampa**: 300 DPI, qualità professionale

**Personalizzazione:**
- **Dimensioni**: Larghezza e altezza personalizzate
- **Colori**: Schema colori personalizzato
- **Logo**: Aggiungi logo aziendale
- **Watermark**: Aggiungi watermark di sicurezza

### Esportazione Report

#### Formati Report

**PDF Avanzato:**
- Layout professionale
- Grafici ad alta risoluzione
- Tabelle formattate
- Intestazioni e piè di pagina personalizzati
- Indice automatico per report lunghi

**Excel Completo:**
- Fogli multipli per sezioni diverse
- Grafici interattivi
- Tabelle pivot
- Formule per calcoli automatici
- Formattazione condizionale

**PowerPoint:**
- Slide pronte per presentazioni
- Grafici modificabili
- Layout professionale
- Note del relatore

#### Template Personalizzati

**Template Aziendali:**
- Logo e colori aziendali
- Layout standardizzato
- Sezioni predefinite
- Formattazione coerente

**Creazione Template:**
1. Genera un report standard
2. Clicca "Salva come Template"
3. Personalizza layout e contenuti
4. Salva per uso futuro

### Automazione Esportazione

#### Esportazione Programmata

**Configurazione:**
1. Vai nelle impostazioni di schedulazione
2. Abilita "Esportazione Automatica"
3. Scegli formati e destinazioni
4. Imposta frequenza di esportazione

**Destinazioni:**
- 📧 **Email**: Invio automatico via email
- ☁️ **Cloud Storage**: Upload su Google Drive, Dropbox
- 🖥️ **FTP/SFTP**: Upload su server aziendali
- 📱 **Webhook**: Notifica sistemi esterni

#### Integrazione API

**Endpoint Esportazione:**
```
POST /api/v1/reports/export
{
  "reportId": "uuid",
  "format": "pdf",
  "options": {
    "quality": "high",
    "template": "corporate"
  }
}
```

**Webhook Notifiche:**
- Notifica quando l'esportazione è completata
- Include link di download
- Metadati del file esportato

---

## Notifiche

### Tipi di Notifiche

#### Notifiche di Sistema

**Generazione Report:**
- 🔄 **Avvio**: "Generazione report iniziata"
- 📊 **Progresso**: Aggiornamenti percentuale (25%, 50%, 75%)
- ✅ **Completamento**: "Report pronto per il download"
- ❌ **Errore**: "Errore durante la generazione"

**Schedulazione:**
- ⏰ **Esecuzione**: "Schedule eseguito con successo"
- 📧 **Invio Email**: "Report inviato a destinatari"
- ⚠️ **Avviso**: "Schedule disattivato per errori ripetuti"

**Sistema:**
- 🔧 **Manutenzione**: "Sistema in manutenzione programmata"
- 🆕 **Aggiornamenti**: "Nuove funzionalità disponibili"
- 🔒 **Sicurezza**: "Accesso da nuovo dispositivo rilevato"

#### Notifiche Personalizzate

**Soglie Personalizzate:**
- 📈 **Crescita**: Notifica quando crescita > X%
- 📉 **Calo**: Notifica quando calo > X%
- 💰 **Obiettivi**: Notifica quando raggiungi obiettivi
- ⚠️ **Anomalie**: Notifica per valori inusuali

### Canali di Notifica

#### In-App

**Caratteristiche:**
- 🔔 **Badge**: Numero notifiche non lette
- 🎨 **Colori**: Diversi colori per tipo di notifica
- ⏰ **Timestamp**: Data e ora precise
- 🔗 **Azioni**: Link diretti alle risorse

**Gestione:**
- Clicca per marcare come letta
- Swipe per eliminare
- "Marca tutte come lette"
- Filtro per tipo di notifica

#### Email

**Configurazione:**
1. Vai in "Impostazioni" → "Notifiche"
2. Abilita notifiche email
3. Scegli frequenza (Immediata/Giornaliera/Settimanale)
4. Seleziona tipi di notifica

**Template Email:**
- **Oggetto**: Chiaro e descrittivo
- **Contenuto**: Informazioni essenziali
- **Azioni**: Pulsanti per azioni rapide
- **Footer**: Link per disiscriversi

#### Push (Mobile)

**Requisiti:**
- App mobile Nexa Manager installata
- Permessi notifiche abilitati
- Account sincronizzato

**Personalizzazione:**
- Orari di silenzio
- Priorità notifiche
- Suoni personalizzati
- Vibrazione

#### Webhook

**Per Sviluppatori:**
```json
{
  "event": "report.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "reportId": "uuid",
    "userId": "uuid",
    "downloadUrl": "https://..."
  }
}
```

### Gestione Notifiche

#### Impostazioni Globali

**Frequenza:**
- **Immediata**: Notifica istantanea
- **Raggruppata**: Ogni 15 minuti
- **Giornaliera**: Riassunto giornaliero
- **Settimanale**: Riassunto settimanale

**Orari:**
- **Sempre**: 24/7
- **Orario Lavorativo**: Solo 9-18
- **Personalizzato**: Orari specifici
- **Fuso Orario**: Rispetta il tuo fuso orario

#### Filtri Avanzati

**Per Tipo Report:**
- Solo notifiche per report di entrate
- Escludi notifiche per report automatici
- Solo errori critici

**Per Utente:**
- Notifiche solo per i tuoi report
- Includi report del team
- Solo report condivisi

#### Do Not Disturb

**Modalità Silenziosa:**
- Disabilita tutte le notifiche
- Durata personalizzabile
- Eccezioni per notifiche critiche

**Programmazione:**
- Silenzio automatico nei weekend
- Pausa durante le ferie
- Silenzio durante le riunioni (integrazione calendario)

---

## Risoluzione Problemi

### Problemi Comuni

#### Report Non Si Genera

**Sintomi:**
- Il processo si blocca al X%
- Messaggio di errore generico
- Timeout durante la generazione

**Soluzioni:**

1. **Verifica Parametri:**
   - Controlla che le date siano valide
   - Verifica che ci siano dati per il periodo
   - Assicurati di avere i permessi necessari

2. **Riduci Complessità:**
   - Prova con un periodo più breve
   - Disabilita grafici complessi
   - Usa formato PDF invece di Excel

3. **Controlla Connessione:**
   - Verifica la connessione internet
   - Prova a ricaricare la pagina
   - Controlla lo stato del sistema

**Codici Errore Comuni:**
- `ERR_001`: Dati insufficienti → Cambia periodo
- `ERR_002`: Timeout → Riprova più tardi
- `ERR_003`: Permessi → Contatta amministratore

#### Schedulazione Non Funziona

**Sintomi:**
- Report non vengono inviati
- Email non arrivano
- Schedule risulta "Errore"

**Soluzioni:**

1. **Verifica Configurazione:**
   - Controlla indirizzo email destinatario
   - Verifica orario e fuso orario
   - Assicurati che lo schedule sia attivo

2. **Controlla Spam:**
   - Verifica cartella spam/junk
   - Aggiungi mittente ai contatti
   - Controlla filtri email aziendali

3. **Test Manuale:**
   - Usa "Esegui Ora" per testare
   - Verifica che la generazione manuale funzioni
   - Controlla log delle esecuzioni

#### Dashboard Non Si Carica

**Sintomi:**
- Pagina bianca
- Grafici non appaiono
- Errore "Impossibile caricare dati"

**Soluzioni:**

1. **Refresh Browser:**
   - Ricarica la pagina (Ctrl+F5)
   - Svuota cache del browser
   - Prova in modalità incognito

2. **Controlla Browser:**
   - Aggiorna browser all'ultima versione
   - Disabilita estensioni
   - Prova browser diverso

3. **Verifica Permessi:**
   - Controlla di essere loggato
   - Verifica permessi di accesso
   - Contatta amministratore se necessario

### Problemi di Performance

#### Caricamento Lento

**Cause Comuni:**
- Troppi dati da visualizzare
- Connessione internet lenta
- Server sovraccarico

**Ottimizzazioni:**

1. **Riduci Dati:**
   - Usa filtri per limitare i risultati
   - Imposta periodi più brevi
   - Nascondi colonne non necessarie

2. **Migliora Connessione:**
   - Usa connessione cablata invece di WiFi
   - Chiudi altre applicazioni che usano internet
   - Prova in orari di minor traffico

3. **Ottimizza Browser:**
   - Chiudi tab non necessarie
   - Svuota cache regolarmente
   - Disabilita estensioni pesanti

#### Grafici Non Responsivi

**Sintomi:**
- Grafici non si aggiornano
- Hover non funziona
- Zoom non risponde

**Soluzioni:**

1. **Aggiorna Dati:**
   - Clicca pulsante "Aggiorna"
   - Ricarica la pagina
   - Verifica connessione WebSocket

2. **Controlla Hardware:**
   - Verifica RAM disponibile
   - Chiudi applicazioni pesanti
   - Riavvia browser se necessario

### Problemi di Sicurezza

#### Accesso Negato

**Sintomi:**
- Messaggio "Accesso negato"
- Impossibile vedere certi report
- Funzioni disabilitate

**Soluzioni:**

1. **Verifica Permessi:**
   - Controlla il tuo ruolo utente
   - Verifica appartenenza ai gruppi
   - Contatta amministratore per permessi

2. **Controlla Sessione:**
   - Fai logout e login
   - Verifica scadenza token
   - Controlla da dispositivo diverso

#### Download Bloccati

**Sintomi:**
- Download non inizia
- File corrotto
- Errore di sicurezza

**Soluzioni:**

1. **Impostazioni Browser:**
   - Abilita download automatici
   - Controlla blocco popup
   - Verifica antivirus

2. **Permessi File:**
   - Controlla permessi cartella download
   - Prova cartella diversa
   - Esegui browser come amministratore

### Supporto Tecnico

#### Informazioni da Fornire

Quando contatti il supporto, includi:

**Informazioni Sistema:**
- Sistema operativo e versione
- Browser e versione
- Risoluzione schermo
- Connessione internet

**Dettagli Errore:**
- Messaggio di errore esatto
- Passi per riprodurre il problema
- Screenshot se possibile
- Orario dell'errore

**Informazioni Account:**
- Nome utente (NON password)
- Ruolo/permessi
- Ultimo accesso riuscito
- Funzionalità utilizzate

#### Canali di Supporto

**Email:** support@nexamanager.com
- Risposta entro 24 ore
- Includi tutte le informazioni sopra
- Usa oggetto descrittivo

**Chat Live:** Disponibile 9-18 CET
- Supporto immediato
- Per problemi urgenti
- Login richiesto

**Knowledge Base:** docs.nexamanager.com
- Guide dettagliate
- Video tutorial
- FAQ aggiornate

**Community Forum:** community.nexamanager.com
- Aiuto da altri utenti
- Condivisione best practices
- Richieste di funzionalità

---

## FAQ

### Domande Generali

**Q: Quanto tempo ci vuole per generare un report?**
A: Dipende dalla complessità e quantità di dati:
- Report semplice (1 mese): 30-60 secondi
- Report complesso (1 anno): 2-5 minuti
- Report con molti grafici: +50% tempo

**Q: Posso generare report per periodi futuri?**
A: No, puoi generare report solo per periodi con dati esistenti. Per proiezioni future, usa la sezione "Analytics".

**Q: Quanti report posso generare al giorno?**
A: Limiti per piano:
- Basic: 10 report/giorno
- Professional: 50 report/giorno
- Enterprise: Illimitati

**Q: I report vengono salvati automaticamente?**
A: Sì, tutti i report vengono salvati per 30 giorni. Report importanti possono essere marcati per conservazione permanente.

### Schedulazione

**Q: Posso programmare report per più destinatari?**
A: Sì, inserisci più email separate da virgola nel campo destinatario.

**Q: Cosa succede se il sistema è in manutenzione durante l'esecuzione programmata?**
A: Il sistema eseguirà automaticamente il report appena torna online, entro 2 ore dall'orario programmato.

**Q: Posso modificare uno schedule mentre è in esecuzione?**
A: No, attendi che l'esecuzione corrente finisca prima di modificare lo schedule.

**Q: Come faccio a sapere se un report programmato è stato inviato?**
A: Controlla la sezione "Log Esecuzioni" nello scheduler, oppure abilita le notifiche email.

### Formati e Compatibilità

**Q: Quale formato è meglio per l'analisi dei dati?**
A: Excel è ideale per analisi grazie a formule, pivot table e grafici modificabili.

**Q: I PDF sono accessibili per screen reader?**
A: Sì, i nostri PDF includono tag di accessibilità e struttura semantica.

**Q: Posso aprire i report Excel su Google Sheets?**
A: Sì, ma alcune funzionalità avanzate potrebbero non essere supportate.

**Q: I grafici nei PDF sono ad alta risoluzione?**
A: Sì, utilizziamo grafici vettoriali che mantengono la qualità a qualsiasi zoom.

### Sicurezza e Privacy

**Q: I miei dati sono sicuri?**
A: Sì, utilizziamo crittografia end-to-end, backup automatici e conformità GDPR.

**Q: Chi può vedere i miei report?**
A: Solo tu e gli utenti con cui condividi esplicitamente i report. Gli amministratori possono accedere per supporto tecnico.

**Q: Posso eliminare definitivamente un report?**
A: Sì, clicca "Elimina" e conferma. I report eliminati non sono recuperabili.

**Q: I link di condivisione scadono?**
A: Sì, i link di condivisione scadono dopo 24 ore per sicurezza.

### Personalizzazione

**Q: Posso personalizzare i colori dei grafici?**
A: Sì, vai in "Impostazioni" → "Personalizzazione" per scegliere schema colori.

**Q: Posso aggiungere il logo aziendale ai report?**
A: Sì, carica il logo nelle impostazioni aziendali e verrà incluso automaticamente.

**Q: Posso creare template personalizzati?**
A: Sì, genera un report, personalizzalo e salvalo come template per uso futuro.

**Q: Posso modificare le metriche mostrate nella dashboard?**
A: Sì, clicca "Personalizza Dashboard" per scegliere quali metriche visualizzare.

### Integrazione

**Q: Posso integrare i report con altri sistemi?**
A: Sì, utilizziamo API REST e webhook per integrazioni. Consulta la documentazione API.

**Q: Supportate l'integrazione con Excel/Google Sheets?**
A: Sì, puoi esportare dati in formato compatibile e impostare aggiornamenti automatici.

**Q: Posso inviare report a sistemi di BI esterni?**
A: Sì, tramite API o esportazione automatica su FTP/cloud storage.

**Q: Supportate Single Sign-On (SSO)?**
A: Sì, supportiamo SAML 2.0 e OAuth 2.0 per piani Enterprise.

### Risoluzione Problemi

**Q: Il report mostra dati errati, cosa faccio?**
A: Verifica i filtri applicati, controlla il periodo selezionato e assicurati che i dati sorgente siano corretti.

**Q: Non ricevo le email dei report programmati**
A: Controlla spam/junk, verifica l'indirizzo email e contatta il supporto se il problema persiste.

**Q: La dashboard è lenta, come posso migliorare le performance?**
A: Riduci il periodo visualizzato, usa filtri per limitare i dati e chiudi tab non necessarie del browser.

**Q: Ho perso un report importante, posso recuperarlo?**
A: Controlla il cestino nella sezione "Report Eliminati". I report possono essere recuperati entro 7 giorni dall'eliminazione.

---

## Contatti e Supporto

### Supporto Tecnico
- **Email**: support@nexamanager.com
- **Telefono**: +39 02 1234 5678 (9-18 CET)
- **Chat**: Disponibile nell'app (utenti loggati)

### Documentazione
- **Guida Completa**: docs.nexamanager.com
- **Video Tutorial**: youtube.com/nexamanager
- **API Documentation**: api.nexamanager.com

### Community
- **Forum**: community.nexamanager.com
- **Discord**: discord.gg/nexamanager
- **LinkedIn**: linkedin.com/company/nexamanager

### Feedback
- **Suggerimenti**: feedback@nexamanager.com
- **Bug Report**: bugs@nexamanager.com
- **Feature Request**: features@nexamanager.com

---

*Questa guida è aggiornata alla versione 2.1.0 del sistema di reporting. Per la versione più recente, visita docs.nexamanager.com*