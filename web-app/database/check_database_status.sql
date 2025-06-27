-- SCRIPT DI VERIFICA STATO DATABASE
-- =====================================================
-- SCRIPT DI VERIFICA STATO DATABASE - CONTROLLO PREVENTIVO
-- =====================================================
-- ⚠️ REGOLA FONDAMENTALE: ESEGUI SEMPRE QUESTO SCRIPT
-- PRIMA DI QUALSIASI MODIFICA AL DATABASE!
-- 
-- Questo script controlla quali tabelle esistono già
-- e fornisce un report dello stato attuale del database
-- 
-- NOTA: Questo script è compatibile con Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CONTROLLO TABELLE ESISTENTI
-- =====================================================
SELECT 
    'TABELLE ESISTENTI' as categoria,
    schemaname as schema,
    tablename as nome_tabella,
    CASE 
        WHEN tablename IN ('roles', 'permissions', 'role_permissions', 'user_roles') THEN 'Ruoli e Permessi'
        WHEN tablename IN ('user_sessions', 'security_audit_logs') THEN 'Sicurezza'
        WHEN tablename IN ('email_settings', 'email_templates', 'notification_preferences', 'email_activity') THEN 'Email'
        WHEN tablename = 'profiles' THEN 'Profili Utente'
        ELSE 'Altro'
    END as categoria_funzionale
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY categoria_funzionale, nome_tabella;

-- =====================================================
-- 2. CONTROLLO COLONNE SPECIFICHE
-- =====================================================
-- Controlla se esistono le colonne problematiche
SELECT 
    'COLONNE CRITICHE' as categoria,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND (
        (table_name = 'user_sessions' AND column_name = 'session_token') OR
        (table_name = 'user_roles' AND column_name = 'role') OR
        (table_name = 'profiles' AND column_name = 'id') OR
        (table_name LIKE '%email%' AND column_name = 'user_id')
    )
ORDER BY table_name, column_name;

-- =====================================================
-- 3. CONTROLLO VINCOLI E CHIAVI ESTERNE
-- =====================================================
SELECT 
    'VINCOLI CHIAVI ESTERNE' as categoria,
    tc.table_name as tabella_origine,
    kcu.column_name as colonna_origine,
    ccu.table_name as tabella_riferimento,
    ccu.column_name as colonna_riferimento,
    tc.constraint_name as nome_vincolo
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (
        tc.table_name LIKE '%email%' OR
        tc.table_name LIKE '%user%' OR
        tc.table_name LIKE '%role%' OR
        tc.table_name LIKE '%security%'
    )
ORDER BY tabella_origine, colonna_origine;

-- =====================================================
-- 4. CONTROLLO INDICI
-- =====================================================
SELECT 
    'INDICI ESISTENTI' as categoria,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND (
        tablename LIKE '%email%' OR
        tablename LIKE '%user%' OR
        tablename LIKE '%role%' OR
        tablename LIKE '%security%'
    )
ORDER BY tablename, indexname;

-- =====================================================
-- 5. CONTROLLO DATI ESISTENTI
-- =====================================================
-- Conta i record nelle tabelle principali
DO $$
DECLARE
    table_record RECORD;
    sql_query TEXT;
    row_count INTEGER;
BEGIN
    RAISE NOTICE 'CONTEGGIO RECORD NELLE TABELLE:';
    
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
            AND tablename IN ('roles', 'permissions', 'user_roles', 'profiles', 'email_settings')
    LOOP
        sql_query := 'SELECT COUNT(*) FROM ' || table_record.tablename;
        EXECUTE sql_query INTO row_count;
        RAISE NOTICE '% : % record', table_record.tablename, row_count;
    END LOOP;
END $$;

-- =====================================================
-- 6. CONTROLLO ERRORI COMUNI
-- =====================================================
-- Verifica se ci sono problemi noti
SELECT 
    'PROBLEMI POTENZIALI' as categoria,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') 
            THEN 'MANCANTE: Tabella roles non esiste'
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_sessions') 
            THEN 'MANCANTE: Tabella user_sessions non esiste'
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_settings') 
            THEN 'MANCANTE: Tabella email_settings non esiste'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'id' AND data_type = 'uuid'
        ) THEN 'ATTENZIONE: profiles.id è ancora UUID (dovrebbe essere TEXT per Clerk)'
        ELSE 'Nessun problema rilevato'
    END as problema
WHERE 
    NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') OR
    NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_sessions') OR
    NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_settings') OR
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'id' AND data_type = 'uuid'
    );

-- =====================================================
-- 7. RACCOMANDAZIONI
-- =====================================================
SELECT 
    'RACCOMANDAZIONI' as categoria,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') 
            THEN 'Eseguire: roles_and_permissions_schema.sql'
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_sessions') 
            THEN 'Eseguire: security_tables_schema.sql'
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_settings') 
            THEN 'Eseguire: email_settings_schema.sql'
        ELSE 'Database sembra completo - verificare solo compatibilità Clerk'
    END as azione_raccomandata;

-- =====================================================
-- VERIFICA COMPLETATA
-- Controlla i risultati sopra per decidere quali script eseguire
-- =====================================================