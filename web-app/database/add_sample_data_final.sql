-- SCRIPT FINALE PER INSERIRE DATI DI ESEMPIO
-- Gestisce correttamente il mismatch user_id: TEXT vs UUID nelle diverse tabelle

-- ⚠️ WARNING: THIS FILE CONTAINS SAMPLE DATA - COMMENTED OUT FOR PRODUCTION
-- Uncomment only if you need to restore demo data for development/testing

/*
-- MAPPING DEFINITIVO:
-- business_profiles.user_id = TEXT ✅
-- clients.user_id = TEXT ✅ 
-- expenses.user_id = UUID ❌
-- expense_categories.user_id = UUID ❌
-- income_categories.user_id = UUID ❌
-- income.user_id = UUID ❌

-- 1. CREIAMO UN UUID FISSO PER IL NOSTRO CLERK ID
-- Generiamo sempre lo stesso UUID per 'user_2yyhN4lw9ritLheD4CxN5RRMXUR'
DO $$
DECLARE
    fixed_uuid UUID := '12345678-1234-5678-9abc-123456789012';
    clerk_id TEXT := 'user_2yyhN4lw9ritLheD4CxN5RRMXUR';
BEGIN
    RAISE NOTICE 'Usando UUID fisso: % per Clerk ID: %', fixed_uuid, clerk_id;
END $$;

-- 2. PRIMA VERIFICHIAMO LA STRUTTURA DELLA TABELLA CLIENTS
SELECT 'STRUTTURA TABELLA CLIENTS:' as info;
SELECT column_name, data_type, is_nullable, ordinal_position 
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. INSERIMENTI CON MAPPING CORRETTO

-- CLIENTS (user_id = TEXT, full_name e phone sono NOT NULL)
INSERT INTO public.clients (
    id,
    full_name,
    email,
    phone,
    address,
    user_id,
    created_at,
    updated_at
) VALUES
(gen_random_uuid(), 'Tech Solutions Srl', 'info@techsolutions.it', '+39 02 1234567', 'Via Milano 15, Milano', 'user_2yyhN4lw9ritLheD4CxN5RRMXUR', NOW(), NOW()),
(gen_random_uuid(), 'Digital Agency', 'contact@digitalagency.it', '+39 02 7654321', 'Corso Buenos Aires 23, Milano', 'user_2yyhN4lw9ritLheD4CxN5RRMXUR', NOW(), NOW()),
(gen_random_uuid(), 'StartUp Innovativa', 'hello@startup.it', '+39 345 1234567', 'Via Torino 45, Milano', 'user_2yyhN4lw9ritLheD4CxN5RRMXUR', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verifica immediata inserimento clients
SELECT 'VERIFICA CLIENTS INSERITI:' as check;
SELECT COUNT(*) as clients_count, user_id 
FROM public.clients 
WHERE user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR'
GROUP BY user_id;

-- INCOME_CATEGORIES (user_id = UUID)
INSERT INTO public.income_categories (id, name, description, user_id, created_at, updated_at) VALUES
(gen_random_uuid(), 'Servizi Web Design', 'Servizi di progettazione web', '12345678-1234-5678-9abc-123456789012', NOW(), NOW()),
(gen_random_uuid(), 'Consulenza IT', 'Consulenza tecnologica', '12345678-1234-5678-9abc-123456789012', NOW(), NOW()),
(gen_random_uuid(), 'Vendite Software', 'Licenze e software', '12345678-1234-5678-9abc-123456789012', NOW(), NOW()),
(gen_random_uuid(), 'Formazione', 'Corsi e training', '12345678-1234-5678-9abc-123456789012', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- EXPENSE_CATEGORIES (user_id = UUID)
INSERT INTO public.expense_categories (id, name, description, user_id, created_at, updated_at) VALUES
(gen_random_uuid(), 'Software e Licenze', 'Costi per software e licenze', '12345678-1234-5678-9abc-123456789012', NOW(), NOW()),
(gen_random_uuid(), 'Marketing', 'Spese pubblicitarie e marketing', '12345678-1234-5678-9abc-123456789012', NOW(), NOW()),
(gen_random_uuid(), 'Ufficio', 'Spese per ufficio e materiali', '12345678-1234-5678-9abc-123456789012', NOW(), NOW()),
(gen_random_uuid(), 'Trasporti', 'Carburante e trasporti', '12345678-1234-5678-9abc-123456789012', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- INCOME (user_id = UUID, client_id = UUID)
INSERT INTO public.income (id, amount, description, category, client_id, user_id, date, created_at, updated_at) VALUES
(gen_random_uuid(), 2500.00, 'Sito web aziendale completo', 'Servizi Web Design', (SELECT id FROM public.clients WHERE full_name = 'Tech Solutions Srl' AND user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR' LIMIT 1), '12345678-1234-5678-9abc-123456789012', '2025-01-15', NOW(), NOW()),
(gen_random_uuid(), 1800.00, 'E-commerce con CMS personalizzato', 'Servizi Web Design', (SELECT id FROM public.clients WHERE full_name = 'Digital Agency' AND user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR' LIMIT 1), '12345678-1234-5678-9abc-123456789012', '2025-01-20', NOW(), NOW()),
(gen_random_uuid(), 950.00, 'Consulenza architettura software', 'Consulenza IT', (SELECT id FROM public.clients WHERE full_name = 'StartUp Innovativa' AND user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR' LIMIT 1), '12345678-1234-5678-9abc-123456789012', '2025-01-25', NOW(), NOW()),
(gen_random_uuid(), 3200.00, 'App mobile React Native', 'Servizi Web Design', (SELECT id FROM public.clients WHERE full_name = 'Tech Solutions Srl' AND user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR' LIMIT 1), '12345678-1234-5678-9abc-123456789012', '2025-02-01', NOW(), NOW()),
(gen_random_uuid(), 600.00, 'Licenza software gestionale', 'Vendite Software', NULL, '12345678-1234-5678-9abc-123456789012', '2025-02-10', NOW(), NOW()),
(gen_random_uuid(), 1200.00, 'Corso formazione React Advanced', 'Formazione', (SELECT id FROM public.clients WHERE full_name = 'Digital Agency' AND user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR' LIMIT 1), '12345678-1234-5678-9abc-123456789012', '2025-02-15', NOW(), NOW());

-- EXPENSES (user_id = UUID)
INSERT INTO public.expenses (id, amount, description, category, user_id, date, created_at, updated_at) VALUES
(gen_random_uuid(), 99.00, 'Abbonamento Adobe Creative Suite', 'Software e Licenze', '12345678-1234-5678-9abc-123456789012', '2025-01-01', NOW(), NOW()),
(gen_random_uuid(), 29.99, 'Hosting VPS mensile', 'Software e Licenze', '12345678-1234-5678-9abc-123456789012', '2025-01-01', NOW(), NOW()),
(gen_random_uuid(), 150.00, 'Campagna Google Ads', 'Marketing', '12345678-1234-5678-9abc-123456789012', '2025-01-05', NOW(), NOW()),
(gen_random_uuid(), 45.50, 'Cancelleria e materiali ufficio', 'Ufficio', '12345678-1234-5678-9abc-123456789012', '2025-01-10', NOW(), NOW()),
(gen_random_uuid(), 80.00, 'Carburante per meeting clienti', 'Trasporti', '12345678-1234-5678-9abc-123456789012', '2025-01-12', NOW(), NOW()),
(gen_random_uuid(), 200.00, 'Corso di formazione React', 'Software e Licenze', '12345678-1234-5678-9abc-123456789012', '2025-01-15', NOW(), NOW()),
(gen_random_uuid(), 75.00, 'Spese postali e spedizioni', 'Ufficio', '12345678-1234-5678-9abc-123456789012', '2025-01-18', NOW(), NOW()),
(gen_random_uuid(), 120.00, 'Social Media Marketing', 'Marketing', '12345678-1234-5678-9abc-123456789012', '2025-01-20', NOW(), NOW()),
(gen_random_uuid(), 99.00, 'Abbonamento Adobe Creative Suite', 'Software e Licenze', '12345678-1234-5678-9abc-123456789012', '2025-02-01', NOW(), NOW()),
(gen_random_uuid(), 29.99, 'Hosting VPS mensile', 'Software e Licenze', '12345678-1234-5678-9abc-123456789012', '2025-02-01', NOW(), NOW()),
(gen_random_uuid(), 90.00, 'Carburante e pedaggi', 'Trasporti', '12345678-1234-5678-9abc-123456789012', '2025-02-05', NOW(), NOW()),
(gen_random_uuid(), 65.00, 'Materiali per presentazioni', 'Ufficio', '12345678-1234-5678-9abc-123456789012', '2025-02-08', NOW(), NOW());

-- 4. VERIFICA FINALE COMPLETA
SELECT '=== VERIFICA INSERIMENTI FINALE ===' as status;
SELECT 'CLIENTI (TEXT):' as check_type, COUNT(*) as count FROM public.clients WHERE user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR';
SELECT 'ENTRATE (UUID):' as check_type, COUNT(*) as count, SUM(amount) as total FROM public.income WHERE user_id = '12345678-1234-5678-9abc-123456789012';
SELECT 'SPESE (UUID):' as check_type, COUNT(*) as count, SUM(amount) as total FROM public.expenses WHERE user_id = '12345678-1234-5678-9abc-123456789012';
SELECT 'CATEGORIE ENTRATE (UUID):' as check_type, COUNT(*) as count FROM public.income_categories WHERE user_id = '12345678-1234-5678-9abc-123456789012';
SELECT 'CATEGORIE SPESE (UUID):' as check_type, COUNT(*) as count FROM public.expense_categories WHERE user_id = '12345678-1234-5678-9abc-123456789012';

-- 5. MOSTRA ALCUNI DATI INSERITI
SELECT 'CLIENTI INSERITI:' as info;
SELECT full_name, email, phone, user_id FROM public.clients WHERE user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR' LIMIT 3;

SELECT 'ENTRATE INSERITE:' as info;
SELECT amount, description, category FROM public.income WHERE user_id = '12345678-1234-5678-9abc-123456789012' LIMIT 3;
*/

-- PRODUCTION READY: All sample data has been commented out
-- The application will now start with an empty client list
-- Use the "Aggiungi Nuovo Cliente" button to add your first real client
SELECT 'Database ready for production - no sample data will be inserted' as status; 