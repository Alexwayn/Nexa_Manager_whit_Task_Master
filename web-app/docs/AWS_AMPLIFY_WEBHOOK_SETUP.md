# Configurazione Webhook Clerk con AWS Amplify

Questa guida ti mostra come configurare i webhook di Clerk con AWS Amplify per sincronizzare automaticamente i dati utente con Supabase.

## 📋 **Prerequisiti**

- Progetto AWS Amplify già configurato
- Account Clerk attivo
- Progetto Supabase configurato
- AWS CLI installato e configurato
- Amplify CLI installato (`npm install -g @aws-amplify/cli`)

## 🛠️ **FASE 1: Configurazione Database Supabase**

### 1. Crea le tabelle nel database
```sql
-- Vai su app.supabase.com → il tuo progetto → SQL Editor
-- Incolla e esegui tutto il contenuto di: web-app/database/clerk_webhook_schema.sql
```

### 2. Verifica le tabelle create
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'organizations', 'organization_memberships', 'webhook_logs');
```

## ⚙️ **FASE 2: Aggiungi la Lambda Function ad Amplify**

### 1. Aggiungi la function al tuo progetto
```bash
cd web-app
amplify add function
```

**Seleziona queste opzioni:**
```
? Select which capability you want to add: Lambda function (serverless function)
? Provide a friendly name for your resource: clerkWebhook
? Provide the Lambda function name: clerkWebhook
? Choose the runtime that you want to use: NodeJS
? Choose the function template: Hello World
? Do you want to configure advanced settings? No
? Do you want to edit the local lambda function now? No
```

### 2. Sostituisci i file generati

**Sostituisci il contenuto di questi file:**
- `amplify/backend/function/clerkWebhook/src/index.js` → usa il codice che abbiamo creato
- `amplify/backend/function/clerkWebhook/src/package.json` → usa il package.json che abbiamo creato

### 3. Aggiungi API Gateway
```bash
amplify add api
```

**Seleziona queste opzioni:**
```
? Please select from one of the below mentioned services: REST
? Provide a friendly name for your resource: webhookApi
? Provide a path (e.g., /book/{isbn}): /clerk-webhook
? Choose a Lambda source: Use a Lambda function already added in the current Amplify project
? Choose the Lambda function to invoke by this path: clerkWebhook
? Restrict API access? No
? Do you want to add another path? No
```

## 🔑 **FASE 3: Configura le Variabili Ambiente**

### 1. Raccogli le chiavi necessarie

**Da Supabase (app.supabase.com → Settings → API):**
- Project URL: `https://tuoprogetto.supabase.co`
- anon/public key: `eyJhbG...`
- service_role key: `eyJhbG...` (MANTIENI SEGRETA!)

**Da Clerk (dashboard.clerk.dev → API Keys):**
- Publishable key: `pk_test_...`

### 2. Aggiungi le variabili all'ambiente Amplify

```bash
# Configura le variabili ambiente per la Lambda
amplify update function clerkWebhook
```

Quando ti chiede di editare le advanced settings, seleziona **Yes** e aggiungi:
```
Environment variables:
SUPABASE_URL=https://tuoprogetto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tua_service_role_key
CLERK_WEBHOOK_SECRET=verrà_aggiunto_dopo
```

## 🚀 **FASE 4: Deploy del Backend**

### 1. Fai il deploy delle modifiche
```bash
amplify push
```

Conferma le modifiche quando richiesto:
```
? Are you sure you want to continue? Yes
? Do you want to generate GraphQL statements? No
```

### 2. Ottieni l'URL dell'API
Dopo il deploy, prendi nota dell'URL della tua API REST:
```
REST API endpoint: https://xxxxxxxxxx.execute-api.region.amazonaws.com/dev
```

Il tuo webhook sarà disponibile all'indirizzo:
```
https://xxxxxxxxxx.execute-api.region.amazonaws.com/dev/clerk-webhook
```

## 🔗 **FASE 5: Configura il Webhook in Clerk**

### 1. Crea il webhook
1. Vai su [dashboard.clerk.dev](https://dashboard.clerk.dev)
2. Seleziona il tuo progetto
3. Clicca su **"Webhooks"** nella sidebar
4. Clicca **"Add Endpoint"**

### 2. Configura l'endpoint
```
Endpoint URL: https://xxxxxxxxxx.execute-api.region.amazonaws.com/dev/clerk-webhook

Eventi da selezionare:
✅ user.created
✅ user.updated
✅ user.deleted
✅ organization.created
✅ organization.updated
✅ organization.deleted
✅ organizationMembership.created
✅ organizationMembership.updated
✅ organizationMembership.deleted
```

### 3. Salva e copia il secret
1. Clicca **"Create"**
2. Copia il **Webhook Secret** (inizia con `whsec_...`)

## 🔐 **FASE 6: Aggiungi il Webhook Secret**

### 1. Aggiorna la Lambda con il secret
```bash
amplify update function clerkWebhook
```

Aggiungi la variabile mancante:
```
CLERK_WEBHOOK_SECRET=whsec_il_tuo_secret_copiato_da_clerk
```

### 2. Redeploy
```bash
amplify push
```

## 🧪 **FASE 7: Test del Sistema**

### 1. Test dal Dashboard Clerk
1. Nel dashboard Clerk, vai al webhook che hai creato
2. Clicca **"Send test event"**
3. Seleziona **"user.created"**
4. Clicca **"Send test event"**

### 2. Controlla i logs
```bash
# Visualizza i logs della Lambda
amplify console api
# Oppure vai direttamente alla console AWS Lambda
```

### 3. Verifica i dati in Supabase
```sql
-- Controlla se i dati sono stati inseriti
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
```

### 4. Test reale
1. Crea un nuovo utente nella tua app
2. Controlla che appaia nella tabella `users` di Supabase
3. Verifica i logs nella tabella `webhook_logs`

## 📊 **FASE 8: Monitoraggio**

### 1. Controlla CloudWatch Logs
```bash
# Accedi ai logs tramite Amplify
amplify console function
# Seleziona clerkWebhook → View in CloudWatch
```

### 2. Query di monitoraggio in Supabase
```sql
-- Statistiche webhook ultimi 24h
SELECT 
    webhook_type,
    processed_successfully,
    COUNT(*) as count,
    AVG(processing_time_ms) as avg_time_ms
FROM webhook_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY webhook_type, processed_successfully
ORDER BY webhook_type, processed_successfully;

-- Webhook falliti
SELECT * FROM webhook_logs 
WHERE processed_successfully = false 
ORDER BY created_at DESC LIMIT 10;
```

## ⚠️ **Risoluzione Problemi**

### Webhook non funziona
1. **Controlla CloudWatch Logs:**
   ```bash
   amplify console function
   ```

2. **Verifica l'URL dell'endpoint:**
   ```bash
   amplify status
   # Controlla l'URL della REST API
   ```

3. **Test manuale dell'endpoint:**
   ```bash
   curl -X POST https://tua-api.execute-api.region.amazonaws.com/dev/clerk-webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

### Errori di autenticazione
1. **Controlla le variabili ambiente:**
   ```bash
   amplify update function clerkWebhook
   # Verifica che tutte le variabili siano corrette
   ```

2. **Verifica il webhook secret in Clerk**
3. **Controlla la service role key di Supabase**

### Database connection errors
1. **Verifica URL Supabase**
2. **Controlla la service role key**
3. **Verifica che le tabelle esistano**

## 🔄 **Aggiornamenti Futuri**

### Per aggiornare la Lambda function:
```bash
# Modifica il codice in amplify/backend/function/clerkWebhook/src/index.js
amplify push
```

### Per aggiornare le variabili ambiente:
```bash
amplify update function clerkWebhook
amplify push
```

## ✅ **Checklist Finale**

- [ ] Database schema creato in Supabase
- [ ] Lambda function aggiunta ad Amplify
- [ ] API Gateway configurato
- [ ] Variabili ambiente impostate
- [ ] Backend deployato con `amplify push`
- [ ] URL webhook ottenuto
- [ ] Webhook creato in Clerk con eventi selezionati
- [ ] Webhook secret aggiunto alla Lambda
- [ ] Backend ridispiegato
- [ ] Test dal dashboard Clerk funziona
- [ ] Nuovo utente crea record in Supabase
- [ ] Logs CloudWatch mostrano successi

## 🎯 **URL Finali**

Dopo aver completato la configurazione:

- **Webhook URL:** `https://xxxxxxxxxx.execute-api.region.amazonaws.com/dev/clerk-webhook`
- **CloudWatch Logs:** Console AWS → Lambda → clerkWebhook → Monitoring
- **Supabase Dashboard:** `https://app.supabase.com/project/tuoprogetto`
- **Clerk Dashboard:** `https://dashboard.clerk.dev`

Il sistema ora sincronizzerà automaticamente tutti gli eventi utente e organizzazione da Clerk al tuo database Supabase! 🚀 