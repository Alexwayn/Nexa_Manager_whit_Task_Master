-- INSERIMENTO CLIENTS FINALE - BASATO SULLA STRUTTURA REALE

-- ⚠️ WARNING: THIS FILE CONTAINS SAMPLE DATA - COMMENTED OUT FOR PRODUCTION
-- Uncomment only if you need to restore demo data for development/testing

/*
-- PULIZIA EVENTUALI DATI DI TEST
DELETE FROM public.clients WHERE email LIKE '%test%' OR email LIKE '%debug%';

-- INSERIMENTO CLIENTS CON STRUTTURA CORRETTA
-- Colonne obbligatorie: full_name (NOT NULL), phone (NOT NULL), user_id (NOT NULL)
-- Colonne opzionali: email, notes, address, vat_number, name
-- Colonne auto: id, created_at, updated_at
-- Colonne boolean: is_habitual (default false), is_new (default true)

INSERT INTO public.clients (
    full_name,      -- pos 2, NOT NULL
    email,          -- pos 3, nullable
    phone,          -- pos 4, NOT NULL
    notes,          -- pos 5, nullable
    address,        -- pos 6, nullable
    is_habitual,    -- pos 7, boolean (default false)
    is_new,         -- pos 8, boolean (default true)
    user_id,        -- pos 9, NOT NULL
    vat_number,     -- pos 12, nullable
    name            -- pos 13, nullable
) VALUES 
(
    'Tech Solutions Srl',                          -- full_name
    'info@techsolutions.it',                       -- email
    '+39 02 1234567',                             -- phone
    'Cliente specializzato in soluzioni IT',      -- notes
    'Via Milano 15, Milano, 20121',               -- address
    false,                                         -- is_habitual
    true,                                          -- is_new
    'user_2yyhN4lw9ritLheD4CxN5RRMXUR',          -- user_id
    'IT01234567890',                              -- vat_number
    'Tech Solutions'                               -- name
),
(
    'Digital Agency',                              -- full_name
    'contact@digitalagency.it',                    -- email
    '+39 02 7654321',                             -- phone
    'Agenzia digitale per marketing online',      -- notes
    'Corso Buenos Aires 23, Milano, 20124',       -- address
    true,                                          -- is_habitual
    false,                                         -- is_new
    'user_2yyhN4lw9ritLheD4CxN5RRMXUR',          -- user_id
    'IT09876543210',                              -- vat_number
    'Digital Agency'                               -- name
),
(
    'StartUp Innovativa',                          -- full_name
    'hello@startup.it',                            -- email
    '+39 345 1234567',                            -- phone
    'Startup nel settore innovazione tecnologica', -- notes
    'Via Torino 45, Milano, 20123',               -- address
    false,                                         -- is_habitual
    true,                                          -- is_new
    'user_2yyhN4lw9ritLheD4CxN5RRMXUR',          -- user_id
    NULL,                                          -- vat_number (no P.IVA per startup)
    'StartUp Innovativa'                           -- name
);

-- VERIFICA INSERIMENTO
SELECT 'CLIENTI INSERITI CON SUCCESSO!' as status;

SELECT 
    id,
    full_name,
    email,
    phone,
    address,
    is_habitual,
    is_new,
    user_id,
    vat_number,
    name,
    created_at
FROM public.clients 
WHERE user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR'
ORDER BY created_at;

-- CONTEGGIO FINALE
SELECT 
    COUNT(*) as total_clients,
    user_id
FROM public.clients 
WHERE user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR'
GROUP BY user_id;

-- SCRIPT FINALE - BYPASS COMPLETO DI TRIGGER E CONSTRAINTS
-- DA ESEGUIRE NEL SUPABASE SQL EDITOR COME ADMIN/SUPERUSER
-- Questo è l'ultimo tentativo - disabilitiamo TUTTO

-- 1. DISABILITA TUTTI I TRIGGER SULLA TABELLA CLIENTS
ALTER TABLE public.clients DISABLE TRIGGER ALL;

-- 2. DISABILITA RLS SU TUTTE LE TABELLE
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.income DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories DISABLE ROW LEVEL SECURITY;

-- 3. PULISCI COMPLETAMENTE LA TABELLA
TRUNCATE TABLE public.clients CASCADE;
TRUNCATE TABLE public.income CASCADE;
TRUNCATE TABLE public.expenses CASCADE;
TRUNCATE TABLE public.income_categories CASCADE;
TRUNCATE TABLE public.expense_categories CASCADE;

-- 4. INSERIMENTO FORZATO - UN CLIENTE ALLA VOLTA PER DEBUG
-- Primo tentativo: INSERT MINIMALE
INSERT INTO public.clients (full_name, email, phone, user_id) 
VALUES ('Test Client MINIMAL', 'test@minimal.com', '+39 123456789', 'user_2yyhN4lw9ritLheD4CxN5RRMXUR');

-- Verifica immediata
SELECT 'VERIFICA INSERIMENTO MINIMALE:' as test;
SELECT id, full_name, email, phone, user_id, notes, created_at 
FROM public.clients 
WHERE email = 'test@minimal.com';

-- Se il test minimale fallisce, STOP QUI
-- Se funziona, continua con il secondo test

-- 5. SECONDO TEST: INSERT COMPLETO
INSERT INTO public.clients (
    id,
    full_name,
    email, 
    phone,
    notes,
    address,
    is_habitual,
    is_new,
    user_id,
    created_at,
    updated_at,
    vat_number,
    name
) VALUES (
    '12345678-1234-5678-9abc-123456789013'::uuid,  -- UUID fisso per test
    'Tech Solutions Test',
    'tech@test.com',
    '+39 02 1234567',
    'Test notes',
    'Via Test 123',
    false,
    true,
    'user_2yyhN4lw9ritLheD4CxN5RRMXUR',
    '2025-01-01 12:00:00'::timestamp,
    '2025-01-01 12:00:00'::timestamp,
    'IT12345678901',
    'Tech Test'
);

-- Verifica secondo test
SELECT 'VERIFICA INSERIMENTO COMPLETO:' as test;
SELECT id, full_name, email, phone, user_id, notes, created_at 
FROM public.clients 
WHERE email = 'tech@test.com';

-- 6. SE I TEST FUNZIONANO, INSERISCI I DATI REALI
INSERT INTO public.clients (
    full_name,
    email, 
    phone,
    user_id,
    notes,
    address,
    is_habitual,
    is_new,
    vat_number,
    name
) VALUES 
('Tech Solutions Srl', 'info@techsolutions.it', '+39 02 1234567', 'user_2yyhN4lw9ritLheD4CxN5RRMXUR', 'Cliente IT specializzato', 'Via Milano 15', true, false, 'IT12345678901', 'Tech Solutions'),
('Digital Agency', 'contact@digitalagency.it', '+39 02 7654321', 'user_2yyhN4lw9ritLheD4CxN5RRMXUR', 'Agenzia marketing', 'Corso Buenos Aires 23', true, false, 'IT98765432109', 'Digital Agency'),
('StartUp Innovativa', 'hello@startup.it', '+39 345 1234567', 'user_2yyhN4lw9ritLheD4CxN5RRMXUR', 'Startup fintech', 'Via Torino 45', false, true, 'IT11223344556', 'StartUp Innovativa');

-- 7. VERIFICA FINALE
SELECT 'CLIENTI FINALI INSERITI:' as finale;
SELECT id, full_name, email, phone, user_id, vat_number 
FROM public.clients 
WHERE user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR'
ORDER BY full_name;

-- 8. SE I CLIENTI SONO OK, INSERISCI CATEGORIE E DATI FINANZIARI
INSERT INTO public.income_categories (name, description, user_id) VALUES
('Servizi Web', 'Sviluppo web', '12345678-1234-5678-9abc-123456789012'),
('Consulenza', 'Consulenza IT', '12345678-1234-5678-9abc-123456789012'),
('Software', 'Licenze software', '12345678-1234-5678-9abc-123456789012'),
('Formazione', 'Training', '12345678-1234-5678-9abc-123456789012');

INSERT INTO public.expense_categories (name, description, user_id) VALUES
('Software', 'Abbonamenti', '12345678-1234-5678-9abc-123456789012'),
('Marketing', 'Pubblicità', '12345678-1234-5678-9abc-123456789012'),
('Ufficio', 'Materiali', '12345678-1234-5678-9abc-123456789012'),
('Trasporti', 'Viaggi', '12345678-1234-5678-9abc-123456789012');

INSERT INTO public.income (amount, description, category, user_id, date) VALUES
(2500.00, 'Sito web completo', 'Servizi Web', '12345678-1234-5678-9abc-123456789012', '2025-01-15'),
(1800.00, 'E-commerce', 'Servizi Web', '12345678-1234-5678-9abc-123456789012', '2025-01-20'),
(950.00, 'Consulenza cloud', 'Consulenza', '12345678-1234-5678-9abc-123456789012', '2025-01-25'),
(3200.00, 'App mobile', 'Servizi Web', '12345678-1234-5678-9abc-123456789012', '2025-02-01'),
(600.00, 'Licenza gestionale', 'Software', '12345678-1234-5678-9abc-123456789012', '2025-02-10'),
(1200.00, 'Formazione React', 'Formazione', '12345678-1234-5678-9abc-123456789012', '2025-02-15');

INSERT INTO public.expenses (amount, description, category, user_id, date) VALUES
(99.00, 'Adobe CC', 'Software', '12345678-1234-5678-9abc-123456789012', '2025-01-01'),
(29.99, 'Hosting VPS', 'Software', '12345678-1234-5678-9abc-123456789012', '2025-01-01'),
(150.00, 'Google Ads', 'Marketing', '12345678-1234-5678-9abc-123456789012', '2025-01-05'),
(45.50, 'Cancelleria', 'Ufficio', '12345678-1234-5678-9abc-123456789012', '2025-01-10'),
(80.00, 'Carburante', 'Trasporti', '12345678-1234-5678-9abc-123456789012', '2025-01-12');

-- 9. RIABILITA TUTTO
ALTER TABLE public.clients ENABLE TRIGGER ALL;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- 10. VERIFICA FINALE TOTALE
SELECT 'SETUP COMPLETO!' as finale;
SELECT COUNT(*) as clients FROM public.clients WHERE user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR';
*/

-- PRODUCTION READY: All sample data has been commented out
-- The application will now start with an empty client list
-- Use the "Aggiungi Nuovo Cliente" button to add your first real client
SELECT 'Database ready for production - no sample data will be inserted' as status; 