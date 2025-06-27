-- Script finale per risolvere il problema user_id
-- Gestisce correttamente la colonna clerk_user_id e i vincoli

-- Prima verifichiamo la situazione attuale
SELECT 'Situazione attuale' as stato;

-- Mostra i dati orfani (che non hanno corrispondenza in users)
SELECT DISTINCT user_id, 'dati_orfani' as tipo
FROM (
    SELECT user_id FROM income_categories
    UNION
    SELECT user_id FROM expense_categories  
    UNION
    SELECT user_id FROM income
    UNION
    SELECT user_id FROM expenses
) all_user_ids
WHERE user_id NOT IN (SELECT id FROM users);

-- OPZIONE A: Creare l'utente per l'UUID esistente c6847659-c173-4cca-8a72-b39407a5a748
-- Questo è più semplice perché non dobbiamo spostare i dati

DO $$
DECLARE 
    existing_user_uuid uuid := 'c6847659-c173-4cca-8a72-b39407a5a748'::uuid;
    clerk_id text := 'user_2yyhN4lw9ritLheD4CxN5RRMXUR';
    user_exists boolean;
BEGIN
    RAISE NOTICE 'Creazione utente per UUID esistente: %', existing_user_uuid;
    RAISE NOTICE 'Clerk User ID: %', clerk_id;
    
    -- Verifica se l'utente esiste già
    SELECT EXISTS(SELECT 1 FROM users WHERE id = existing_user_uuid) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE NOTICE 'Creazione utente nella tabella users...';
        
        -- Crea l'utente con tutti i campi richiesti
        INSERT INTO users (
            id, 
            clerk_user_id, 
            email, 
            created_at, 
            updated_at
        )
        VALUES (
            existing_user_uuid,
            clerk_id,
            'user@nexa-manager.app',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Utente creato con successo!';
    ELSE
        RAISE NOTICE 'Utente già esistente';
        
        -- Aggiorna il clerk_user_id se è NULL
        UPDATE users 
        SET clerk_user_id = clerk_id,
            updated_at = NOW()
        WHERE id = existing_user_uuid 
          AND (clerk_user_id IS NULL OR clerk_user_id != clerk_id);
          
        RAISE NOTICE 'Clerk user ID aggiornato se necessario';
    END IF;
    
END $$;

-- Verifica che tutto sia a posto
SELECT 'Verifica finale' as stato;

-- 1. Verifica che l'utente esista
SELECT 
    'Utente in tabella users' as verifica,
    id,
    clerk_user_id,
    email,
    created_at
FROM users 
WHERE id = 'c6847659-c173-4cca-8a72-b39407a5a748'::uuid;

-- 2. Conta tutti i dati finanziari per questo utente
SELECT 'Categorie Entrate' as tipo, COUNT(*) as conteggio 
FROM income_categories 
WHERE user_id = 'c6847659-c173-4cca-8a72-b39407a5a748'::uuid
UNION ALL
SELECT 'Categorie Spese' as tipo, COUNT(*) as conteggio 
FROM expense_categories 
WHERE user_id = 'c6847659-c173-4cca-8a72-b39407a5a748'::uuid
UNION ALL
SELECT 'Entrate' as tipo, COUNT(*) as conteggio 
FROM income 
WHERE user_id = 'c6847659-c173-4cca-8a72-b39407a5a748'::uuid
UNION ALL
SELECT 'Spese' as tipo, COUNT(*) as conteggio 
FROM expenses 
WHERE user_id = 'c6847659-c173-4cca-8a72-b39407a5a748'::uuid;

-- 3. Verifica che non ci siano più dati orfani
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'TUTTI I VINCOLI FOREIGN KEY SONO SODDISFATTI'
        ELSE CONCAT('ATTENZIONE: ', COUNT(*), ' user_id ancora orfani')
    END as stato_foreign_keys
FROM (
    SELECT user_id FROM income_categories
    UNION
    SELECT user_id FROM expense_categories  
    UNION
    SELECT user_id FROM income
    UNION
    SELECT user_id FROM expenses
) all_user_ids
WHERE user_id NOT IN (SELECT id FROM users);

-- 4. Test di accesso ai dati
SELECT 'Test accesso spese' as test, category, amount, date
FROM expenses 
WHERE user_id = 'c6847659-c173-4cca-8a72-b39407a5a748'::uuid
ORDER BY date DESC
LIMIT 3; 