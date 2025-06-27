-- SCRIPT FINALE PER INSERIRE DATI DI TEST
-- DA ESEGUIRE NEL SUPABASE SQL EDITOR COME ADMIN
-- NOTA: phone è un campo obbligatorio (NOT NULL)

-- 1. Disabilita RLS su tutte le tabelle
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.income DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories DISABLE ROW LEVEL SECURITY;

-- 2. Pulisci dati di test esistenti
DELETE FROM public.income WHERE user_id = '12345678-1234-5678-9abc-123456789012';
DELETE FROM public.expenses WHERE user_id = '12345678-1234-5678-9abc-123456789012';
DELETE FROM public.clients WHERE user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR';
DELETE FROM public.income_categories WHERE user_id = '12345678-1234-5678-9abc-123456789012';
DELETE FROM public.expense_categories WHERE user_id = '12345678-1234-5678-9abc-123456789012';

-- 3. Inserisci clienti con TUTTI i campi obbligatori (incluso phone)
INSERT INTO public.clients (full_name, email, phone, user_id) VALUES
('Tech Solutions Srl', 'info@techsolutions.it', '+39 02 1234567', 'user_2yyhN4lw9ritLheD4CxN5RRMXUR'),
('Digital Agency', 'contact@digitalagency.it', '+39 02 7654321', 'user_2yyhN4lw9ritLheD4CxN5RRMXUR'),
('StartUp Innovativa', 'hello@startup.it', '+39 345 1234567', 'user_2yyhN4lw9ritLheD4CxN5RRMXUR');

-- 4. Aggiorna i campi opzionali per ogni cliente
UPDATE public.clients SET 
    address = 'Via Milano 15, Milano',
    notes = 'Cliente specializzato in soluzioni tecnologiche innovative',
    is_habitual = true,
    is_new = false,
    vat_number = 'IT12345678901',
    name = 'Tech Solutions'
WHERE full_name = 'Tech Solutions Srl' AND user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR';

UPDATE public.clients SET 
    address = 'Corso Buenos Aires 23, Milano',
    notes = 'Agenzia di marketing digitale e social media',
    is_habitual = true,
    is_new = false,
    vat_number = 'IT98765432109',
    name = 'Digital Agency'
WHERE full_name = 'Digital Agency' AND user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR';

UPDATE public.clients SET 
    address = 'Via Torino 45, Milano',
    notes = 'Startup innovativa nel settore fintech',
    is_habitual = false,
    is_new = true,
    vat_number = 'IT11223344556',
    name = 'StartUp Innovativa'
WHERE full_name = 'StartUp Innovativa' AND user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR';

-- 5. Inserisci categorie entrate
INSERT INTO public.income_categories (name, description, user_id) VALUES
('Servizi Web Design', 'Progettazione e sviluppo siti web', '12345678-1234-5678-9abc-123456789012'),
('Consulenza IT', 'Consulenza tecnologica e architetturale', '12345678-1234-5678-9abc-123456789012'),
('Vendite Software', 'Licenze software e applicazioni', '12345678-1234-5678-9abc-123456789012'),
('Formazione', 'Corsi di formazione e training', '12345678-1234-5678-9abc-123456789012');

-- 6. Inserisci categorie spese
INSERT INTO public.expense_categories (name, description, user_id) VALUES
('Software e Licenze', 'Abbonamenti software e licenze', '12345678-1234-5678-9abc-123456789012'),
('Marketing', 'Pubblicità e promozione', '12345678-1234-5678-9abc-123456789012'),
('Ufficio', 'Materiali e forniture ufficio', '12345678-1234-5678-9abc-123456789012'),
('Trasporti', 'Carburante e spese di viaggio', '12345678-1234-5678-9abc-123456789012');

-- 7. Inserisci entrate con date realistiche
INSERT INTO public.income (amount, description, category, user_id, date) VALUES
(2500.00, 'Sito web aziendale completo con CMS', 'Servizi Web Design', '12345678-1234-5678-9abc-123456789012', '2025-01-15'),
(1800.00, 'E-commerce personalizzato con gestionale', 'Servizi Web Design', '12345678-1234-5678-9abc-123456789012', '2025-01-20'),
(950.00, 'Consulenza architettura software cloud', 'Consulenza IT', '12345678-1234-5678-9abc-123456789012', '2025-01-25'),
(3200.00, 'App mobile React Native completa', 'Servizi Web Design', '12345678-1234-5678-9abc-123456789012', '2025-02-01'),
(600.00, 'Licenza software gestionale annuale', 'Vendite Software', '12345678-1234-5678-9abc-123456789012', '2025-02-10'),
(1200.00, 'Corso formazione React Advanced (3 giorni)', 'Formazione', '12345678-1234-5678-9abc-123456789012', '2025-02-15');

-- 8. Inserisci spese operative
INSERT INTO public.expenses (amount, description, category, user_id, date) VALUES
(99.00, 'Adobe Creative Suite - abbonamento mensile', 'Software e Licenze', '12345678-1234-5678-9abc-123456789012', '2025-01-01'),
(29.99, 'Hosting VPS DigitalOcean', 'Software e Licenze', '12345678-1234-5678-9abc-123456789012', '2025-01-01'),
(150.00, 'Campagna Google Ads - gennaio', 'Marketing', '12345678-1234-5678-9abc-123456789012', '2025-01-05'),
(45.50, 'Cancelleria e materiali per ufficio', 'Ufficio', '12345678-1234-5678-9abc-123456789012', '2025-01-10'),
(80.00, 'Carburante per incontri clienti', 'Trasporti', '12345678-1234-5678-9abc-123456789012', '2025-01-12'),
(200.00, 'Corso online React Hooks e Context', 'Software e Licenze', '12345678-1234-5678-9abc-123456789012', '2025-01-15'),
(75.00, 'Spese postali e spedizioni documenti', 'Ufficio', '12345678-1234-5678-9abc-123456789012', '2025-01-18'),
(120.00, 'Social Media Marketing - LinkedIn Ads', 'Marketing', '12345678-1234-5678-9abc-123456789012', '2025-01-20');

-- 9. Collega alcune entrate ai clienti specifici
UPDATE public.income SET client_id = (
    SELECT id FROM public.clients 
    WHERE full_name = 'Tech Solutions Srl' 
    AND user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR' 
    LIMIT 1
) WHERE description LIKE '%Sito web aziendale%';

UPDATE public.income SET client_id = (
    SELECT id FROM public.clients 
    WHERE full_name = 'Digital Agency' 
    AND user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR' 
    LIMIT 1
) WHERE description LIKE '%E-commerce%';

UPDATE public.income SET client_id = (
    SELECT id FROM public.clients 
    WHERE full_name = 'StartUp Innovativa' 
    AND user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR' 
    LIMIT 1
) WHERE description LIKE '%Consulenza architettura%';

-- 10. Verifica risultati
SELECT 'CLIENTI INSERITI:' as info;
SELECT COUNT(*) as total_clients, 'clienti inseriti con successo' as status 
FROM public.clients WHERE user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR';

SELECT 'ENTRATE INSERITE:' as info;
SELECT COUNT(*) as total_income, ROUND(SUM(amount), 2) as total_amount, 'entrate inserite' as status 
FROM public.income WHERE user_id = '12345678-1234-5678-9abc-123456789012';

SELECT 'SPESE INSERITE:' as info;
SELECT COUNT(*) as total_expenses, ROUND(SUM(amount), 2) as total_amount, 'spese inserite' as status 
FROM public.expenses WHERE user_id = '12345678-1234-5678-9abc-123456789012';

-- 11. Riabilita RLS per sicurezza
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- 12. Mostra un sample dei dati inseriti
SELECT 'SAMPLE CLIENTI:' as info;
SELECT full_name, email, phone, vat_number, address 
FROM public.clients 
WHERE user_id = 'user_2yyhN4lw9ritLheD4CxN5RRMXUR' 
ORDER BY full_name;

SELECT 'SAMPLE ENTRATE:' as info;
SELECT amount, description, category, date 
FROM public.income 
WHERE user_id = '12345678-1234-5678-9abc-123456789012' 
ORDER BY date DESC 
LIMIT 3;

SELECT 'SAMPLE SPESE:' as info;
SELECT amount, description, category, date 
FROM public.expenses 
WHERE user_id = '12345678-1234-5678-9abc-123456789012' 
ORDER BY date DESC 
LIMIT 3;

-- 🎉 SUCCESS! I dati dovrebbero ora essere visibili nell'applicazione! 