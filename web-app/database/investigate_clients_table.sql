-- INVESTIGAZIONE APPROFONDITA TABELLA CLIENTS

-- 1. VERIFICA SE È UNA TABELLA O UNA VIEW
SELECT 'TIPO DI OGGETTO:' as info;
SELECT 
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'clients' AND table_schema = 'public';

-- 2. CONTROLLA TRIGGER SULLA TABELLA
SELECT 'TRIGGER SULLA TABELLA:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'clients' 
AND event_object_schema = 'public';

-- 3. VERIFICA POLITICHE RLS (Row Level Security)
SELECT 'POLITICHE RLS:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'clients' AND schemaname = 'public';

-- 4. CONTROLLA SE CI SONO FUNZIONI/TRIGGER CHE GESTISCONO USER_ID
SELECT 'FUNZIONI CORRELATE:' as info;
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%clients%' 
AND routine_definition ILIKE '%user_id%'
AND routine_schema = 'public';

-- 5. CONTROLLA LA DEFINIZIONE ESATTA DELLA TABELLA
SELECT 'DEFINIZIONE COLONNA USER_ID:' as info;
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND table_schema = 'public'
AND column_name = 'user_id';

-- 6. PROVA UN INSERIMENTO MANUALE CON SOLO USER_ID
-- Prima cancella eventuali test precedenti
DELETE FROM public.clients WHERE email LIKE '%test%';

-- Inserimento MINIMO con solo i campi assolutamente necessari
INSERT INTO public.clients (full_name, email, phone, user_id) 
VALUES ('Test Minimal', 'test-minimal@example.com', '+39 111 222333', 'test-user-id-123');

-- Verifica il risultato
SELECT 'RISULTATO INSERIMENTO MINIMAL:' as check;
SELECT id, full_name, email, phone, user_id 
FROM public.clients 
WHERE email = 'test-minimal@example.com';

-- 7. PROVIAMO A VEDERE SE C'È UNA SEQUENCE O DEFAULT CHE INTERFERISCE
SELECT 'SEQUENCE E DEFAULT:' as info;
SELECT 
    column_name,
    column_default,
    is_identity,
    identity_generation
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. CONTROLLA SE ESISTONO VIEW CHE MASCHERANO LA TABELLA
SELECT 'VIEW CORRELATE:' as info;
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_name ILIKE '%client%' 
AND table_schema = 'public';

-- Pulizia finale
DELETE FROM public.clients WHERE email = 'test-minimal@example.com'; 