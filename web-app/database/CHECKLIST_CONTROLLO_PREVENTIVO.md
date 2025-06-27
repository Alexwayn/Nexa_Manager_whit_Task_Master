# ✅ CHECKLIST CONTROLLO PREVENTIVO DATABASE

## 🚨 PRIMA DI ESEGUIRE QUALSIASI SCRIPT SQL

### ☑️ CONTROLLI OBBLIGATORI

- [ ] **Ho eseguito il controllo dello stato del database?**
  ```bash
  node check_database_status.js
  ```

- [ ] **Ho analizzato l'output del controllo?**
  - Tabelle esistenti identificate ✓
  - Tabelle mancanti identificate ✓
  - Conteggio record verificato ✓

- [ ] **Ho identificato gli script necessari?**
  - Solo script per tabelle mancanti ✓
  - Nessuno script per tabelle esistenti ✓
  - Ordine di esecuzione pianificato ✓

- [ ] **Ho verificato le dipendenze?**
  - Foreign key dependencies ✓
  - Trigger dependencies ✓
  - Function dependencies ✓

### ☑️ CONTROLLI DI SICUREZZA

- [ ] **Backup del database effettuato?** (per ambienti di produzione)
- [ ] **Script testato in ambiente di sviluppo?**
- [ ] **Nessun comando DROP senza IF EXISTS?**
- [ ] **Nessun TRUNCATE su tabelle con dati?**

### ☑️ DOPO L'ESECUZIONE

- [ ] **Script eseguito senza errori?**
- [ ] **Tabelle create correttamente?**
- [ ] **Politiche RLS attive?**
- [ ] **Trigger funzionanti?**
- [ ] **Test di base superati?**

## 🎯 PROMEMORIA RAPIDO

### ✅ COSA FARE
- Sempre controllare prima
- Leggere l'output attentamente
- Eseguire solo il necessario
- Verificare dopo ogni script

### ❌ COSA NON FARE
- Mai eseguire script alla cieca
- Mai ignorare gli errori
- Mai saltare la verifica
- Mai assumere lo stato del database

## 🚨 IN CASO DI DUBBI

**FERMATI E CHIEDI AIUTO!**

Meglio perdere 5 minuti per una domanda che ore per un ripristino.

---

**Ricorda:** Questa checklist ti protegge da errori costosi. Usala sempre!

**Data:** $(date)
**Versione:** 1.0