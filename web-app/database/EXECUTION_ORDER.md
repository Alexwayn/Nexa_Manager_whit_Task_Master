# ORDINE DI ESECUZIONE SCRIPT SQL

Per risolvere gli errori del database, esegui questi script SQL nel seguente ordine:

⚠️ **IMPORTANTE:** Tutti gli script sono ora aggiornati per gestire tabelle esistenti con `CREATE TABLE IF NOT EXISTS` e `ON CONFLICT DO NOTHING`.

## 1. Prima esecuzione - Tabelle di base
```sql
-- Esegui questo per primo per creare le tabelle di ruoli e permessi
-- Questo risolve l'errore "column user_roles.role does not exist"
-- Ora sicuro da eseguire anche se le tabelle esistono già
```
**File:** `roles_and_permissions_schema.sql`

## 2. Seconda esecuzione - Tabelle di sicurezza
```sql
-- Esegui questo per creare le tabelle di sessioni e audit logs
-- Questo risolve l'errore "session_token does not exist"
```
**File:** `security_tables_schema.sql`

## 3. Terza esecuzione - Impostazioni email
```sql
-- Esegui questo per creare le tabelle delle impostazioni email
-- Questo risolve l'errore "relation public.email_settings does not exist"
```
**File:** `email_settings_schema.sql` (già corretto per Clerk)

## 4. Quarta esecuzione - Migrazione Clerk (opzionale)
```sql
-- Esegui questo solo se hai bisogno di convertire dati esistenti
```
**File:** `clerk_compatibility_migration.sql`

## Errori Risolti

✅ **Errore 1:** `column "session_token" does not exist`
- **Causa:** Tabella `user_sessions` non esisteva
- **Soluzione:** Eseguire `security_tables_schema.sql`

✅ **Errore 2:** `foreign key constraint "email_settings_user_id_fkey" cannot be implemented`
- **Causa:** Riferimento a `auth.users(id)` che è UUID mentre `user_id` è TEXT
- **Soluzione:** Rimossi i vincoli di chiave esterna da `email_settings_schema.sql`

✅ **Errore 3:** `column user_roles.role does not exist`
- **Causa:** Tabella `user_roles` non esisteva
- **Soluzione:** Eseguire `roles_and_permissions_schema.sql`

## Note Importanti

1. **Clerk Compatibility:** Tutti gli script sono ora compatibili con Clerk (user_id come TEXT)
2. **RLS Policies:** Tutte le tabelle hanno Row Level Security abilitata
3. **Performance:** Indici creati per ottimizzare le query
4. **Triggers:** Trigger automatici per `updated_at` timestamp

## Verifica Post-Esecuzione

Dopo aver eseguito tutti gli script, verifica che queste tabelle esistano:
- `roles`
- `permissions` 
- `role_permissions`
- `user_roles`
- `user_sessions`
- `security_audit_logs`
- `email_settings`
- `email_templates`
- `notification_preferences`
- `email_activity`